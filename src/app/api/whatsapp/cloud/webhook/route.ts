import { after } from "next/server";
import { evolution } from "@/lib/server/whatsapp";
import { cloudLinkByPhoneId, evoBase, evoKeyFor, meta, signatureOk } from "@/lib/server/waCloud";

/**
 * Meta's WhatsApp webhook (Meta → WhatsApp → Configuration → Callback URL).
 * GET: Meta checks the URL with META_WEBHOOK_VERIFY_TOKEN.
 * POST: each customer message (and, with the WhatsApp Business app kept, each message the owner
 * typed on their phone) is passed to the n8n AI Replies webhook in the same shape Evolution uses.
 */

export function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  if (q.get("hub.mode") === "subscribe" && meta.verifyToken && q.get("hub.verify_token") === meta.verifyToken) {
    return new Response(q.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

type WaMessage = {
  from?: string;
  to?: string;
  id?: string;
  type?: string;
  text?: { body?: string };
  image?: { caption?: string };
  video?: { caption?: string };
  document?: { caption?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
};
type Change = {
  field?: string;
  value?: {
    metadata?: { phone_number_id?: string };
    contacts?: { wa_id?: string; profile?: { name?: string } }[];
    messages?: WaMessage[];
    message_echoes?: WaMessage[];
  };
};

const textOf = (m: WaMessage) =>
  m.text?.body ?? m.image?.caption ?? m.video?.caption ?? m.document?.caption ?? m.button?.text ?? m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "";

/** One message in the Evolution "messages.upsert" shape the n8n workflow reads. */
function asEvolution(instance: string, m: WaMessage, fromMe: boolean, name: string) {
  const voice = m.type === "audio";
  const customer = fromMe ? m.to : m.from;
  return {
    event: "messages.upsert",
    instance,
    server_url: evoBase(),
    apikey: evoKeyFor(instance),
    data: {
      key: { remoteJid: `${String(customer ?? "").replace(/\D/g, "")}@s.whatsapp.net`, fromMe, id: m.id ?? "" },
      pushName: name || "Customer",
      messageType: voice ? "audioMessage" : "conversation",
      message: voice ? { audioMessage: {} } : { conversation: textOf(m) },
    },
  };
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!signatureOk(raw, request.headers.get("x-hub-signature-256"))) return new Response("Bad signature", { status: 401 });
  let body: { entry?: { changes?: Change[] }[] };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const changes = (body.entry ?? []).flatMap((e) => e.changes ?? []);
  // Answer Meta at once; hand the messages to n8n right after.
  after(async () => {
    if (!evolution.webhook) return;
    for (const ch of changes) {
      const v = ch.value ?? {};
      const phoneId = v.metadata?.phone_number_id;
      const incoming = ch.field === "messages" ? (v.messages ?? []) : [];
      const echoes = ch.field === "smb_message_echoes" ? (v.message_echoes ?? []) : [];
      if (!phoneId || (incoming.length === 0 && echoes.length === 0)) continue;
      const link = await cloudLinkByPhoneId(phoneId);
      if (!link) continue;
      const names = new Map((v.contacts ?? []).map((c) => [c.wa_id ?? "", c.profile?.name ?? ""]));
      const events = [...incoming.map((m) => asEvolution(link.instance, m, false, names.get(m.from ?? "") ?? "")), ...echoes.map((m) => asEvolution(link.instance, m, true, ""))];
      for (const ev of events) {
        await fetch(evolution.webhook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(ev), signal: AbortSignal.timeout(10_000) }).catch((err) =>
          console.error("[wa-cloud] forward to n8n failed", err instanceof Error ? err.message : err),
        );
      }
    }
  });
  return new Response("OK", { status: 200 });
}
