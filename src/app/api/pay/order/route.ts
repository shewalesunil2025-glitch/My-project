import { NextResponse } from "next/server";
import { annualPrice, isLive, priceIn, serviceById } from "@/content/app/services";
import { chargeInInr, currencyForCountry } from "@/config/product";
import { adminDb } from "@/lib/server/followup";
import { createOrder, razorpayKeyId, razorpayReady, razorpayTestMode, webhookReady } from "@/lib/server/razorpay";
import { userFromRequest } from "@/lib/server/whatsapp";

/**
 * Starts a payment: the price is worked out here (never trusted from the browser), in the
 * owner's currency, and always charged in rupees. GET says whether real payments are on.
 */

export function GET() {
  // Autopay is offered only once the webhook is set up, or monthly charges would not extend plans.
  return NextResponse.json({ enabled: razorpayReady(), test: razorpayTestMode(), autopay: razorpayReady() && webhookReady() });
}

export async function POST(request: Request) {
  if (!razorpayReady()) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  const db = adminDb();
  const user = await userFromRequest(request);
  if (!db || !user) return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { serviceId?: unknown; period?: unknown };
  const svc = typeof body.serviceId === "string" ? serviceById(body.serviceId) : undefined;
  if (!svc || svc.price === null || !isLive(svc.id)) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  const period = svc.billing === "one-time" ? "one-time" : body.period === "annual" ? "annual" : "monthly";

  const { data: row } = await db.from("workspaces").select("data").eq("owner_id", user.id).maybeSingle();
  const ws = row?.data as { business?: { country?: string; name?: string; email?: string; phone?: string } | null } | undefined;
  const currency = currencyForCountry(ws?.business?.country);
  const base = priceIn(svc, currency) ?? svc.price;
  const amount = period === "annual" ? annualPrice(base) : base;
  const inr = chargeInInr(amount, currency);

  try {
    const order = await createOrder(inr, `${svc.id}-${Date.now()}`, { user: user.id, service: svc.id, period, currency, amount: String(amount) });
    return NextResponse.json({
      ok: true,
      keyId: razorpayKeyId(),
      orderId: order.id,
      amountPaise: order.amount,
      description: `${svc.name} · ${period === "one-time" ? "one-time" : period}`,
      prefill: { name: ws?.business?.name ?? "", email: ws?.business?.email ?? "", contact: ws?.business?.phone ?? "" },
    });
  } catch (error) {
    console.error("[pay] order failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
  }
}
