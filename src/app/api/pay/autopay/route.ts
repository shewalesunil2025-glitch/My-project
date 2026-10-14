import { NextResponse } from "next/server";
import { isLive, serviceById } from "@/content/app/services";
import { adminDb } from "@/lib/server/followup";
import { markAutopay, ownerPrice } from "@/lib/server/billing";
import { AUTOPAY_MAX_INR, cancelSubscription, createSubscription, fetchSubscription, planFor, razorpayKeyId, razorpayReady } from "@/lib/server/razorpay";
import { userFromRequest } from "@/lib/server/whatsapp";

/**
 * Autopay (Razorpay Subscriptions — UPI AutoPay or a card mandate).
 * POST starts one: without `startAt` the first payment is taken now (a new plan or a renewal);
 * with `startAt` (the current end date of a paid plan) only the mandate is set up and the first
 * charge happens on that date. DELETE switches Autopay off.
 */

export async function POST(request: Request) {
  if (!razorpayReady()) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  const db = adminDb();
  const user = await userFromRequest(request);
  if (!db || !user) return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { serviceId?: unknown; period?: unknown; startAt?: unknown };
  const svc = typeof body.serviceId === "string" ? serviceById(body.serviceId) : undefined;
  if (!svc || svc.price === null || svc.billing === "one-time" || !isLive(svc.id)) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  const period = body.period === "annual" ? "annual" : "monthly";
  const { currency, amount, inr, business } = await ownerPrice(db, user.id, svc, period);
  if (inr > AUTOPAY_MAX_INR) return NextResponse.json({ ok: false, reason: "too_high" }, { status: 400 });

  // Mandates must start a little in the future; a plan that ends sooner is charged now instead.
  const startMs = typeof body.startAt === "string" ? Date.parse(body.startAt) : NaN;
  const startAt = Number.isFinite(startMs) && startMs > Date.now() + 15 * 60_000 ? Math.floor(startMs / 1000) : undefined;

  try {
    const planId = await planFor(svc.id, svc.name, period, inr);
    const sub = await createSubscription(planId, period, { user: user.id, service: svc.id, period, currency, amount: String(amount) }, startAt);
    return NextResponse.json({
      ok: true,
      keyId: razorpayKeyId(),
      subscriptionId: sub.id,
      chargesNow: !startAt,
      description: `${svc.name} · ${period} · Autopay`,
      prefill: { name: business?.name ?? "", email: business?.email ?? "", contact: business?.phone ?? "" },
    });
  } catch (error) {
    console.error("[autopay] start failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  if (!razorpayReady()) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  const db = adminDb();
  const user = await userFromRequest(request);
  if (!db || !user) return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { subscriptionId?: unknown };
  const id = typeof body.subscriptionId === "string" ? body.subscriptionId : "";
  if (!/^sub_[A-Za-z0-9]+$/.test(id)) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  try {
    const sub = await fetchSubscription(id);
    if (sub.notes?.user !== user.id) return NextResponse.json({ ok: false, reason: "mismatch" }, { status: 403 });
    if (!["cancelled", "completed", "expired"].includes(sub.status)) await cancelSubscription(id);
    if (sub.notes?.service) await markAutopay(db, user.id, sub.notes.service, null);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[autopay] cancel failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
  }
}
