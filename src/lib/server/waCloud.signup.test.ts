import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Embedded Signup server side, with Meta's Graph API and the database faked: no real Meta call,
 * no real WhatsApp number, no message is sent. (The popup, the OTP and Meta's review can only be
 * tested with a real number.)
 */

type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = {};
let failSaveOn: string | null = null;
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (t: string) => {
      const rows = (tables[t] ??= []);
      const q = (filters: [string, unknown][]) => ({
        eq: (c: string, v: unknown) => q([...filters, [c, v]]),
        maybeSingle: async () => ({ data: rows.find((r) => filters.every(([c, v]) => r[c] === v)) ?? null }),
      });
      return {
        select: () => q([]),
        upsert: async (row: Row, o: { onConflict: string }) => {
          if (failSaveOn === t) return { error: { message: "db down" } };
          const i = rows.findIndex((r) => r[o.onConflict] === row[o.onConflict]);
          if (i >= 0) rows[i] = { ...rows[i], ...row };
          else rows.push(row);
          return { error: null };
        },
        delete: () => ({ eq: async (c: string, v: unknown) => void (tables[t] = rows.filter((r) => r[c] !== v)) }),
      };
    },
  }),
}));
vi.mock("next/server", async (orig) => ({ ...(await orig<typeof import("next/server")>()), after: (fn: () => unknown) => void fn() }));

const calls: { url: string; method: string; body?: string }[] = [];
let graph: (url: string, method: string) => { status: number; json: unknown };
const path = (c: { url: string; method: string }) => `${c.method} ${c.url.replace("https://graph.facebook.com/v25.0", "").split("?")[0]}`;

beforeEach(() => {
  for (const k of Object.keys(tables)) delete tables[k];
  failSaveOn = null;
  calls.length = 0;
  process.env.META_APP_SECRET = "s3cret";
  process.env.NEXT_PUBLIC_META_APP_ID = "111";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://db";
  process.env.SUPABASE_SECRET_KEY = "k";
  process.env.N8N_EVOLUTION_WEBHOOK_URL = "https://n8n.example/webhook/ibax-evolution?token=t";
  delete process.env.NEXT_PUBLIC_META_WA_LIVE;
  delete process.env.META_WA_TEST_EMAILS;
  graph = (url) => {
    if (url.includes("/oauth/access_token")) return { status: 200, json: { access_token: "TOK" } };
    if (/\/\d+\?fields=/.test(url)) return { status: 200, json: { display_phone_number: "+91 98765 43210", verified_name: "Test Biz" } };
    if (url.includes("/phone_numbers")) return { status: 200, json: { data: [{ id: "800" }] } };
    return { status: 200, json: { success: true } };
  };
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), method: init?.method ?? "GET", body: init?.body as string | undefined });
    const r = String(url).startsWith("https://graph.facebook.com") ? graph(String(url), init?.method ?? "GET") : { status: 200, json: { ok: true } };
    return new Response(JSON.stringify(r.json), { status: r.status });
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const input = { code: "CODE_1234567890", wabaId: "900", phoneNumberId: "800", coexistence: false };

describe("finishSignup", () => {
  it("exchanges, subscribes, registers and saves the token encrypted", async () => {
    const { finishSignup } = await import("./waCloud");
    expect(await finishSignup("owner1", input)).toMatchObject({ ok: true, instance: "ibax-919876543210" });
    expect(calls.map(path)).toEqual(["GET /oauth/access_token", "GET /800", "POST /900/subscribed_apps", "POST /800/register"]);
    expect(String(tables.wa_cloud[0].token_enc)).not.toContain("TOK");
    expect(tables.wa_instances[0]).toMatchObject({ instance: "ibax-919876543210", owner_id: "owner1" });
  });

  it("a failed code exchange saves nothing", async () => {
    graph = (u) => (u.includes("oauth") ? { status: 400, json: { error: { message: "Invalid code" } } } : { status: 200, json: {} });
    const { finishSignup } = await import("./waCloud");
    expect(await finishSignup("o", input)).toMatchObject({ ok: false, reason: "exchange_failed" });
    expect(tables.wa_cloud ?? []).toHaveLength(0);
  });

  it("a missing permission on the number is reported, nothing saved", async () => {
    graph = (u) => (u.includes("oauth") ? { status: 200, json: { access_token: "T" } } : { status: 403, json: { error: { code: 10, message: "(#10) Permission denied" } } });
    const { finishSignup } = await import("./waCloud");
    expect(await finishSignup("o", input)).toMatchObject({ ok: false, reason: "number_not_found" });
    expect(tables.wa_cloud ?? []).toHaveLength(0);
  });

  it("a failed registration saves nothing", async () => {
    const g = graph;
    graph = (u, m) => (u.endsWith("/register") ? { status: 400, json: { error: { code: 133005, message: "PIN mismatch" } } } : g(u, m));
    const { finishSignup } = await import("./waCloud");
    expect(await finishSignup("o", input)).toMatchObject({ ok: false, reason: "register_failed" });
    expect(tables.wa_cloud ?? []).toHaveLength(0);
  });

  it("refuses a number another account already linked, before changing anything at Meta", async () => {
    tables.wa_instances = [{ instance: "ibax-919876543210", owner_id: "someone-else" }];
    const { finishSignup } = await import("./waCloud");
    expect(await finishSignup("owner1", input)).toMatchObject({ ok: false, reason: "taken" });
    expect(calls.some((c) => c.url.includes("subscribed_apps") || c.url.includes("register"))).toBe(false);
  });

  it("never takes over a number the same owner linked with a link code / QR", async () => {
    tables.wa_instances = [{ instance: "ibax-919876543210", owner_id: "owner1" }];
    const { finishSignup } = await import("./waCloud");
    expect(await finishSignup("owner1", input)).toMatchObject({ ok: false, reason: "already_linked" });
    expect(calls.some((c) => c.url.includes("subscribed_apps") || c.url.includes("register"))).toBe(false);
    expect(tables.wa_cloud ?? []).toHaveLength(0);
    expect(tables.wa_instances).toHaveLength(1);
  });

  it("a number already linked through Meta can be linked again by its owner", async () => {
    const { finishSignup } = await import("./waCloud");
    await finishSignup("owner1", input);
    expect(await finishSignup("owner1", input)).toMatchObject({ ok: true });
  });

  it("finds the number's id itself when Meta doesn't send it (WhatsApp Business app kept)", async () => {
    const { finishSignup } = await import("./waCloud");
    const r = await finishSignup("owner1", { code: "CODE_1234567890", wabaId: "900", coexistence: true });
    expect(r).toMatchObject({ ok: true, instance: "ibax-919876543210" });
    expect(calls.map(path)).toContain("GET /900/phone_numbers");
    expect(calls.some((c) => c.url.endsWith("/register"))).toBe(false); // no registration with the app kept
    expect(tables.wa_cloud[0].phone_number_id).toBe("800");
  });

  it("does not guess when the account has several numbers", async () => {
    const g = graph;
    graph = (u, m) => (u.includes("/phone_numbers") ? { status: 200, json: { data: [{ id: "1" }, { id: "2" }] } } : g(u, m));
    const { finishSignup } = await import("./waCloud");
    expect(await finishSignup("owner1", { code: "CODE_1234567890", wabaId: "900", coexistence: true })).toMatchObject({ ok: false, reason: "number_not_found" });
  });

  it("uses the same registration PIN every time for a number, so a re-link never mismatches", async () => {
    const { finishSignup, unlinkCloud, cloudLink } = await import("./waCloud");
    await finishSignup("o", input);
    const link = await cloudLink("ibax-919876543210");
    await unlinkCloud(link!);
    expect(tables.wa_instances ?? []).toHaveLength(0); // ownership row goes with the link
    await finishSignup("o", input);
    const pins = calls.filter((c) => c.url.endsWith("/register")).map((c) => JSON.parse(c.body!).pin);
    expect(pins).toHaveLength(2);
    expect(pins[0]).toBe(pins[1]);
    expect(pins[0]).toMatch(/^\d{6}$/);
  });

  it("a database failure after registering still leaves a recoverable PIN", async () => {
    failSaveOn = "wa_cloud";
    const { finishSignup } = await import("./waCloud");
    expect(await finishSignup("o", input)).toMatchObject({ ok: false, reason: "server_error" });
    failSaveOn = null;
    await finishSignup("o", input);
    const pins = calls.filter((c) => c.url.endsWith("/register")).map((c) => JSON.parse(c.body!).pin);
    expect(pins[0]).toBe(pins[1]);
  });
});

describe("who may finish a signup before Meta approves the app", () => {
  it("only listed accounts, until NEXT_PUBLIC_META_WA_LIVE=1", async () => {
    const { cloudSignupAllowed } = await import("./waCloud");
    expect(cloudSignupAllowed("owner@x.com")).toBe(false);
    process.env.META_WA_TEST_EMAILS = " Owner@X.com , other@y.com ";
    expect(cloudSignupAllowed("owner@x.com")).toBe(true);
    expect(cloudSignupAllowed("stranger@x.com")).toBe(false);
    expect(cloudSignupAllowed(undefined)).toBe(false);
    process.env.NEXT_PUBLIC_META_WA_LIVE = "1";
    expect(cloudSignupAllowed("stranger@x.com")).toBe(true);
  });
});

describe("webhook and send endpoint", () => {
  const sign = (raw: string) => `sha256=${createHmac("sha256", "s3cret").update(raw).digest("hex")}`;
  const post = (raw: string, signature?: string) => new Request("http://x", { method: "POST", body: raw, headers: signature ? { "x-hub-signature-256": signature } : {} });

  it("rejects unsigned posts and forwards signed customer and owner messages to n8n in Evolution's shape", async () => {
    const { finishSignup } = await import("./waCloud");
    await finishSignup("owner1", input);
    calls.length = 0;
    const { POST } = await import("@/app/api/whatsapp/cloud/webhook/route");
    const raw = JSON.stringify({
      entry: [
        {
          changes: [
            { field: "messages", value: { metadata: { phone_number_id: "800" }, contacts: [{ wa_id: "919000000001", profile: { name: "Ravi" } }], messages: [{ from: "919000000001", id: "wamid.1", type: "text", text: { body: "price?" } }] } },
            { field: "smb_message_echoes", value: { metadata: { phone_number_id: "800" }, message_echoes: [{ from: "919876543210", to: "919000000001", id: "wamid.2", type: "text", text: { body: "hello from owner" } }] } },
          ],
        },
      ],
    });
    expect((await POST(post(raw))).status).toBe(401);
    expect((await POST(post(raw, sign(raw)))).status).toBe(200);
    await new Promise((r) => setTimeout(r, 30));
    const sent = calls.filter((c) => c.url.startsWith("https://n8n.example")).map((c) => JSON.parse(c.body!));
    expect(sent).toHaveLength(2);
    expect(sent[0]).toMatchObject({ event: "messages.upsert", instance: "ibax-919876543210", data: { key: { remoteJid: "919000000001@s.whatsapp.net", fromMe: false }, pushName: "Ravi", message: { conversation: "price?" } } });
    expect(sent[0].server_url).toMatch(/\/api\/whatsapp\/cloud\/evo$/);
    expect(sent[1].data.key.fromMe).toBe(true);
  });

  it("ignores messages for a number that isn't linked", async () => {
    const { POST } = await import("@/app/api/whatsapp/cloud/webhook/route");
    const raw = JSON.stringify({ entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: "nope" }, messages: [{ from: "1", id: "w", type: "text", text: { body: "x" } }] } }] }] });
    expect((await POST(post(raw, sign(raw)))).status).toBe(200);
    await new Promise((r) => setTimeout(r, 30));
    expect(calls.some((c) => c.url.startsWith("https://n8n.example"))).toBe(false);
  });

  it("the send endpoint needs the number's own key and turns Meta's refusal into a 502", async () => {
    const { finishSignup, evoKeyFor } = await import("./waCloud");
    await finishSignup("owner1", input);
    const { POST } = await import("@/app/api/whatsapp/cloud/evo/message/sendText/[instance]/route");
    const mk = (key: string) => new Request("http://x", { method: "POST", headers: { apikey: key, "content-type": "application/json" }, body: JSON.stringify({ number: "919000000001", text: "hi" }) });
    const ctx = { params: Promise.resolve({ instance: "ibax-919876543210" }) };
    expect((await POST(mk("bad"), ctx)).status).toBe(401);
    graph = (u) => (u.endsWith("/messages") ? { status: 200, json: { messages: [{ id: "wamid.out" }] } } : { status: 200, json: {} });
    expect((await POST(mk(evoKeyFor("ibax-919876543210")), ctx)).status).toBe(201);
    graph = (u) => (u.endsWith("/messages") ? { status: 400, json: { error: { code: 131047, message: "Re-engagement message" } } } : { status: 200, json: {} });
    expect((await POST(mk(evoKeyFor("ibax-919876543210")), ctx)).status).toBe(502);
  });

  it("usesCloud tells a Cloud number from a link-code one", async () => {
    const { finishSignup, usesCloud } = await import("./waCloud");
    await finishSignup("owner1", input);
    expect(await usesCloud("ibax-919876543210")).toBe(true);
    expect(await usesCloud("ibax-911111111111")).toBe(false);
  });
});
