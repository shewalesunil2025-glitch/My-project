import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay (payments in Indian rupees). Env: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from
 * Razorpay Dashboard → Account & Settings → API Keys (rzp_test_… keys take test payments).
 */

export const razorpayReady = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID ?? "";
export const razorpayTestMode = () => razorpayKeyId().startsWith("rzp_test_");

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: { authorization: `Basic ${auth}`, "content-type": "application/json", ...init?.headers },
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { description?: string } };
  if (!res.ok) throw new Error(`Razorpay ${res.status}: ${data.error?.description ?? "request failed"}`);
  return data;
}

export type RazorpayOrder = { id: string; amount: number; currency: string; status: string; notes?: Record<string, string> };

/** An order for `amountInr` rupees; notes say who pays for what (read back when verifying). */
export const createOrder = (amountInr: number, receipt: string, notes: Record<string, string>) =>
  api<RazorpayOrder>("/orders", { method: "POST", body: JSON.stringify({ amount: Math.round(amountInr * 100), currency: "INR", receipt: receipt.slice(0, 40), notes }) });

export const fetchOrder = (id: string) => api<RazorpayOrder>(`/orders/${encodeURIComponent(id)}`);

export const fetchPayment = (id: string) => api<{ id: string; order_id: string; status: string; amount: number }>(`/payments/${encodeURIComponent(id)}`);

/** Razorpay signs order_id|payment_id with the key secret; only a real payment carries a valid signature. */
export function validSignature(orderId: string, paymentId: string, signature: string) {
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "").update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ---------- Autopay (Razorpay Subscriptions: UPI AutoPay or a card mandate) ---------- */

/** UPI AutoPay and card mandates charge up to ₹15,000 a time without asking the customer again. */
export const AUTOPAY_MAX_INR = 15_000;

type RazorpayPlan = { id: string; notes?: Record<string, string> };
export type RazorpaySubscription = {
  id: string;
  status: string;
  current_end?: number | null;
  charge_at?: number | null;
  notes?: Record<string, string>;
};

const plans = new Map<string, string>();

/** The Razorpay plan for this service, period and rupee amount — made once, then reused. */
export async function planFor(serviceId: string, name: string, period: "monthly" | "annual", amountInr: number) {
  const paise = Math.round(amountInr * 100);
  const key = `${serviceId}-${period}-${paise}`;
  const known = plans.get(key);
  if (known) return known;
  for (let skip = 0; skip < 500; skip += 100) {
    const page = await api<{ items: RazorpayPlan[] }>(`/plans?count=100&skip=${skip}`);
    const hit = page.items.find((p) => p.notes?.key === key);
    if (hit) {
      plans.set(key, hit.id);
      return hit.id;
    }
    if (page.items.length < 100) break;
  }
  const plan = await api<RazorpayPlan>("/plans", {
    method: "POST",
    body: JSON.stringify({
      period: period === "annual" ? "yearly" : "monthly",
      interval: 1,
      item: { name: `${name} · ${period}`, amount: paise, currency: "INR" },
      notes: { key },
    }),
  });
  plans.set(key, plan.id);
  return plan.id;
}

/** Without `startAt` the first payment is taken now; with it, only the mandate is set up and the first charge waits. */
export const createSubscription = (planId: string, period: "monthly" | "annual", notes: Record<string, string>, startAt?: number) =>
  api<RazorpaySubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({ plan_id: planId, total_count: period === "annual" ? 10 : 120, quantity: 1, customer_notify: 1, ...(startAt ? { start_at: startAt } : {}), notes }),
  });

export const fetchSubscription = (id: string) => api<RazorpaySubscription>(`/subscriptions/${encodeURIComponent(id)}`);

export const cancelSubscription = (id: string) => api<RazorpaySubscription>(`/subscriptions/${encodeURIComponent(id)}/cancel`, { method: "POST", body: JSON.stringify({ cancel_at_cycle_end: 0 }) });

const sameHex = (expected: string, signature: string) => {
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
};

/** Checkout of a subscription signs payment_id|subscription_id. */
export const validSubscriptionSignature = (subscriptionId: string, paymentId: string, signature: string) =>
  sameHex(createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "").update(`${paymentId}|${subscriptionId}`).digest("hex"), signature);

/** Webhooks are signed with RAZORPAY_WEBHOOK_SECRET (the secret typed when the webhook was made). */
export const webhookReady = () => Boolean(process.env.RAZORPAY_WEBHOOK_SECRET);
export const validWebhookSignature = (rawBody: string, signature: string) =>
  webhookReady() && sameHex(createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET ?? "").update(rawBody).digest("hex"), signature);
