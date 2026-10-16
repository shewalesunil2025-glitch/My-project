import { json, ownerCall } from "@/lib/server/wa/http";
import { instanceOk } from "@/lib/server/wa/rules";
import { setBot } from "@/lib/server/wa/service";

/** "Turn bot back on" / off for one customer, from the Inbox. */
export async function POST(request: Request) {
  const c = await ownerCall(request);
  if ("error" in c) return c.error;
  const { body: b } = c;
  if (!instanceOk(b.instance) || typeof b.on !== "boolean") return json({ ok: false, reason: "invalid" }, 400);
  const r = await setBot(c.db, c.user.id, b.instance, String(b.phone ?? ""), b.on);
  return json(r, r.ok ? 200 : r.reason === "forbidden" ? 403 : 400);
}
