import { NextResponse } from "next/server";
import { adminDb, fromAutomationServer } from "../followup";
import { userFromRequest } from "../whatsapp";

/** Shared guards for the WhatsApp routes. */
export const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

const hits = new Map<string, number[]>();
/** Small in-memory limiter (per server instance): at most `max` calls per `windowMs` for a key. */
export function limited(key: string, max: number, windowMs = 60_000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return recent.length > max;
}

/** Server-to-server call from our n8n: secret header, JSON body, database ready. */
export async function automationCall(request: Request) {
  if (!fromAutomationServer(request)) return { error: json({ ok: false }, 401) } as const;
  if (limited("n8n", 600)) return { error: json({ ok: false, reason: "rate_limited" }, 429) } as const;
  const db = adminDb();
  if (!db) return { error: json({ ok: false, reason: "not_configured" }, 503) } as const;
  const text = await request.text();
  if (text.length > 20_000) return { error: json({ ok: false, reason: "too_large" }, 413) } as const;
  let body: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(text || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed;
    else return { error: json({ ok: false, reason: "bad_request" }, 400) } as const;
  } catch {
    return { error: json({ ok: false, reason: "bad_request" }, 400) } as const;
  }
  return { db, body } as const;
}

/** A signed-in owner calling from the app. */
export async function ownerCall(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return { error: json({ ok: false, reason: "unauthorized" }, 401) } as const;
  if (limited(`owner:${user.id}`, 40)) return { error: json({ ok: false, reason: "rate_limited" }, 429) } as const;
  const db = adminDb();
  if (!db) return { error: json({ ok: false, reason: "not_configured" }, 503) } as const;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return { db, body, user } as const;
}
