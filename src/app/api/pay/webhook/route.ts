import { NextResponse } from "next/server";
import { adminDb } from "@/lib/server/followup";
import { markAutopay, recordAutopayCharge } from "@/lib/server/billing";
import { validWebhookSignature } from "@/lib/server/razorpay";

/**
 * Razorpay webhook (Dashboard → Account & Settings → Webhooks), signed with
 * RAZORPAY_WEBHOOK_SECRET. Events: subscription.charged (Autopay took the monthly/yearly
 * payment → plan extended) and subscription.cancelled / halted / completed (Autopay off, the
 * renewal reminders take over).
 */

type Entity<T> = { entity?: T };
type Payload = {
  event?: string;
  payload?: {
    subscription?: Entity<{ id: string; status: string; current_end?: number | null; notes?: Record<string, string> }>;
    payment?: Entity<{ id: string; amount: number; status: string }>;
  };
};

export async function POST(request: Request) {
  const raw = await request.text();
  if (!validWebhookSignature(raw, request.headers.get("x-razorpay-signature") ?? "")) return NextResponse.json({ ok: false }, { status: 401 });
  const db = adminDb();
  if (!db) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  let body: Payload;
  try {
    body = JSON.parse(raw) as Payload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const sub = body.payload?.subscription?.entity;
  const notes = sub?.notes ?? {};
  if (!sub || !notes.user || !notes.service) return NextResponse.json({ ok: true, ignored: true });

  try {
    if (body.event === "subscription.charged") {
      const payment = body.payload?.payment?.entity;
      if (!payment || !["captured", "authorized"].includes(payment.status)) return NextResponse.json({ ok: true, ignored: true });
      const period = notes.period === "annual" ? "annual" : "monthly";
      let end: Date;
      if (sub.current_end) end = new Date(sub.current_end * 1000);
      else {
        end = new Date();
        if (period === "annual") end.setFullYear(end.getFullYear() + 1);
        else end.setMonth(end.getMonth() + 1);
      }
      await recordAutopayCharge(db, {
        userId: notes.user,
        serviceId: notes.service,
        period,
        renewsAt: end.toISOString(),
        paymentId: payment.id,
        amountInr: payment.amount / 100,
        amount: Number(notes.amount) || payment.amount / 100,
        currency: notes.currency === "USD" ? "USD" : "INR",
        autopayId: sub.id,
      });
    } else if (body.event === "subscription.cancelled" || body.event === "subscription.halted" || body.event === "subscription.completed") {
      await markAutopay(db, notes.user, notes.service, null);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[pay] webhook failed", error instanceof Error ? error.message : error);
    // A 5xx makes Razorpay retry later.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
