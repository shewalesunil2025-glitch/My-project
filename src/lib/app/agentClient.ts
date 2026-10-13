"use client";

import type Anthropic from "@anthropic-ai/sdk";
import { useSyncExternalStore } from "react";
import { product } from "@/config/product";
import { isLive, providerInfo, serviceById } from "@/content/app/services";
import { askForReview, askMessages } from "./reviewRequests";
import { money } from "./money";
import { cloudAuthHeader, cloudEnabled } from "./cloud";
import type { Attachment } from "@/lib/attachments";
import { activateService, automationFor, buyService, joinWaitlist, connectProvider, periodFor, priceFor, saveServiceDetails, servicesSnapshot, setServiceState } from "./agentActions";
import { detectLang, flowNext, localTurn, type LocalReply } from "./agentLocal";
import { workspaceContext } from "./assistant";
import { whatsAppStatus } from "./whatsappLink";
import { currentWorkspace, logActivity, nowIso, uid, updateWorkspace } from "./store";
import type { AgentCard, ChatMessage, ProviderId, Workspace } from "./types";

/**
 * Runs IBAX conversations. With the AI model configured, every owner message goes to
 * /api/assistant together with a snapshot of the workspace; the actions IBAX asks for
 * are carried out here on the owner's own workspace and the results sent back, until
 * IBAX has answered. Without it (or if it can't be reached) the built-in conversation
 * in agentLocal.ts answers instead — it can still buy and activate services.
 */

type Thread = Anthropic.Beta.BetaMessageParam[];
type Block = Anthropic.Beta.BetaContentBlock;

const MAX_STEPS = 8;
const MAX_THREAD = 70;

/* ── Shared "IBAX is thinking" state, so every chat surface shows it ── */
let busy = false;
const listeners = new Set<() => void>();
function setBusy(v: boolean) {
  busy = v;
  listeners.forEach((l) => l());
}
export function useAgentBusy() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => void listeners.delete(l)),
    () => busy,
    () => false,
  );
}

/** null = not known yet; false = use the built-in conversation for this visit. */
let aiAvailable: boolean | null = null;

/* ── The conversation sent to the model, kept for this browser session ── */
const threadKey = (ws: Workspace) => `ibax-thread-${ws.id}`;
function loadThread(ws: Workspace): Thread {
  try {
    const raw = sessionStorage.getItem(threadKey(ws));
    return raw ? (JSON.parse(raw) as Thread) : [];
  } catch {
    return [];
  }
}
function saveThread(ws: Workspace, thread: Thread) {
  try {
    sessionStorage.setItem(threadKey(ws), JSON.stringify(thread));
  } catch {
    /* storage full or blocked — the conversation still continues in this tab */
  }
}
export function clearAgentConversation(ws: Workspace) {
  try {
    sessionStorage.removeItem(threadKey(ws));
  } catch {
    /* ignore */
  }
  updateWorkspace((w) => {
    w.chat = [];
    w.agentFlow = null;
  });
}

const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const short = (t: string, n = 120) => (t.length > n ? `${t.slice(0, n)}…` : t);
const when = (iso: string) => new Date(iso).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Recent workspace data, so IBAX can answer about leads, calls, messages, reviews and content. */
function recentData(ws: Workspace) {
  const lines: string[] = [];
  if (ws.leads.length) lines.push(`Latest leads: ${ws.leads.slice(0, 6).map((l) => `${l.name} (${l.source}, wants ${short(l.interest, 50)}, ${l.status}, ${when(l.createdAt)})`).join("; ")}.`);
  if (ws.calls.length) lines.push(`Latest calls: ${ws.calls.slice(0, 5).map((c) => `${when(c.at)} ${c.caller} — ${c.outcome}: ${short(c.summary, 90)}`).join("; ")}.`);
  if (ws.conversations.length)
    lines.push(`Latest conversations: ${ws.conversations.slice(0, 5).map((c) => `${c.channel} with ${c.contact} (${when(c.at)}): “${short(c.messages.at(-1)?.text ?? "", 90)}”`).join("; ")}.`);
  if (ws.reviews.length) lines.push(`Latest reviews: ${ws.reviews.slice(0, 5).map((r) => `${r.author} ${r.rating}★ “${short(r.text, 90)}”${r.reply ? " (replied)" : " (no reply yet)"}`).join("; ")}.`);
  const upcoming = ws.content.filter((c) => c.status === "scheduled" || c.status === "approval").slice(0, 5);
  if (upcoming.length) lines.push(`Upcoming content: ${upcoming.map((c) => `${c.platform} ${c.type} “${short(c.title, 60)}” (${c.status}${c.scheduledAt ? `, ${when(c.scheduledAt)}` : ""})`).join("; ")}.`);
  return lines.join("\n");
}

function snapshot(ws: Workspace) {
  const accounts = Object.values(ws.connections)
    .filter((c) => c?.status === "connected")
    .map((c) => `${c!.provider} (${c!.account})`)
    .join(", ");
  return [
    `[Workspace snapshot — now: ${new Date().toLocaleString([], { dateStyle: "full", timeStyle: "short" })} (${localDate()})]`,
    workspaceContext(ws),
    `Connected accounts: ${accounts || "none"}.`,
    servicesSnapshot(ws),
    recentData(ws),
  ]
    .filter(Boolean)
    .join("\n");
}

function postAssistant(reply: LocalReply & { image?: string }) {
  if (!reply.text && !reply.cards?.length && !reply.image) return;
  updateWorkspace((w) => {
    w.chat.push({ id: uid(), role: "assistant", at: nowIso(), text: reply.text, links: reply.links?.length ? reply.links : undefined, cards: reply.cards?.length ? reply.cards : undefined, image: reply.image });
    w.chat = w.chat.slice(-100);
  });
}

/** Carries out one action IBAX asked for. Returns the result IBAX sees. */
async function runTool(block: Anthropic.Beta.BetaToolUseBlock, out: Required<Pick<LocalReply, "cards" | "links">> & { image?: string }): Promise<{ content: string; is_error?: boolean }> {
  const input = (block.input ?? {}) as Record<string, unknown>;
  const ws = currentWorkspace();
  if (!ws) return { content: "The owner is signed out.", is_error: true };
  const svc = typeof input.service_id === "string" ? serviceById(input.service_id) : undefined;

  switch (block.name) {
    case "show_payment": {
      if (!svc || svc.price === null) return { content: "Unknown service, or it needs a custom quote.", is_error: true };
      if (automationFor(ws, svc.id)) return { content: "Already paid — no payment needed. Continue with the setup." };
      if (!isLive(svc.id)) return { content: `${svc.name} is COMING SOON and can't be bought yet. Offer join_waitlist instead.`, is_error: true };
      const period = periodFor(svc, String(input.period));
      out.cards.push({ type: "pay", serviceId: svc.id, period });
      return { content: `Payment card shown: ${svc.name}, ${money(priceFor(svc, period))} (${period}). Not paid yet — wait for "[App event] Payment confirmed".` };
    }
    case "save_service_details": {
      if (!svc) return { content: "Unknown service.", is_error: true };
      const fields = Array.isArray(input.fields) ? (input.fields as { key?: unknown; value?: unknown }[]).filter((f) => typeof f.key === "string" && typeof f.value === "string") : [];
      const result = saveServiceDetails(svc.id, fields as { key: string; value: string }[]);
      return result.ok ? { content: JSON.stringify(result) } : { content: result.error === "not_paid" ? "Not paid yet — show the payment card first." : "Unknown service.", is_error: true };
    }
    case "request_connection": {
      const provider = input.provider as ProviderId;
      if (!svc || !(provider in providerInfo)) return { content: "Unknown service or account type.", is_error: true };
      const conn = ws.connections[provider];
      if (conn?.status === "connected") return { content: `Already connected: ${conn.account}.` };
      out.cards.push({ type: "connect", provider, serviceId: svc.id });
      return { content: `Connect card shown for ${providerInfo[provider].name}. Not connected yet — wait for the "[App event] … connected" message.` };
    }
    case "activate_service": {
      if (!svc) return { content: "Unknown service.", is_error: true };
      const result = await activateService(svc.id);
      if (result.ok) out.cards.push({ type: "activated", serviceId: svc.id, automationId: result.automationId });
      return { content: JSON.stringify(result), is_error: !result.ok };
    }
    case "join_waitlist": {
      if (!svc) return { content: "Unknown service.", is_error: true };
      joinWaitlist(svc.id);
      out.links.push({ href: `/app/services/${svc.id}`, label: svc.name });
      return { content: `Added to the ${svc.name} waitlist. The owner will be told in the app the day it launches.` };
    }
    case "set_service_state": {
      if (!svc) return { content: "Unknown service.", is_error: true };
      const ok = setServiceState(svc.id, input.state === "pause" ? "pause" : "resume");
      return ok ? { content: `${svc.name} ${input.state === "pause" ? "paused" : "resumed"}.` } : { content: "The owner doesn't have this service.", is_error: true };
    }
    case "save_content_draft": {
      const platform = (["instagram", "facebook", "youtube"] as const).find((x) => x === input.platform);
      const type = (["post", "reel", "short", "caption", "script"] as const).find((x) => x === input.type);
      if (!platform || !type || typeof input.body !== "string") return { content: "Invalid draft.", is_error: true };
      const day = typeof input.publish_on === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.publish_on) ? new Date(`${input.publish_on}T19:00:00`) : null;
      const title = typeof input.title === "string" && input.title.trim() ? input.title.trim().slice(0, 140) : `${platform} ${type}`;
      updateWorkspace((w) => {
        w.content.unshift({
          id: uid(),
          type,
          platform,
          title,
          body: input.body as string,
          hashtags: typeof input.hashtags === "string" && input.hashtags.trim() ? input.hashtags.trim() : undefined,
          status: "approval",
          scheduledAt: day && !Number.isNaN(day.getTime()) ? day.toISOString() : undefined,
          createdAt: nowIso(),
        });
        logActivity(w, { kind: platform, title: `${providerInfo[platform].name} draft created by ${product.assistantName}`, detail: title, href: "/app/content" });
      });
      out.links.push({ href: "/app/content", label: "Content Centre" });
      return { content: "Draft saved in the Content Centre, waiting for the owner's approval." };
    }
    case "create_image": {
      const r = await createImage(String(input.prompt ?? ""), input.edit_last_photo === true);
      if (r.ok) {
        out.image = r.url;
        return { content: `Image created and shown to the owner (${r.left} more allowed today). Don't describe it at length — one short line is enough.` };
      }
      return { content: `${r.message} (reason: ${r.reason})`, is_error: true };
    }
    case "ask_review": {
      const result = await askForReview(String(input.name ?? ""), String(input.phone ?? ""), "manual");
      if (result !== "sent") out.links.push({ href: "/app/services/reviews", label: "Google Review Management" });
      return { content: `${askMessages[result]} (result: ${result})`, is_error: result !== "sent" };
    }
    case "check_whatsapp": {
      const conn = ws.connections.whatsapp;
      if (!conn?.account) return { content: "No WhatsApp number is linked yet. The owner can link it from Services → WhatsApp Automation (request_connection)." };
      const state = (await whatsAppStatus(conn.account)).state;
      if (state === "open")
        return {
          content: `WhatsApp ${conn.account} is linked and working right now. If a customer got no reply: replies can pause for a customer after IBAX handed them to the owner, numbers in the ignore list get no replies, and Lead Follow-up only messages new leads from the website or the Leads page (not every WhatsApp chat).`,
        };
      if (state === "unknown") return { content: "Couldn't reach the WhatsApp server just now. Ask the owner to try again in a minute.", is_error: true };
      out.links.push({ href: "/app/services/whatsapp", label: "Link WhatsApp again" });
      return {
        content: `WhatsApp ${conn.account} is NOT linked right now (state: ${state}). WhatsApp logs out linked devices when the phone is offline for about 14 days, when the owner removes it under Linked devices, or after a WhatsApp update. Fix: open the WhatsApp service page and link again with the code (Linked devices → Link a device → Link with phone number instead). A "Link WhatsApp again" button was added.`,
      };
    }
    case "show_link": {
      if (typeof input.page !== "string" || !input.page.startsWith("/app")) return { content: "Unknown page.", is_error: true };
      out.links.push({ href: input.page, label: typeof input.label === "string" ? input.label.slice(0, 40) : "Open" });
      return { content: "Button added." };
    }
    default:
      return { content: `Unknown action ${block.name}.`, is_error: true };
  }
}

/** Actions that only add a button to the reply: once IBAX has also written its answer, no need to ask it again. */
const DISPLAY_ONLY = new Set(["show_link"]);

/** Runs one exchange with the model. Returns false if the model can't be used. */
/** Photos and PDFs stay in the conversation for one turn only (they're large); later turns keep a note. */
function withoutOldFiles(thread: Thread): Thread {
  return thread.map((m) =>
    typeof m.content === "string"
      ? m
      : {
          ...m,
          content: (m.content as Anthropic.Beta.BetaContentBlockParam[]).map((b) =>
            b.type === "image" || b.type === "document" ? { type: "text" as const, text: "[A file the owner shared earlier — ask them to attach it again if you need to look at it.]" } : b,
          ),
        },
  );
}

function fileBlocks(file: Attachment): Anthropic.Beta.BetaContentBlockParam[] {
  if (file.kind === "image") return [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: file.data } }];
  if (file.kind === "pdf") return [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: file.data } }];
  return [{ type: "text", text: `[File "${file.name}"]\n${file.data}` }];
}

async function aiTurn(ws: Workspace, userText: string, voice = false, file?: Attachment): Promise<boolean> {
  let thread = withoutOldFiles(loadThread(ws));
  if (thread.length > MAX_THREAD) {
    // Start a fresh conversation instead of cutting the old one; carry a short recap.
    const recap = ws.chat
      .slice(-8)
      .map((m) => `${m.role === "user" ? "Owner" : "IBAX"}: ${m.text}`)
      .join("\n");
    thread = [];
    userText = `[Recap of our earlier conversation]\n${recap}\n\n${userText}`;
  }
  const startLength = thread.length;
  thread.push({
    role: "user",
    content: [
      ...(file ? [...fileBlocks(file), { type: "text" as const, text: `[The owner attached "${file.name}" (${file.kind === "image" ? "photo" : file.kind === "pdf" ? "PDF" : "text file"}). Read it and help with it.]` }] : []),
      { type: "text", text: userText },
      ...(voice ? [{ type: "text" as const, text: "[Voice call: the owner is talking out loud. Reply in one or two short spoken sentences, no lists.]" }] : []),
      { type: "text", text: snapshot(currentWorkspace() ?? ws) },
    ],
  });

  const out = { text: [] as string[], cards: [] as AgentCard[], links: [] as NonNullable<ChatMessage["links"]>, image: undefined as string | undefined };
  for (let step = 0; step < MAX_STEPS; step++) {
    let data: { ok?: boolean; content?: Block[]; stop_reason?: string; refused?: boolean } | null = null;
    try {
      const res = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: thread }) });
      data = await res.json().catch(() => null);
      if (res.status === 503) aiAvailable = false;
      if (!res.ok) data = null;
    } catch {
      data = null;
    }
    if (!data?.ok) {
      if (step === 0) {
        thread.length = startLength; // the unanswered message is answered by the built-in conversation
        saveThread(ws, thread);
        return false;
      }
      out.text.push("Sorry — I lost the connection for a moment. Please send that again.");
      break;
    }
    aiAvailable = true;
    if (data.refused) {
      out.text.push("I can't help with that one. Ask me anything about your business, your services or the app.");
      thread.length = startLength; // a declined turn isn't kept
      break;
    }

    const content = data.content ?? [];
    thread.push({ role: "assistant", content: content as Anthropic.Beta.BetaContentBlockParam[] });
    for (const b of content) if (b.type === "text" && b.text.trim()) out.text.push(b.text.trim());

    const calls = content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (data.stop_reason !== "tool_use" || !calls.length) break;
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const call of calls) {
      const r = await runTool(call, out);
      results.push({ type: "tool_result", tool_use_id: call.id, content: r.content, ...(r.is_error ? { is_error: true } : {}) });
    }
    thread.push({ role: "user", content: results });
    if (out.text.length && calls.every((c) => DISPLAY_ONLY.has(c.name))) break;
  }
  saveThread(ws, withoutOldFiles(thread));
  postAssistant({ text: out.text.join("\n\n"), cards: out.cards, links: out.links, image: out.image });
  return true;
}

async function respond(ws: Workspace, modelText: string, local: () => Promise<LocalReply>, voice = false, file?: Attachment) {
  setBusy(true);
  try {
    const usedAi = aiAvailable !== false && (await aiTurn(ws, modelText, voice, file));
    if (!usedAi) postAssistant(await local());
  } finally {
    setBusy(false);
  }
}

/* ── Live voice calls (liveCall.ts) ── */

/** What IBAX should know about the owner's workspace at the start of a live call. */
export function liveContext() {
  const ws = currentWorkspace();
  return ws ? snapshot(ws) : "";
}

/** IBAX asked for an action during a live call: do it and show any card in the chat. */
export async function runLiveAction(name: string, input: Record<string, unknown>) {
  const out = { cards: [] as AgentCard[], links: [] as NonNullable<ChatMessage["links"]>, image: undefined as string | undefined };
  const r = await runTool({ type: "tool_use", id: uid(), name, input } as Anthropic.Beta.BetaToolUseBlock, out);
  if (out.cards.length || out.links.length || out.image)
    updateWorkspace((w) => {
      w.chat.push({ id: uid(), role: "assistant", at: nowIso(), text: "", cards: out.cards.length ? out.cards : undefined, links: out.links.length ? out.links : undefined, image: out.image });
    });
  return r;
}

/** A line said in a live call, written into the chat (and IBAX's memory of it). */
export function addVoiceMessage(role: "user" | "assistant", text: string) {
  const ws = currentWorkspace();
  if (!ws || !text) return;
  updateWorkspace((w) => {
    w.chat.push({ id: uid(), role, at: nowIso(), text });
    w.chat = w.chat.slice(-100);
  });
  const thread = loadThread(ws);
  const last = thread.at(-1);
  if ((last ? last.role : "assistant") !== role) {
    thread.push({ role, content: [{ type: "text", text }] });
    saveThread(ws, thread);
  }
}

/** The owner sent a message (`voice`: said out loud in a voice call, so keep the answer short), maybe with a file. */
export async function sendToAgent(text: string, voice = false, file?: Attachment) {
  const ws = currentWorkspace();
  const msg = text.trim().slice(0, 4000);
  if (!ws || (!msg && !file) || busy) return;
  if (file?.kind === "image") lastPhoto = { mime: "image/jpeg", data: file.data };
  updateWorkspace((w) => {
    w.chat.push({ id: uid(), role: "user", text: msg, at: nowIso(), file: file ? { name: file.name, kind: file.kind, thumb: file.thumb } : undefined });
  });
  const ask = msg || "Please look at this file and tell me what's in it and how it can help my business.";
  const offline = async (): Promise<LocalReply> =>
    file ? { text: "Files padhne ke liye AI abhi connect nahi ho pa raha. Thodi der baad dobara bhejiye." } : localTurn(currentWorkspace()!, msg);
  await respond(ws, ask, offline, voice, file);
}

/* ── AI images ── */

/** The last photo the owner attached, for "edit this photo" requests. */
let lastPhoto: { mime: string; data: string } | null = null;

export type ImageResult = { ok: true; url: string; left: number } | { ok: false; reason: string; message: string };

const imageErrors: Record<string, string> = {
  limit: "Aaj ki 20 free photo poori ho gayi. Kal phir banaiye.",
  unauthorized: "Photo banane ke liye apne ibaxai account se login kariye.",
  not_configured: "Photo banane ke liye apne ibaxai account se login kariye.",
  invalid: "Batayiye kaisi photo chahiye.",
  upstream: "Photo abhi nahi ban paayi. Thodi der baad dobara try kariye.",
};

/** Makes an image (or edits the last attached photo) on the server. */
export async function createImage(prompt: string, editLastPhoto = false): Promise<ImageResult> {
  if (!cloudEnabled) return { ok: false, reason: "not_configured", message: imageErrors.not_configured };
  const res = await fetch("/api/image", {
    method: "POST",
    headers: { "content-type": "application/json", ...(await cloudAuthHeader()) },
    body: JSON.stringify({ prompt, photo: editLastPhoto && lastPhoto ? lastPhoto : undefined }),
  }).catch(() => null);
  const data = (await res?.json().catch(() => null)) as { ok?: boolean; url?: string | null; image?: string; left?: number; reason?: string } | null;
  const url = data?.url || data?.image;
  if (data?.ok && url) return { ok: true, url, left: data.left ?? 0 };
  const reason = data?.reason ?? "upstream";
  return { ok: false, reason, message: imageErrors[reason] ?? imageErrors.upstream };
}

/** "Create image" from the + menu: straight to the image model, no chat model in between. */
export async function makeImageFromChat(prompt: string, file?: Attachment) {
  const ws = currentWorkspace();
  const text = prompt.trim().slice(0, 1500);
  if (!ws || !text || busy) return;
  if (file?.kind === "image") lastPhoto = { mime: "image/jpeg", data: file.data };
  updateWorkspace((w) => {
    w.chat.push({ id: uid(), role: "user", text: `🎨 ${text}`, at: nowIso(), file: file ? { name: file.name, kind: file.kind, thumb: file.thumb } : undefined });
  });
  setBusy(true);
  try {
    const r = await createImage(text, file?.kind === "image");
    postAssistant(r.ok ? { text: `Ye rahi aapki photo ✨ (aaj ${r.left} aur bana sakte hain)`, image: r.url } : { text: r.message });
  } finally {
    setBusy(false);
  }
}

function markCard(match: (c: AgentCard) => boolean) {
  updateWorkspace((w) => {
    for (const m of w.chat) for (const c of m.cards ?? []) if (match(c)) Object.assign(c, { done: true });
  });
}

/** The owner paid on a payment card. */
export async function payFromCard(card: Extract<AgentCard, { type: "pay" }>) {
  const svc = serviceById(card.serviceId);
  if (!svc || busy) return;
  if (!buyService(svc.id, card.period)) return;
  markCard((c) => c.type === "pay" && c.serviceId === svc.id);
  const ws = currentWorkspace()!;
  const lang = ws.agentFlow?.lang ?? detectLang(ws.chat.filter((m) => m.role === "user").at(-1)?.text ?? "");
  await respond(ws, `[App event] Payment confirmed: ${svc.name} (${svc.id}), ${money(priceFor(svc, card.period))}, ${card.period}. Continue the setup.`, () =>
    flowNext(svc, { serviceId: svc.id, lang, skipped: ws.agentFlow?.serviceId === svc.id ? ws.agentFlow.skipped : undefined }),
  );
}

/** The owner connected an account on a connect card. */
export async function connectFromCard(card: Extract<AgentCard, { type: "connect" }>, account: string, simulated?: boolean) {
  const svc = serviceById(card.serviceId);
  if (!svc || !account.trim() || busy) return;
  connectProvider(card.provider, account, simulated);
  markCard((c) => c.type === "connect" && c.provider === card.provider);
  const ws = currentWorkspace()!;
  const lang = ws.agentFlow?.lang ?? detectLang(ws.chat.filter((m) => m.role === "user").at(-1)?.text ?? "");
  await respond(ws, `[App event] ${providerInfo[card.provider].name} connected: ${account.trim()}. Continue the setup of ${svc.name} (${svc.id}).`, () =>
    flowNext(svc, { serviceId: svc.id, lang, skipped: ws.agentFlow?.serviceId === svc.id ? ws.agentFlow.skipped : undefined }),
  );
}
