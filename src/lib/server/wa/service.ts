import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppNotification, NotificationKind, Workspace } from "@/lib/app/types";
import { connectionState, evo, waFullDigits } from "../whatsapp";
import { clip, dailyLimit, shouldAutoResume, type ContactState, type Gate } from "./rules";

/**
 * WhatsApp Inbox service: n8n asks `gate` before each bot reply and reports with `deliver` /
 * `failure`; the owner replies from the app with `ownerReply`. Tables: 0004 + 0005 migrations.
 */

const day = () => new Date().toISOString().slice(0, 10);

async function workspaceOf(db: SupabaseClient, ownerId: string) {
  const { data } = await db.from("workspaces").select("data").eq("owner_id", ownerId).maybeSingle();
  return (data?.data as Workspace | undefined) ?? null;
}

/** Puts a notice in the owner's app notifications (respecting their preferences). Never throws. */
export async function notifyOwner(db: SupabaseClient, ownerId: string, kind: NotificationKind, title: string, detail: string, href = "/app/inbox") {
  try {
    const ws = await workspaceOf(db, ownerId);
    if (!ws) return false;
    if (ws.notificationPrefs && ws.notificationPrefs[kind] === false) return false;
    const n: AppNotification = { id: crypto.randomUUID(), at: new Date().toISOString(), read: false, kind, title, detail, href };
    // Same title within the last hour → one notice is enough.
    const recent = ws.notifications.some((x) => x.title === title && Date.now() - Date.parse(x.at) < 3_600_000);
    if (recent) return false;
    ws.notifications.unshift(n);
    ws.notifications.length = Math.min(ws.notifications.length, 200);
    await db.from("workspaces").update({ data: ws }).eq("owner_id", ownerId);
    return true;
  } catch {
    return false;
  }
}

async function ownerOfInstance(db: SupabaseClient, instance: string) {
  const { data } = await db.from("wa_instances").select("owner_id").eq("instance", instance).maybeSingle();
  return (data?.owner_id as string | undefined) ?? null;
}

const contactCols = "bot_status, needs_attention, paused_at, last_in_at, last_owner_at";

/**
 * Called by n8n for each customer message, right before the bot would reply. Stores the inbound
 * message once (a retried workflow gets "duplicate"), auto-resumes a quiet paused customer, and
 * answers whether the bot may reply now.
 */
export async function gate(db: SupabaseClient, b: { instance: string; phone: string; name: string; messageId: string | null; text: string }): Promise<Gate> {
  const ownerId = await ownerOfInstance(db, b.instance);
  const phone = waFullDigits(b.phone);
  if (!ownerId || !phone) return { allow: false, reason: ownerId ? "bad_request" : "unknown_instance" };
  const now = new Date();

  const ins = await db
    .from("wa_messages")
    .insert({ owner_id: ownerId, instance: b.instance, phone, name: clip(b.name, 80), direction: "in", text: clip(b.text, 2000), msg_id: b.messageId, created_at: now.toISOString() });
  if (ins.error) {
    if (ins.error.code === "23505") return { allow: false, reason: "duplicate" };
    console.error("[wa] gate insert failed", ins.error.code);
  }

  const { data: row } = await db.from("wa_contacts").select(contactCols).eq("instance", b.instance).eq("phone", phone).maybeSingle();
  let c = row as ContactState | null;
  // The pause check uses the state *before* this message counts as activity.
  const resume = c ? shouldAutoResume(c, now.getTime()) : false;
  await db.from("wa_contacts").upsert(
    { owner_id: ownerId, instance: b.instance, phone, name: clip(b.name, 80), last_at: now.toISOString(), last_in_at: now.toISOString(), ...(resume ? { bot_status: "on", paused_at: null } : {}) },
    { onConflict: "instance,phone" },
  );
  if (resume) c = { ...c!, bot_status: "on" };
  if (c?.bot_status === "paused") return { allow: false, reason: "paused" };

  const ws = await workspaceOf(db, ownerId);
  const wa = ws?.automations.find((a) => a.serviceId === "whatsapp");
  const limit = dailyLimit(wa?.config?.dailyLimit);
  const { count } = await db
    .from("wa_messages")
    .select("id", { count: "exact", head: true })
    .eq("instance", b.instance)
    .eq("phone", phone)
    .eq("direction", "out")
    .gte("created_at", `${day()}T00:00:00.000Z`);
  if ((count ?? 0) >= limit) return { allow: false, reason: "limit" };
  return { allow: true, reason: "ok" };
}

export type Deliver = { instance: string; phone: string; name: string; reply: string; delivered: boolean; messageId: string | null; intent: string; needsHuman: boolean; leadTemp: string; interest: string };

/** n8n reports the bot's reply. A reply that did not go out is stored as failed and the owner is told. */
export async function deliver(db: SupabaseClient, d: Deliver) {
  const ownerId = await ownerOfInstance(db, d.instance);
  const phone = waFullDigits(d.phone);
  if (!ownerId || !phone) return { ok: false as const, reason: "unknown_instance" };
  const temp = ["hot", "warm", "cold"].includes(d.leadTemp) ? d.leadTemp : null;
  const now = new Date().toISOString();

  if (d.reply.trim()) {
    const r = await db.from("wa_messages").insert({
      owner_id: ownerId, instance: d.instance, phone, name: clip(d.name, 80), direction: "out", text: clip(d.reply, 2000),
      intent: clip(d.intent, 20), needs_human: d.needsHuman, delivery: d.delivered ? "sent" : "failed", msg_id: d.messageId, created_at: now,
    });
    if (r.error && r.error.code !== "23505") console.error("[wa] deliver insert failed", r.error.code);
    if (r.error?.code === "23505") return { ok: true as const, duplicate: true };
  }
  const patch: Record<string, unknown> = { owner_id: ownerId, instance: d.instance, phone, name: clip(d.name, 80), last_at: now };
  if (temp) patch.lead_temp = temp;
  if (d.interest.trim()) patch.interest = clip(d.interest, 200);
  if (d.needsHuman) Object.assign(patch, { bot_status: "paused", needs_attention: true, paused_at: now });
  await db.from("wa_contacts").upsert(patch, { onConflict: "instance,phone" });

  const who = d.name || `+${phone}`;
  if (!d.delivered) await notifyOwner(db, ownerId, "automation_failed", "A WhatsApp reply was not delivered", `IBAX could not send a reply to ${who}. Please check your WhatsApp link and reply yourself.`);
  else if (d.needsHuman) await notifyOwner(db, ownerId, "message", `${who} needs you`, "IBAX paused the bot for this customer. Reply in the Inbox, then tap “Turn bot back on”.");
  return { ok: true as const };
}

/** n8n reports that the AI could not answer (quota, timeout, error). No reply was sent. */
export async function failure(db: SupabaseClient, f: { instance: string; phone: string; name: string; kind: string }) {
  const ownerId = await ownerOfInstance(db, f.instance);
  const phone = waFullDigits(f.phone);
  if (!ownerId || !phone) return { ok: false as const, reason: "unknown_instance" };
  await db.from("wa_contacts").upsert({ owner_id: ownerId, instance: f.instance, phone, name: clip(f.name, 80), needs_attention: true, last_at: new Date().toISOString() }, { onConflict: "instance,phone" });
  const why = f.kind === "quota" ? "the AI limit was reached" : f.kind === "timeout" ? "the AI took too long" : "the AI had an error";
  const notified = await notifyOwner(db, ownerId, "automation_failed", "IBAX could not answer a customer", `A customer (${f.name || `+${phone}`}) is waiting: ${why}. Please reply in the Inbox.`);
  return { ok: true as const, notified };
}

/** The owner replies from the Inbox: sends on WhatsApp, stores it, and pauses the bot for that customer. */
export async function ownerReply(db: SupabaseClient, ownerId: string, instance: string, to: string, text: string) {
  const phone = waFullDigits(to);
  const body = text.trim();
  if (!phone || !body) return { ok: false as const, reason: "invalid" };
  const own = await ownerOfInstance(db, instance);
  if (own !== ownerId) return { ok: false as const, reason: "forbidden" };
  // Pause first, so an automatic reply cannot slip out while the owner is typing to the customer.
  const now = new Date().toISOString();
  await db.from("wa_contacts").upsert({ owner_id: ownerId, instance, phone, bot_status: "paused", paused_at: now, last_owner_at: now, last_at: now }, { onConflict: "instance,phone" });
  const r = await evo(`/message/sendText/${encodeURIComponent(instance)}`, { method: "POST", body: JSON.stringify({ number: phone, text: body.slice(0, 2000) }) });
  await db.from("wa_messages").insert({ owner_id: ownerId, instance, phone, direction: "owner", text: body.slice(0, 2000), delivery: r.ok ? "sent" : "failed" });
  return r.ok ? { ok: true as const } : { ok: false as const, reason: "send_failed" };
}

/** "Turn bot back on" (or off) for one customer. Also clears the needs-attention flag. */
export async function setBot(db: SupabaseClient, ownerId: string, instance: string, to: string, on: boolean) {
  const phone = waFullDigits(to);
  if (!phone) return { ok: false as const, reason: "invalid" };
  if ((await ownerOfInstance(db, instance)) !== ownerId) return { ok: false as const, reason: "forbidden" };
  const now = new Date().toISOString();
  await db.from("wa_contacts").upsert(
    { owner_id: ownerId, instance, phone, bot_status: on ? "on" : "paused", paused_at: on ? null : now, ...(on ? { needs_attention: false } : {}) },
    { onConflict: "instance,phone" },
  );
  return { ok: true as const };
}

/** Hourly: checks every linked number with WhatsApp itself and tells the owner if one is down. */
export async function monitorLinks(db: SupabaseClient) {
  const { data } = await db.from("wa_instances").select("instance, owner_id, connection, down_alerted").limit(500);
  let down = 0;
  for (const row of data ?? []) {
    const state = await connectionState(row.instance).catch(() => "unknown");
    const connection = state === "open" ? "open" : state === "unknown" ? "unknown" : "closed";
    await db.from("wa_instances").update({ connection, checked_at: new Date().toISOString(), ...(connection === "open" ? { down_alerted: false } : {}) }).eq("instance", row.instance);
    if (connection === "closed") {
      down++;
      if (!row.down_alerted) {
        await notifyOwner(db, row.owner_id, "connection", "WhatsApp is disconnected", "Your linked WhatsApp is not connected, so IBAX cannot reply. Open Settings → Connections and link it again.", "/app/settings");
        await db.from("wa_instances").update({ down_alerted: true }).eq("instance", row.instance);
      }
    }
  }
  return { checked: data?.length ?? 0, down };
}
