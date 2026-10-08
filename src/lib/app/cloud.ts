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
