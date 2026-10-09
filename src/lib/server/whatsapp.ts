import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

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

/** WhatsApp number as digits with country code; 10-digit numbers are taken as Indian. */
export function waDigits(input: string): string | null {
  const d = input.replace(/\D/g, "").replace(/^0+/, "");
  const full = d.length === 10 ? `91${d}` : d;
  return /^\d{11,15}$/.test(full) ? full : null;
}

/** One Evolution instance per WhatsApp number — the same name the n8n workflows use. */
export const instanceFor = (digits: string) => `ibax-${digits}`;

/**
 * Each instance's API key is derived from its owner, so only the account that linked a
 * number can use or reconnect it, without keeping a separate ownership table.
 */
export const instanceToken = (userId: string, instance: string) =>
  createHash("sha256").update(`${evolution.key}:${userId}:${instance}`).digest("hex");

export async function evo(path: string, init: RequestInit & { key?: string } = {}) {
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
export async function userFromRequest(request: Request): Promise<{ id: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !secret || !token) return null;
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.getUser(token);
  return error || !data.user ? null : { id: data.user.id };
}

export type Ownership = "none" | "mine" | "other";

/** Does this instance exist, and does it belong to this user? */
export async function ownership(userId: string, instance: string): Promise<Ownership> {
  const all = await evo(`/instance/fetchInstances?instanceName=${encodeURIComponent(instance)}`);
  const list = Array.isArray(all.data) ? all.data : [];
  if (!all.ok || list.length === 0) return "none";
  const mine = await evo(`/instance/fetchInstances?instanceName=${encodeURIComponent(instance)}`, { key: instanceToken(userId, instance) });
  return mine.ok && Array.isArray(mine.data) && mine.data.length > 0 ? "mine" : "other";
}

export async function connectionState(instance: string): Promise<string> {
  const r = await evo(`/instance/connectionState/${encodeURIComponent(instance)}`);
  return (r.data as { instance?: { state?: string } } | null)?.instance?.state ?? "unknown";
}
