import { json, automationCall } from "@/lib/server/wa/http";
import { cleanId, clip, instanceOk } from "@/lib/server/wa/rules";
import { gate } from "@/lib/server/wa/service";

/** From n8n before each bot reply: stores the customer's message once and says whether the bot may answer. */
export async function POST(request: Request) {
  const c = await automationCall(request);
  if ("error" in c) return c.error;
  const { body } = c;
  if (!instanceOk(body.instance)) return json({ ok: false, allow: false, reason: "bad_request" }, 400);
  const result = await gate(c.db, { instance: body.instance, phone: String(body.phone ?? ""), name: clip(body.customer_name, 80), messageId: cleanId(body.message_id), text: clip(body.message, 2000) });
  return json({ ok: true, ...result });
}
