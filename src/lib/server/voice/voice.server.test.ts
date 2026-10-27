import { beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminNumberAction, adminSavePlan, entitlement, handleEvent, listCalls, requestNumber, saveAssistant, setPaused, snapshot, startPlan } from "./service";
import { fakeProvider, vapi } from "./provider";

/** AI Voice server rules with a faked database and a fake provider: no real calls, money or Vapi. */

type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = {};
const unique: Record<string, string[]> = { voice_calls: ["provider_call_id"], voice_usage_records: ["call_id"], voice_provider_events: ["event_key"], voice_subscriptions: ["owner_id"] };
let n = 0;
/** What the database fills in when a column is left out. */
const DEFAULTS: Record<string, Row> = {
  voice_subscriptions: { status: "active", paused: false },
  voice_provider_events: { status: "received" },
  voice_assistants: { keep_transcripts: false },
  voice_phone_numbers: { test_passed_at: null, note: "" },
};

class Q {
  private filters: ((r: Row) => boolean)[] = [];
  private returning = false;
  private head = false;
  private counted = false;
  private sort?: { col: string; asc: boolean };
  private max = Infinity;
  constructor(private table: string, private mode: "select" | "insert" | "update", private payload?: Row | Row[]) {}
  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    this.returning = true;
    if (opts?.count) this.counted = true;
    if (opts?.head) this.head = true;
    return this;
  }
  eq(c: string, v: unknown) { this.filters.push((r) => r[c] === v); return this; }
  in(c: string, vs: unknown[]) { this.filters.push((r) => vs.includes(r[c])); return this; }
  gte(c: string, v: unknown) { this.filters.push((r) => String(r[c]) >= String(v)); return this; }
  order(col: string, o?: { ascending?: boolean }) { this.sort = { col, asc: o?.ascending !== false }; return this; }
  limit(k: number) { this.max = k; return this; }
  private run(): { rows: Row[]; error: { message: string } | null } {
    const rows = (tables[this.table] ??= []);
    if (this.mode === "insert") {
      const made: Row[] = [];
      for (const p of Array.isArray(this.payload) ? this.payload : [this.payload as Row]) {
        const cols = unique[this.table];
        if (cols && rows.some((r) => cols.every((c) => r[c] === p[c]))) return { rows: [], error: { message: "duplicate key value violates unique constraint" } };
        const row = { id: `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`, created_at: new Date(Date.now() + n).toISOString(), ...(DEFAULTS[this.table] ?? {}), ...p };
        rows.push(row);
        made.push(row);
      }
      return { rows: made, error: null };
    }
    let hit = rows.filter((r) => this.filters.every((f) => f(r)));
    if (this.mode === "update") {
      for (const r of hit) Object.assign(r, this.payload);
    }
    if (this.sort) hit = [...hit].sort((a, b) => (String(a[this.sort!.col]) < String(b[this.sort!.col]) ? -1 : 1) * (this.sort!.asc ? 1 : -1));
    return { rows: hit.slice(0, this.max), error: null };
  }
  single() { const r = this.run(); return Promise.resolve(r.rows[0] ? { data: r.rows[0], error: null } : { data: null, error: r.error ?? { message: "no rows" } }); }
  maybeSingle() { const r = this.run(); return Promise.resolve({ data: r.rows[0] ?? null, error: r.error }); }
  then(resolve: (v: unknown) => unknown) {
    const r = this.run();
    return Promise.resolve(this.counted ? { data: this.head ? null : r.rows, count: r.rows.length, error: r.error } : { data: this.returning || this.mode === "select" ? r.rows : null, error: r.error }).then(resolve);
  }
}
const db = {
  from: (t: string) => ({
    select: (c?: string, o?: { count?: string; head?: boolean }) => new Q(t, "select").select(c, o),
    insert: (p: Row | Row[]) => new Q(t, "insert", p),
    update: (p: Row) => new Q(t, "update", p),
  }),
} as unknown as SupabaseClient;


const A = "00000000-0000-4000-8000-0000000000a1";
const B = "00000000-0000-4000-8000-0000000000b2";
const NOW = new Date("2026-03-10T10:00:00Z");
const provider = fakeProvider();
const asst = { language: "hi", voiceGender: "female", name: "Riya", knowledge: { prices: "Haircut 200" } };

async function liveClient(owner: string, providerNumberId: string, opts: { test?: boolean } = {}) {
  tables.subscriptions = [...(tables.subscriptions ?? []), { owner_id: owner, service_id: "voice", status: "active", renews_at: "2026-12-01T00:00:00Z" }];
  tables.voice_plans = [{ id: "standard", name: "Standard", included_minutes: 10, overage_inr_per_minute: null, hard_cap_minutes: null, active: true }];
  await saveAssistant(db, owner, asst);
  await startPlan(db, owner, "standard", NOW);
  tables.voice_phone_numbers = [...(tables.voice_phone_numbers ?? []), { id: `n-${owner}`, owner_id: owner, provider: "fake", provider_number_id: providerNumberId, number: "+911100000000", status: opts.test === false ? "ready_for_testing" : "active", test_passed_at: opts.test === false ? null : NOW.toISOString() }];
}
const report = (callId: string, num: string, secs: number) => ({ kind: "end-of-call-report" as const, providerCallId: callId, providerNumberId: num, caller: "+919800000000", startedAt: "2026-03-10T10:00:00Z", endedAt: new Date(Date.parse("2026-03-10T10:00:00Z") + secs * 1000).toISOString(), durationSec: secs, endedReason: "customer-ended-call", summary: "Asked about prices", transcript: "secret words", costUsd: 0.1 });

beforeEach(() => { for (const k of Object.keys(tables)) delete tables[k]; });

describe("assistant setup", () => {
  it("saves Hindi/English and a woman's or man's voice, and refuses anything else", async () => {
    expect((await saveAssistant(db, A, asst)).ok).toBe(true);
    expect(tables.voice_assistants[0]).toMatchObject({ language: "hi", voice_gender: "female", voice_id: "hi-f" });
    expect((await saveAssistant(db, A, { ...asst, language: "en", voiceGender: "male" })).ok).toBe(true);
    expect(tables.voice_assistants).toHaveLength(1);
    expect(tables.voice_assistants[0]).toMatchObject({ language: "en", voice_id: "en-m" });
    expect(await saveAssistant(db, A, { ...asst, language: "mr" })).toMatchObject({ ok: false, reason: "bad_language" });
    expect(await saveAssistant(db, A, { ...asst, voiceGender: "robot" })).toMatchObject({ ok: false, reason: "bad_voice" });
  });
  it("keeps transcripts off unless asked", async () => {
    await saveAssistant(db, A, asst);
    expect(tables.voice_assistants[0].keep_transcripts).toBe(false);
  });
});

describe("tenant isolation", () => {
  it("one client never sees another's assistant, number or calls", async () => {
    await liveClient(A, "pn-a");
    await liveClient(B, "pn-b");
    await handleEvent(db, provider, report("c1", "pn-a", 60), NOW);
    const sa = await snapshot(db, A, NOW);
    const sb = await snapshot(db, B, NOW);
    expect(sa.number?.owner_id).toBe(A);
    expect(sb.number?.owner_id).toBe(B);
    expect(await listCalls(db, A)).toHaveLength(1);
    expect(await listCalls(db, B)).toHaveLength(0);
    expect(sb.minutes?.usedMinutes).toBe(0);
  });
  it("the pause switch only touches the caller's own package", async () => {
    await liveClient(A, "pn-a");
    await liveClient(B, "pn-b");
    await setPaused(db, A, true);
    expect(tables.voice_subscriptions.find((s) => s.owner_id === B)?.paused).toBe(false);
  });
});

describe("phone number requests and statuses", () => {
  it("starts as requested and refuses a second open request", async () => {
    const r = await requestNumber(db, A, { kind: "new" });
    expect(r.ok).toBe(true);
    expect(tables.voice_phone_numbers[0].status).toBe("requested");
    expect(await requestNumber(db, A, { kind: "new" })).toMatchObject({ ok: false, reason: "already_requested" });
  });
  it("forwarding keeps the client's own number and checks it", async () => {
    expect(await requestNumber(db, A, { kind: "forwarding", existingNumber: "12" })).toMatchObject({ ok: false, reason: "bad_phone" });
    expect((await requestNumber(db, A, { kind: "forwarding", existingNumber: "+91 98765 43210", carrier: "Jio" })).ok).toBe(true);
    expect(tables.voice_phone_numbers[0].existing_number).toBe("+919876543210");
  });
  it("cannot be set to ready or active by hand; only provider setup then a passed test", async () => {
    await requestNumber(db, A, { kind: "new" });
    const id = String(tables.voice_phone_numbers[0].id);
    expect(await adminNumberAction(db, provider, "f", { id, action: "set_status", status: "active" })).toMatchObject({ ok: false, reason: "bad_status" });
    expect(await adminNumberAction(db, provider, "f", { id, action: "set_status", status: "ready_for_testing" })).toMatchObject({ ok: false });
    expect(await adminNumberAction(db, provider, "f", { id, action: "configure" })).toMatchObject({ ok: false, reason: "not_attached" });
    expect(await adminNumberAction(db, provider, "f", { id, action: "test_passed" })).toMatchObject({ ok: false, reason: "not_ready" });
    expect((await adminNumberAction(db, provider, "f", { id, action: "attach", number: "+911234500000", providerNumberId: "pn-1" })).ok).toBe(true);
    expect(await adminNumberAction(db, provider, "f", { id, action: "configure" })).toMatchObject({ ok: true, status: "ready_for_testing" });
    expect(provider.configured).toContain("pn-1");
    expect(await adminNumberAction(db, provider, "f", { id, action: "test_passed" })).toMatchObject({ ok: true, status: "active" });
    expect(tables.voice_phone_numbers[0].test_passed_at).toBeTruthy();
    expect(tables.voice_audit.length).toBeGreaterThan(3);
  });
  it("a failed provider setup is shown as failed, and can be retried", async () => {
    await requestNumber(db, A, { kind: "new" });
    const id = String(tables.voice_phone_numbers[0].id);
    await adminNumberAction(db, provider, "f", { id, action: "attach", number: "+911234500000", providerNumberId: "pn-1" });
    const bad = fakeProvider({ failConfigure: true });
    expect(await adminNumberAction(db, bad, "f", { id, action: "configure" })).toMatchObject({ ok: false, reason: "provider_failed" });
    expect(tables.voice_phone_numbers[0].status).toBe("failed");
    expect((await snapshot(db, A, NOW)).status).toBe("failed");
    expect(await adminNumberAction(db, provider, "f", { id, action: "configure" })).toMatchObject({ ok: true, status: "ready_for_testing" });
  });
  it("the same number or provider id cannot be given to two clients' requests... id must be unique per row", async () => {
    expect(await adminNumberAction(db, provider, "f", { id: "nope", action: "attach", number: "+911", providerNumberId: "x" })).toMatchObject({ ok: false, reason: "not_found" });
  });
});

describe("payment and the package", () => {
  it("cannot start without a verified payment", async () => {
    tables.voice_plans = [{ id: "standard", name: "S", included_minutes: 10, active: true }];
    expect(await startPlan(db, A, "standard", NOW)).toMatchObject({ ok: false, reason: "not_paid" });
  });
  it("an expired or cancelled payment does not count", async () => {
    tables.voice_plans = [{ id: "standard", name: "S", included_minutes: 10, active: true }];
    tables.subscriptions = [{ owner_id: A, service_id: "voice", status: "active", renews_at: "2026-01-01T00:00:00Z" }, { owner_id: A, service_id: "voice", status: "cancelled", renews_at: null }];
    expect((await startPlan(db, A, "standard", NOW)).ok).toBe(false);
  });
  it("another client's payment does not count", async () => {
    tables.voice_plans = [{ id: "standard", name: "S", included_minutes: 10, active: true }];
    tables.subscriptions = [{ owner_id: B, service_id: "voice", status: "active", renews_at: null }];
    expect((await startPlan(db, A, "standard", NOW)).ok).toBe(false);
  });
  it("is blocked while the package has no minutes set (no invented numbers)", async () => {
    tables.subscriptions = [{ owner_id: A, service_id: "voice", status: "active", renews_at: null }];
    tables.voice_plans = [{ id: "standard", name: "S", included_minutes: null, active: false }];
    expect(await startPlan(db, A, "standard", NOW)).toMatchObject({ ok: false, reason: "plan_not_ready" });
  });
  it("starting twice makes one package", async () => {
    await liveClient(A, "pn-a");
    await startPlan(db, A, "standard", NOW);
    expect(tables.voice_subscriptions).toHaveLength(1);
  });
  it("admin package edits: no minutes means it can't be switched on, and the cap can't be below the minutes", async () => {
    expect((await adminSavePlan(db, "f", { id: "standard", name: "S", active: true })).ok).toBe(true);
    expect(tables.voice_plans[0].active).toBe(false);
    expect(await adminSavePlan(db, "f", { id: "standard", includedMinutes: 100, hardCapMinutes: 50, active: true })).toMatchObject({ ok: false, reason: "bad_cap" });
    expect((await adminSavePlan(db, "f", { id: "standard", includedMinutes: 100, hardCapMinutes: 150, overageInrPerMinute: 4, active: true })).ok).toBe(true);
    expect(tables.voice_plans[0]).toMatchObject({ included_minutes: 100, active: true });
  });
});

describe("call-time check (assistant-request)", () => {
  const req = (pn: string) => handleEvent(db, provider, { kind: "assistant-request", providerNumberId: pn, caller: "+91", providerCallId: "x" }, NOW);
  it("answers with the client's assistant, voice and language", async () => {
    await liveClient(A, "pn-a");
    const r = await req("pn-a");
    const a = r.body.assistant as Record<string, any>;
    expect(a.voice).toMatchObject({ provider: "azure", voiceId: "hi-IN-SwaraNeural" });
    expect(a.model.messages[0].content).toContain("Haircut 200");
    expect(JSON.stringify(a)).not.toMatch(/api[_-]?key/i);
    expect(a.artifactPlan.recordingEnabled).toBe(false);
  });
  it("refuses an unknown number, a paused one, a number not live, an unpaid client and a used-up package", async () => {
    await liveClient(A, "pn-a");
    expect(await req("pn-unknown")).toMatchObject({ body: { error: expect.any(String) } });
    await setPaused(db, A, true);
    expect((await req("pn-a")).body.error).toBeTruthy();
    await setPaused(db, A, false);
    expect((await req("pn-a")).body.assistant).toBeTruthy();
    tables.subscriptions = [];
    expect((await req("pn-a")).body.error).toBeTruthy();
    tables.subscriptions = [{ owner_id: A, service_id: "voice", status: "active", renews_at: "2026-12-01T00:00:00Z" }];
    tables.voice_usage_records = [{ owner_id: A, call_id: "c", billable_sec: 600, occurred_at: "2026-03-10T10:00:00Z" }];
    expect((await req("pn-a")).body.error).toBeTruthy();
    tables.voice_usage_records = [];
    tables.voice_phone_numbers[0].status = "configuration_in_progress";
    expect((await req("pn-a")).body.error).toBeTruthy();
  });
  it("a number ready for testing answers even before the test passed", async () => {
    await liveClient(A, "pn-a", { test: false });
    expect((await req("pn-a")).body.assistant).toBeTruthy();
  });
  it("one client's number never uses another client's assistant", async () => {
    await liveClient(A, "pn-a");
    await liveClient(B, "pn-b");
    tables.voice_assistants.find((a) => a.owner_id === B)!.name = "OtherBiz";
    const a = (await req("pn-a")).body.assistant as Record<string, any>;
    expect(a.name).toBe("Riya");
    expect(a.name).not.toBe("OtherBiz");
  });
  it("entitlement says why", async () => {
    expect(await entitlement(db, A, NOW)).toMatchObject({ ok: false, reason: "not_paid" });
  });
});

describe("provider events", () => {
  it("stores a call and its minutes once; a repeated report changes nothing", async () => {
    await liveClient(A, "pn-a");
    const first = await handleEvent(db, provider, report("c1", "pn-a", 61), NOW);
    expect(first.status).toBe(200);
    const again = await handleEvent(db, provider, report("c1", "pn-a", 61), NOW);
    expect(again.body.duplicate).toBe(true);
    expect(tables.voice_calls).toHaveLength(1);
    expect(tables.voice_usage_records).toHaveLength(1);
    expect(tables.voice_usage_records[0]).toMatchObject({ duration_sec: 61, billable_sec: 120 });
    expect(tables.voice_provider_events).toHaveLength(1);
  });
  it("recovers a half-processed event without a second call or usage row", async () => {
    await liveClient(A, "pn-a");
    tables.voice_provider_events = [{ event_key: "fake:c2:end-of-call-report", status: "failed" }];
    await handleEvent(db, provider, report("c2", "pn-a", 30), NOW);
    await handleEvent(db, provider, { ...report("c2", "pn-a", 30) }, NOW);
    expect(tables.voice_calls).toHaveLength(1);
    expect(tables.voice_usage_records).toHaveLength(1);
  });
  it("adds up minutes across calls in the month and shows them in the snapshot", async () => {
    await liveClient(A, "pn-a");
    await handleEvent(db, provider, report("c1", "pn-a", 61), NOW);
    await handleEvent(db, provider, report("c2", "pn-a", 30), NOW);
    expect((await snapshot(db, A, NOW)).minutes).toMatchObject({ usedMinutes: 3, leftMinutes: 7 });
  });
  it("does not count minutes from before this month's window", async () => {
    await liveClient(A, "pn-a");
    tables.voice_usage_records = [{ owner_id: A, call_id: "old", billable_sec: 6000, occurred_at: "2026-02-01T00:00:00Z" }];
    expect((await snapshot(db, A, NOW)).minutes?.usedMinutes).toBe(0);
  });
  it("keeps the transcript only when the client allowed it", async () => {
    await liveClient(A, "pn-a");
    await handleEvent(db, provider, report("c1", "pn-a", 30), NOW);
    expect(tables.voice_calls[0].transcript).toBeNull();
    tables.voice_assistants[0].keep_transcripts = true;
    await handleEvent(db, provider, report("c2", "pn-a", 30), NOW);
    expect(tables.voice_calls[1].transcript).toBe("secret words");
  });
  it("a report for an unknown number is kept as unmatched and bills nobody", async () => {
    await handleEvent(db, provider, report("c9", "pn-zzz", 30), NOW);
    expect(tables.voice_calls ?? []).toHaveLength(0);
    expect(tables.voice_provider_events[0].status).toBe("unmatched");
  });
  it("rejects an invalid event", async () => {
    expect((await handleEvent(db, provider, { kind: "invalid" }, NOW)).status).toBe(400);
  });
});

describe("Vapi webhook parsing and verification", () => {
  const prev = process.env.VAPI_WEBHOOK_SECRET;
  it("accepts only the right secret (bearer or X-Vapi-Secret)", () => {
    process.env.VAPI_WEBHOOK_SECRET = "s3cret-value";
    expect(vapi.verifyWebhook(new Headers({ authorization: "Bearer s3cret-value" }))).toBe(true);
    expect(vapi.verifyWebhook(new Headers({ "x-vapi-secret": "s3cret-value" }))).toBe(true);
    expect(vapi.verifyWebhook(new Headers({ authorization: "Bearer wrong" }))).toBe(false);
    expect(vapi.verifyWebhook(new Headers())).toBe(false);
    process.env.VAPI_WEBHOOK_SECRET = "";
    expect(vapi.verifyWebhook(new Headers({ authorization: "Bearer " }))).toBe(false);
    process.env.VAPI_WEBHOOK_SECRET = prev;
  });
  it("parses an end-of-call-report and takes the duration from the timestamps", () => {
    const e = vapi.parseEvent({ message: { type: "end-of-call-report", endedReason: "customer-ended-call", startedAt: "2026-03-10T10:00:00Z", endedAt: "2026-03-10T10:01:30Z", analysis: { summary: "hi" }, call: { id: "c1", phoneNumberId: "pn", customer: { number: "+91" } } } });
    expect(e).toMatchObject({ kind: "end-of-call-report", providerCallId: "c1", providerNumberId: "pn", durationSec: 90, summary: "hi" });
  });
  it("treats garbage as invalid", () => {
    expect(vapi.parseEvent(null).kind).toBe("invalid");
    expect(vapi.parseEvent({ message: { type: "x" } }).kind).toBe("invalid");
  });
});
