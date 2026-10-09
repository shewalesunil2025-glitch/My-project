import { NextResponse } from "next/server";
import { connectionState, evo, evolution, evolutionReady, instanceFor, instanceToken, ownership, userFromRequest, waDigits } from "@/lib/server/whatsapp";

/**
 * Links a client's WhatsApp number to ibaxai, self-service:
 *  - "connect": creates (or reopens) the number's Evolution instance with the AI Replies
 *    webhook and returns a pairing code (enter it in WhatsApp → Linked devices) and a QR code.
 *  - "status": "open" once WhatsApp is linked.
 *  - "disconnect": unlinks the number.
 */
type Action = "connect" | "status" | "disconnect";

type QrCode = { base64?: string; code?: string; pairingCode?: string } | null | undefined;

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

export async function POST(request: Request) {
  if (!evolutionReady()) return json({ ok: false, reason: "not_configured" }, 503);
  const user = await userFromRequest(request);
  if (!user) return json({ ok: false, reason: "unauthorized" }, 401);

  const body = (await request.json().catch(() => ({}))) as { action?: Action; number?: string };
  const digits = waDigits(String(body.number ?? ""));
  if (!digits) return json({ ok: false, reason: "invalid_number" }, 400);
  const instance = instanceFor(digits);

  try {
    const owner = await ownership(user.id, instance);
    if (owner === "other") return json({ ok: false, reason: "taken" }, 409);

    if (body.action === "status") {
      if (owner === "none") return json({ ok: true, state: "close" });
      return json({ ok: true, state: await connectionState(instance), instance });
    }

    if (body.action === "disconnect") {
      if (owner === "mine") await evo(`/instance/logout/${encodeURIComponent(instance)}`, { method: "DELETE" });
      return json({ ok: true });
    }

    // connect
    let qr: QrCode;
    if (owner === "none") {
      const created = await evo("/instance/create", {
        method: "POST",
        body: JSON.stringify({
          instanceName: instance,
          token: instanceToken(user.id, instance),
          integration: "WHATSAPP-BAILEYS",
          qrcode: true,
          number: digits,
          groupsIgnore: true,
          webhook: { enabled: true, url: evolution.webhook, byEvents: false, base64: false, events: ["MESSAGES_UPSERT"] },
        }),
      });
      if (!created.ok) {
        console.error("[whatsapp] create failed", created.status, JSON.stringify(created.data).slice(0, 300));
        return json({ ok: false, reason: "server_error" }, 502);
      }
      qr = (created.data as { qrcode?: QrCode }).qrcode;
    } else {
      const state = await connectionState(instance);
      if (state === "open") return json({ ok: true, state, instance });
      const r = await evo(`/instance/connect/${encodeURIComponent(instance)}?number=${digits}`);
      qr = r.data as QrCode;
    }
    return json({ ok: true, state: "connecting", instance, pairingCode: qr?.pairingCode ?? null, qr: qr?.base64 ?? null });
  } catch (error) {
    console.error("[whatsapp] server unreachable", error);
    return json({ ok: false, reason: "server_error" }, 502);
  }
}
