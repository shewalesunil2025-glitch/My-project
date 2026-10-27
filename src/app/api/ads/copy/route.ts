import { geminiReady } from "@/lib/server/gemini";
import { generateCopy } from "@/lib/server/ads/copy";
import { json, limited, ownerCall } from "@/lib/server/wa/http";

export const maxDuration = 40;

/** AI ad text for a campaign (English and/or Hindi). Made-up prices and claims are filtered out. */
export async function POST(request: Request) {
  if (!geminiReady()) return json({ ok: false, reason: "not_configured", message: "AI isn't switched on yet." }, 503);
  const c = await ownerCall(request);
  if ("error" in c) return c.error;
  if (limited(`ads-copy:${c.user.id}`, 6, 60_000)) return json({ ok: false, reason: "rate_limited", message: "Please wait a moment and try again." }, 429);
  const r = await generateCopy(c.db, c.user.id, c.body.id, c.body.count);
  return r.ok ? json(r) : json({ ok: false, reason: r.reason, message: r.message }, r.status);
}
