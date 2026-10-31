import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cloudLink, unlinkCloud } from "@/lib/server/waCloud";
import { deleteInstance } from "@/lib/server/waRelease";

/**
 * Deletes the signed-in owner's account. Needs the server-only SUPABASE_SECRET_KEY,
 * so the browser can't delete accounts itself. The owner's profile, workspace and
 * subscriptions are removed with it (on delete cascade).
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });

  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });

  // Free their WhatsApp numbers first, so the same number can be linked again from another account.
  const { data: numbers } = await admin.from("wa_instances").select("instance").eq("owner_id", data.user.id);
  for (const n of numbers ?? []) {
    const cloud = await cloudLink(n.instance).catch(() => null);
    if (cloud) await unlinkCloud(cloud).catch(() => null);
    else await deleteInstance(n.instance).catch(() => null);
  }

  const removed = await admin.auth.admin.deleteUser(data.user.id);
  if (removed.error) return NextResponse.json({ ok: false, reason: "failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
