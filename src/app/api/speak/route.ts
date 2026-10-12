import { NextResponse } from "next/server";
import { geminiReady, geminiSpeak, geminiTtsModels } from "@/lib/server/gemini";

/** IBAX's spoken replies in a natural voice. POST { text } → audio/wav; 503 means "use the phone's voice". */
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!geminiReady()) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim().slice(0, 700) : "";
  if (!text) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  const wav = await geminiSpeak(text);
  if (!wav) return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 503 });
  return new Response(new Uint8Array(wav), { headers: { "content-type": "audio/wav", "cache-control": "no-store" } });
}

/** Which voice models the key can use (names only), to check the setup. */
export async function GET() {
  if (!geminiReady()) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  return NextResponse.json({ ok: true, models: await geminiTtsModels() });
}
