import { NextResponse } from "next/server";
import { adminDb } from "@/lib/server/followup";
import { fetchOrder, fetchPayment, razorpayReady, validSignature } from "@/lib/server/razorpay";
import { userFromRequest } from "@/lib/server/whatsapp";

/**
 * Confirms a payment after Razorpay's checkout: checks the signature, that the order belongs
 * to this user and is paid, then records the subscription (the `subscriptions` table can only
 * be written by the server).
 */
export async function POST(request: Request) {
  if (!razorpayReady()) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  const db = adminDb();
  const user = await userFromRequest(request);
  if (!db || !user) return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const orderId = String(body.razorpay_order_id ?? "");
  const paymentId = String(body.razorpay_payment_id ?? "");
  const signature = String(body.razorpay_signature ?? "");
  if (!orderId || !paymentId || !validSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ ok: false, reason: "invalid_signature" }, { status: 400 });
  }

  try {
    const [order, payment] = await Promise.all([fetchOrder(orderId), fetchPayment(paymentId)]);
    const notes = order.notes ?? {};
    if (notes.user !== user.id || payment.order_id !== orderId || !["captured", "authorized"].includes(payment.status)) {
      return NextResponse.json({ ok: false, reason: "mismatch" }, { status: 400 });
    }
    const period = notes.period === "annual" || notes.period === "one-time" ? notes.period : "monthly";
    const renews = new Date();
    if (period === "monthly") renews.setMonth(renews.getMonth() + 1);
    else if (period === "annual") renews.setFullYear(renews.getFullYear() + 1);
    // Recorded once per payment, even if the browser confirms twice.
    const { data: seen } = await db.from("subscriptions").select("id").eq("payment_ref", paymentId).maybeSingle();
    if (!seen) {
      const { error } = await db.from("subscriptions").insert({
        owner_id: user.id,
        service_id: notes.service,
        period,
        price: order.amount / 100,
        status: "active",
        renews_at: period === "one-time" ? null : renews.toISOString(),
        payment_ref: paymentId,
      });
      if (error) console.error("[pay] could not record subscription", error.message);
    }
    return NextResponse.json({ ok: true, serviceId: notes.service, period, paymentId });
  } catch (error) {
    console.error("[pay] verify failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
  }
}
