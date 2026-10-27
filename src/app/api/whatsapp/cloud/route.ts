import { json, ownerCall } from "@/lib/server/wa/http";
import { cleanId } from "@/lib/server/wa/rules";
import { cloudLinksOf, cloudReady, cloudSignupAllowed, finishSignup, unlinkCloud } from "@/lib/server/waCloud";

/**
 * The app's side of Meta's Embedded Signup (official WhatsApp Cloud API):
 *  - "finish": the signup popup's one-time code + the WhatsApp account and number ids → linked
 *  - "status": the owner's linked Cloud numbers
 *  - "disconnect": unlinks one of them
 */
export async function POST(request: Request) {
  if (!cloudReady()) return json({ ok: false, reason: "not_configured" }, 503);
  const c = await ownerCall(request);
  if ("error" in c) return c.error;
  const { body: b, user } = c;

  // Whether this account may use the OTP signup yet (the app shows the button only if so).
  if (b.action === "access") return json({ ok: true, allowed: cloudSignupAllowed(user.email) });

  if (b.action === "status") {
    const links = await cloudLinksOf(user.id);
    return json({ ok: true, links: links.map((l) => ({ instance: l.instance, number: `+${l.instance.slice(5)}`, name: l.name, coexistence: l.coexistence })) });
  }

  if (b.action === "disconnect") {
    const link = (await cloudLinksOf(user.id)).find((l) => l.instance === b.instance);
    if (link) await unlinkCloud(link);
    return json({ ok: true });
  }

  if (b.action === "finish") {
    if (!cloudSignupAllowed(user.email)) return json({ ok: false, reason: "not_live" }, 403);
    const code = typeof b.code === "string" && /^[\w.-]{10,2000}$/.test(b.code) ? b.code : null;
    const wabaId = cleanId(b.waba_id);
    const phoneNumberId = b.phone_number_id ? cleanId(b.phone_number_id) : undefined;
    if (!code || !wabaId || !/^\d+$/.test(wabaId) || (b.phone_number_id && (!phoneNumberId || !/^\d+$/.test(phoneNumberId)))) return json({ ok: false, reason: "bad_request" }, 400);
    const r = await finishSignup(user.id, { code, wabaId, phoneNumberId: phoneNumberId ?? undefined, coexistence: b.coexistence === true });
    return json(r, r.ok ? 200 : r.reason === "taken" || r.reason === "already_linked" ? 409 : 502);
  }

  return json({ ok: false, reason: "bad_request" }, 400);
}
