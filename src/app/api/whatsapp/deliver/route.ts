import { json, automationCall } from "@/lib/server/wa/http";
import { cleanId, clip, instanceOk } from "@/lib/server/wa/rules";
import { deliver } from "@/lib/server/wa/service";

/** From n8n after a bot reply: saves it, rates the lead, pauses the bot if the owner is needed, tells the owner if it failed to send. */
export async function POST(request: Request) {
  const c = await automationCall(request);
  if ("error" in c) return c.error;
  const { body: b } = c;
  if (!instanceOk(b.instance)) return json({ ok: false, reason: "bad_request" }, 400);
  const result = await deliver(c.db, {
    instance: b.instance,
    phone: String(b.phone ?? ""),
    name: clip(b.customer_name, 80),
    reply: clip(b.reply, 2000),
    delivered: b.delivered === true,
    messageId: cleanId(b.reply_id),
    intent: clip(b.intent, 20),
    needsHuman: b.needs_human === true,
    leadTemp: clip(b.lead_temp, 8),
    interest: clip(b.interest, 200),
  });
  return json(result, result.ok ? 200 : 404);
}
