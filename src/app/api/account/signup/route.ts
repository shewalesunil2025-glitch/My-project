import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates an account without a confirmation email. Supabase's built-in mailer only
 * sends a few emails an hour, which blocked real sign-ups ("too many attempts").
 * Once our own SMTP is set up in Supabase, sign-up can go back to email confirmation.
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }
  const text = (k: string, max: number) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : "");
  const email = text("email", 254).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, reason: "invalid", message: "Enter a valid email address." }, { status: 400 });
  if (password.length < 8 || password.length > 72) return NextResponse.json({ ok: false, reason: "invalid", message: "Use 8 to 72 characters for your password." }, { status: 400 });

  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: text("name", 100), phone: text("phone", 30), country: text("country", 60) },
  });
  if (error) {
    const exists = error.code === "email_exists" || /already (been )?registered/i.test(error.message);
    if (exists) return NextResponse.json({ ok: false, reason: "exists" }, { status: 409 });
    if (/password/i.test(error.message)) return NextResponse.json({ ok: false, reason: "invalid", message: error.message }, { status: 400 });
    return NextResponse.json({ ok: false, reason: "failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
