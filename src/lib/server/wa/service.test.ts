import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deliver, failure, gate, ownerReply, setBot } from "./service";

type Row = Record<string, unknown>;

/** Tiny in-memory stand-in for the Supabase client: just what the WhatsApp service calls. */
function fakeDb(seed: Record<string, Row[]> = {}) {
  const t: Record<string, Row[]> = { wa_instances: [], wa_messages: [], wa_contacts: [], workspaces: [], ...seed };
  const from = (name: string) => {
    const filters: [string, unknown][] = [];
    let gte: [string, string] | null = null;
    let head = false;
    const rows = () => t[name].filter((r) => filters.every(([k, v]) => r[k] === v) && (!gte || String(r[gte[0]]) >= gte[1]));
    const q = {
      select: (_c?: string, o?: { head?: boolean }) => ((head = Boolean(o?.head)), q),
      eq: (k: string, v: unknown) => (filters.push([k, v]), q),
      gte: (k: string, v: string) => ((gte = [k, v]), q),
      limit: () => q,
      order: () => q,
      maybeSingle: async () => ({ data: rows()[0] ?? null }),
      insert: async (r: Row | Row[]) => {
        for (const row of Array.isArray(r) ? r : [r]) {
          if (name === "wa_messages" && row.msg_id && t[name].some((x) => x.instance === row.instance && x.msg_id === row.msg_id)) return { error: { code: "23505" } };
          t[name].push({ id: String(t[name].length + 1), ...row });
        }
        return { error: null };
      },
      upsert: async (r: Row) => {
        const hit = t[name].find((x) => x.instance === r.instance && x.phone === r.phone);
        if (hit) Object.assign(hit, r);
        else t[name].push({ bot_status: "on", needs_attention: false, ...r });
        return { error: null };
      },
      update: (patch: Row) => ({ eq: async (k: string, v: unknown) => (t[name].filter((x) => x[k] === v).forEach((x) => Object.assign(x, patch)), { error: null }) }),
      then: (res: (v: unknown) => void) => res({ data: rows(), count: rows().length, error: null }),
    };
    void head;
    return q;
  };
  return { db: { from } as unknown as SupabaseClient, t };
}

const ws = (extra: Row = {}) => ({ notifications: [], notificationPrefs: {}, automations: [{ serviceId: "whatsapp", config: {} }], ...extra });
const seed = () => ({
  wa_instances: [{ instance: "ibax-919876543210", owner_id: "owner-a" }],
  workspaces: [{ owner_id: "owner-a", data: ws() }],
});
const msg = (o: Partial<Parameters<typeof gate>[1]> = {}) => ({ instance: "ibax-919876543210", phone: "919000000001", name: "Asha", messageId: "M1", text: "hi", ...o });

describe("gate", () => {
  it("allows a new message once and flags a retry as duplicate", async () => {
    const { db, t } = fakeDb(seed());
    expect((await gate(db, msg())).allow).toBe(true);
    expect(await gate(db, msg())).toEqual({ allow: false, reason: "duplicate" });
    expect(t.wa_messages).toHaveLength(1);
  });
  it("rejects an unknown instance", async () => {
    const { db } = fakeDb(seed());
    expect((await gate(db, msg({ instance: "ibax-911111111111" }))).reason).toBe("unknown_instance");
  });
  it("blocks while paused and resumes after 24 h of silence", async () => {
    const old = new Date(Date.now() - 30 * 3_600_000).toISOString();
    const { db } = fakeDb({ ...seed(), wa_contacts: [{ owner_id: "owner-a", instance: "ibax-919876543210", phone: "919000000001", bot_status: "paused", needs_attention: false, paused_at: old, last_in_at: old }] });
    expect((await gate(db, msg({ messageId: "M2" }))).allow).toBe(true);
    const { db: db2 } = fakeDb({ ...seed(), wa_contacts: [{ owner_id: "owner-a", instance: "ibax-919876543210", phone: "919000000001", bot_status: "paused", needs_attention: true, paused_at: old, last_in_at: old }] });
    expect((await gate(db2, msg({ messageId: "M3" }))).reason).toBe("paused");
  });
  it("stops at the daily limit", async () => {
    const s = seed();
    s.workspaces[0].data = ws({ automations: [{ serviceId: "whatsapp", config: { dailyLimit: "2" } }] });
    const outs = [1, 2].map((i) => ({ instance: "ibax-919876543210", phone: "919000000001", direction: "out", created_at: new Date().toISOString(), id: `o${i}` }));
    const { db } = fakeDb({ ...s, wa_messages: outs });
    expect((await gate(db, msg())).reason).toBe("limit");
  });
});

describe("deliver / failure", () => {
  it("pauses the bot and notifies the owner when a human is needed", async () => {
    const { db, t } = fakeDb(seed());
    await deliver(db, { instance: "ibax-919876543210", phone: "919000000001", name: "Asha", reply: "ok", delivered: true, messageId: null, intent: "complaint", needsHuman: true, leadTemp: "hot", interest: "" });
    expect(t.wa_contacts[0]).toMatchObject({ bot_status: "paused", needs_attention: true, lead_temp: "hot" });
    expect((t.workspaces[0].data as { notifications: unknown[] }).notifications).toHaveLength(1);
  });
  it("records an undelivered reply as failed, not sent", async () => {
    const { db, t } = fakeDb(seed());
    await deliver(db, { instance: "ibax-919876543210", phone: "919000000001", name: "", reply: "hello", delivered: false, messageId: null, intent: "", needsHuman: false, leadTemp: "", interest: "" });
    expect(t.wa_messages[0].delivery).toBe("failed");
  });
  it("AI failure tells the owner and sends nothing to the customer", async () => {
    const { db, t } = fakeDb(seed());
    const r = await failure(db, { instance: "ibax-919876543210", phone: "919000000001", name: "Asha", kind: "quota" });
    expect(r).toMatchObject({ ok: true, notified: true });
    expect(t.wa_messages).toHaveLength(0);
  });
});

describe("tenant isolation", () => {
  it("another account cannot reply or toggle the bot", async () => {
    const { db } = fakeDb(seed());
    expect(await ownerReply(db, "owner-b", "ibax-919876543210", "919000000001", "hi")).toEqual({ ok: false, reason: "forbidden" });
    expect(await setBot(db, "owner-b", "ibax-919876543210", "919000000001", true)).toEqual({ ok: false, reason: "forbidden" });
  });
  it("owner can turn the bot back on and clears needs-attention", async () => {
    const { db, t } = fakeDb({ ...seed(), wa_contacts: [{ owner_id: "owner-a", instance: "ibax-919876543210", phone: "919000000001", bot_status: "paused", needs_attention: true }] });
    expect((await setBot(db, "owner-a", "ibax-919876543210", "919000000001", true)).ok).toBe(true);
    expect(t.wa_contacts[0]).toMatchObject({ bot_status: "on", needs_attention: false });
  });
});
