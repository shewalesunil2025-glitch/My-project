import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { serviceById } from "@/content/app/services";
import { demoPrice, demoScenes, speechParts } from "@/components/demo/scenes";
import { adminDb } from "@/lib/server/followup";
import { geminiReady, geminiSpeak } from "@/lib/server/gemini";

/**
 * The spoken narration of the service demo videos, in IBAX's natural (Gemini) voice.
 * GET ?service=whatsapp&cur=INR&scene=2&part=0 → redirects to the audio file. Only the
 * demo's own words can be spoken, and each clip is made once and kept in storage, so
 * every later viewer gets it instantly without using the voice quota.
 */
export const maxDuration = 60;

const BUCKET = "ai-images";
const VOICE_VERSION = "v1";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const svc = serviceById(q.get("service") ?? "");
  const cur = q.get("cur") === "USD" ? "USD" : "INR";
  const scene = Number(q.get("scene"));
  const part = Number(q.get("part") ?? 0);
  if (!svc || !Number.isInteger(scene) || !Number.isInteger(part)) return NextResponse.json({ ok: false }, { status: 400 });
  const say = demoScenes(svc, demoPrice(svc, cur))[scene]?.say;
  const text = say ? speechParts(say)[part] : undefined;
  if (!text) return NextResponse.json({ ok: false, reason: "no_such_part" }, { status: 404 });

  const db = adminDb();
  const path = `demo-voice/${VOICE_VERSION}/${createHash("sha256").update(text).digest("hex").slice(0, 32)}.wav`;
  if (db) {
    const url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    const head = await fetch(url, { method: "HEAD" }).catch(() => null);
    if (head?.ok) return NextResponse.redirect(url, { headers: { "cache-control": "public, max-age=86400" } });
  }

  if (!geminiReady()) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  const wav = await geminiSpeak(text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ""));
  if (!wav) return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 503 });
  if (db) {
    const body = new Uint8Array(wav);
    let up = await db.storage.from(BUCKET).upload(path, body, { contentType: "audio/wav", upsert: true });
    if (up.error && /bucket/i.test(up.error.message)) {
      await db.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 10_000_000 });
      up = await db.storage.from(BUCKET).upload(path, body, { contentType: "audio/wav", upsert: true });
    }
    if (!up.error) return NextResponse.redirect(db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return new Response(new Uint8Array(wav), { headers: { "content-type": "audio/wav", "cache-control": "no-store" } });
}
