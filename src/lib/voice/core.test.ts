import { describe, expect, it } from "vitest";
import { billableSeconds, buildInstructions, cleanPhone, cycleFor, minutesState, planSellable, voiceFor, voiceStatus, VOICES, type AssistantConfig } from "./core";

const A = (d: string) => new Date(d);
describe("monthly window", () => {
  it("counts from the start day", () => {
    const c = cycleFor(A("2026-01-15T00:00:00Z"), A("2026-03-20T10:00:00Z"));
    expect(c.start.toISOString()).toBe("2026-03-15T00:00:00.000Z");
    expect(c.end.toISOString()).toBe("2026-04-15T00:00:00.000Z");
  });
  it("31 Jan never jumps into March", () => {
    const c = cycleFor(A("2026-01-31T00:00:00Z"), A("2026-02-28T12:00:00Z"));
    expect(c.start.toISOString()).toBe("2026-02-28T00:00:00.000Z");
    expect(c.end.toISOString()).toBe("2026-03-31T00:00:00.000Z");
  });
  it("is the first window right at the start", () => {
    const c = cycleFor(A("2026-05-10T00:00:00Z"), A("2026-05-10T00:00:00Z"));
    expect(c.start.toISOString()).toBe("2026-05-10T00:00:00.000Z");
  });
});
describe("minutes", () => {
  it("rounds up to whole minutes", () => {
    expect(billableSeconds(0)).toBe(0);
    expect(billableSeconds(1)).toBe(60);
    expect(billableSeconds(61)).toBe(120);
  });
  it("blocks at the package when there is no overage price or cap", () => {
    expect(minutesState(100 * 60, { includedMinutes: 100, overageInrPerMinute: null, hardCapMinutes: null }).blocked).toBe(true);
  });
  it("allows overage up to the hard cap only", () => {
    const p = { includedMinutes: 100, overageInrPerMinute: 5, hardCapMinutes: 120 };
    expect(minutesState(110 * 60, p)).toMatchObject({ blocked: false, overage: true });
    expect(minutesState(120 * 60, p).blocked).toBe(true);
  });
  it("warns from 80%", () => {
    const p = { includedMinutes: 100, overageInrPerMinute: null, hardCapMinutes: null };
    expect(minutesState(79 * 60, p).warn).toBe(false);
    expect(minutesState(80 * 60, p).warn).toBe(true);
  });
  it("a plan without minutes cannot be sold", () => {
    expect(planSellable({ includedMinutes: null, active: true })).toBe(false);
    expect(planSellable({ includedMinutes: 100, active: false })).toBe(false);
    expect(planSellable({ includedMinutes: 100, active: true })).toBe(true);
  });
});
describe("status", () => {
  const base = { paid: true, assistantReady: true, numberStatus: "active" as const, testPassed: true, suspended: false, paused: false };
  it("is active only with payment, assistant, live number and a passed test", () => {
    expect(voiceStatus(base)).toBe("active");
    expect(voiceStatus({ ...base, testPassed: false })).toBe("ready_for_testing");
    expect(voiceStatus({ ...base, paid: false })).toBe("awaiting_payment");
    expect(voiceStatus({ ...base, numberStatus: "configuration_in_progress" })).toBe("awaiting_number");
    expect(voiceStatus({ ...base, numberStatus: null })).toBe("awaiting_number");
    expect(voiceStatus({ ...base, assistantReady: false })).toBe("setup_needed");
    expect(voiceStatus({ ...base, numberStatus: "failed" })).toBe("failed");
    expect(voiceStatus({ ...base, suspended: true })).toBe("suspended");
    expect(voiceStatus({ ...base, paused: true })).toBe("paused");
  });
});
describe("voices and language", () => {
  it("has a woman and a man for Hindi and English", () => {
    for (const l of ["hi", "en"]) for (const g of ["female", "male"]) expect(voiceFor(l, g)).toBeTruthy();
    expect(new Set(VOICES.map((v) => v.phoneVoice)).size).toBe(VOICES.length);
    expect(voiceFor("mr", "female")).toBeUndefined();
  });
  it("instructions use only the typed facts, say AI, and carry the language", () => {
    const cfg: AssistantConfig = { name: "Riya", language: "hi", voiceGender: "female", greeting: "", style: "warm", neverSay: "politics", transferNumber: "", handoff: "refund", knowledge: { prices: "Haircut 200" }, businessName: "Salon X", keepTranscripts: false };
    const t = buildInstructions(cfg);
    expect(t).toContain("Hindi");
    expect(t).toContain("Haircut 200");
    expect(t).toContain("AI assistant");
    expect(t).toContain("politics");
    expect(t).not.toContain("Marathi");
  });
  it("phone numbers", () => {
    expect(cleanPhone("+91 98765 43210")).toBe("+919876543210");
    expect(cleanPhone("123")).toBeNull();
  });
});
