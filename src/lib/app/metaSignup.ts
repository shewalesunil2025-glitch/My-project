"use client";

import { cloudAuthHeader } from "./cloud";

/**
 * Meta's Embedded Signup in the browser: a Meta popup where the client picks or types their
 * WhatsApp number and confirms it with an OTP. We get a one-time code plus the account and number
 * ids, and the server (/api/whatsapp/cloud) finishes the link.
 */

const APP_ID = process.env.NEXT_PUBLIC_META_APP_ID;
const CONFIG_ID = process.env.NEXT_PUBLIC_META_WA_CONFIG_ID;
const SDK_VERSION = "v25.0";

const LIVE = process.env.NEXT_PUBLIC_META_WA_LIVE === "1";

/**
 * Until Meta approves the app (App Review), only the app's own admins can finish the signup, so
 * the button stays hidden for clients. Set NEXT_PUBLIC_META_WA_LIVE=1 after approval. To test or
 * record the review video before that, open the app once with ?meta=1 (remembered on this device).
 */
export function officialWhatsAppAvailable() {
  if (!APP_ID || !CONFIG_ID || typeof window === "undefined") return false;
  if (LIVE) return true;
  try {
    if (new URLSearchParams(window.location.search).get("meta") === "1") localStorage.setItem("ibax-meta-test", "1");
    return localStorage.getItem("ibax-meta-test") === "1";
  } catch {
    return false;
  }
}

type FB = {
  init: (o: Record<string, unknown>) => void;
  login: (cb: (r: { authResponse?: { code?: string } | null; status?: string }) => void, o: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    FB?: FB;
    fbAsyncInit?: () => void;
  }
}

let sdk: Promise<FB> | null = null;

function loadSdk(): Promise<FB> {
  sdk ??= new Promise<FB>((resolve, reject) => {
    if (window.FB) return resolve(window.FB);
    window.fbAsyncInit = () => {
      window.FB!.init({ appId: APP_ID, autoLogAppEvents: true, xfbml: false, version: SDK_VERSION });
      resolve(window.FB!);
    };
    const s = document.createElement("script");
    s.src = "https://connect.facebook.net/en_US/sdk.js";
    s.async = true;
    s.defer = true;
    s.crossOrigin = "anonymous";
    s.onerror = () => {
      sdk = null;
      reject(new Error("sdk"));
    };
    document.body.appendChild(s);
  });
  return sdk;
}

export type SignupResult =
  | { ok: true; number: string; name: string }
  | { ok: false; reason: "cancelled" | "sdk" | "not_configured" | "taken" | "exchange_failed" | "number_not_found" | "register_failed" | "server_error" };

/** Opens Meta's signup popup. `keepApp`: the client keeps using the WhatsApp Business app on this number. */
export async function connectOfficialWhatsApp(keepApp: boolean): Promise<SignupResult> {
  if (!officialWhatsAppAvailable()) return { ok: false, reason: "not_configured" };
  let fb: FB;
  try {
    fb = await loadSdk();
  } catch {
    return { ok: false, reason: "sdk" };
  }

  // The popup posts the chosen account and number to this window when the client finishes.
  let ids: { waba_id?: string; phone_number_id?: string } = {};
  const onMessage = (e: MessageEvent) => {
    if (!/(^|\.)facebook\.com$/.test(new URL(e.origin).hostname)) return;
    try {
      const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      if (d?.type === "WA_EMBEDDED_SIGNUP" && String(d.event ?? "").startsWith("FINISH")) ids = d.data ?? {};
    } catch {
      /* other Facebook messages */
    }
  };
  window.addEventListener("message", onMessage);

  const code = await new Promise<string | null>((resolve) =>
    fb.login((r) => resolve(r.authResponse?.code ?? null), {
      config_id: CONFIG_ID,
      response_type: "code",
      override_default_response_type: true,
      extras: { setup: {}, featureType: keepApp ? "whatsapp_business_app_onboarding" : "", sessionInfoVersion: "3" },
    }),
  );
  // The ids message can arrive just after the login callback.
  for (let i = 0; i < 20 && code && !ids.phone_number_id; i++) await new Promise((r) => setTimeout(r, 150));
  window.removeEventListener("message", onMessage);
  if (!code || !ids.phone_number_id || !ids.waba_id) return { ok: false, reason: "cancelled" };

  const res = await fetch("/api/whatsapp/cloud", {
    method: "POST",
    headers: { "content-type": "application/json", ...(await cloudAuthHeader()) },
    body: JSON.stringify({ action: "finish", code, waba_id: ids.waba_id, phone_number_id: ids.phone_number_id, coexistence: keepApp }),
  }).catch(() => null);
  const data = (await res?.json().catch(() => null)) as SignupResult | null;
  return data ?? { ok: false, reason: "server_error" };
}

export const signupErrors: Record<string, string> = {
  cancelled: "The Meta window was closed before the number was confirmed. Please try again.",
  sdk: "Couldn't open Meta's window. Check your internet, allow pop-ups for ibaxai.com, then try again.",
  taken: "This WhatsApp number is already linked to another ibaxai account.",
  exchange_failed: "Meta didn't confirm the link. Please try again.",
  number_not_found: "Meta didn't share the WhatsApp number. Please try again and pick your number.",
  register_failed: "Meta couldn't switch this number on. If it is on the WhatsApp app, tick “I use the WhatsApp Business app” and try again.",
  server_error: "Something went wrong on our side. Please try again in a minute.",
  not_configured: "Official WhatsApp linking isn't switched on yet.",
};

/* ── Message templates (official numbers only) ── */

export type WaTemplate = { name: string; status: string; category: string; language: string; body: string };

async function templates(body: Record<string, unknown>) {
  const res = await fetch("/api/whatsapp/cloud/templates", {
    method: "POST",
    headers: { "content-type": "application/json", ...(await cloudAuthHeader()) },
    body: JSON.stringify(body),
  }).catch(() => null);
  return ((await res?.json().catch(() => null)) ?? { ok: false, reason: "server_error" }) as { ok: boolean; reason?: string; message?: string; templates?: WaTemplate[]; status?: string };
}

export const listTemplates = () => templates({ action: "list" });
export const createTemplate = (t: { name: string; text: string; category: string; language: string; examples: string[] }) => templates({ action: "create", ...t });
export const sendTemplate = (t: { name: string; language: string; to: string; params: string[] }) => templates({ action: "send", ...t });

export async function officialStatus(): Promise<{ instance: string; number: string; name: string; coexistence: boolean }[]> {
  const res = await fetch("/api/whatsapp/cloud", {
    method: "POST",
    headers: { "content-type": "application/json", ...(await cloudAuthHeader()) },
    body: JSON.stringify({ action: "status" }),
  }).catch(() => null);
  const d = (await res?.json().catch(() => null)) as { links?: { instance: string; number: string; name: string; coexistence: boolean }[] } | null;
  return d?.links ?? [];
}
