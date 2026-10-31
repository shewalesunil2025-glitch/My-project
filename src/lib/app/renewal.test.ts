import { describe, expect, it } from "vitest";
import { convertPaidTrials } from "./renewal";
import type { Workspace } from "./types";

/** A paid client must never be paused because the app missed their payment (the page closed, another device). */

const NOW = Date.parse("2026-10-20T10:00:00Z");
const FUTURE = "2026-11-18T10:00:00.000Z";

const ws = (over: Record<string, unknown> = {}) =>
  ({
    audit: [],
    subscriptions: [{ id: "s1", serviceId: "whatsapp", period: "monthly", price: 499, status: "trial", startedAt: "2026-10-01T00:00:00Z", renewsAt: "2026-10-04T00:00:00Z" }],
    automations: [{ id: "a1", serviceId: "whatsapp", subscriptionId: "s1", status: "paused", activatedAt: "2026-10-01T00:00:00Z", trialEndsAt: "2026-10-04T00:00:00Z", note: "Your free trial has ended. Pay to switch it back on.", logs: [] }],
    ...over,
  }) as unknown as Workspace;

describe("paid on the server, still a trial in the app", () => {
  it("converts the trial to the paid plan and switches the service back on", () => {
    const w = ws();
    const done = convertPaidTrials(w, [{ service_id: "whatsapp", period: "monthly", renews_at: FUTURE }], NOW);
    expect(done).toEqual(["whatsapp"]);
    const a = w.automations[0];
    expect(a.trialEndsAt).toBeUndefined();
    expect(a.status).toBe("active");
    expect(a.note).toBeUndefined();
    expect(Date.parse(a.paidUntil!)).toBeGreaterThan(Date.parse(FUTURE)); // plus the grace days
    expect(w.subscriptions[0]).toMatchObject({ status: "active", renewsAt: FUTURE });
  });
  it("is safe to run twice", () => {
    const w = ws();
    const rows = [{ service_id: "whatsapp", period: "monthly", renews_at: FUTURE }];
    convertPaidTrials(w, rows, NOW);
    expect(convertPaidTrials(w, rows, NOW)).toEqual([]);
  });
  it("does nothing for a payment that has already ended, another service, or a trial with no payment", () => {
    const w = ws();
    expect(convertPaidTrials(w, [{ service_id: "whatsapp", period: "monthly", renews_at: "2026-10-01T00:00:00Z" }], NOW)).toEqual([]);
    expect(convertPaidTrials(w, [{ service_id: "followup", period: "monthly", renews_at: FUTURE }], NOW)).toEqual([]);
    expect(convertPaidTrials(w, [], NOW)).toEqual([]);
    expect(w.automations[0].trialEndsAt).toBeTruthy();
    expect(w.automations[0].status).toBe("paused");
  });
  it("keeps a service that is already on (never paused) running", () => {
    const w = ws();
    w.automations[0].status = "active";
    convertPaidTrials(w, [{ service_id: "whatsapp", period: "monthly", renews_at: FUTURE }], NOW);
    expect(w.automations[0].status).toBe("active");
    expect(w.automations[0].trialEndsAt).toBeUndefined();
  });
});
