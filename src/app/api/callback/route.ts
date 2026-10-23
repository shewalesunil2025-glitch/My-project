import { NextResponse } from "next/server";
import { validateCallback, type LeadResponse } from "@/lib/leads";
import { mailLead } from "@/lib/server/leadMail";
import { mailReady } from "@/lib/server/mail";
import { limited } from "@/lib/server/wa/http";

/**
 * "Call me back" from the IBAX chat (website and app). Emails the visitor's name and number to the
 * owner, so ibaxai calls them; the owner's own number is never shown. Needs SMTP_USER / SMTP_PASS.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, reason: "invalid", message: "Invalid request." }, 400);
  }
  const { req, error } = validateCallback(body);
  if (!req) return json({ ok: false, reason: "invalid", message: error ?? "Invalid request." }, 400);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(`callback:${ip}`, 5, 10 * 60_000)) return json({ ok: false, reason: "upstream", message: "Too many requests. Please try again in a few minutes." }, 429);
  if (!mailReady()) return json({ ok: false, reason: "not_configured", message: "Call-back requests aren't connected yet." }, 503);

  const from = req.from === "app" ? "IBAX chat in the app" : "IBAX chat on the website";
  const ok = await mailLead("callback", { name: req.name, phone: req.phone, email: req.email ?? "", message: req.message }, from);
  return ok ? json({ ok: true }, 200) : json({ ok: false, reason: "upstream", message: "We couldn't send your request. Please try again." }, 502);
}

function json(payload: LeadResponse, status: number) {
  return NextResponse.json(payload, { status });
}
