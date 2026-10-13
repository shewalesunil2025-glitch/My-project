import { cloudAuthHeader, cloudEnabled } from "./cloud";
import { currentWorkspace } from "./store";

/**
 * Takes a payment with Razorpay's checkout. "preview" means real payments aren't switched on
 * (no keys, sample workspace, or no account server), so the app records a test payment instead.
 */
export type PaymentResult = { status: "paid"; paymentId: string } | { status: "preview" } | { status: "cancelled" } | { status: "error"; message: string };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (r: { error?: { description?: string } }) => void) => void };
  }
}

let enabled: Promise<boolean> | null = null;
let known = false;
/** True once we know real payments are on (so invoices say "paid", not "test"). */
export const paymentsAreLive = () => known;
/** Are real payments switched on? Asked once per visit. */
export function paymentsEnabled() {
  enabled ??= fetch("/api/pay/order")
    .then((r) => r.json() as Promise<{ enabled?: boolean }>)
    .then((d) => (known = Boolean(d.enabled)))
    .catch(() => false);
  return enabled;
}

function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

export async function collectPayment(serviceId: string, period: string): Promise<PaymentResult> {
  const ws = currentWorkspace();
  if (!cloudEnabled || !ws || ws.sample || !(await paymentsEnabled())) return { status: "preview" };

  const headers = { "content-type": "application/json", ...(await cloudAuthHeader()) };
  const res = await fetch("/api/pay/order", { method: "POST", headers, body: JSON.stringify({ serviceId, period }) }).catch(() => null);
  const order = (await res?.json().catch(() => null)) as { ok?: boolean; keyId?: string; orderId?: string; amountPaise?: number; description?: string; prefill?: Record<string, string> } | null;
  if (!order?.ok || !order.orderId) return { status: "error", message: "Payment shuru nahi ho paya. Thodi der baad dobara try kariye." };
  if (!(await loadCheckout()) || !window.Razorpay) return { status: "error", message: "Payment box khul nahi raha. Internet check karke dobara try kariye." };

  return new Promise<PaymentResult>((resolve) => {
    const box = new window.Razorpay!({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amountPaise,
      currency: "INR",
      name: "ibaxai",
      description: order.description,
      prefill: order.prefill,
      theme: { color: "#4fb336" },
      modal: { ondismiss: () => resolve({ status: "cancelled" }) },
      handler: async (response: Record<string, string>) => {
        const v = await fetch("/api/pay/verify", { method: "POST", headers, body: JSON.stringify(response) }).catch(() => null);
        const data = (await v?.json().catch(() => null)) as { ok?: boolean } | null;
        resolve(data?.ok ? { status: "paid", paymentId: response.razorpay_payment_id } : { status: "error", message: "Payment mil gaya par confirm nahi ho paya. Humse WhatsApp par sampark kariye, paisa surakshit hai." });
      },
    });
    box.on("payment.failed", (r) => resolve({ status: "error", message: r.error?.description ?? "Payment fail ho gaya. Dobara try kariye." }));
    box.open();
  });
}
