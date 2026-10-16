import { NextResponse } from "next/server";
import { geminiJson, geminiReady } from "@/lib/server/gemini";
import { userFromRequest } from "@/lib/server/whatsapp";

/**
 * Google Review Management: writes a reply for a Google review the owner pastes in.
 * (Reading new reviews by itself needs Google's Business Profile API approval; until then
 * the owner copies the review here and IBAX drafts the answer.)
 */

const recent = new Map<string, number[]>();
const PER_HOUR = 30;

const system = `You write public replies to Google reviews for a small business owner.
Rules:
- Reply in the same language and script as the review (Hindi in Devanagari → Hindi, Hinglish → Hinglish, Marathi → Marathi, English → English).
- 2 to 4 short sentences, under 70 words, warm and natural, signed with the business name.
- Positive review: thank the person by first name if given, mention one thing they praised, invite them back.
- Negative or mixed review: stay calm and polite, apologise sincerely without arguing or blaming the customer, and invite them to contact the business directly. Never promise a refund, discount or action you can't know about.
- Never invent facts about the business, never offer anything, never ask for a changed rating, never mention fake reviews. Plain text, no hashtags, at most one emoji.`;

export async function POST(request: Request) {
  if (!geminiReady()) return NextResponse.json({ ok: false, reason: "off" }, { status: 503 });
  const user = await userFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });

  const now = Date.now();
  const hits = (recent.get(user.id) ?? []).filter((t) => now - t < 3_600_000);
  if (hits.length >= PER_HOUR) return NextResponse.json({ ok: false, reason: "limit" }, { status: 429 });
  recent.set(user.id, [...hits, now]);

  const body = (await request.json().catch(() => ({}))) as { review?: unknown; rating?: unknown; author?: unknown; business?: unknown };
  const review = typeof body.review === "string" ? body.review.trim().slice(0, 1500) : "";
  const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating) || 5)));
  const author = typeof body.author === "string" ? body.author.trim().slice(0, 60) : "";
  const business = typeof body.business === "string" ? body.business.trim().slice(0, 80) : "our team";
  if (review.length < 2 && rating >= 4) {
    // A star-only review: a short thank-you is enough.
  } else if (review.length < 2) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });

  try {
    const out = (await geminiJson(
      system,
      [{ role: "user", content: `Business: ${business}\nReviewer: ${author || "(name not given)"}\nStars: ${rating} out of 5\nReview: ${review || "(no text, stars only)"}` }],
      { type: "object", properties: { reply: { type: "string", description: "The public reply to post on Google." } }, required: ["reply"] },
    )) as { reply?: unknown };
    const reply = typeof out?.reply === "string" ? out.reply.trim().slice(0, 700) : "";
    if (!reply) return NextResponse.json({ ok: false, reason: "empty" }, { status: 502 });
    return NextResponse.json({ ok: true, reply });
  } catch (error) {
    console.error("[reviews] reply failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
  }
}
