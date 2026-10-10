import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validSlug } from "@/lib/sites/site";

/**
 * Enquiry form on a client's published website → their Leads.
 * Uses the server-only secret key, so visitors can't read or write anything else.
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const text = (k: string, max: number) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : "");
  // Bots fill the hidden "website" field; pretend it worked.
  if (text("website", 200)) return NextResponse.json({ ok: true });

  const slug = text("slug", 40);
  const name = text("name", 80);
  const phone = text("phone", 20);
  const message = text("message", 600);
  if (!validSlug(slug) || !name || phone.replace(/\D/g, "").length < 6) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: site } = await admin.from("sites").select("owner_id").eq("slug", slug).maybeSingle();
  if (!site) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });

  const { error } = await admin.from("site_leads").insert({ owner_id: site.owner_id, slug, name, phone, message });
  if (error) {
    console.error("[site-lead] insert failed", error.message);
    return NextResponse.json({ ok: false, reason: "failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
