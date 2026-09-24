import { NextResponse } from "next/server";
import { validateLead, type LeadResponse } from "@/lib/leads";

/**
 * Receives demo requests and forwards them to LEAD_WEBHOOK_URL
 * (n8n, Make, Zapier or a CRM endpoint). Nothing is stored here.
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

  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (!webhook) {
    return json(
      {
        ok: false,
        reason: "not_configured",
        message: "Online booking isn't connected yet.",
      },
      503,
    );
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lead, source: "website", receivedAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
    return json({ ok: true }, 200);
  } catch (err) {
    console.error("[lead] forwarding failed", err);
    return json({ ok: false, reason: "upstream", message: "We couldn't send your request. Please try again." }, 502);
  }
}

function json(payload: LeadResponse, status: number) {
  return NextResponse.json(payload, { status });
}
