import { cloudPaidPlans } from "./cloud";
import { audit, nowIso, updateWorkspace } from "./store";
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
  updateWorkspace((w) => {
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
}
