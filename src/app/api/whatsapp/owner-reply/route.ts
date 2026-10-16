import { json, ownerCall } from "@/lib/server/wa/http";
import { instanceOk } from "@/lib/server/wa/rules";
import { ownerReply } from "@/lib/server/wa/service";
import { evolutionReady } from "@/lib/server/whatsapp";

/** The owner answers a customer from the Inbox. Only the account that linked the number may do this. */
export async function POST(request: Request) {
  if (!evolutionReady()) return json({ ok: false, reason: "not_configured" }, 503);
  const c = await ownerCall(request);
  if ("error" in c) return c.error;
  const { body: b } = c;
  if (!instanceOk(b.instance)) return json({ ok: false, reason: "invalid" }, 400);
  const r = await ownerReply(c.db, c.user.id, b.instance, String(b.phone ?? ""), typeof b.text === "string" ? b.text : "");
  return json(r, r.ok ? 200 : r.reason === "forbidden" ? 403 : r.reason === "send_failed" ? 502 : 400);
}
