import { json, limited } from "@/lib/server/wa/http";
import { founderFromRequest } from "@/lib/server/founder";
import { vapi } from "@/lib/server/voice/provider";
import { adminNumberAction, adminOverview, adminSavePlan, type Fail } from "@/lib/server/voice/service";

/** Founder only: number requests, provider setup, test result, packages. The founder's email is checked on the server. */
const out = (r: { ok: true } | Fail) => ("ok" in r && r.ok ? json(r) : json({ ok: false, reason: (r as Fail).reason, message: (r as Fail).message }, (r as Fail).status));

export async function POST(request: Request) {
  const f = await founderFromRequest(request);
  if (!f) return json({ ok: false }, 403);
  if (limited(`voice-admin:${f.id}`, 60)) return json({ ok: false, reason: "rate_limited" }, 429);
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  switch (b.action) {
    case "overview":
      return json({ ok: true, ...(await adminOverview(f.db)) });
    case "save_plan":
      return out(await adminSavePlan(f.db, f.email, b));
    case "number":
      return out(await adminNumberAction(f.db, vapi, f.email, { ...b, action: b.op }));
    default:
      return json({ ok: false, reason: "bad_request" }, 400);
  }
}
