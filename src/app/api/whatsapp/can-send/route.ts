import { json, automationCall } from "@/lib/server/wa/http";
import { instanceOk } from "@/lib/server/wa/rules";
import { canSend } from "@/lib/server/wa/service";

/** From n8n right before sending a bot reply: false if the owner stepped in while it was being written. */
export async function POST(request: Request) {
  const c = await automationCall(request);
  if ("error" in c) return c.error;
  const { body: b } = c;
  if (!instanceOk(b.instance)) return json({ ok: false, allow: true, reason: "bad_request" }, 400);
  const since = Date.parse(String(b.since ?? "")) || Date.now();
  return json({ ok: true, allow: await canSend(c.db, b.instance, String(b.phone ?? ""), since) });
}
