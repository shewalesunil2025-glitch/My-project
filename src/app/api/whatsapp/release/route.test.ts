import { beforeEach, describe, expect, it, vi } from "vitest";

/** Freeing a stuck WhatsApp number: founder only, never an official (Meta) number, and only the ownership row is removed. */
let founder: { id: string; email: string; db: object } | null = null;
let cloud: object | null = null;
let deleted = true;
const removed: string[] = [];
const db = {
  from: (t: string) => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: t === "wa_instances" ? { owner_id: "old" } : null }) }) }),
    delete: () => ({ eq: async (_c: string, v: string) => void removed.push(`${t}:${v}`) }),
  }),
};
vi.mock("@/lib/server/founder", () => ({ founderFromRequest: async () => founder }));
vi.mock("@/lib/server/waCloud", () => ({ cloudLink: async () => cloud }));
vi.mock("@/lib/server/waRelease", () => ({ deleteInstance: async () => deleted }));

import { POST } from "./route";
const call = (number: string) => POST(new Request("http://x/api", { method: "POST", body: JSON.stringify({ number }) }));

beforeEach(() => { founder = null; cloud = null; deleted = true; removed.length = 0; });

describe("release a WhatsApp number", () => {
  it("is for the founder only", async () => {
    expect((await call("917499414443")).status).toBe(403);
    expect(removed).toHaveLength(0);
  });
  it("frees the number: the instance and only the ownership row", async () => {
    founder = { id: "f", email: "f@x.com", db };
    const r = await call("917499414443");
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ ok: true, hadOwner: true });
    expect(removed).toEqual(["wa_instances:ibax-917499414443"]);
  });
  it("refuses a number linked through Meta and a bad number", async () => {
    founder = { id: "f", email: "f@x.com", db };
    cloud = {};
    expect((await call("917499414443")).status).toBe(409);
    cloud = null;
    expect((await call("12")).status).toBe(400);
    expect(removed).toHaveLength(0);
  });
  it("keeps the row when the WhatsApp server could not remove the instance", async () => {
    founder = { id: "f", email: "f@x.com", db };
    deleted = false;
    expect((await call("917499414443")).status).toBe(502);
    expect(removed).toHaveLength(0);
  });
});
