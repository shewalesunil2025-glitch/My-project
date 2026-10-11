import { NextResponse } from "next/server";
import { adminDb, fromAutomationServer, markReplied } from "@/lib/server/followup";

/** From n8n (AI Replies) on every customer message: a lead who writes back gets no more reminders. */
export async function POST(request: Request) {
  if (!fromAutomationServer(request)) return NextResponse.json({ ok: false }, { status: 401 });
  const db = adminDb();
  if (!db) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { instance?: unknown; phone?: unknown };
  const replied = await markReplied(db, String(body.instance ?? ""), String(body.phone ?? ""));
  return NextResponse.json({ ok: true, replied });
}
