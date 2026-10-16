/** Pure WhatsApp bot rules (no I/O), so they can be unit-tested. */

export const RESUME_AFTER_MS = 24 * 3_600_000;
export const DEFAULT_DAILY_LIMIT = 30;
export const MAX_DAILY_LIMIT = 500;

export type ContactState = {
  bot_status: string | null;
  needs_attention: boolean | null;
  paused_at: string | null;
  last_in_at: string | null;
  last_owner_at: string | null;
};

const ms = (iso: string | null | undefined) => (iso ? Date.parse(iso) || 0 : 0);

/**
 * A paused customer gets the bot back after 24 h of silence — but never while the owner still
 * needs to act (needs_attention), and never right after the owner or the customer wrote.
 */
export function shouldAutoResume(c: ContactState, now: number): boolean {
  if (c.bot_status !== "paused" || c.needs_attention) return false;
  const lastActivity = Math.max(ms(c.paused_at), ms(c.last_in_at), ms(c.last_owner_at));
  return lastActivity > 0 && now - lastActivity >= RESUME_AFTER_MS;
}

/** The owner's configured cap on bot replies per customer per day (blank/invalid → default). */
export function dailyLimit(raw: unknown): number {
  const n = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_DAILY_LIMIT;
  return Math.min(Math.floor(n), MAX_DAILY_LIMIT);
}

export type Gate = { allow: boolean; reason: "ok" | "duplicate" | "paused" | "limit" | "unknown_instance" | "bad_request" };

/** Messages and ids we accept from the automation server. Anything else is rejected. */
export const cleanId = (v: unknown) => (typeof v === "string" && /^[\w.:@=-]{3,128}$/.test(v) ? v : null);
export const instanceOk = (v: unknown): v is string => typeof v === "string" && /^ibax-\d{8,15}$/.test(v);
export const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");

/** Timing-safe secret check that accepts the current secret and (during rotation) the next one. */
export function secretMatches(given: string | null, current?: string, next?: string): boolean {
  if (!given) return false;
  return [current, next].some((s) => Boolean(s) && eq(given, s as string));
}
function eq(a: string, b: string) {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
