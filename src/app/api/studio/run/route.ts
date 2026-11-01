import { automationCall, json } from "@/lib/server/wa/http";
import { studioDeps } from "@/lib/server/studio/deps";
import { advance, startDay } from "@/lib/server/studio/jobs";

/**
 * For n8n and the video worker (x-ibax-secret): "start" makes today's job (the daily trigger),
 * "advance" runs the next step of any job (called every few minutes until the video is ready).
 */
export const maxDuration = 300;

export async function POST(request: Request) {
  const c = await automationCall(request);
  if ("error" in c) return c.error;
  const d = studioDeps(c.db);
  try {
    if (c.body.action === "start") return json(await startDay(d));
    if (c.body.action === "advance") return json(await advance(d));
    return json({ ok: false, reason: "bad_request" }, 400);
  } catch (e) {
    console.error("[studio/run]", e instanceof Error ? e.message : e);
    return json({ ok: false, reason: "server_error" }, 500);
  }
}
