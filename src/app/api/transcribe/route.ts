import { NextResponse } from "next/server";
import { geminiReady, geminiTranscribe } from "@/lib/server/gemini";

/** Voice messages from IBAX's mic → text. Body: { audio: base64 16 kHz mono WAV, lang: "en" | "hi" | "mr" }. */
export const maxDuration = 60;
const MAX_BODY = 3_000_000; // ~60 s of 16 kHz mono audio

export async function POST(request: Request) {
  if (!geminiReady()) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  const raw = await request.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ ok: false, reason: "too_large" }, { status: 413 });
  const body = (() => {
    try {
      return JSON.parse(raw) as { audio?: unknown; lang?: unknown };
    } catch {
      return {};
    }
  })();
  if (typeof body.audio !== "string" || !/^[A-Za-z0-9+/=]+$/.test(body.audio.slice(0, 200))) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }
  try {
    const text = await geminiTranscribe(body.audio, typeof body.lang === "string" ? body.lang : "en");
    return NextResponse.json({ ok: true, text });
  } catch (error) {
    console.error("[transcribe] failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
  }
}
