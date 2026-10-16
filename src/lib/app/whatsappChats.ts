import type { Conversation } from "./types";
import type { WaContactRow, WaMessageRow } from "./cloud";

/** A real WhatsApp conversation (from the server) shaped like an Inbox conversation. */
export type WaConversation = Conversation & {
  wa: { instance: string; phone: string; botOn: boolean; needsAttention: boolean; leadTemp: WaContactRow["lead_temp"]; interest: string };
  failed: boolean;
};

export const waKey = (instance: string, phone: string) => `wa:${instance}:${phone}`;

export function buildWaConversations(messages: WaMessageRow[], contacts: WaContactRow[]): WaConversation[] {
  const byKey = new Map<string, WaMessageRow[]>();
  for (const m of messages) {
    const k = waKey(m.instance, m.phone);
    byKey.set(k, [...(byKey.get(k) ?? []), m]);
  }
  const out: WaConversation[] = [];
  for (const c of contacts) {
    const rows = byKey.get(waKey(c.instance, c.phone)) ?? [];
    if (!rows.length) continue;
    out.push({
      id: waKey(c.instance, c.phone),
      channel: "whatsapp",
      contact: c.name || `+${c.phone}`,
      at: rows[rows.length - 1].created_at,
      messages: rows.map((r) => ({ from: r.direction === "in" ? "customer" : r.direction === "out" ? "assistant" : "owner", text: r.delivery === "failed" ? `${r.text} (not delivered)` : r.text, at: r.created_at })),
      important: c.needs_attention,
      wa: { instance: c.instance, phone: c.phone, botOn: c.bot_status !== "paused", needsAttention: c.needs_attention, leadTemp: c.lead_temp, interest: c.interest },
      failed: rows.some((r) => r.delivery === "failed"),
    });
  }
  return out;
}
