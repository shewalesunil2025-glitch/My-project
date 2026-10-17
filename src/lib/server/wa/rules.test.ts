import { describe, expect, it } from "vitest";
import { cleanId, dailyLimit, instanceOk, secretMatches, shouldAutoResume, type ContactState } from "./rules";

const H = 3_600_000;
const now = Date.parse("2026-10-16T12:00:00Z");
const ago = (h: number) => new Date(now - h * H).toISOString();
const paused = (o: Partial<ContactState> = {}): ContactState => ({ bot_status: "paused", needs_attention: false, paused_at: ago(30), last_in_at: ago(30), last_owner_at: null, ...o });

describe("bot resume", () => {
  it("resumes after 24 h of silence", () => expect(shouldAutoResume(paused(), now)).toBe(true));
  it("not before 24 h", () => expect(shouldAutoResume(paused({ paused_at: ago(2), last_in_at: ago(2) }), now)).toBe(false));
  it("never while the owner is needed", () => expect(shouldAutoResume(paused({ needs_attention: true }), now)).toBe(false));
  it("owner replied recently → stays paused", () => expect(shouldAutoResume(paused({ last_owner_at: ago(3) }), now)).toBe(false));
  it("an active bot stays as is", () => expect(shouldAutoResume(paused({ bot_status: "on" }), now)).toBe(false));
});

describe("daily limit", () => {
  it("defaults and clamps", () => {
    expect(dailyLimit("")).toBe(30);
    expect(dailyLimit("abc")).toBe(30);
    expect(dailyLimit("0")).toBe(30);
    expect(dailyLimit("12")).toBe(12);
    expect(dailyLimit(99999)).toBe(500);
  });
});

describe("input validation", () => {
  it("accepts only ibax instances", () => {
    expect(instanceOk("ibax-919876543210")).toBe(true);
    expect(instanceOk("ibax-1; drop")).toBe(false);
    expect(instanceOk("other-919876543210")).toBe(false);
  });
  it("cleans message ids", () => {
    expect(cleanId("3EB0A1B2C3")).toBe("3EB0A1B2C3");
    expect(cleanId("a b")).toBeNull();
    expect(cleanId(5)).toBeNull();
  });
});

describe("server secret", () => {
  it("accepts current and next secret, rejects others", () => {
    expect(secretMatches("aaa", "aaa", undefined)).toBe(true);
    expect(secretMatches("bbb", "aaa", "bbb")).toBe(true);
    expect(secretMatches("ccc", "aaa", "bbb")).toBe(false);
    expect(secretMatches(null, "aaa")).toBe(false);
    expect(secretMatches("aaa", undefined, undefined)).toBe(false);
    expect(secretMatches("", "", "")).toBe(false);
  });
});

describe("owner typing on their own WhatsApp", () => {
  it("tells the owner's messages from the server's", async () => {
    const { typedByOwner } = await import("./rules");
    expect(typedByOwner(true, "3A923620ED6C5FA388EF")).toBe(true); // iPhone
    expect(typedByOwner(true, "BB2D3F0A1C8E44F19A71C2D3E4F5A6B7")).toBe(true); // Android
    expect(typedByOwner(true, "3EB0C431D3F2A1B2C3D4E5")).toBe(false); // sent by the server
    expect(typedByOwner(false, "3A923620ED6C5FA388EF")).toBe(false); // from the customer
  });
  it("stops a reply when the owner stepped in after it was started", async () => {
    const { maySend } = await import("./rules");
    const since = Date.parse("2026-10-17T12:00:00Z");
    expect(maySend(null, since)).toBe(true);
    expect(maySend({ bot_status: "on", last_owner_at: null }, since)).toBe(true);
    expect(maySend({ bot_status: "paused", last_owner_at: null }, since)).toBe(false);
    expect(maySend({ bot_status: "on", last_owner_at: "2026-10-17T12:00:05Z" }, since)).toBe(false);
    expect(maySend({ bot_status: "on", last_owner_at: "2026-10-17T11:00:00Z" }, since)).toBe(true);
  });
});
