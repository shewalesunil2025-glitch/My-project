import { json, automationCall } from "@/lib/server/wa/http";
import { cleanId, clip, instanceOk } from "@/lib/server/wa/rules";
import { ownerTyped } from "@/lib/server/wa/service";

/** From n8n when the owner writes to a customer from their own WhatsApp: the bot pauses for that customer. */
export async function POST(request: Request) {
  const c = await automationCall(request);
  if ("error" in c) return c.error;
  const { body: b } = c;
  if (!instanceOk(b.instance)) return json({ ok: false, reason: "bad_request" }, 400);
  const r = await ownerTyped(c.db, { instance: b.instance, phone: String(b.phone ?? ""), text: clip(b.message, 2000), messageId: cleanId(b.message_id) });
  return json(r, r.ok ? 200 : 404);
}
