import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/** The ad campaign server rules, with the database, Razorpay and the AI faked (no real money, no real Meta). */

type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = {};
const unique: Record<string, string[]> = { ad_campaigns: ["owner_id", "idempotency_key"], ad_payments: ["razorpay_payment_id"] };
let n = 0;

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
        const row = { id: `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`, created_at: new Date(Date.now() + n).toISOString(), approved: false, status: "draft", ...p };
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

const rz = { signatureOk: true, order: { id: "order_1", amount: 0, notes: {} as Record<string, string> }, payment: { id: "pay_1", order_id: "order_1", status: "captured", amount: 0 } };
vi.mock("@/lib/server/razorpay", () => ({
  razorpayReady: () => true,
  razorpayKeyId: () => "rzp_test_x",
  createOrder: async (amountInr: number, _r: string, notes: Record<string, string>) => ({ id: "order_1", amount: Math.round(amountInr * 100), currency: "INR", status: "created", notes }),
  fetchOrder: async () => rz.order,
  fetchPayment: async () => rz.payment,
  capturePayment: async () => ({}),
  validSignature: () => rz.signatureOk,
}));
vi.mock("@/lib/server/mail", () => ({ mailReady: () => false, ownerEmail: () => "o@x.com", sendMail: async () => true, esc: (s: string) => s }));
const ai = { out: {} as unknown };
vi.mock("@/lib/server/gemini", () => ({ geminiJson: async () => ai.out, geminiReady: () => true }));

const OWNER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const tomorrow = () => new Date(Date.now() + 330 * 60_000 + 86_400_000).toISOString().slice(0, 10);
const brief = (over: Row = {}) => ({
  idempotencyKey: "key-12345678",
  objective: "whatsapp",
  platforms: "both",
  language: "en",
  offer: "Diwali box of 12 mithai for Rs 499",
  areas: [{ type: "radius", km: 10, label: "Cidco, Aurangabad", lat: 19.87, lng: 75.34 }],
  dailyBudgetInr: 300,
  days: 7,
  startDate: tomorrow(),
  ...over,
});

beforeEach(() => {
  for (const k of Object.keys(tables)) delete tables[k];
  n = 0;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
  rz.signatureOk = true;
  tables.workspaces = [
    { owner_id: OWNER, data: { business: { name: "Sharma Sweets", category: "Sweet shop", city: "Aurangabad", services: "mithai", description: "Fresh sweets daily", logo: "data:image/png;base64,AAAA" } } },
    { owner_id: OTHER, data: { business: { name: "Other Shop" } } },
  ];
});

const make = async (over: Row = {}) => {
  const { createCampaign } = await import("./campaigns");
  const r = await createCampaign(db, OWNER, brief(over));
  if (!r.ok) throw new Error(r.reason);
  return r.campaign;
};

describe("creating a campaign", () => {
  it("saves the brief, works out the end date and ad spend, and drops the logo", async () => {
    const c = await make();
    expect(c).toMatchObject({ status: "draft", daily_budget_inr: 300, days: 7, spend_estimate_inr: 2100, platforms: "both" });
    expect(new Date(String(c.end_date)).getTime() - new Date(String(c.start_date)).getTime()).toBe(6 * 86_400_000);
    expect((c.business as Row).logo).toBeUndefined();
  });
  it("a retried request returns the same campaign, not a second one", async () => {
    const { createCampaign } = await import("./campaigns");
    const a = await createCampaign(db, OWNER, brief());
    const b = await createCampaign(db, OWNER, brief());
    expect(a.ok && b.ok && a.campaign.id === b.campaign.id && b.existing).toBe(true);
    expect(tables.ad_campaigns).toHaveLength(1);
  });
  it("rejects a bad area, budget, date or missing business", async () => {
    const { createCampaign } = await import("./campaigns");
    const bad = async (over: Row, reason: string) => expect(await createCampaign(db, OWNER, brief({ idempotencyKey: `k-${Math.random()}-xx`, ...over }))).toMatchObject({ ok: false, reason });
    await bad({ areas: [{ type: "radius", km: 500, label: "x shop" }] }, "bad_area");
    await bad({ dailyBudgetInr: 10 }, "bad_budget");
    await bad({ startDate: "2020-01-01" }, "bad_start");
    await bad({ objective: "get_rich" }, "bad_objective");
    tables.workspaces = [];
    await bad({}, "no_business");
  });
});

describe("changing and reading a campaign", () => {
  it("the owner can change a draft; another account can't even see it", async () => {
    const { updateCampaign, getCampaign } = await import("./campaigns");
    const c = await make();
    const u = await updateCampaign(db, OWNER, c.id, { dailyBudgetInr: 500, days: 3 });
    expect(u.ok && u.campaign.spend_estimate_inr).toBe(1500);
    expect(await updateCampaign(db, OTHER, c.id, { dailyBudgetInr: 999 })).toMatchObject({ ok: false, reason: "not_found" });
    expect(await getCampaign(db, OTHER, c.id)).toMatchObject({ ok: false, reason: "not_found" });
  });
  it("only pictures from the owner's own ibaxai library are accepted", async () => {
    const { addAsset } = await import("./campaigns");
    const c = await make();
    expect(await addAsset(db, OWNER, c.id, { url: "https://evil.example/x.png" })).toMatchObject({ ok: false, reason: "bad_asset" });
    expect(await addAsset(db, OWNER, c.id, { url: `https://proj.supabase.co/storage/v1/object/public/ai-images/${OTHER}/1.png` })).toMatchObject({ ok: false, reason: "bad_asset" });
    expect(await addAsset(db, OWNER, c.id, { url: `https://proj.supabase.co/storage/v1/object/public/ai-images/${OWNER}/1.png`, placement: "feed 1:1" })).toMatchObject({ ok: true });
  });
});

describe("AI ad text", () => {
  it("throws away variations that invent a price, keeps the safe ones", async () => {
    const { generateCopy } = await import("./copy");
    const c = await make();
    ai.out = { variations: [
      { language: "en", headline: "Fresh mithai in Aurangabad", primary_text: "Diwali box of 12 mithai for Rs 499. Message us on WhatsApp.", description: "Order now", cta: "WHATSAPP_MESSAGE" },
      { language: "en", headline: "Now only ₹299!", primary_text: "Get 20% off on every box.", description: "Hurry", cta: "SHOP_NOW" },
    ] };
    const r = await generateCopy(db, OWNER, c.id, 3);
    expect(r).toMatchObject({ ok: true, rejected: 1 });
    expect(r.ok && r.creatives).toHaveLength(1);
    expect(tables.ad_campaigns[0].status).toBe("creatives_ready");
  });
  it("says so when everything the AI wrote was made up", async () => {
    const { generateCopy } = await import("./copy");
    const c = await make();
    ai.out = { variations: [{ language: "en", headline: "Only ₹99", primary_text: "100% guaranteed", description: "", cta: "SHOP_NOW" }] };
    expect(await generateCopy(db, OWNER, c.id, 3)).toMatchObject({ ok: false, reason: "no_safe_copy" });
    expect(tables.ad_creatives ?? []).toHaveLength(0);
  });
});

describe("approving and paying", () => {
  const prepare = async () => {
    const { addAsset, setApproved, requestPayment } = await import("./campaigns");
    const { generateCopy } = await import("./copy");
    const c = await make();
    ai.out = { variations: [{ language: "en", headline: "Fresh mithai", primary_text: "Diwali box of 12 mithai for Rs 499.", description: "Order now", cta: "WHATSAPP_MESSAGE" }] };
    const copy = await generateCopy(db, OWNER, c.id, 1);
    const img = await addAsset(db, OWNER, c.id, { url: `https://proj.supabase.co/storage/v1/object/public/ai-images/${OWNER}/1.png` });
    if (!copy.ok || !img.ok) throw new Error("setup");
    return { c, copyId: copy.creatives[0].id, imgId: img.creative.id, setApproved, requestPayment };
  };

  it("needs an approved text and picture first, and no videos yet", async () => {
    const { c, copyId, imgId, setApproved, requestPayment } = await prepare();
    expect(await requestPayment(db, OWNER, c.id, { imagePacks: 1 })).toMatchObject({ ok: false, reason: "no_copy" });
    await setApproved(db, OWNER, c.id, copyId, true);
    expect(await requestPayment(db, OWNER, c.id, { imagePacks: 1 })).toMatchObject({ ok: false, reason: "no_image" });
    await setApproved(db, OWNER, c.id, imgId, true);
    expect(await requestPayment(db, OWNER, c.id, { imagePacks: 1, templateVideos: 1 })).toMatchObject({ ok: false, reason: "videos_soon" });
    const r = await requestPayment(db, OWNER, c.id, { imagePacks: 1 });
    expect(r).toMatchObject({ ok: true });
    expect(tables.ad_campaigns[0]).toMatchObject({ status: "awaiting_payment", creative_fee_inr: 199, tax_inr: 0, spend_estimate_inr: 2100 });
  });

  it("is only 'paid' after the signature, owner, campaign and exact amount all match, and only once", async () => {
    const { c, copyId, imgId, setApproved, requestPayment } = await prepare();
    await setApproved(db, OWNER, c.id, copyId, true);
    await setApproved(db, OWNER, c.id, imgId, true);
    await requestPayment(db, OWNER, c.id, { imagePacks: 1 });
    const { createAdOrder, verifyAdPayment } = await import("./pay");

    expect(await createAdOrder(db, OTHER, c.id)).toMatchObject({ ok: false, reason: "not_found" });
    const order = await createAdOrder(db, OWNER, c.id);
    expect(order).toMatchObject({ ok: true, amountPaise: 19900 });
    const body = { id: c.id, razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: "sig" };
    const goodNotes = { user: OWNER, kind: "ads", campaign: String(c.id) };
    rz.order = { id: "order_1", amount: 19900, notes: goodNotes };
    rz.payment = { id: "pay_1", order_id: "order_1", status: "captured", amount: 19900 };

    rz.signatureOk = false;
    expect(await verifyAdPayment(db, OWNER, body)).toMatchObject({ ok: false, reason: "invalid_signature" });
    rz.signatureOk = true;
    rz.order = { id: "order_1", amount: 100, notes: goodNotes }; // someone paid ₹1 for a ₹199 order
    rz.payment = { id: "pay_1", order_id: "order_1", status: "captured", amount: 100 };
    expect(await verifyAdPayment(db, OWNER, body)).toMatchObject({ ok: false, reason: "mismatch" });
    rz.order = { id: "order_1", amount: 19900, notes: { ...goodNotes, user: OTHER } }; // someone else's order
    rz.payment = { id: "pay_1", order_id: "order_1", status: "captured", amount: 19900 };
    expect(await verifyAdPayment(db, OWNER, body)).toMatchObject({ ok: false, reason: "mismatch" });
    expect(tables.ad_campaigns[0].status).toBe("awaiting_payment");
    expect(tables.ad_payments ?? []).toHaveLength(0);

    rz.order = { id: "order_1", amount: 19900, notes: goodNotes };
    expect(await verifyAdPayment(db, OWNER, body)).toMatchObject({ ok: true });
    expect(await verifyAdPayment(db, OWNER, body)).toMatchObject({ ok: true }); // the browser confirms twice
    expect(tables.ad_payments).toHaveLength(1);
    expect(tables.ad_campaigns[0].status).toBe("ready_to_launch");
    expect(tables.ad_events.map((e) => e.type)).toEqual(expect.arrayContaining(["status:paid", "status:ready_to_launch"]));
  });

  it("a campaign that isn't waiting for payment can't start a payment", async () => {
    const { createAdOrder } = await import("./pay");
    const c = await make();
    expect(await createAdOrder(db, OWNER, c.id)).toMatchObject({ ok: false, reason: "not_payable" });
  });
});
