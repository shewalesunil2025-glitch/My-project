import { NextResponse } from "next/server";
import { adminDb } from "@/lib/server/followup";
import { geminiImage, geminiImageModels, geminiReady } from "@/lib/server/gemini";
import { userFromRequest } from "@/lib/server/whatsapp";

/**
 * AI images for signed-in owners (posters, banners, product photos, photo edits). Images cost
 * money on Google's side, so each account gets a daily allowance: DAILY.paid with any paid
 * service, DAILY.free otherwise (free trial). The count lives in the user's app_metadata,
 * which only the server can write. Images are saved in the public "ai-images" bucket.
 */

export const maxDuration = 60;

const DAILY = { paid: 10, free: 3 };
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

  // Daily allowance: more with a paid service.
  const { data: row } = await db.from("workspaces").select("data").eq("owner_id", user.id).maybeSingle();
  const ws = row?.data as { automations?: { serviceId: string; trialEndsAt?: string }[] } | undefined;
  const paid = Boolean(ws?.automations?.some((a) => !a.trialEndsAt && a.serviceId !== "custom"));
  const limit = paid ? DAILY.paid : DAILY.free;
  const { data: account } = await db.auth.admin.getUserById(user.id);
  const meta = (account?.user?.app_metadata ?? {}) as Record<string, unknown>;
  const usage = (meta.ai_images ?? {}) as { day?: string; count?: number };
  const today = indiaDate();
  const used = usage.day === today ? (usage.count ?? 0) : 0;
  if (used >= limit) return NextResponse.json({ ok: false, reason: "limit", limit, paid }, { status: 429 });

  let image: { mime: string; data: string; model: string };
  try {
    image = await geminiImage(prompt, photo);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[image] failed", message.slice(0, 300));
    // A free-tier key can't make images: Google needs billing switched on for image models.
    const billing = /billing|quota|limit: 0|free_tier|RESOURCE_EXHAUSTED|429|No image model/i.test(message);
    return NextResponse.json({ ok: false, reason: billing ? "billing" : "upstream" }, { status: 502 });
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
