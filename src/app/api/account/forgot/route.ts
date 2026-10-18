import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Forgot password: emails a link to set a new password. The owner can give their email, or
 * the mobile number on their account; then the link goes to that account's email (shown
 * half-hidden, so they know where to look). Text messages would cost money per SMS.
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as { email?: unknown; phone?: unknown };
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const redirectTo = `${new URL(request.url).origin}/app/reset`;

  let email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  let masked: string | undefined;
  if (!email) {
    const digits = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
    if (digits.length < 8) return NextResponse.json({ ok: false, reason: "invalid", message: "Enter the mobile number on your account." }, { status: 400 });
    const last = digits.slice(-10);
    // Numbers are saved as typed ("+91 98765 43210"), so match on the last digits.
    const { data } = await db.from("profiles").select("id, phone").ilike("phone", `%${last.slice(-4)}`).limit(200);
    const match = (data ?? []).find((p) => String(p.phone).replace(/\D/g, "").endsWith(last));
    if (!match) return NextResponse.json({ ok: false, reason: "not_found", message: "No account has this mobile number. Try your email instead." }, { status: 404 });
    const { data: found } = await db.auth.admin.getUserById(match.id);
    email = found.user?.email?.toLowerCase() ?? "";
    if (!email) return NextResponse.json({ ok: false, reason: "not_found", message: "No account has this mobile number. Try your email instead." }, { status: 404 });
    const [name, domain] = email.split("@");
    masked = `${name.slice(0, 2)}${"•".repeat(Math.max(2, name.length - 2))}@${domain}`;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, reason: "invalid", message: "Enter a valid email address." }, { status: 400 });

  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    const busy = /rate limit|too many|security purposes/i.test(error.message);
    console.error("[forgot]", error.message);
    return NextResponse.json(
      { ok: false, reason: busy ? "busy" : "failed", message: busy ? "Too many reset emails just now. Please try again in a few minutes." : "We couldn't send the email. Please try again." },
      { status: busy ? 429 : 500 },
    );
  }
  // For an email we don't say whether an account exists (Supabase sends nothing if it doesn't).
  return NextResponse.json({ ok: true, sentTo: masked });
}
