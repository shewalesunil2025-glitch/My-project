import { NextResponse } from "next/server";
import { adminDb, enroll, stopFor } from "@/lib/server/followup";
import { userFromRequest } from "@/lib/server/whatsapp";

/**
 * Lead Follow-up from the app (signed-in owner):
 *  - "enroll": a lead the owner added by hand → start following up (if the service is on).
 *  - "stop": the owner marked a lead converted or lost → no more messages.
 */
export async function POST(request: Request) {
  const db = adminDb();
  if (!db) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  const user = await userFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const text = (k: string, max: number) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : "");
  const phone = text("phone", 30);
  if (!phone) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });

  if (body.action === "stop") {
    await stopFor(db, user.id, phone);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "enroll") {
    const result = await enroll(db, user.id, { name: text("name", 80), phone, interest: text("interest", 300), source: text("source", 40), leadRef: text("leadRef", 80) });
    return NextResponse.json({ ok: true, result });
  }
  return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
}
