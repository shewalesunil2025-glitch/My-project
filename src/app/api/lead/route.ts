import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { formSubmitPayload, validateLead, type LeadRequest, type LeadResponse } from "@/lib/leads";

/**
 * Receives contact requests and delivers them to the owner. Nothing is stored here.
 *
 * - With LEAD_WEBHOOK_URL set (n8n, Make, Zapier or a CRM), the lead is posted there.
 * - Otherwise it is emailed to LEAD_EMAIL (default: the site's contact email) through
 *   FormSubmit, a free form-to-email relay. FormSubmit asks the owner to click an
 *   activation link in the first email it sends; until then delivery fails, and the
 *   form offers WhatsApp instead.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, reason: "invalid", message: "Invalid request." }, 400);
  }

  const { lead, error } = validateLead(body);
  if (!lead) return json({ ok: false, reason: "invalid", message: error ?? "Invalid request." }, 400);

  try {
    const webhook = process.env.LEAD_WEBHOOK_URL;
    if (webhook) await sendToWebhook(webhook, lead);
    else await sendByEmail(process.env.LEAD_EMAIL || siteConfig.email, lead);
    return json({ ok: true }, 200);
  } catch (err) {
    console.error("[lead] delivery failed", err);
    return json(
      { ok: false, reason: "upstream", message: "We couldn't send your request online right now." },
      502,
    );
  }
}

async function sendToWebhook(url: string, lead: LeadRequest) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...lead, source: "website", receivedAt: new Date().toISOString() }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
}

/** FormSubmit activates each sending address separately; use the same one browsers send (the live www site). */
const FORM_ORIGIN = "https://www.ibaxai.com/";

async function sendByEmail(to: string, lead: LeadRequest) {
  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Referer: FORM_ORIGIN },
    body: JSON.stringify(formSubmitPayload(lead)),
    signal: AbortSignal.timeout(10000),
  });
  const data = (await res.json().catch(() => ({}))) as { success?: string | boolean; message?: string };
  if (!res.ok || String(data.success) !== "true") throw new Error(`FormSubmit: ${data.message ?? res.status}`);
}

function json(payload: LeadResponse, status: number) {
  return NextResponse.json(payload, { status });
}
