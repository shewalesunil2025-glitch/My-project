import { NextResponse } from "next/server";
import { limited } from "@/lib/server/wa/http";
import { instanceOk } from "@/lib/server/wa/rules";
import { cloudLink, cloudSendText, evoKeyOk } from "@/lib/server/waCloud";

/**
 * Evolution's "send text" call, for numbers on Meta's Cloud API: n8n sends replies to
 * `<server_url>/message/sendText/<instance>` with the `apikey` it was given, and they go out
 * through Meta. The answer has Evolution's shape (`key.id`), so the workflow needs no change.
 */
export async function POST(request: Request, { params }: { params: Promise<{ instance: string }> }) {
  const { instance } = await params;
  if (!instanceOk(instance) || !evoKeyOk(instance, request.headers.get("apikey"))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (limited(`cloud-send:${instance}`, 120)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const link = await cloudLink(instance);
  if (!link) return NextResponse.json({ error: "not_linked" }, { status: 404 });
  const b = (await request.json().catch(() => ({}))) as { number?: unknown; text?: unknown };
  const text = typeof b.text === "string" ? b.text.trim() : "";
  const to = typeof b.number === "string" ? b.number.replace(/\D/g, "") : "";
  if (!text || to.length < 8 || to.length > 15) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const r = await cloudSendText(link, to, text);
  return r.ok ? NextResponse.json({ key: { id: r.id, remoteJid: `${to}@s.whatsapp.net`, fromMe: true } }, { status: 201 }) : NextResponse.json({ error: r.error?.message ?? "send_failed" }, { status: 502 });
}
