import { createHmac } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

let m: typeof import("./waCloud");

beforeAll(async () => {
  process.env.META_APP_SECRET = "test-secret";
  process.env.NEXT_PUBLIC_META_APP_ID = "123";
  m = await import("./waCloud");
});

describe("waCloud", () => {
  it("seals and unseals a token, and rejects a tampered one", () => {
    const sealed = m.seal("EAAG-token");
    expect(sealed).not.toContain("EAAG");
    expect(m.unseal(sealed)).toBe("EAAG-token");
    const [iv, tag, body] = sealed.split(".");
    expect(m.unseal([iv, tag, body.slice(0, -2) + (body.endsWith("A") ? "BB" : "AA")].join("."))).toBeNull();
    expect(m.unseal("garbage")).toBeNull();
  });

  it("checks Meta's webhook signature", () => {
    const raw = JSON.stringify({ entry: [] });
    const good = `sha256=${createHmac("sha256", "test-secret").update(raw).digest("hex")}`;
    expect(m.signatureOk(raw, good)).toBe(true);
    expect(m.signatureOk(raw + " ", good)).toBe(false);
    expect(m.signatureOk(raw, null)).toBe(false);
    expect(m.signatureOk(raw, "sha256=abc")).toBe(false);
  });

  it("gives each instance its own send key", () => {
    const k = m.evoKeyFor("ibax-919876543210");
    expect(m.evoKeyOk("ibax-919876543210", k)).toBe(true);
    expect(m.evoKeyOk("ibax-919876543211", k)).toBe(false);
    expect(m.evoKeyOk("ibax-919876543210", null)).toBe(false);
  });
});
