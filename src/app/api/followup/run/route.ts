import { NextResponse } from "next/server";
import { adminDb, fromAutomationServer, runDue, sendSummaries } from "@/lib/server/followup";

/** Hourly from n8n (IBAX · Lead Follow-up · Hourly): sends due follow-ups and the morning lists. */
export async function POST(request: Request) {
  if (!fromAutomationServer(request)) return NextResponse.json({ ok: false }, { status: 401 });
  const db = adminDb();
  if (!db) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  const due = await runDue(db);
  const summaries = await sendSummaries(db);
  return NextResponse.json({ ok: true, ...due, ...summaries });
}
