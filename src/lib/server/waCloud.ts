import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { siteConfig } from "@/config/site";

/**
 * WhatsApp through Meta's official Cloud API, for numbers linked with Embedded Signup (the client
 * types their number and confirms it with an OTP from Meta). Vercel env:
 *  - NEXT_PUBLIC_META_APP_ID, NEXT_PUBLIC_META_WA_CONFIG_ID: the Meta app and its Embedded Signup configuration
 *  - META_APP_SECRET: the app secret (exchanges the signup code, checks webhook signatures, encrypts tokens)
 *  - META_WEBHOOK_VERIFY_TOKEN: any long random text, the same one typed in Meta → WhatsApp → Configuration
 *
 * A Cloud number keeps the same `ibax-<digits>` instance name as an Evolution link. Incoming messages
 * are handed to the same n8n AI Replies webhook in Evolution's format, with `server_url` pointing at
 * /api/whatsapp/cloud/evo, so n8n's "send" calls come back here and go out through Meta.
 */

export const GRAPH = "https://graph.facebook.com/v25.0";

export const meta = {
  appId: process.env.NEXT_PUBLIC_META_APP_ID,
  configId: process.env.NEXT_PUBLIC_META_WA_CONFIG_ID,
  secret: process.env.META_APP_SECRET,
  verifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN,
};

export const cloudReady = () => Boolean(meta.appId && meta.secret);

/** Where n8n sends replies for Cloud numbers (it appends /message/sendText/<instance>). */
export const evoBase = () => `${siteConfig.url.replace(/\/$/, "")}/api/whatsapp/cloud/evo`;

function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  return url && secret ? createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

/* ── Tokens are stored encrypted (AES-256-GCM, key derived from the app secret) ── */
const key = () => createHash("sha256").update(`ibax-wa-cloud:${meta.secret}`).digest();

export function seal(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), body].map((b) => b.toString("base64url")).join(".");
}

export function unseal(sealed: string): string | null {
  try {
    const [iv, tag, body] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
    const d = createDecipheriv("aes-256-gcm", key(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(body), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** The "apikey" n8n sends back with each reply for a Cloud number; only this server can make it. */
export const evoKeyFor = (instance: string) => createHmac("sha256", `${meta.secret}`).update(`evo:${instance}`).digest("hex");

export function evoKeyOk(instance: string, given: string | null) {
  if (!meta.secret || !given) return false;
  const a = Buffer.from(evoKeyFor(instance));
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Meta signs each webhook with the app secret (X-Hub-Signature-256: sha256=<hex>). */
export function signatureOk(raw: string, header: string | null) {
  if (!meta.secret || !header?.startsWith("sha256=")) return false;
  const a = Buffer.from(createHmac("sha256", meta.secret).update(raw).digest("hex"));
  const b = Buffer.from(header.slice(7));
  return a.length === b.length && timingSafeEqual(a, b);
}

export type CloudLink = { instance: string; ownerId: string; wabaId: string; phoneNumberId: string; display: string; name: string; coexistence: boolean; token: string };

type Row = { instance: string; owner_id: string; waba_id: string; phone_number_id: string; display_phone: string; verified_name: string; coexistence: boolean; token_enc: string };

function toLink(r: Row | null): CloudLink | null {
  const token = r ? unseal(r.token_enc) : null;
  return r && token
    ? { instance: r.instance, ownerId: r.owner_id, wabaId: r.waba_id, phoneNumberId: r.phone_number_id, display: r.display_phone, name: r.verified_name, coexistence: r.coexistence, token }
    : null;
}

const cols = "instance, owner_id, waba_id, phone_number_id, display_phone, verified_name, coexistence, token_enc";

// Looked up on every send; a short cache keeps that cheap. Misses are cached too (most numbers are Evolution links).
const cache = new Map<string, { at: number; link: CloudLink | null }>();
const CACHE_MS = 60_000;

export async function cloudLink(instance: string): Promise<CloudLink | null> {
  if (!cloudReady()) return null;
  const hit = cache.get(instance);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.link;
  const d = db();
  if (!d) return null;
  const { data } = await d.from("wa_cloud").select(cols).eq("instance", instance).maybeSingle();
  const link = toLink((data as Row | null) ?? null);
  cache.set(instance, { at: Date.now(), link });
  return link;
}

export async function cloudLinkByPhoneId(phoneNumberId: string): Promise<CloudLink | null> {
  const d = db();
  if (!d || !cloudReady()) return null;
  const { data } = await d.from("wa_cloud").select(cols).eq("phone_number_id", phoneNumberId).maybeSingle();
  return toLink((data as Row | null) ?? null);
}

export async function cloudLinksOf(ownerId: string): Promise<CloudLink[]> {
  const d = db();
  if (!d || !cloudReady()) return [];
  const { data } = await d.from("wa_cloud").select(cols).eq("owner_id", ownerId);
  return ((data as Row[] | null) ?? []).map(toLink).filter((l): l is CloudLink => l !== null);
}

export async function graph(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`${GRAPH}${path}`, {
    ...init,
    headers: { "content-type": "application/json", authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  }).catch(() => null);
  const data = res ? await res.json().catch(() => null) : null;
  return { ok: Boolean(res?.ok), status: res?.status ?? 0, data: data as Record<string, unknown> | null };
}

/** Sends a text message from a Cloud number. Meta only allows free text within 24 hours of the customer's last message. */
export async function cloudSendText(link: CloudLink, to: string, text: string) {
  const r = await graph(`/${link.phoneNumberId}/messages`, link.token, {
    method: "POST",
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: to.replace(/\D/g, ""), type: "text", text: { body: text.slice(0, 4096), preview_url: true } }),
  });
  const id = (r.data?.messages as { id?: string }[] | undefined)?.[0]?.id ?? null;
  if (!r.ok) console.error("[wa-cloud] send failed", r.status, JSON.stringify(r.data?.error ?? {}).slice(0, 300));
  return { ok: r.ok && Boolean(id), id, error: (r.data?.error as { message?: string; code?: number } | undefined) ?? null };
}

/**
 * Finishes Embedded Signup: swaps the one-time code for the business's access token, subscribes
 * our app to the account's webhooks, registers the number for the Cloud API (not needed when the
 * client keeps the WhatsApp Business app) and saves the link.
 */
export async function finishSignup(ownerId: string, input: { code: string; wabaId: string; phoneNumberId: string; coexistence: boolean }) {
  const d = db();
  if (!d || !cloudReady()) return { ok: false as const, reason: "not_configured" };

  const ex = await fetch(`${GRAPH}/oauth/access_token?${new URLSearchParams({ client_id: meta.appId!, client_secret: meta.secret!, code: input.code })}`, {
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  }).catch(() => null);
  const tokenData = ex ? ((await ex.json().catch(() => null)) as { access_token?: string } | null) : null;
  const token = tokenData?.access_token;
  if (!token) {
    console.error("[wa-cloud] code exchange failed", ex?.status);
    return { ok: false as const, reason: "exchange_failed" };
  }

  const phone = await graph(`/${input.phoneNumberId}?fields=display_phone_number,verified_name`, token);
  const digits = String(phone.data?.display_phone_number ?? "").replace(/\D/g, "");
  if (!phone.ok || digits.length < 8 || digits.length > 15) return { ok: false as const, reason: "number_not_found" };
  const instance = `ibax-${digits}`;

  const { data: taken } = await d.from("wa_instances").select("owner_id").eq("instance", instance).maybeSingle();
  if (taken && taken.owner_id !== ownerId) return { ok: false as const, reason: "taken" };

  const sub = await graph(`/${input.wabaId}/subscribed_apps`, token, { method: "POST" });
  if (!sub.ok) console.error("[wa-cloud] subscribe failed", sub.status, JSON.stringify(sub.data?.error ?? {}).slice(0, 300));

  let pin = "";
  if (!input.coexistence) {
    pin = String(randomInt(100000, 1000000));
    const reg = await graph(`/${input.phoneNumberId}/register`, token, { method: "POST", body: JSON.stringify({ messaging_product: "whatsapp", pin }) });
    if (!reg.ok) {
      console.error("[wa-cloud] register failed", reg.status, JSON.stringify(reg.data?.error ?? {}).slice(0, 300));
      return { ok: false as const, reason: "register_failed" };
    }
  }

  const now = new Date().toISOString();
  const { error } = await d.from("wa_cloud").upsert(
    {
      instance,
      owner_id: ownerId,
      waba_id: input.wabaId,
      phone_number_id: input.phoneNumberId,
      display_phone: String(phone.data?.display_phone_number ?? ""),
      verified_name: String(phone.data?.verified_name ?? ""),
      coexistence: input.coexistence,
      token_enc: seal(token),
      pin_enc: pin ? seal(pin) : "",
      updated_at: now,
    },
    { onConflict: "instance" },
  );
  if (error) {
    console.error("[wa-cloud] save failed", error.message);
    return { ok: false as const, reason: "server_error" };
  }
  await d.from("wa_instances").upsert({ instance, owner_id: ownerId }, { onConflict: "instance" });
  cache.delete(instance);
  return { ok: true as const, instance, number: `+${digits}`, name: String(phone.data?.verified_name ?? "") };
}

/** Unlinks a Cloud number: our app stops getting its messages, and the saved token is deleted. */
export async function unlinkCloud(link: CloudLink) {
  await graph(`/${link.wabaId}/subscribed_apps`, link.token, { method: "DELETE" });
  await db()?.from("wa_cloud").delete().eq("instance", link.instance);
  cache.delete(link.instance);
}
