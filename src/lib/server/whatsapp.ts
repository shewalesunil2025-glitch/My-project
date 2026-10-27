import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { fullDigits, phoneDigits } from "@/lib/phone";
import { cloudLink, cloudSendText } from "./waCloud";

/**
 * Server-only helpers for WhatsApp through our Evolution API server.
 * EVOLUTION_API_URL + EVOLUTION_API_KEY (the server's global key) and
 * N8N_EVOLUTION_WEBHOOK_URL (the AI Replies webhook, with its ?token=) are Vercel env vars.
 */

export const evolution = {
  url: process.env.EVOLUTION_API_URL?.replace(/\/+$/, ""),
  key: process.env.EVOLUTION_API_KEY,
  webhook: process.env.N8N_EVOLUTION_WEBHOOK_URL,
};

export const evolutionReady = () => Boolean(evolution.url && evolution.key && evolution.webhook);

/**
 * WhatsApp number as digits with country code. A number with "+" or "00" keeps its own code;
 * one without gets `defaultDial` (India's "91" unless the caller knows the business's country).
 */
export function waDigits(input: string, defaultDial?: string): string | null {
  return phoneDigits(input, defaultDial);
}

/** A number WhatsApp or our own database gave us: it already has its country code, so it is never prefixed. */
export const waFullDigits = fullDigits;

/** One Evolution instance per WhatsApp number — the same name the n8n workflows use. */
export const instanceFor = (digits: string) => `ibax-${digits}`;

/**
 * Each instance's API key is derived from its owner, so only the account that linked a
 * number can use or reconnect it, without keeping a separate ownership table.
 */
export const instanceToken = (userId: string, instance: string) =>
  createHash("sha256").update(`${evolution.key}:${userId}:${instance}`).digest("hex");

export async function evo(path: string, init: RequestInit & { key?: string } = {}) {
  // A number linked through Meta's official Cloud API sends through Meta instead (same reply shape).
  const send = /^\/message\/sendText\/([^/?]+)$/.exec(path);
  if (send) {
    const link = await cloudLink(decodeURIComponent(send[1]));
    if (link) {
      const b = JSON.parse(String(init.body ?? "{}")) as { number?: string; text?: string };
      const r = await cloudSendText(link, String(b.number ?? ""), String(b.text ?? ""));
      return { ok: r.ok, status: r.ok ? 201 : 400, data: r.ok ? { key: { id: r.id } } : { error: r.error } };
    }
  }
  const { key, ...rest } = init;
  const res = await fetch(`${evolution.url}${path}`, {
    ...rest,
    headers: { "content-type": "application/json", apikey: key ?? evolution.key!, ...(rest.headers ?? {}) },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

/** The signed-in Supabase user behind a request's bearer token, or null. */
export async function userFromRequest(request: Request): Promise<{ id: string; email?: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !secret || !token) return null;
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.getUser(token);
  return error || !data.user ? null : { id: data.user.id, email: data.user.email ?? undefined };
}

export type Ownership = "none" | "mine" | "other";

/** Does this instance exist, and does it belong to this user? */
export async function ownership(userId: string, instance: string): Promise<Ownership> {
  const cloud = await cloudLink(instance);
  if (cloud) return cloud.ownerId === userId ? "mine" : "other";
  const all = await evo(`/instance/fetchInstances?instanceName=${encodeURIComponent(instance)}`);
  const list = Array.isArray(all.data) ? all.data : [];
  if (!all.ok || list.length === 0) return "none";
  const mine = await evo(`/instance/fetchInstances?instanceName=${encodeURIComponent(instance)}`, { key: instanceToken(userId, instance) });
  return mine.ok && Array.isArray(mine.data) && mine.data.length > 0 ? "mine" : "other";
}

export async function connectionState(instance: string): Promise<string> {
  if (await cloudLink(instance)) return "open";
  const r = await evo(`/instance/connectionState/${encodeURIComponent(instance)}`);
  return (r.data as { instance?: { state?: string } } | null)?.instance?.state ?? "unknown";
}
