import { NextResponse } from "next/server";
import { adminDb, fromAutomationServer, runDue, sendSummaries } from "@/lib/server/followup";
import { monitorLinks } from "@/lib/server/wa/service";
import { sendRenewalReminders } from "@/lib/server/renewals";

/** Hourly from n8n (IBAX · Lead Follow-up · Hourly): sends due follow-ups, the morning lists and renewal reminders. */
export async function POST(request: Request) {
  if (!fromAutomationServer(request)) return NextResponse.json({ ok: false }, { status: 401 });
  const db = adminDb();
  if (!db) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  const due = await runDue(db);
  const summaries = await sendSummaries(db);
  const renewals = await sendRenewalReminders(db).catch(() => ({ reminders: 0 }));
  const links = await monitorLinks(db).catch(() => ({ checked: 0, down: 0 }));
  return NextResponse.json({ ok: true, ...due, ...summaries, ...renewals, links });
}
