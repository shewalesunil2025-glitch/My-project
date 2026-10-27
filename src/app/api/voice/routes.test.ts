import { beforeEach, describe, expect, it, vi } from "vitest";

/** The voice routes' front doors: who may call them. The database and the founder check are faked. */
const handled: unknown[] = [];
vi.mock("@/lib/server/followup", () => ({ adminDb: () => ({}) }));
vi.mock("@/lib/server/voice/service", () => ({
  handleEvent: async (_d: unknown, _p: unknown, ev: unknown) => { handled.push(ev); return { status: 200, body: { ok: true } }; },
  adminOverview: async () => ({ numbers: [] }), adminSavePlan: async () => ({ ok: true }), adminNumberAction: async () => ({ ok: true }),
}));
let founder: { id: string; email: string; db: object } | null = null;
vi.mock("@/lib/server/founder", () => ({ founderFromRequest: async () => founder }));

import { POST as webhook } from "./webhook/route";
import { POST as admin } from "./admin/route";

const event = { message: { type: "end-of-call-report", call: { id: "c1", phoneNumberId: "p" } } };
const req = (body: unknown, headers: Record<string, string> = {}) => new Request("http://x/api", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

beforeEach(() => { handled.length = 0; founder = null; process.env.VAPI_WEBHOOK_SECRET = "good-secret"; });

describe("webhook door", () => {
  it("refuses a request without the right secret and does nothing", async () => {
    expect((await webhook(req(event))).status).toBe(401);
    expect((await webhook(req(event, { authorization: "Bearer nope" }))).status).toBe(401);
    expect(handled).toHaveLength(0);
  });
  it("accepts the right secret and rejects bad JSON", async () => {
    expect((await webhook(req(event, { authorization: "Bearer good-secret" }))).status).toBe(200);
    expect(handled).toHaveLength(1);
    const bad = new Request("http://x/api", { method: "POST", headers: { authorization: "Bearer good-secret" }, body: "{not json" });
    expect((await webhook(bad)).status).toBe(400);
  });
  it("is closed when no secret is configured", async () => {
    process.env.VAPI_WEBHOOK_SECRET = "";
    expect((await webhook(req(event, { authorization: "Bearer " }))).status).toBe(401);
  });
});

describe("admin door", () => {
  it("is for the founder only", async () => {
    expect((await admin(req({ action: "overview" }))).status).toBe(403);
    expect((await admin(req({ action: "save_plan", id: "standard" }))).status).toBe(403);
    founder = { id: "f", email: "f@x.com", db: {} };
    expect((await admin(req({ action: "overview" }))).status).toBe(200);
    expect((await admin(req({ action: "nope" }))).status).toBe(400);
  });
});
