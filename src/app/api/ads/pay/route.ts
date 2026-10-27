import { createAdOrder, verifyAdPayment } from "@/lib/server/ads/pay";
import { json, ownerCall } from "@/lib/server/wa/http";

/** Paying ibaxai for a campaign's creatives: `order` starts it, `verify` confirms it after Razorpay's checkout. */
export async function POST(request: Request) {
  const c = await ownerCall(request);
  if ("error" in c) return c.error;
  const r = c.body.action === "verify" ? await verifyAdPayment(c.db, c.user.id, c.body) : c.body.action === "order" ? await createAdOrder(c.db, c.user.id, c.body.id) : null;
  if (!r) return json({ ok: false, reason: "bad_request" }, 400);
  return r.ok ? json(r) : json({ ok: false, reason: r.reason, message: r.message }, r.status);
}
