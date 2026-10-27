import { json, ownerCall } from "@/lib/server/wa/http";
import { addAsset, createCampaign, getCampaign, listCampaigns, requestPayment, setApproved, updateCampaign, type Fail } from "@/lib/server/ads/campaigns";

/**
 * The owner's ad campaigns. One POST with an `action`:
 * create · update · list · get · add_asset · approve_creative · request_payment.
 * Every rule (who owns it, what can change, the price) is decided on the server.
 */
const out = (r: { ok: true } | Fail) => ("ok" in r && r.ok ? json(r) : json({ ok: false, reason: (r as Fail).reason, message: (r as Fail).message }, (r as Fail).status));

export async function POST(request: Request) {
  const c = await ownerCall(request);
  if ("error" in c) return c.error;
  const { db, body: b, user } = c;
  switch (b.action) {
    case "create":
      return out(await createCampaign(db, user.id, b));
    case "update":
      return out(await updateCampaign(db, user.id, b.id, b));
    case "list":
      return out(await listCampaigns(db, user.id));
    case "get":
      return out(await getCampaign(db, user.id, b.id));
    case "add_asset":
      return out(await addAsset(db, user.id, b.id, b));
    case "approve_creative":
      return out(await setApproved(db, user.id, b.id, b.creativeId, b.approved));
    case "request_payment":
      return out(await requestPayment(db, user.id, b.id, b));
    default:
      return json({ ok: false, reason: "bad_request" }, 400);
  }
}
