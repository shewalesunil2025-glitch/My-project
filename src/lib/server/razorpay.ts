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
