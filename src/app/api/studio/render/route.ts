import { automationCall, json } from "@/lib/server/wa/http";
import { studioDeps } from "@/lib/server/studio/deps";
import { claimRender, finishRender, type Fail } from "@/lib/server/studio/jobs";

/**
 * The video worker (on the VPS, with ffmpeg; x-ibax-secret): "claim" hands out the next job's
 * scenes as short signed links plus one-time upload links; "finish" reports the result.
 */
export async function POST(request: Request) {
  const c = await automationCall(request);
  if ("error" in c) return c.error;
  const d = studioDeps(c.db);
  try {
    if (c.body.action === "claim") return json(await claimRender(d));
    if (c.body.action === "finish") {
      const r = await finishRender(d, c.body);
      return r.ok ? json(r) : json({ ok: false, reason: (r as Fail).reason, message: (r as Fail).message }, (r as Fail).status);
    }
    return json({ ok: false, reason: "bad_request" }, 400);
  } catch (e) {
    console.error("[studio/render]", e instanceof Error ? e.message : e);
    return json({ ok: false, reason: "server_error" }, 500);
  }
}
