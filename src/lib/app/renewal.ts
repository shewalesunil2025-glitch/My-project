import type { Subscription, Workspace } from "./types";

/** Days before the end date when the app starts asking to renew. */
export const RENEW_SOON_DAYS = 3;

/** A plan that was paid for (not just the free trial). */
export const wasPaid = (ws: Workspace, s: Subscription) => s.period !== "one-time" && (s.status === "active" || ws.invoices.some((i) => i.serviceId === s.serviceId));

export const renewHref = (s: Subscription) => `/app/services/${s.serviceId}/checkout?period=${s.period}&renew=1`;

/** Paid plans that end within RENEW_SOON_DAYS, and paid plans that already ended. */
export function renewalsDue(ws: Workspace, now = Date.now()) {
  const soon = ws.subscriptions.filter((s) => s.status === "active" && s.period !== "one-time" && Date.parse(s.renewsAt) - now <= RENEW_SOON_DAYS * 86_400_000);
  const ended = ws.subscriptions.filter((s) => s.status === "expired" && wasPaid(ws, s));
  return { soon, ended };
}
