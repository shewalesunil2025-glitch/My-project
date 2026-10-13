import { serviceById } from "@/content/app/services";
import { cloudAuthHeader, cloudEnabled } from "./cloud";
import { audit, currentWorkspace, logActivity, nowIso, uid, updateWorkspace } from "./store";
import { trialOver } from "./trial";
import type { ReviewRequest, Workspace } from "./types";

/** Same form as the server keeps: digits with the country code (10-digit numbers are Indian). */
const waNumber = (input: string) => {
  const d = input.replace(/\D/g, "").replace(/^0+/, "");
  return d.length === 10 ? `91${d}` : d;
};

/** Google Review Management is on (and its free trial, if any, hasn't ended). */
export const reviewsOn = (ws: Workspace) => ws.automations.some((a) => a.serviceId === "reviews" && a.status === "active" && !trialOver(a));

export type AskResult = "sent" | "off" | "invalid" | "already" | "limit" | "not_linked" | "failed" | "unauthorized";

export const askMessages: Record<AskResult, string> = {
  sent: "Review request sent on WhatsApp ✓",
  off: "Switch on Google Review Management (with your review link) first.",
  invalid: "That doesn't look like a WhatsApp number.",
  already: "This customer was already asked in the last 30 days.",
  limit: "Today's limit is reached (40 a day keeps your WhatsApp safe). Try tomorrow.",
  not_linked: "Your WhatsApp isn't linked right now — relink it in Settings → Accounts.",
  failed: "WhatsApp didn't accept the message. Check the number and try again.",
  unauthorized: "Please log in again.",
};

/** Asks one customer for a Google review on the owner's WhatsApp and records it. */
export async function askForReview(name: string, phone: string, source: ReviewRequest["source"]): Promise<AskResult> {
  const ws = currentWorkspace();
  if (!ws || !reviewsOn(ws)) return "off";
  let result: AskResult = "sent";
  // Preview mode (no accounts server): the request is recorded but not sent.
  if (cloudEnabled && !ws.sample) {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json", ...(await cloudAuthHeader()) },
      body: JSON.stringify({ name, phone }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { result?: AskResult } | null;
    result = data?.result ?? "failed";
  }
  if (result === "sent" || result === "failed") {
    updateWorkspace((w) => {
      w.reviewRequests = [{ id: uid(), name: name.trim() || "Customer", phone: waNumber(phone), at: nowIso(), status: result === "sent" ? ("sent" as const) : ("failed" as const), source }, ...(w.reviewRequests ?? [])].slice(0, 300);
      if (result === "sent") {
        logActivity(w, { kind: "review", title: `Review request sent to ${name.trim() || "a customer"}`, href: "/app/reviews" });
        audit(w, `${serviceById("reviews")?.name}: asked ${name.trim() || phone} for a review`);
      }
    });
  }
  return result;
}
