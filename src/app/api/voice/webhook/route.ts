import { adminDb } from "@/lib/server/followup";
import { json, limited } from "@/lib/server/wa/http";
import { vapi } from "@/lib/server/voice/provider";
import { handleEvent } from "@/lib/server/voice/service";

/**
 * Vapi's server URL for the phone numbers we set up. Vapi sends the credential we created there
 * (Authorization: Bearer … ) on every request; anything else is refused.
 * assistant-request: answered within Vapi's 7.5 s with the client's assistant, or an error that Vapi speaks to the caller.
 * end-of-call-report and other events: recorded once, then the call and its minutes are stored.
 */
export async function POST(request: Request) {
  if (!vapi.verifyWebhook(request.headers)) return json({ ok: false }, 401);
  if (limited("voice-webhook", 1200)) return json({ ok: false, reason: "rate_limited" }, 429);
  const db = adminDb();
  if (!db) return json({ ok: false, reason: "not_configured" }, 503);
  const text = await request.text();
  if (text.length > 2_000_000) return json({ ok: false, reason: "too_large" }, 413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ ok: false }, 400);
  }
  try {
    const r = await handleEvent(db, vapi, vapi.parseEvent(body));
    return json(r.body, r.status);
  } catch (e) {
    console.error("[voice] webhook failed", e instanceof Error ? e.message : e);
    return json({ ok: false }, 500);
  }
}
