import { activateService, automationFor } from "./agentActions";
import { cloudPaidPlans } from "./cloud";
import { audit, currentWorkspace, nowIso, updateWorkspace } from "./store";
import { paidUntilFor } from "./trial";
import type { Subscription, Workspace } from "./types";

/** Days before the end date when the app starts asking to renew. */
export const RENEW_SOON_DAYS = 3;

/** A plan that was paid for (not just the free trial). */
export const wasPaid = (ws: Workspace, s: Subscription) => s.period !== "one-time" && (s.status === "active" || ws.invoices.some((i) => i.serviceId === s.serviceId));

export const renewHref = (s: Subscription) => `/app/services/${s.serviceId}/checkout?period=${s.period}&renew=1`;

/** Paid plans that end within RENEW_SOON_DAYS, and paid plans that already ended. */
export function renewalsDue(ws: Workspace, now = Date.now()) {
  const soon = ws.subscriptions.filter((s) => s.status === "active" && s.period !== "one-time" && !s.autopayId && Date.parse(s.renewsAt) - now <= RENEW_SOON_DAYS * 86_400_000);
  const ended = ws.subscriptions.filter((s) => s.status === "expired" && wasPaid(ws, s));
  return { soon, ended };
}

/**
 * A payment the server verified (a row in `subscriptions`) for a service that still runs as a free
 * trial in the workspace: the app never got to convert it (the page closed after paying, or it was
 * paid on another device). The paid plan wins: the trial end date is dropped, the plan runs to the
 * server's end date plus the grace days, and a service that was paused for "trial ended" is switched back on.
 * Returns the ids of the services that were converted. Safe to run again.
 */
export function convertPaidTrials(w: Workspace, rows: { service_id: string; period: string; renews_at: string | null }[], now = Date.now()): string[] {
  const done: string[] = [];
  for (const r of rows) {
    if (!r.renews_at || Date.parse(r.renews_at) <= now) continue;
    const a = w.automations.find((x) => x.serviceId === r.service_id);
    if (!a || !a.trialEndsAt) continue;
    const sub = w.subscriptions.find((x) => x.id === a.subscriptionId);
    const period = r.period === "annual" ? "annual" : "monthly";
    if (sub) Object.assign(sub, { period, status: "active", renewsAt: r.renews_at });
    delete a.trialEndsAt;
    a.paidUntil = paidUntilFor(r.renews_at);
    if (a.status === "paused") {
      a.status = a.activatedAt ? "active" : "setup";
      a.note = undefined;
    }
    a.logs.unshift({ at: nowIso(), level: "success", message: `Payment found — the plan runs until ${new Date(r.renews_at).toLocaleDateString()}` });
    audit(w, `Paid plan for ${r.service_id} found on the server — trial converted`);
    done.push(r.service_id);
  }
  return done;
}

let lastSync = 0;

/**
 * Brings in plans the server extended while the app was closed (Autopay charges arrive by
 * Razorpay webhook): the server's end date wins when it is later. At most every 10 minutes.
 */
export async function syncPaidPlans() {
  if (Date.now() - lastSync < 10 * 60_000) return;
  lastSync = Date.now();
  const rows = await cloudPaidPlans();
  if (!rows.length) return;
  let converted: string[] = [];
  updateWorkspace((w) => {
    converted = convertPaidTrials(w, rows);
    for (const r of rows) {
      if (!r.renews_at) continue;
      const sub = w.subscriptions.find((s) => s.serviceId === r.service_id && s.period !== "one-time" && s.status !== "trial");
      if (!sub || Date.parse(r.renews_at) <= Date.parse(sub.renewsAt) + 60_000) continue;
      sub.renewsAt = r.renews_at;
      if (sub.status === "expired") sub.status = "active";
      const a = w.automations.find((x) => x.subscriptionId === sub.id);
      if (a && !a.trialEndsAt) {
        const wasOver = Boolean(a.paidUntil && Date.parse(a.paidUntil) <= Date.now());
        a.paidUntil = paidUntilFor(r.renews_at);
        if (wasOver && a.status === "paused") {
          a.status = a.activatedAt ? "active" : "setup";
          a.note = undefined;
        }
        a.logs.unshift({ at: nowIso(), level: "success", message: `Plan renewed until ${new Date(r.renews_at).toLocaleDateString()}` });
      }
      audit(w, `Plan for ${sub.serviceId} renewed until ${r.renews_at.slice(0, 10)}`);
    }
  });
  // The automation server still has the trial's end date: tell it the plan is paid.
  for (const id of converted) {
    if (automationFor(currentWorkspace()!, id)?.status === "active") void activateService(id).catch(() => {});
  }
}
