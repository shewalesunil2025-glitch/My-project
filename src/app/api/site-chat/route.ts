import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validSlug, type PublishedSite } from "@/lib/sites/site";
import { geminiJson, geminiReady } from "@/lib/server/gemini";
import { alertOwner, supportFor, supportPrompt } from "@/lib/server/support";

/**
 * Customer Support chat on a client's ibaxai website (/s/<slug>). GET says whether the
 * chat is on; POST answers a customer from the owner's FAQs, prices, hours and policies,
 * and alerts the owner on WhatsApp (plus a lead in the app) when a person is needed.
 */

export const maxDuration = 60;

const REPLY_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string", description: "The answer to the customer, in their language." },
    needs_person: {
      type: "boolean",
      description: "True when the owner or team should contact this customer (complaint, refund, angry customer, asked for a person, or you couldn't answer).",
    },
    customer_name: { type: "string", description: "The customer's name if they gave it, else empty." },
    customer_phone: { type: "string", description: "The customer's phone number if they gave it, else empty." },
    summary: { type: "string", description: "One line for the owner: what the customer wants or is unhappy about. Empty if not needed." },
  },
  required: ["reply", "needs_person", "customer_name", "customer_phone", "summary"],
};

/** Small per-instance rate limit: 15 messages a minute per visitor IP. */
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 15;
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  return url && secret ? createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

/** The published site, and the owner's Customer Support settings if the service is on. */
async function load(slug: string) {
  const db = admin();
  if (!db || !validSlug(slug)) return null;
  const { data: site } = await db.from("sites").select("owner_id, data").eq("slug", slug).maybeSingle();
  if (!site) return null;
  const setup = await supportFor(db, site.owner_id);
  return setup ? { db, ownerId: site.owner_id as string, site: site.data as PublishedSite, setup } : null;
}

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  const found = geminiReady() ? await load(slug) : null;
  return NextResponse.json({ on: Boolean(found), name: found?.setup.business ?? "" }, { headers: { "cache-control": "public, max-age=60" } });
}

export async function POST(request: Request) {
  if (!geminiReady()) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ ok: false, reason: "busy" }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { slug?: unknown; messages?: unknown; alerted?: unknown };
  const slug = typeof body.slug === "string" ? body.slug : "";
  const raw = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const messages = raw.flatMap((m): { role: "user" | "assistant"; content: string }[] => {
    const { role, content } = (m ?? {}) as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || !content.trim()) return [];
    return [{ role, content: content.trim().slice(0, 800) }];
  });
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  const found = await load(slug);
  if (!found) return NextResponse.json({ ok: false, reason: "off" }, { status: 404 });

  try {
    const out = (await geminiJson(supportPrompt(found.setup, found.site), messages, REPLY_SCHEMA)) as Record<string, unknown>;
    const reply = typeof out.reply === "string" ? out.reply.trim() : "";
    if (!reply) throw new Error("Empty reply");
    let alerted = body.alerted === true;
    const phone = typeof out.customer_phone === "string" ? out.customer_phone.replace(/[^\d+]/g, "") : "";
    // Once per chat, as soon as we have the customer's number: a lead in the app and a WhatsApp alert.
    if (out.needs_person === true && !alerted && phone.replace(/\D/g, "").length >= 6) {
      const name = typeof out.customer_name === "string" && out.customer_name.trim() ? out.customer_name.trim().slice(0, 80) : "Website visitor";
      const summary =
        typeof out.summary === "string" && out.summary.trim() ? out.summary.trim().slice(0, 300) : messages[messages.length - 1].content.slice(0, 300);
      await found.db.from("site_leads").insert({ owner_id: found.ownerId, slug, name, phone, message: `Support: ${summary}` });
      await alertOwner(
        found.setup,
        `🔔 IBAX Support · ${found.setup.business}\nA customer on your website needs you.\n\n${name} (${phone})\n"${summary}"\n\nPlease call or WhatsApp them.`,
      ).catch(() => false);
      alerted = true;
    }
    return NextResponse.json({ ok: true, reply, alerted });
  } catch (error) {
    const status = (error as { status?: number }).status;
    console.error("[site-chat] failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, reason: status === 429 ? "busy" : "upstream" }, { status: status === 429 ? 429 : 502 });
  }
}
