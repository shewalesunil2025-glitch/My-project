import { NextResponse } from "next/server";
import { adminDb, fromAutomationServer } from "@/lib/server/followup";
import { logTurn } from "@/lib/server/wachat";

/** From n8n (AI Replies) after each reply: saves the chat for the app's Inbox and rates the lead. */
export async function POST(request: Request) {
  if (!fromAutomationServer(request)) return NextResponse.json({ ok: false }, { status: 401 });
  const db = adminDb();
  if (!db) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const s = (k: string) => (typeof b[k] === "string" ? (b[k] as string) : "");
  const result = await logTurn(db, {
    instance: s("instance"),
    phone: s("phone"),
    name: s("customer_name"),
    message: s("message"),
    reply: s("reply"),
    intent: s("intent"),
    needsHuman: b.needs_human === true,
    leadTemp: s("lead_temp"),
    interest: s("interest"),
  });
  return NextResponse.json(result);
}
