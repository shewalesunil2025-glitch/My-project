import { NextResponse } from "next/server";
import { adminDb } from "@/lib/server/followup";
import { requestReview } from "@/lib/server/reviews";
import { userFromRequest } from "@/lib/server/whatsapp";

/** Google Review Management: the signed-in owner asks a customer for a review on WhatsApp. */
export async function POST(request: Request) {
  const db = adminDb();
  if (!db) return NextResponse.json({ ok: false, result: "off" }, { status: 503 });
  const user = await userFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, result: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { name?: unknown; phone?: unknown };
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 30) : "";
  const result = await requestReview(db, user.id, { name, phone });
  return NextResponse.json({ ok: result === "sent", result });
}
