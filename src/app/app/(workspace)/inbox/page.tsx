"use client";

import { product } from "@/config/product";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Bot, Send } from "lucide-react";
import { nowIso, updateWorkspace } from "@/lib/app/store";
import type { Channel, Conversation } from "@/lib/app/types";
import { cloudEnabled, cloudWaBot, cloudWaChats, cloudWaOwnerReply } from "@/lib/app/cloud";
import { buildWaConversations, type WaConversation } from "@/lib/app/whatsappChats";
import { useWorkspace } from "@/components/app/AppShell";
import { KindIcon } from "@/components/app/kinds";
import { Btn, BtnLink, Notice, EmptyState, Input, PageHeader, Pill, Segmented, fmtTime, relTime } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const channelLabel: Record<Channel, string> = { whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Messenger", email: "Email" };

export default function InboxPage() {
  const ws = useWorkspace();
  const [channel, setChannel] = useState<"all" | Channel>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [real, setReal] = useState<WaConversation[]>([]);
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);

  // Real WhatsApp chats come from the server; refresh while the Inbox is open.
  const load = useCallback(async () => {
    if (!cloudEnabled) return;
    const { messages, contacts } = await cloudWaChats();
    setReal(buildWaConversations(messages, contacts));
  }, []);
  useEffect(() => {
    const first = setTimeout(() => void load(), 0);
    const timer = setInterval(() => void load(), 15000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  if (!ws) return null;

  const all: Conversation[] = [...real, ...ws.conversations];
  const list = all.filter((c) => channel === "all" || c.channel === channel).sort((a, b) => b.at.localeCompare(a.at));
  const open = all.find((c) => c.id === openId);
  const openWa = real.find((c) => c.id === openId);

  async function sendWa(e: FormEvent) {
    e.preventDefault();
    if (!openWa || !reply.trim() || busy) return;
    setBusy(true);
    setProblem("");
    const r = await cloudWaOwnerReply(openWa.wa.instance, openWa.wa.phone, reply.trim());
    setBusy(false);
    if (!r.ok) return setProblem("Your message could not be sent on WhatsApp. Check that your WhatsApp is linked, then try again.");
    setReply("");
    await load();
  }

  async function botOn() {
    if (!openWa || busy) return;
    setBusy(true);
    setProblem("");
    const r = await cloudWaBot(openWa.wa.instance, openWa.wa.phone, true);
    setBusy(false);
    if (!r.ok) return setProblem("Could not turn the bot back on. Please try again.");
    await load();
  }

  function send(e: FormEvent) {
    if (openWa) return void sendWa(e);
    e.preventDefault();
    if (!reply.trim() || !open) return;
    updateWorkspace((w) => {
      const c = w.conversations.find((x) => x.id === open.id);
      if (!c) return;
      c.messages.push({ from: "owner", text: reply.trim(), at: nowIso() });
      c.at = nowIso();
      c.important = false;
    });
    setReply("");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Inbox"
        title="Messages"
        subtitle={`WhatsApp, Instagram, Messenger and email conversations — answered by ${product.assistantName}, readable right here.`}
      />
      <div className="mb-5">
        <Segmented
          label="Channel"
          value={channel}
          onChange={(v) => {
            setChannel(v);
            setOpenId(null);
          }}
          options={[{ value: "all", label: "All" }, ...(Object.keys(channelLabel) as Channel[]).map((c) => ({ value: c, label: channelLabel[c] }))]}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState title="No conversations yet" action={<BtnLink href="/app/services/whatsapp" size="sm">Set up WhatsApp AI Assistant</BtnLink>}>
          When your WhatsApp, Instagram, Messenger or email assistant is active, every conversation appears here — no need to open other apps.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 [&>*]:min-w-0 lg:grid-cols-[22rem_1fr]">
          <ul className={cn("space-y-2", open && "hidden lg:block")}>
            {list.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(c.id)}
                  className={cn("glass flex w-full items-start gap-3 rounded-2xl p-3.5 text-left hover:border-white/20", openId === c.id && "border-flow/40")}
                >
                  <KindIcon kind={c.channel === "facebook" ? "facebook" : c.channel} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <span className="truncate">{c.contact}</span>
                      {c.important && <Pill tone="amber">Needs you</Pill>}
                      {"wa" in c && (c as WaConversation).wa.leadTemp === "hot" && <Pill tone="amber">Hot lead</Pill>}
                    </p>
                    <p className="truncate text-xs text-fg-muted">{c.messages[c.messages.length - 1].text}</p>
                  </div>
                  <span className="shrink-0 text-[0.7rem] text-fg-subtle">{relTime(c.at)}</span>
                </button>
              </li>
            ))}
          </ul>

          {open ? (
            <section className="glass flex min-h-[28rem] flex-col rounded-2xl p-4" aria-label={`Conversation with ${open.contact}`}>
              <div className="mb-4 flex items-center gap-3 border-b border-white/[0.06] pb-3">
                <button type="button" onClick={() => setOpenId(null)} className="lg:hidden" aria-label="Back to conversations">
                  <ArrowLeft className="size-5" aria-hidden />
                </button>
                <div>
                  <p className="font-semibold">{open.contact}</p>
                  <p className="text-xs text-fg-subtle">{channelLabel[open.channel]}</p>
                </div>
              </div>
              {openWa && !openWa.wa.botOn && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/30 bg-amber-400/[0.07] p-3 text-xs">
                  <span>{openWa.wa.needsAttention ? `${product.assistantName} is paused for this customer — they need you.` : `${product.assistantName} is paused for this customer.`}</span>
                  <Btn size="sm" onClick={() => void botOn()} disabled={busy}>
                    <Bot className="size-3.5" aria-hidden /> Turn Bot Back On
                  </Btn>
                </div>
              )}
              {problem && <Notice tone="amber">{problem}</Notice>}
              <div className="flex-1 space-y-3">
                {open.messages.map((m, i) => (
                  <div key={i} className={cn("max-w-[85%]", m.from === "customer" ? "" : "ml-auto text-right")}>
                    <p className={cn("inline-block rounded-2xl px-3.5 py-2 text-left text-sm", m.from === "customer" ? "rounded-tl-sm bg-white/[0.07]" : m.from === "owner" ? "rounded-tr-sm bg-sky-500/80 text-white" : "rounded-tr-sm bg-flow text-ink-950")}>
                      {m.text}
                    </p>
                    <p className="mt-1 text-[0.65rem] text-fg-subtle">
                      {m.from === "assistant" ? product.assistantName : m.from === "owner" ? "You" : open.contact} · {fmtTime(m.at)}
                    </p>
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="mt-4 flex gap-2">
                <label htmlFor="reply" className="sr-only">
                  Reply
                </label>
                <Input id="reply" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply yourself…" />
                <button type="submit" aria-label="Send reply" disabled={!reply.trim()} className="grid size-11 shrink-0 place-items-center rounded-full bg-flow text-ink-950 disabled:opacity-40">
                  <Send className="size-4" aria-hidden />
                </button>
              </form>
            </section>
          ) : (
            <div className="hidden place-items-center rounded-2xl border border-dashed border-white/10 text-sm text-fg-subtle lg:grid">Select a conversation</div>
          )}
        </div>
      )}
    </div>
  );
}
