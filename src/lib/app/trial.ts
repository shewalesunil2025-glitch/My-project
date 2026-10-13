import { TRIAL_DAYS, serviceById } from "@/content/app/services";
import { audit, logActivity, notify, nowIso, updateWorkspace } from "./store";
import type { Automation, Workspace } from "./types";

/**
 * The free trial: once per account, TRIAL_DAYS of the messaging automations and the website
 * builder at no cost. When it ends, every service still on the trial pauses until it's paid.
 */

export type TrialPhase = { phase: "unused" } | { phase: "on"; endsAt: string; msLeft: number } | { phase: "over"; endsAt: string };

export function trialState(ws: Workspace, now = Date.now()): TrialPhase {
  if (!ws.trial) return { phase: "unused" };
  const left = Date.parse(ws.trial.endsAt) - now;
  return left > 0 ? { phase: "on", endsAt: ws.trial.endsAt, msLeft: left } : { phase: "over", endsAt: ws.trial.endsAt };
}

/** "2 days 5 hours left", "5 hours left", "20 minutes left". */
export function timeLeft(ms: number) {
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} day${days > 1 ? "s" : ""}${hours % 24 ? ` ${hours % 24} hour${hours % 24 > 1 ? "s" : ""}` : ""} left`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} left`;
  return `${Math.max(1, Math.ceil(ms / 60_000))} minutes left`;
}

/** True when this automation ran on the trial and the trial has ended without payment. */
export const trialOver = (a: Pick<Automation, "trialEndsAt">, now = Date.now()) => Boolean(a.trialEndsAt && Date.parse(a.trialEndsAt) <= now);

/** Starts the account's free trial (once). Returns false when it was already used up. */
export function beginTrial(): boolean {
  let ok = false;
  updateWorkspace((w) => {
    if (w.trial) {
      ok = Date.parse(w.trial.endsAt) > Date.now();
      return;
    }
    const ends = new Date(Date.now() + TRIAL_DAYS * 86_400_000).toISOString();
    w.trial = { startedAt: nowIso(), endsAt: ends };
    logActivity(w, { kind: "system", title: `Free ${TRIAL_DAYS}-day trial started`, href: "/app/services" });
    notify(w, {
      kind: "message",
      title: `Your ${TRIAL_DAYS}-day free trial has started 🎁`,
      detail: "Switch on WhatsApp, Lead Follow-up and the other messaging automations, and build your website — free until the trial ends.",
      href: "/app/services",
    });
    audit(w, "Started the free trial");
    ok = true;
  });
  return ok;
}

/** Pauses every service still on the trial once the trial is over. Safe to call often. */
export function expireTrials(ws: Workspace) {
  const due = ws.automations.some((a) => trialOver(a) && a.status !== "paused") || ws.subscriptions.some((s) => s.status === "trial" && Date.parse(s.renewsAt) <= Date.now());
  if (!due) return;
  updateWorkspace((w) => {
    let paused = 0;
    for (const s of w.subscriptions) if (s.status === "trial" && Date.parse(s.renewsAt) <= Date.now()) s.status = "expired";
    for (const a of w.automations) {
      if (!trialOver(a) || a.status === "paused") continue;
      a.status = "paused";
      a.note = "Your free trial has ended. Pay to switch it back on.";
      a.logs.unshift({ at: nowIso(), level: "warning", message: "Free trial ended — paused until paid" });
      paused++;
    }
    if (paused) {
      notify(w, { kind: "expiry", title: "Your free trial has ended", detail: "Your trial automations are paused. Pay for any service to switch it back on.", href: "/app/billing" });
      audit(w, `Free trial ended — ${paused} service${paused > 1 ? "s" : ""} paused`);
    }
  });
}

/** Website builder access: paid (or already live), on the trial, or locked. */
export function websiteAccess(ws: Workspace): "paid" | "trial" | "unused" | "over" {
  const paid = ws.automations.some((a) => (a.serviceId === "website" || a.serviceId === "digital-marketing") && !a.trialEndsAt);
  if (paid || ws.website?.publishedAt || ws.sample) return "paid";
  const t = trialState(ws).phase;
  return t === "on" ? "trial" : t;
}

export const trialServiceNames = (ids: readonly string[]) => ids.map((id) => serviceById(id)?.name).filter(Boolean) as string[];
