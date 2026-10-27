import type { SupabaseClient } from "@supabase/supabase-js";
import { directReviewLink, reviewMessage } from "@/lib/reviewMessage";
import { connectionState, evo, evolutionReady, instanceFor, ownership, waDigits } from "./whatsapp";
import { dialForCountry } from "@/lib/phone";
import { usesCloud } from "./waCloud";

/**
 * Google Review requests: after a visit or a sale, IBAX asks the customer on the owner's own
 * WhatsApp for a Google review, with the owner's review link. Only real customers are asked,
 * once a month at most, and never more than DAILY_LIMIT a day (WhatsApp limits bulk sends).
 * Reading reviews and replying on Google needs the Google Business Profile API (part 2).
 */

const DAILY_LIMIT = 40;
const ONCE_PER_MS = 30 * 86_400_000;

type WorkspaceData = {
  business?: { name?: string; country?: string } | null;
  automations?: { serviceId: string; status: string; config?: Record<string, unknown>; trialEndsAt?: string; paidUntil?: string }[];
  connections?: { whatsapp?: { account?: string; status?: string } };
  reviewRequests?: { phone: string; at: string; status?: string }[];
};

export type ReviewResult = "sent" | "off" | "invalid" | "already" | "limit" | "not_linked" | "failed";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Sends one review request from the owner's WhatsApp, if Google Review Management is on. */
export async function requestReview(db: SupabaseClient, ownerId: string, customer: { name: string; phone: string }): Promise<ReviewResult> {
  const { data: row } = await db.from("workspaces").select("data").eq("owner_id", ownerId).maybeSingle();
  const ws = row?.data as WorkspaceData | undefined;
  const dial = dialForCountry(ws?.business?.country);
  const phone = waDigits(customer.phone, dial);
  if (!phone) return "invalid";
  const auto = ws?.automations?.find((a) => a.serviceId === "reviews");
  const trialOver = [auto?.trialEndsAt, auto?.paidUntil].some((t) => t && Date.parse(t) <= Date.now());
  const link = directReviewLink(str(auto?.config?.reviewLink));
  if (!auto || auto.status !== "active" || trialOver || !/^https?:\/\//i.test(link) || !evolutionReady()) return "off";

  const wa = ws?.connections?.whatsapp;
  const digits = wa?.status === "connected" ? waDigits(String(wa.account ?? ""), dial) : null;
  if (!digits) return "not_linked";
  const instance = instanceFor(digits);
  // Only the account that linked this WhatsApp may send from it.
  if ((await ownership(ownerId, instance)) !== "mine") return "not_linked";
  // Review requests are business-started messages: on Meta's official API they need an approved template (not built yet).
  if (await usesCloud(instance)) return "off";

  const now = Date.now();
  const history = ws?.reviewRequests ?? [];
  if (history.some((r) => r.phone === phone && r.status !== "failed" && now - Date.parse(r.at) < ONCE_PER_MS)) return "already";
  if (history.filter((r) => r.status !== "failed" && now - Date.parse(r.at) < 86_400_000).length >= DAILY_LIMIT) return "limit";

  if ((await connectionState(instance)) !== "open") return "not_linked";
  const text = reviewMessage(customer.name, str(ws?.business?.name) || "humari dukaan", link, str(auto.config?.message));
  const r = await evo(`/message/sendText/${encodeURIComponent(instance)}`, { method: "POST", body: JSON.stringify({ number: phone, text }) });
  return r.ok ? "sent" : "failed";
}
