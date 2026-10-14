import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { connectionState, evo, evolutionReady, instanceFor, waDigits } from "./whatsapp";

/**
 * Lead Follow-up: messages each new lead on the owner's own WhatsApp — a thank-you straight
 * away, then up to two reminders — and stops as soon as the lead replies or the owner marks
 * them converted or lost. The queue is the `followups` table (supabase/migrations/0003_followups.sql);
 * n8n calls /api/followup/run every hour and /api/followup/inbound when a customer writes.
 */

/** The thank-you plus two reminders. */
export const MAX_STEPS = 3;
/** Messages go out only between these hours, India time. */
const OPEN_HOUR = 9;
const CLOSE_HOUR = 21;
const SUMMARY_HOUR = 9;

const DELAYS: Record<string, number> = { "1 hour": 3_600_000, "1 day": 86_400_000, "2 days": 172_800_000 };

export function adminDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return null;
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Requests from our own n8n workflows carry the shared secret. */
export function fromAutomationServer(request: Request) {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  return Boolean(secret) && request.headers.get("x-ibax-secret") === secret;
}

export type FollowupSetup = { active: boolean; instance: string; business: string; offer: string; delayMs: number; ownerPhone: string };

type WorkspaceData = {
  business?: { name?: string; phone?: string } | null;
  automations?: { serviceId: string; status: string; config?: Record<string, unknown>; trialEndsAt?: string; paidUntil?: string }[];
  connections?: { whatsapp?: { account?: string; status?: string } };
};

/** The owner's Lead Follow-up settings, read from their saved workspace. */
export async function setupFor(db: SupabaseClient, ownerId: string): Promise<FollowupSetup | null> {
  const { data: row } = await db.from("workspaces").select("data").eq("owner_id", ownerId).maybeSingle();
  const ws = row?.data as WorkspaceData | undefined;
  const auto = ws?.automations?.find((a) => a.serviceId === "followup");
  const wa = ws?.connections?.whatsapp;
  const digits = wa?.status === "connected" ? waDigits(String(wa.account ?? "")) : null;
  if (!auto || !digits) return null;
  const config = auto.config ?? {};
  return {
    // A free-trial service stops when the trial ends, even if the owner hasn't opened the app since.
    active: auto.status === "active" && ![auto.trialEndsAt, auto.paidUntil].some((t) => t && Date.parse(t) <= Date.now()),
    instance: instanceFor(digits),
    business: String(ws?.business?.name ?? "").trim() || "our team",
    offer: typeof config.offer === "string" ? config.offer.trim() : "",
    delayMs: DELAYS[String(config.delay)] ?? DELAYS["1 day"],
    ownerPhone: waDigits(String(ws?.business?.phone ?? "")) ?? digits,
  };
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "ji";

/** The message for a step (0 = thank-you, 1–2 = reminders), in simple Hinglish. */
export function messageFor(step: number, lead: { name: string; interest: string }, s: Pick<FollowupSetup, "business" | "offer">) {
  const name = firstName(lead.name);
  const about = lead.interest.trim() ? `"${lead.interest.trim().slice(0, 60)}"` : "humari services";
  if (step === 0)
    return [`Namaste ${name} 🙏`, `${s.business} mein enquiry ke liye dhanyavaad!`, s.offer ? `Aapke liye offer: ${s.offer}` : "", "Aapko kis cheez ki jaankari chahiye? Yahin reply kijiye, hum turant jawab denge."]
      .filter(Boolean)
      .join("\n");
  if (step === 1) return `Hi ${name}, ${s.business} se yaad dila rahe hain 🙂\nKya aapko abhi bhi ${about} ke baare mein jaankari chahiye? Bas "haan" likh dijiye.`;
  return `${name} ji, ${s.business} ki taraf se aakhri message: agar aapko kuch bhi chahiye ho to yahin likh dijiye, hum madad karenge. Dhanyavaad!`;
}

/** Hour of the day in India (UTC+5:30). */
export function indiaHour(now = new Date()) {
  return new Date(now.getTime() + 330 * 60_000).getUTCHours();
}
const indiaDate = (now = new Date()) => new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);

async function send(instance: string, phone: string, text: string) {
  const r = await evo(`/message/sendText/${encodeURIComponent(instance)}`, { method: "POST", body: JSON.stringify({ number: phone, text }) });
  return r.ok;
}

export type NewLead = { name: string; phone: string; interest?: string; source?: string; leadRef?: string };

/**
 * Starts following up a new lead, if the owner has Lead Follow-up on: saves it to the queue
 * and sends the thank-you straight away (or at opening time, at night).
 */
export async function enroll(db: SupabaseClient, ownerId: string, lead: NewLead): Promise<"started" | "off" | "invalid" | "already"> {
  const phone = waDigits(lead.phone);
  if (!phone) return "invalid";
  const setup = await setupFor(db, ownerId);
  if (!setup?.active || !evolutionReady()) return "off";

  const { data: existing } = await db.from("followups").select("id, state").eq("owner_id", ownerId).eq("phone", phone).maybeSingle();
  if (existing?.state === "waiting") return "already";

  const row = {
    owner_id: ownerId,
    instance: setup.instance,
    lead_ref: lead.leadRef ?? "",
    name: lead.name.slice(0, 80),
    phone,
    interest: (lead.interest ?? "").slice(0, 300),
    source: (lead.source ?? "").slice(0, 40),
    state: "waiting",
    steps_sent: 0,
    next_at: new Date().toISOString(),
    replied_at: null,
  };
  const { data: saved, error } = await db.from("followups").upsert(row, { onConflict: "owner_id,phone" }).select("id").single();
  if (error || !saved) {
    console.error("[followup] enroll failed", error?.message);
    return "off";
  }
  const hour = indiaHour();
  if (hour >= OPEN_HOUR && hour < CLOSE_HOUR) await sendStep(db, { ...row, id: saved.id }, setup);
  return "started";
}

type QueueRow = { id: string; owner_id: string; instance: string; name: string; phone: string; interest: string; steps_sent: number; created_at?: string };

async function sendStep(db: SupabaseClient, row: QueueRow, setup: FollowupSetup) {
  const step = row.steps_sent;
  const ok = (await connectionState(setup.instance)) === "open" && (await send(setup.instance, row.phone, messageFor(step, row, setup)));
  const now = Date.now();
  const sent = step + 1;
  const patch = ok
    ? { steps_sent: sent, last_sent_at: new Date(now).toISOString(), state: sent >= MAX_STEPS ? "done" : "waiting", next_at: sent >= MAX_STEPS ? null : new Date(now + setup.delayMs * sent).toISOString() }
    : // WhatsApp unlinked or the number isn't on WhatsApp: try again in an hour, give up after a day.
      now - new Date(row.created_at ?? now).getTime() > 86_400_000
      ? { state: "failed", next_at: null }
      : { next_at: new Date(now + 3_600_000).toISOString() };
  await db.from("followups").update(patch).eq("id", row.id);
  return ok;
}

/** Sends every follow-up that is due. Called hourly; does nothing outside opening hours. */
export async function runDue(db: SupabaseClient) {
  const hour = indiaHour();
  if (hour < OPEN_HOUR || hour >= CLOSE_HOUR || !evolutionReady()) return { sent: 0, skipped: "closed" as const };
  const { data } = await db
    .from("followups")
    .select("id, owner_id, instance, name, phone, interest, steps_sent, created_at")
    .eq("state", "waiting")
    .lte("next_at", new Date().toISOString())
    .order("next_at")
    .limit(200);
  const setups = new Map<string, FollowupSetup | null>();
  let sent = 0;
  for (const row of (data ?? []) as QueueRow[]) {
    if (!setups.has(row.owner_id)) setups.set(row.owner_id, await setupFor(db, row.owner_id));
    const setup = setups.get(row.owner_id);
    if (!setup?.active || setup.instance !== row.instance) continue; // paused or a different number now
    if (await sendStep(db, row, setup)) sent++;
  }
  return { sent };
}

/** Morning message to each owner: who replied, and who didn't answer any message. */
export async function sendSummaries(db: SupabaseClient) {
  if (indiaHour() !== SUMMARY_HOUR || !evolutionReady()) return { summaries: 0 };
  const today = indiaDate();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { data } = await db.from("followups").select("owner_id, name, phone, state, replied_at, last_sent_at").or(`and(state.eq.replied,replied_at.gte.${since}),and(state.eq.done,last_sent_at.gte.${since})`);
  const byOwner = new Map<string, { name: string; phone: string; state: string }[]>();
  for (const r of data ?? []) byOwner.set(r.owner_id, [...(byOwner.get(r.owner_id) ?? []), r]);

  let summaries = 0;
  for (const [ownerId, rows] of byOwner) {
    const { data: done } = await db.from("followup_summaries").select("last_sent_on").eq("owner_id", ownerId).maybeSingle();
    if (done?.last_sent_on === today) continue;
    const setup = await setupFor(db, ownerId);
    if (!setup?.active) continue;
    const line = (r: { name: string; phone: string }) => `• ${r.name || "Customer"} (+${r.phone})`;
    const replied = rows.filter((r) => r.state === "replied");
    const silent = rows.filter((r) => r.state === "done");
    const text = [
      "🔔 IBAX · Aaj ki follow-up list",
      replied.length ? `\nJawab diya, inse baat karein:\n${replied.map(line).join("\n")}` : "",
      silent.length ? `\nJawab nahi diya, ek call kar lijiye:\n${silent.map(line).join("\n")}` : "",
      "\nPoori list: www.ibaxai.com/app/leads",
    ].join("\n");
    if (await send(setup.instance, setup.ownerPhone, text)) {
      await db.from("followup_summaries").upsert({ owner_id: ownerId, last_sent_on: today });
      summaries++;
    }
  }
  return { summaries };
}

/** A customer wrote on WhatsApp: stop reminding them. */
export async function markReplied(db: SupabaseClient, instance: string, phone: string) {
  const digits = waDigits(phone);
  if (!digits || !/^ibax-\d+$/.test(instance)) return 0;
  const { data } = await db
    .from("followups")
    .update({ state: "replied", replied_at: new Date().toISOString(), next_at: null })
    .eq("instance", instance)
    .eq("phone", digits)
    .in("state", ["waiting", "done"])
    .select("id");
  return data?.length ?? 0;
}

/** The owner marked the lead converted or lost: no more messages. */
export async function stopFor(db: SupabaseClient, ownerId: string, phone: string) {
  const digits = waDigits(phone);
  if (!digits) return;
  await db.from("followups").update({ state: "stopped", next_at: null }).eq("owner_id", ownerId).eq("phone", digits).in("state", ["waiting", "replied"]);
}
