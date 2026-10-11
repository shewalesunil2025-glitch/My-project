import type { SupabaseClient } from "@supabase/supabase-js";
import { evo, waDigits } from "./whatsapp";

/**
 * WhatsApp chats inside the app: n8n (AI Replies) logs each customer message and IBAX's reply
 * here; the app reads them back as Inbox conversations and WhatsApp leads, rated hot / warm / cold.
 * Tables: supabase/migrations/0004_whatsapp_chats.sql.
 */

export type LeadTemp = "hot" | "warm" | "cold";
const temps: LeadTemp[] = ["hot", "warm", "cold"];

/** Remembers which account linked a WhatsApp number, so its chats land in the right workspace. */
export async function rememberInstance(db: SupabaseClient, instance: string, ownerId: string) {
  await db.from("wa_instances").upsert({ instance, owner_id: ownerId }, { onConflict: "instance" });
}

export async function ownerOf(db: SupabaseClient, instance: string): Promise<string | null> {
  const { data } = await db.from("wa_instances").select("owner_id").eq("instance", instance).maybeSingle();
  return data?.owner_id ?? null;
}

async function ownerAlertNumber(db: SupabaseClient, ownerId: string, instance: string) {
  const { data } = await db.from("workspaces").select("data").eq("owner_id", ownerId).maybeSingle();
  const phone = (data?.data as { business?: { phone?: string } } | undefined)?.business?.phone;
  return waDigits(String(phone ?? "")) ?? instance.replace(/^ibax-/, "");
}

export type Turn = { instance: string; phone: string; name: string; message: string; reply: string; intent: string; needsHuman: boolean; leadTemp: string; interest: string };

/** Saves one customer message and IBAX's reply; alerts the owner the first time a customer turns hot. */
export async function logTurn(db: SupabaseClient, t: Turn) {
  const ownerId = await ownerOf(db, t.instance);
  const phone = waDigits(t.phone);
  if (!ownerId || !phone) return { ok: false as const, reason: "unknown_instance" };
  const temp: LeadTemp = temps.includes(t.leadTemp as LeadTemp) ? (t.leadTemp as LeadTemp) : "warm";
  const now = Date.now();
  const base = { owner_id: ownerId, instance: t.instance, phone, name: t.name.slice(0, 80) };
  const rows = [{ ...base, direction: "in", text: t.message.slice(0, 2000), intent: t.intent.slice(0, 20), needs_human: false, created_at: new Date(now).toISOString() }];
  if (t.reply.trim()) rows.push({ ...base, direction: "out", text: t.reply.slice(0, 2000), intent: t.intent.slice(0, 20), needs_human: t.needsHuman, created_at: new Date(now + 1).toISOString() });
  await db.from("wa_messages").insert(rows);

  const { data: before } = await db.from("wa_contacts").select("lead_temp").eq("instance", t.instance).eq("phone", phone).maybeSingle();
  await db
    .from("wa_contacts")
    .upsert({ ...base, lead_temp: temp, ...(t.interest.trim() ? { interest: t.interest.slice(0, 200) } : {}), last_at: new Date(now).toISOString() }, { onConflict: "instance,phone" });

  let alerted = false;
  if (temp === "hot" && before?.lead_temp !== "hot") {
    const to = await ownerAlertNumber(db, ownerId, t.instance);
    const text = `🔥 IBAX: Hot lead!\n${t.name || "Customer"} (+${phone}) kharidne ke liye taiyaar lag rahe hain.\n${t.interest ? `Chahiye: ${t.interest}\n` : ""}Unka message: "${t.message.slice(0, 200)}"\n\nJaldi call ya reply kijiye.`;
    alerted = (await evo(`/message/sendText/${encodeURIComponent(t.instance)}`, { method: "POST", body: JSON.stringify({ number: to, text }) })).ok;
  }
  return { ok: true as const, alerted };
}

/** The owner replies to a customer from the app's Inbox. */
export async function ownerSend(db: SupabaseClient, ownerId: string, instance: string, to: string, text: string) {
  const phone = waDigits(to);
  if (!phone || !text.trim()) return false;
  const r = await evo(`/message/sendText/${encodeURIComponent(instance)}`, { method: "POST", body: JSON.stringify({ number: phone, text: text.slice(0, 2000) }) });
  if (r.ok) await db.from("wa_messages").insert({ owner_id: ownerId, instance, phone, direction: "owner", text: text.slice(0, 2000) });
  return r.ok;
}
