import type { SupabaseClient } from "@supabase/supabase-js";
import { product } from "@/config/product";
import { serviceById } from "@/content/app/services";
import { indiaHour } from "./followup";
import { connectionState, evo, evolutionReady, instanceFor, waDigits } from "./whatsapp";

/**
 * Renewal reminders: once a day (10 am India time, from the hourly n8n run) every owner whose
 * monthly or yearly plan ends in 3 days, or today, gets a WhatsApp from ibaxai's own number with
 * a link to renew. After the end date there are GRACE_DAYS more, then the service pauses in the
 * app and on the server (Automation.paidUntil).
 */

export const GRACE_DAYS = 3;
const REMIND_HOUR = 10;
const DAY = 86_400_000;

/** Whole days from today (India) to the date, e.g. 3, 0 or -1. */
const daysUntil = (iso: string, now = Date.now()) => {
  const day = (t: number) => Math.floor((t + 330 * 60_000) / DAY);
  return day(Date.parse(iso)) - day(now);
};

export async function sendRenewalReminders(db: SupabaseClient) {
  if (indiaHour() !== REMIND_HOUR || !evolutionReady()) return { reminders: 0 };
  const from = waDigits(product.supportPhone);
  if (!from) return { reminders: 0 };
  const instance = instanceFor(from);
  if ((await connectionState(instance)) !== "open") return { reminders: 0 };

  const now = Date.now();
  const { data: subs } = await db
    .from("subscriptions")
    .select("owner_id, service_id, period, renews_at")
    .eq("status", "active")
    .neq("period", "one-time")
    .gte("renews_at", new Date(now - DAY).toISOString())
    .lte("renews_at", new Date(now + 4 * DAY).toISOString());

  let reminders = 0;
  for (const s of subs ?? []) {
    const left = daysUntil(s.renews_at, now);
    if (left !== 3 && left !== 0) continue;
    const { data: row } = await db.from("workspaces").select("data").eq("owner_id", s.owner_id).maybeSingle();
    const ws = row?.data as { business?: { ownerName?: string; phone?: string } | null } | undefined;
    const to = waDigits(String(ws?.business?.phone ?? ""));
    const svc = serviceById(s.service_id);
    if (!to || !svc) continue;
    const name = String(ws?.business?.ownerName ?? "").trim().split(/\s+/)[0] || "ji";
    const link = `https://www.ibaxai.com/app/services/${svc.id}/checkout?period=${s.period}&renew=1`;
    const when = left === 0 ? "aaj khatam ho raha hai" : "3 din me khatam hoga";
    const text = [
      `Namaste ${name} 🙏`,
      `Aapka *${svc.name}* plan ${when}.`,
      `Service bina ruke chalti rahe, iske liye yahan renew kariye:`,
      link,
      "",
      `Koi sawal ho to isi number par likhiye. — ibaxai`,
    ].join("\n");
    const r = await evo(`/message/sendText/${encodeURIComponent(instance)}`, { method: "POST", body: JSON.stringify({ number: to, text }) });
    if (r.ok) reminders++;
  }
  return { reminders };
}
