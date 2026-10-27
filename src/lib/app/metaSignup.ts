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

/** The Meta app and Embedded Signup configuration are set up in this build. */
export const officialWhatsAppAvailable = () => Boolean(APP_ID && CONFIG_ID);

/**
 * Whether to show "Get OTP & connect" to this account. The server decides: everyone once Meta
 * has approved the app (NEXT_PUBLIC_META_WA_LIVE=1), before that only the accounts listed in
 * META_WA_TEST_EMAILS (the owner), on any device, with nothing to open or remember.
 */
export async function officialAccess(): Promise<boolean> {
  if (!officialWhatsAppAvailable()) return false;
  if (LIVE) return true;
  const res = await fetch("/api/whatsapp/cloud", {
    method: "POST",
    headers: { "content-type": "application/json", ...(await cloudAuthHeader()) },
    body: JSON.stringify({ action: "access" }),
  }).catch(() => null);
  const d = (await res?.json().catch(() => null)) as { allowed?: boolean } | null;
  return d?.allowed === true;
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
  | { ok: false; reason: "cancelled" | "sdk" | "not_configured" | "taken" | "already_linked" | "not_live" | "exchange_failed" | "number_not_found" | "register_failed" | "server_error"; message?: string };

/** Loads Meta's SDK ahead of the click, so the popup opens straight away (browsers block popups that wait on a download). */
export function preloadMetaSdk() {
  if (officialWhatsAppAvailable()) void loadSdk().catch(() => undefined);
}

/** Opens Meta's signup popup. `keepApp`: the client keeps using the WhatsApp Business app on this number. */
export async function connectOfficialWhatsApp(keepApp: boolean, number = ""): Promise<SignupResult> {
  // "+91 98765 43210" → Meta's prefill shape, so the client sees their number already filled in.
  const m = /^\+(\d{1,4})\s*(.+)$/.exec(number.trim());
  const phone = m ? { code: Number(m[1]), number: m[2].replace(/\D/g, "") } : undefined;
  if (!officialWhatsAppAvailable()) return { ok: false, reason: "not_configured" };
  let fb: FB;
  try {
    fb = await loadSdk();
  } catch {
    return { ok: false, reason: "sdk" };
  }

  // The popup posts the chosen account and number to this window when the client finishes.
  let ids: { waba_id?: string; phone_number_id?: string } = {};
  let metaError = "";
  const onMessage = (e: MessageEvent) => {
    let host = "";
    try {
      host = new URL(e.origin).hostname;
    } catch {
      return; // a message from a sandboxed frame ("null" origin)
    }
    if (!/(^|\.)facebook\.com$/.test(host)) return;
    try {
      const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      if (d?.type !== "WA_EMBEDDED_SIGNUP") return;
      if (String(d.event ?? "").startsWith("FINISH")) ids = d.data ?? {};
      else if (d.event === "CANCEL" || d.event === "ERROR") metaError = String(d.data?.error_message ?? "").slice(0, 200);
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
      extras: { setup: phone ? { business: { phone } } : {}, featureType: keepApp ? "whatsapp_business_app_onboarding" : "", sessionInfoVersion: "3" },
    }),
  );
  // The ids message can arrive just after the login callback.
  for (let i = 0; i < 20 && code && !ids.waba_id; i++) await new Promise((r) => setTimeout(r, 150));
  window.removeEventListener("message", onMessage);
  if (!code || !ids.waba_id) return { ok: false, reason: "cancelled", message: metaError || undefined };

  const res = await fetch("/api/whatsapp/cloud", {
    method: "POST",
    headers: { "content-type": "application/json", ...(await cloudAuthHeader()) },
    body: JSON.stringify({ action: "finish", code, waba_id: ids.waba_id, phone_number_id: ids.phone_number_id, coexistence: keepApp }),
  }).catch(() => null);
  const data = (await res?.json().catch(() => null)) as SignupResult | null;
  if (res?.status === 401) return { ok: false, reason: "server_error", message: "Your session ended. Please log in again, then try once more." };
  return data ?? { ok: false, reason: "server_error" };
}

export const signupErrors: Record<string, string> = {
  cancelled: "The Meta window was closed before the number was confirmed. Please try again.",
  sdk: "Couldn't open Meta's window. Check your internet, allow pop-ups for ibaxai.com, then try again.",
  taken: "This WhatsApp number is already linked to another ibaxai account.",
  already_linked: "This number is already linked with a link code and keeps working. To move it to the official WhatsApp, disconnect it first.",
  not_live: "Official WhatsApp linking isn't open for your account yet. Use the link code for now.",
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
