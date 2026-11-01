import { json, limited } from "@/lib/server/wa/http";
import { founderFromRequest } from "@/lib/server/founder";
import { studioDeps } from "@/lib/server/studio/deps";
import { advance, approve, overview, regenerate, reject, retryPublish, startDay, type Fail } from "@/lib/server/studio/jobs";

/** Founder only: the Content Studio dashboard and its buttons. Nothing publishes without "approve". */
export const maxDuration = 300;

const out = (r: { ok: true } | Fail) => ("ok" in r && r.ok ? json(r) : json({ ok: false, reason: (r as Fail).reason, message: (r as Fail).message }, (r as Fail).status));

export async function POST(request: Request) {
  const f = await founderFromRequest(request);
  if (!f) return json({ ok: false }, 403);
  if (limited(`studio:${f.id}`, 30)) return json({ ok: false, reason: "rate_limited" }, 429);
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const d = studioDeps(f.db);
  try {
    switch (b.action) {
      case "overview":
        return json({ ok: true, ...(await overview(d)) });
      case "start":
        return json(await startDay(d));
      case "advance":
        return json(await advance(d));
      case "approve":
        return out(await approve(d, b.id));
      case "reject":
        return out(await reject(d, b.id));
      case "regenerate":
        return out(await regenerate(d, b.id));
      case "retry_publish":
        return out(await retryPublish(d, b.id));
      default:
        return json({ ok: false, reason: "bad_request" }, 400);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[studio]", message);
    return json({ ok: false, reason: /does not exist|schema cache/i.test(message) ? "not_ready" : "server_error", message: message.slice(0, 200) }, 500);
  }
}
