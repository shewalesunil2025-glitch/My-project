import { NextResponse } from "next/server";
import { adminDb } from "@/lib/server/followup";
import { geminiImage, geminiImageModels, geminiJson, geminiReady, type InlineFile } from "@/lib/server/gemini";
import { freeImage } from "@/lib/server/freeImage";
import { userFromRequest } from "@/lib/server/whatsapp";

/**
 * AI images for signed-in owners (posters, posts, banners, cartoons, photo makeovers), free
 * for everyone. Gemini's image model is tried first (better, edits photos directly, but needs
 * billing on the key); otherwise the free Pollinations model makes it, and for a photo
 * makeover Gemini (free) first describes the photo. A daily allowance (DAILY) stops abuse;
 * the count lives in the user's app_metadata, which only the server can write. Images are
 * saved in the public "ai-images" bucket.
 */

export const maxDuration = 60;

const DAILY = 20;
const BUCKET = "ai-images";
const MAX_PHOTO = 3_000_000;

const indiaDate = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);

/** Which image models the key can use (no image is made). */
export async function GET() {
  if (!geminiReady()) return NextResponse.json({ ok: false, reason: "not_configured" });
  const { gemini, imagen } = await geminiImageModels();
  return NextResponse.json({ ok: true, gemini, imagen });
}

export async function POST(request: Request) {
  const db = adminDb();
  if (!db || !geminiReady()) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  const user = await userFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { prompt?: unknown; photo?: { mime?: unknown; data?: unknown } };
  const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 1500) : "";
  if (!prompt) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  const photo =
    body.photo && typeof body.photo.mime === "string" && /^image\/(png|jpeg|webp)$/.test(body.photo.mime) && typeof body.photo.data === "string" && body.photo.data.length < MAX_PHOTO
      ? { mime: body.photo.mime, data: body.photo.data }
      : undefined;

  const limit = DAILY;
  const { data: account } = await db.auth.admin.getUserById(user.id);
  const meta = (account?.user?.app_metadata ?? {}) as Record<string, unknown>;
  const usage = (meta.ai_images ?? {}) as { day?: string; count?: number };
  const today = indiaDate();
  const used = usage.day === today ? (usage.count ?? 0) : 0;
  if (used >= limit) return NextResponse.json({ ok: false, reason: "limit", limit }, { status: 429 });

  let image: { mime: string; data: string; model: string };
  try {
    image = await geminiImage(prompt, photo);
  } catch (error) {
    console.warn("[image] gemini unavailable, using the free model:", (error instanceof Error ? error.message : String(error)).slice(0, 200));
    try {
      image = await freeImage(photo ? await withPhoto(prompt, photo) : prompt);
    } catch (e) {
      console.error("[image] free model failed", e instanceof Error ? e.message.slice(0, 200) : e);
      return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
    }
  }

  await db.auth.admin.updateUserById(user.id, { app_metadata: { ...meta, ai_images: { day: today, count: used + 1 } } });

  // Keep the image so it stays in the chat; if storage isn't available, send it back inline.
  const ext = image.mime.includes("jpeg") ? "jpg" : image.mime.includes("webp") ? "webp" : "png";
  const path = `${user.id}/${Date.now()}.${ext}`;
  let upload = await db.storage.from(BUCKET).upload(path, Buffer.from(image.data, "base64"), { contentType: image.mime });
  if (upload.error && /not found/i.test(upload.error.message)) {
    await db.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 10_000_000 });
    upload = await db.storage.from(BUCKET).upload(path, Buffer.from(image.data, "base64"), { contentType: image.mime });
  }
  const url = upload.error ? null : db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ ok: true, url, image: url ? undefined : `data:${image.mime};base64,${image.data}`, left: limit - used - 1, limit });
}

/** The free model can't see photos: Gemini (free) describes the photo, and the image is made from that. */
async function withPhoto(prompt: string, photo: InlineFile) {
  try {
    const out = (await geminiJson(
      "Describe this photo for an image generator so it can be redrawn: the people (age, look, clothes, pose, expression), objects, place, colours and lighting. One paragraph, under 90 words, English. No names.",
      [{ role: "user", content: "Describe the photo.", files: [photo] }],
      { type: "object", properties: { description: { type: "string" } }, required: ["description"] },
    )) as { description?: string };
    return out.description ? `${prompt}. Redraw this photo: ${out.description}` : prompt;
  } catch {
    return prompt;
  }
}
