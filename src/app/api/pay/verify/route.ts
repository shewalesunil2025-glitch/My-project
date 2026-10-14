import { NextResponse } from "next/server";
import { adminDb } from "@/lib/server/followup";
import type { SupabaseClient } from "@supabase/supabase-js";
import { chargeInInr } from "@/config/product";
import { markAutopay, recordPaidRow } from "@/lib/server/billing";
import { fetchOrder, fetchPayment, fetchSubscription, razorpayReady, validSignature, validSubscriptionSignature } from "@/lib/server/razorpay";
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
  if (body.razorpay_subscription_id) return verifyAutopay(db, user.id, body);
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
    // Recorded once per payment, even if the browser confirms twice.
    const { data: seen } = await db.from("subscriptions").select("renews_at").eq("payment_ref", paymentId).maybeSingle();
    if (seen) return NextResponse.json({ ok: true, serviceId: notes.service, period, paymentId, renewsAt: seen.renews_at });

    // A renewal adds a month (or a year) after the current end date, so paying early loses nothing.
    const { data: current } = await db
      .from("subscriptions")
      .select("id, renews_at")
      .eq("owner_id", user.id)
      .eq("service_id", notes.service)
      .eq("status", "active")
      .order("renews_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const from = current?.renews_at && Date.parse(current.renews_at) > Date.now() ? new Date(current.renews_at) : new Date();
    const renews = new Date(from);
    if (period === "monthly") renews.setMonth(renews.getMonth() + 1);
    else if (period === "annual") renews.setFullYear(renews.getFullYear() + 1);
    const row = { period, price: order.amount / 100, status: "active", renews_at: period === "one-time" ? null : renews.toISOString(), payment_ref: paymentId };
    const { error } =
      current && period !== "one-time"
        ? await db.from("subscriptions").update(row).eq("id", current.id)
        : await db.from("subscriptions").insert({ owner_id: user.id, service_id: notes.service, ...row });
    if (error) console.error("[pay] could not record subscription", error.message);
    return NextResponse.json({ ok: true, serviceId: notes.service, period, paymentId, renewsAt: row.renews_at });
  } catch (error) {
    console.error("[pay] verify failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
  }
}

/**
 * Autopay checkout: either the first payment was taken now (a new plan or a renewal), or only
 * the mandate was set up and the first charge waits for the plan's end date.
 */
async function verifyAutopay(db: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const subscriptionId = String(body.razorpay_subscription_id ?? "");
  const paymentId = String(body.razorpay_payment_id ?? "");
  const signature = String(body.razorpay_signature ?? "");
  if (!paymentId || !validSubscriptionSignature(subscriptionId, paymentId, signature)) {
    return NextResponse.json({ ok: false, reason: "invalid_signature" }, { status: 400 });
  }
  try {
    const [sub, payment] = await Promise.all([fetchSubscription(subscriptionId), fetchPayment(paymentId)]);
    const notes = sub.notes ?? {};
    if (notes.user !== userId || !notes.service || !["captured", "authorized", "refunded"].includes(payment.status)) {
      return NextResponse.json({ ok: false, reason: "mismatch" }, { status: 400 });
    }
    const period = notes.period === "annual" ? "annual" : "monthly";
    const due = Math.round(chargeInInr(Number(notes.amount) || 0, notes.currency === "USD" ? "USD" : "INR") * 100);
    const charged = payment.amount >= due && payment.status !== "refunded";
    let renewsAt: string | null = null;
    if (charged) {
      const end = sub.current_end ? new Date(sub.current_end * 1000) : new Date();
      if (!sub.current_end) {
        if (period === "annual") end.setFullYear(end.getFullYear() + 1);
        else end.setMonth(end.getMonth() + 1);
      }
      renewsAt = end.toISOString();
      await recordPaidRow(db, { userId, serviceId: notes.service, period, renewsAt, paymentId, amountInr: payment.amount / 100 });
    } else {
      // Only the mandate: the plan keeps its current end date; Autopay charges on that day.
      await markAutopay(db, userId, notes.service, sub.id);
    }
    return NextResponse.json({ ok: true, serviceId: notes.service, period, paymentId, autopayId: sub.id, charged, renewsAt });
  } catch (error) {
    console.error("[pay] autopay verify failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
  }
}
