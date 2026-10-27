import type { SupabaseClient } from "@supabase/supabase-js";
import { createOrder, capturePayment, fetchOrder, fetchPayment, razorpayKeyId, razorpayReady, validSignature } from "@/lib/server/razorpay";
import { esc, mailReady, ownerEmail, sendMail } from "@/lib/server/mail";
import { siteConfig } from "@/config/site";
import { objectiveLabel } from "@/lib/ads/types";
import { loadCampaign, move, type Fail, type Ok, type Row } from "./campaigns";

/**
 * Paying ibaxai for the creatives. The amount is read from the campaign on the server, never from
 * the browser, and a campaign only becomes "paid" after Razorpay's signature, the order's owner,
 * the campaign and the exact amount all check out. The ad spend is never part of this payment.
 */

const fail = (reason: string, message: string, status = 400): Fail => ({ ok: false, reason, message, status });
const payable = (row: Row) => Math.round((Number(row.creative_fee_inr) + Number(row.tax_inr)) * 100) / 100;

export async function createAdOrder(db: SupabaseClient, ownerId: string, id: unknown): Promise<Ok<{ keyId: string; orderId: string; amountPaise: number; description: string; prefill: { name: string; email: string; contact: string } }> | Fail> {
  if (!razorpayReady()) return fail("not_configured", "Payments aren't switched on yet.", 503);
  const l = await loadCampaign(db, ownerId, id);
  if (!("row" in l)) return l;
  const row = l.row;
  if (row.status !== "awaiting_payment") return fail("not_payable", "This campaign isn't waiting for payment.", 409);
  const amount = payable(row);
  if (!(amount > 0)) return fail("not_payable", "There is nothing to pay for this campaign.", 409);
  try {
    const order = await createOrder(amount, `ad-${String(row.id).slice(0, 8)}-${Date.now()}`, { user: ownerId, kind: "ads", campaign: String(row.id) });
    const biz = (row.business ?? {}) as Row;
    return {
      ok: true,
      keyId: razorpayKeyId(),
      orderId: order.id,
      amountPaise: order.amount,
      description: `ibaxai ad creatives · ${String(row.name).slice(0, 60)}`,
      prefill: { name: String(biz.name ?? ""), email: String(biz.email ?? ""), contact: String(biz.phone ?? "") },
    };
  } catch (error) {
    console.error("[ads] order failed", error instanceof Error ? error.message : error);
    return fail("upstream", "Couldn't start the payment. Please try again.", 502);
  }
}

export async function verifyAdPayment(db: SupabaseClient, ownerId: string, body: Record<string, unknown>): Promise<Ok<{ campaign: Row }> | Fail> {
  if (!razorpayReady()) return fail("not_configured", "Payments aren't switched on yet.", 503);
  const orderId = String(body.razorpay_order_id ?? "");
  const paymentId = String(body.razorpay_payment_id ?? "");
  const signature = String(body.razorpay_signature ?? "");
  if (!orderId || !paymentId || !validSignature(orderId, paymentId, signature)) return fail("invalid_signature", "The payment couldn't be confirmed.");

  const l = await loadCampaign(db, ownerId, body.id);
  if (!("row" in l)) return l;
  const row = l.row;

  try {
    const [order, payment] = await Promise.all([fetchOrder(orderId), fetchPayment(paymentId)]);
    const notes = order.notes ?? {};
    if (notes.user !== ownerId || notes.kind !== "ads" || notes.campaign !== String(row.id) || payment.order_id !== orderId || !["captured", "authorized"].includes(payment.status)) {
      return fail("mismatch", "The payment doesn't match this campaign.");
    }
    if (order.amount !== Math.round(payable(row) * 100) || payment.amount !== order.amount) return fail("mismatch", "The payment doesn't match this campaign.");
    if (payment.status === "authorized") {
      await capturePayment(paymentId, payment.amount).catch((error: Error) => {
        if (!/already been captured/i.test(error.message)) throw error;
      });
    }

    // Recorded once per payment, even if the browser confirms twice.
    const { data: seen } = await db.from("ad_payments").select("id").eq("razorpay_payment_id", paymentId).maybeSingle();
    if (!seen) {
      const { error } = await db.from("ad_payments").insert({ campaign_id: row.id, owner_id: ownerId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, amount_inr: order.amount / 100 });
      if (error && !/duplicate|unique/i.test(error.message)) {
        console.error("[ads] could not record payment", error.message);
        return fail("server_error", "Your payment went through but we couldn't save it. Please contact support; you won't be charged twice.", 500);
      }
    }
    if (row.status === "awaiting_payment") {
      await move(db, row, "paid", { payment: paymentId, amountInr: order.amount / 100 });
      await move(db, row, "ready_to_launch");
      void tellTeam(row, order.amount / 100);
    }
    return { ok: true, campaign: row };
  } catch (error) {
    console.error("[ads] verify failed", error instanceof Error ? error.message : error);
    return fail("upstream", "We couldn't confirm the payment yet. If money was deducted, it will be matched shortly; don't pay again.", 502);
  }
}

/** ibaxai's team launches the ad until the Meta connection is live, so a paid campaign emails the owner. */
async function tellTeam(row: Row, amountInr: number) {
  if (!mailReady()) return;
  const biz = (row.business ?? {}) as Row;
  const subject = `💸 Paid ad campaign to launch: ${String(biz.name ?? "a client")}`;
  const line = `${String(row.name)} · ${objectiveLabel(String(row.objective))} · ${String(row.platforms)} · ${String(row.days)} days at ₹${String(row.daily_budget_inr)}/day`;
  await sendMail({
    to: ownerEmail(),
    subject,
    text: `A client paid ₹${amountInr} for ad creatives.\n\n${line}\n\nOpen ${siteConfig.url.replace(/\/$/, "")}/app/founder to launch it.`,
    html: `<p>A client paid <b>₹${amountInr}</b> for ad creatives.</p><p>${esc(line)}</p><p><a href="${siteConfig.url.replace(/\/$/, "")}/app/founder">Open the founder page to launch it</a></p>`,
  }).catch(() => false);
}
