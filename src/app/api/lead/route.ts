import { NextResponse } from "next/server";
import { validateLead, type LeadResponse } from "@/lib/leads";
import { mailLead } from "@/lib/server/leadMail";
import { mailReady } from "@/lib/server/mail";
import { limited } from "@/lib/server/wa/http";

/**
 * Receives "Book a free demo" requests. Emails the owner (and thanks the visitor with what ibaxai
 * does) when SMTP_USER / SMTP_PASS are set, and also forwards to LEAD_WEBHOOK_URL (n8n, a CRM…)
 * when that is set. Nothing is stored here.
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

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(`lead:${ip}`, 5, 10 * 60_000)) return json({ ok: false, reason: "upstream", message: "Too many requests. Please try again in a few minutes." }, 429);

  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (!webhook && !mailReady()) {
    return json(
      {
        ok: false,
        reason: "not_configured",
        message: "Online booking isn't connected yet.",
      },
      503,
    );
  }

  const [mailed, forwarded] = await Promise.all([
    mailReady() ? mailLead("demo", lead, request.headers.get("referer") ?? undefined) : Promise.resolve(false),
    webhook ? forward(webhook, lead) : Promise.resolve(false),
  ]);
  if (mailed || forwarded) return json({ ok: true }, 200);
  return json({ ok: false, reason: "upstream", message: "We couldn't send your request. Please try again." }, 502);
}

async function forward(webhook: string, lead: object) {
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lead, source: "website", receivedAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
    return true;
  } catch (err) {
    console.error("[lead] forwarding failed", err);
    return false;
  }
}

function json(payload: LeadResponse, status: number) {
  return NextResponse.json(payload, { status });
}
