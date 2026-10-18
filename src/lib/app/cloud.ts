"use client";

import { createClient, type SupabaseClient, type User as AuthUser } from "@supabase/supabase-js";
import type { Workspace } from "./types";

/**
 * Supabase: real accounts and a workspace that follows the owner to any device.
 * Switched on by NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 * without them the app keeps everything on this device (preview mode).
 * Schema and access rules: supabase/migrations/0001_init.sql.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const cloudEnabled = Boolean(url && key);

let client: SupabaseClient | null = null;

function sb(): SupabaseClient {
  client ??= createClient(url!, key!, { auth: { storageKey: "ibax-auth", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return client;
}

export type CloudAccount = {
  id: string;
  email: string;
  name: string;
  phone: string;
  country: string;
  createdAt: string;
  /** null until the owner's workspace has been saved for the first time. */
  workspace: Workspace | null;
};

export type CloudResult<T> = { ok: true; value: T } | { ok: false; error: string };

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with this email already exists. Log in instead.";
  if (m.includes("invalid login credentials")) return "That email and password don't match an account.";
  if (m.includes("email not confirmed")) return "Please confirm your email first: open the link we sent you, then log in.";
  if (m.includes("email rate limit")) return "We couldn't send the confirmation email right now. Please try again in an hour.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a few minutes and try again.";
  if (m.includes("password")) return message;
  return "Something went wrong. Please try again.";
}

async function loadAccount(user: AuthUser): Promise<CloudAccount> {
  const db = sb();
  const [{ data: profile }, { data: row }] = await Promise.all([
    db.from("profiles").select("name, phone, country").eq("id", user.id).maybeSingle(),
    db.from("workspaces").select("data").eq("owner_id", user.id).maybeSingle(),
  ]);
  const meta = user.user_metadata ?? {};
  const data = row?.data as Partial<Workspace> | undefined;
  return {
    id: user.id,
    email: (user.email ?? "").toLowerCase(),
    name: profile?.name || meta.name || "",
    phone: profile?.phone || meta.phone || "",
    country: profile?.country || meta.country || "",
    createdAt: user.created_at,
    workspace: data && data.id ? (data as Workspace) : null,
  };
}

export async function cloudSignUp(input: {
  email: string;
  password: string;
  name: string;
  phone: string;
  country: string;
}): Promise<CloudResult<CloudAccount | "confirm-email">> {
  // The server creates the account straight away (no confirmation email to wait for).
  const res = await fetch("/api/account/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  }).catch(() => null);
  if (res && res.status !== 503) {
    const out = (await res.json().catch(() => ({}))) as { ok?: boolean; reason?: string; message?: string };
    if (out.reason === "exists") return { ok: false, error: friendly("already registered") };
    if (!out.ok) return { ok: false, error: out.message ?? friendly("") };
    return cloudSignIn(input.email, input.password);
  }
  // Server not configured: let Supabase handle sign-up (sends a confirmation email when enabled).
  const { data, error } = await sb().auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { name: input.name, phone: input.phone, country: input.country },
      emailRedirectTo: `${window.location.origin}/app/login`,
    },
  });
  if (error) return { ok: false, error: friendly(error.message) };
  // With "Confirm email" on, Supabase returns the user without a session.
  if (!data.session || !data.user) return { ok: true, value: "confirm-email" };
  return { ok: true, value: await loadAccount(data.user) };
}

export async function cloudSignIn(email: string, password: string): Promise<CloudResult<CloudAccount>> {
  const { data, error } = await sb().auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, error: friendly(error?.message ?? "") };
  return { ok: true, value: await loadAccount(data.user) };
}

/** The account signed in on this browser, if any (also completes an email-confirmation link). */
export async function cloudCurrent(): Promise<CloudAccount | null> {
  const { data } = await sb().auth.getSession();
  const user = data.session?.user;
  return user ? loadAccount(user) : null;
}

export async function cloudSaveWorkspace(ownerId: string, workspace: Workspace): Promise<boolean> {
  const { error } = await sb().from("workspaces").upsert({ owner_id: ownerId, data: workspace }, { onConflict: "owner_id" });
  return !error;
}

/** `Authorization: Bearer …` for our own API routes, when signed in with Supabase. */
export async function cloudAuthHeader(): Promise<Record<string, string>> {
  if (!cloudEnabled) return {};
  const { data } = await sb().auth.getSession();
  const token = data.session?.access_token;
  return token ? { authorization: `Bearer ${token}` } : {};
}

/* ── Websites built in the app (sites table) ── */

export async function cloudPublishSite(data: { slug: string } & Record<string, unknown>): Promise<CloudResult<null>> {
  const { data: session } = await sb().auth.getSession();
  const ownerId = session.session?.user.id;
  if (!ownerId) return { ok: false, error: "Please log in again." };
  const { error } = await sb().from("sites").upsert({ slug: data.slug, owner_id: ownerId, data }, { onConflict: "owner_id" });
  if (!error) return { ok: true, value: null };
  if (error.code === "23505") return { ok: false, error: "That address is taken. Try another one." };
  if (error.code === "42P01" || /relation .* does not exist|schema cache/i.test(error.message)) return { ok: false, error: "Publishing isn't switched on yet. Please contact ibaxai support." };
  return { ok: false, error: "Couldn't publish. Please try again." };
}

export async function cloudUnpublishSite(): Promise<boolean> {
  const { data: session } = await sb().auth.getSession();
  const ownerId = session.session?.user.id;
  if (!ownerId) return false;
  const { error } = await sb().from("sites").delete().eq("owner_id", ownerId);
  return !error;
}

export type SiteLeadRow = { id: string; slug: string; name: string; phone: string; message: string; created_at: string };

/** Enquiries from the owner's published website (newest first). */
export async function cloudSiteLeads(): Promise<SiteLeadRow[]> {
  const { data, error } = await sb().from("site_leads").select("id, slug, name, phone, message, created_at").order("created_at", { ascending: false }).limit(200);
  return error || !data ? [] : (data as SiteLeadRow[]);
}

/* ── WhatsApp chats (wa_messages / wa_contacts, written by the server; row-level security shows owners only their own) ── */

export type WaMessageRow = { id: string; instance: string; phone: string; name: string; direction: "in" | "out" | "owner"; text: string; needs_human: boolean; delivery: string; created_at: string };
export type WaContactRow = { instance: string; phone: string; name: string; lead_temp: "hot" | "warm" | "cold"; interest: string; bot_status: "on" | "paused"; needs_attention: boolean; last_at: string };

export async function cloudWaChats(): Promise<{ messages: WaMessageRow[]; contacts: WaContactRow[] }> {
  if (!cloudEnabled) return { messages: [], contacts: [] };
  const [m, c] = await Promise.all([
    sb().from("wa_messages").select("id, instance, phone, name, direction, text, needs_human, delivery, created_at").order("created_at", { ascending: false }).limit(1000),
    sb().from("wa_contacts").select("instance, phone, name, lead_temp, interest, bot_status, needs_attention, last_at").order("last_at", { ascending: false }).limit(300),
  ]);
  return { messages: m.error || !m.data ? [] : (m.data as WaMessageRow[]).reverse(), contacts: c.error || !c.data ? [] : (c.data as WaContactRow[]) };
}

async function waCall(path: "owner-reply" | "bot", body: Record<string, unknown>): Promise<{ ok: boolean; reason?: string }> {
  const res = await fetch(`/api/whatsapp/${path}`, { method: "POST", headers: { "content-type": "application/json", ...(await cloudAuthHeader()) }, body: JSON.stringify(body) }).catch(() => null);
  if (!res) return { ok: false, reason: "network" };
  return (await res.json().catch(() => ({ ok: false, reason: "server_error" }))) as { ok: boolean; reason?: string };
}
export const cloudWaOwnerReply = (instance: string, phone: string, text: string) => waCall("owner-reply", { instance, phone, text });
export const cloudWaBot = (instance: string, phone: string, on: boolean) => waCall("bot", { instance, phone, on });

/* ── Paid plans (subscriptions table, written by the server after each payment, Autopay included) ── */

export type PaidPlanRow = { service_id: string; period: string; renews_at: string | null };

export async function cloudPaidPlans(): Promise<PaidPlanRow[]> {
  if (!cloudEnabled) return [];
  const { data, error } = await sb().from("subscriptions").select("service_id, period, renews_at").eq("status", "active").neq("period", "one-time");
  return error || !data ? [] : (data as PaidPlanRow[]);
}

/* ── Lead Follow-up (followups table, written by the server) ── */

export type FollowupRow = { lead_ref: string; phone: string; state: "waiting" | "replied" | "done" | "stopped" | "failed"; steps_sent: number; replied_at: string | null };

export async function cloudFollowups(): Promise<FollowupRow[]> {
  const { data, error } = await sb().from("followups").select("lead_ref, phone, state, steps_sent, replied_at").order("created_at", { ascending: false }).limit(500);
  return error || !data ? [] : (data as FollowupRow[]);
}

/** Starts (enroll) or stops follow-up messages for one lead. */
export async function cloudFollowupAction(action: "enroll" | "stop", lead: { phone: string; name?: string; interest?: string; source?: string; leadRef?: string }) {
  await fetch("/api/followup", {
    method: "POST",
    headers: { "content-type": "application/json", ...(await cloudAuthHeader()) },
    body: JSON.stringify({ action, ...lead }),
  }).catch(() => null);
}

export type OAuthProvider = "google" | "apple";

/** Sends the visitor to Google / Apple; they come back to /app/login signed in. */
export async function cloudOAuth(provider: OAuthProvider): Promise<CloudResult<null>> {
  const settings = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key! } })
    .then((r) => r.json() as Promise<{ external?: Record<string, boolean> }>)
    .catch(() => null);
  if (settings && !settings.external?.[provider]) {
    const name = provider === "google" ? "Google" : "Apple";
    return { ok: false, error: `${name} sign-in isn't switched on yet. Please use your email for now.` };
  }
  const { error } = await sb().auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/app/login` } });
  if (error) return { ok: false, error: friendly(error.message) };
  return { ok: true, value: null };
}

export async function cloudSignOut() {
  await sb().auth.signOut();
}

export async function cloudChangePassword(email: string, current: string, next: string): Promise<CloudResult<null>> {
  // Signing in again checks the current password and gives the fresh session Supabase asks for.
  const check = await sb().auth.signInWithPassword({ email, password: current });
  if (check.error) return { ok: false, error: "Current password is wrong." };
  const { error } = await sb().auth.updateUser({ password: next, current_password: current });
  if (error) return { ok: false, error: friendly(error.message) };
  return { ok: true, value: null };
}

/** On the reset page: true once the email link has signed the owner in to choose a new password. */
export async function cloudRecoveryReady(): Promise<boolean> {
  if (!cloudEnabled) return false;
  const db = sb();
  const { data } = await db.auth.getSession();
  if (data.session) return true;
  // The link's tokens are read from the address a moment after the page loads.
  return new Promise((resolve) => {
    const { data: sub } = db.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) (sub.subscription.unsubscribe(), resolve(true));
    });
    setTimeout(() => (sub.subscription.unsubscribe(), resolve(false)), 4000);
  });
}

export async function cloudSetNewPassword(next: string): Promise<CloudResult<null>> {
  const { error } = await sb().auth.updateUser({ password: next });
  if (error) return { ok: false, error: /different from the old/i.test(error.message) ? "Choose a password different from your old one." : friendly(error.message) };
  return { ok: true, value: null };
}

/** Deletes the account and everything stored for it (rows cascade from auth.users). */
export async function cloudDeleteAccount(): Promise<boolean> {
  const { data } = await sb().auth.getSession();
  const token = data.session?.access_token;
  if (!token) return false;
  const res = await fetch("/api/account/delete", { method: "POST", headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) return false;
  await sb().auth.signOut();
  return true;
}
