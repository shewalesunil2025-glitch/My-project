import { json, automationCall } from "@/lib/server/wa/http";
import { clip, instanceOk } from "@/lib/server/wa/rules";
import { failure } from "@/lib/server/wa/service";

/** From n8n when the AI could not answer (quota, timeout, error): the owner is told to reply themselves. */
export async function POST(request: Request) {
  const c = await automationCall(request);
  if ("error" in c) return c.error;
  const { body: b } = c;
  if (!instanceOk(b.instance)) return json({ ok: false, reason: "bad_request" }, 400);
  const kind = ["quota", "timeout", "error"].includes(String(b.kind)) ? String(b.kind) : "error";
  const result = await failure(c.db, { instance: b.instance, phone: String(b.phone ?? ""), name: clip(b.customer_name, 80), kind });
  return json(result, result.ok ? 200 : 404);
}
