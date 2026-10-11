"use client";

import { cloudAuthHeader, cloudEnabled } from "./cloud";

/** Client side of /api/whatsapp: link a WhatsApp number with a pairing code or QR. */

export type LinkStart =
  | { ok: true; state: "open" | "connecting"; pairingCode: string | null; qr: string | null }
  | { ok: false; reason: "not_configured" | "unauthorized" | "invalid_number" | "taken" | "server_error" };

async function call(action: "connect" | "status" | "disconnect", number: string) {
  const res = await fetch("/api/whatsapp", {
    method: "POST",
    headers: { "content-type": "application/json", ...(await cloudAuthHeader()) },
    body: JSON.stringify({ action, number }),
  }).catch(() => null);
  if (!res) return { ok: false, reason: "server_error" } as const;
  return (await res.json().catch(() => ({ ok: false, reason: "server_error" }))) as Record<string, unknown> & { ok: boolean };
}

/** "+<country code><number>", as stored on the connection (10 digits are taken as Indian). */
export function waAccount(number: string) {
  const d = number.replace(/\D/g, "").replace(/^0+/, "");
  return `+${d.length === 10 ? `91${d}` : d}`;
}

/** Real linking needs Supabase sign-in; without it the app keeps the preview "connect" step. */
export const whatsappLinkAvailable = () => cloudEnabled;

export async function startWhatsAppLink(number: string): Promise<LinkStart> {
  return (await call("connect", number)) as LinkStart;
}

export async function whatsAppState(number: string): Promise<string> {
  return (await whatsAppStatus(number)).state;
}

/** Link state plus, while linking, the current pairing code and QR (WhatsApp renews them every ~20 s). */
export async function whatsAppStatus(number: string): Promise<{ state: string; pairingCode: string | null; qr: string | null }> {
  const r = await call("status", number);
  if (!r.ok) return { state: "unknown", pairingCode: null, qr: null };
  return { state: String(r.state ?? "unknown"), pairingCode: (r.pairingCode as string | null) ?? null, qr: (r.qr as string | null) ?? null };
}

export async function unlinkWhatsApp(number: string) {
  await call("disconnect", number);
}

export const linkErrors: Record<string, string> = {
  invalid_number: "Enter your WhatsApp number with country code, e.g. +91 98765 43210.",
  taken: "This WhatsApp number is already linked to another ibaxai account.",
  unauthorized: "Please log in again, then try once more.",
  server_error: "Couldn't reach the WhatsApp server. Please try again in a minute.",
};
