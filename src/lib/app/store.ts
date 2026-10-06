"use client";

import { useSyncExternalStore } from "react";
import type { ActivityEvent, AppNotification, Database, NotificationKind, User, Workspace } from "./types";

/**
 * Preview-mode persistence: the whole app state lives in this browser's localStorage.
 * Every read and write goes through the signed-in user's own workspace, mirroring the
 * tenant isolation the production backend enforces (see docs/ARCHITECTURE.md).
 */

const KEY = "lumi-db-v1";
const empty: Database = { version: 1, users: [], sessionUserId: null, workspaces: {} };

let cache: Database | null = null;
const listeners = new Set<() => void>();

function load(): Database {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Database) : empty;
  } catch {
    cache = empty;
  }
  return cache;
}

function save(next: Database) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked — state still lives in memory for this tab */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** `null` during server render and before hydration. */
export function useDb(): Database | null {
  return useSyncExternalStore(subscribe, load, () => null);
}

export function useSession() {
  const db = useDb();
  if (!db) return { ready: false as const, user: null, workspace: null };
  const user = db.users.find((u) => u.id === db.sessionUserId) ?? null;
  const workspace = user ? (db.workspaces[user.id] ?? null) : null;
  return { ready: true as const, user, workspace };
}

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export const nowIso = () => new Date().toISOString();

async function hashPassword(email: string, password: string) {
  const data = new TextEncoder().encode(`lumi:${email.toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const defaultNotificationPrefs: Record<NotificationKind, boolean> = {
  lead: true,
  review: true,
  message: true,
  automation_failed: true,
  published: true,
  upcoming: true,
  payment: true,
  expiry: true,
  connection: true,
};

export function newWorkspace(ownerId: string, sample = false): Workspace {
  return {
    id: uid(),
    ownerId,
    createdAt: nowIso(),
    sample,
    business: null,
    assistant: null,
    subscriptions: [],
    invoices: [],
    automations: [],
    connections: {},
    activity: [],
    leads: [],
    conversations: [],
    calls: [],
    reviews: [],
    content: [],
    notifications: [],
    tickets: [],
    chat: [],
    metrics: [],
    website: null,
    team: [],
    security: { twoFactor: false },
    notificationPrefs: { ...defaultNotificationPrefs },
    audit: [{ at: nowIso(), action: "Workspace created" }],
  };
}

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function signUp(input: Omit<User, "id" | "createdAt" | "passwordHash"> & { password: string }): Promise<AuthResult> {
  const db = structuredClone(load());
  const email = input.email.trim().toLowerCase();
  if (db.users.some((u) => u.email === email)) return { ok: false, error: "An account with this email already exists. Log in instead." };
  const { password, ...rest } = input;
  const user: User = { ...rest, email, id: uid(), createdAt: nowIso(), passwordHash: await hashPassword(email, password) };
  db.users.push(user);
  db.workspaces[user.id] = newWorkspace(user.id);
  db.workspaces[user.id].team.push({ id: uid(), name: user.name, email, role: "owner" });
  db.sessionUserId = user.id;
  save(db);
  return { ok: true };
}

export async function logIn(emailRaw: string, password: string): Promise<AuthResult> {
  const db = structuredClone(load());
  const email = emailRaw.trim().toLowerCase();
  const user = db.users.find((u) => u.email === email);
  if (!user || user.passwordHash !== (await hashPassword(email, password))) {
    return { ok: false, error: "That email and password don't match an account on this device." };
  }
  db.sessionUserId = user.id;
  db.workspaces[user.id]?.audit.unshift({ at: nowIso(), action: "Signed in" });
  save(db);
  return { ok: true };
}

export async function changePassword(current: string, next: string): Promise<AuthResult> {
  const db = structuredClone(load());
  const user = db.users.find((u) => u.id === db.sessionUserId);
  if (!user) return { ok: false, error: "You're signed out." };
  if (user.passwordHash !== (await hashPassword(user.email, current))) return { ok: false, error: "Current password is wrong." };
  user.passwordHash = await hashPassword(user.email, next);
  const ws = db.workspaces[user.id];
  if (ws) {
    ws.security.lastPasswordChange = nowIso();
    ws.audit.unshift({ at: nowIso(), action: "Password changed" });
  }
  save(db);
  return { ok: true };
}

export function logOut() {
  const db = structuredClone(load());
  db.sessionUserId = null;
  save(db);
}

/** Creates (or reopens) the sample workspace with a prepared business and data. */
export function openSampleWorkspace(build: (ws: Workspace) => void) {
  const db = structuredClone(load());
  const email = "sample@lumi.app";
  let user = db.users.find((u) => u.email === email);
  if (!user) {
    user = { id: uid(), name: "Alex Morgan", email, phone: "+1 555 0142", country: "United States", passwordHash: "", createdAt: nowIso() };
    db.users.push(user);
  }
  const ws = newWorkspace(user.id, true);
  build(ws);
  db.workspaces[user.id] = ws;
  db.sessionUserId = user.id;
  save(db);
}

/** The signed-in user's workspace right now (for code that runs outside React). */
export function currentWorkspace(): Workspace | null {
  const db = load();
  return db.sessionUserId ? (db.workspaces[db.sessionUserId] ?? null) : null;
}

/** Apply a change to the signed-in user's workspace. */
export function updateWorkspace(mutate: (ws: Workspace) => void) {
  const db = structuredClone(load());
  if (!db.sessionUserId) return;
  const ws = db.workspaces[db.sessionUserId];
  if (!ws) return;
  mutate(ws);
  save(db);
}

export function deleteAccount() {
  const db = structuredClone(load());
  const id = db.sessionUserId;
  if (!id) return;
  db.users = db.users.filter((u) => u.id !== id);
  delete db.workspaces[id];
  db.sessionUserId = null;
  save(db);
}

/* ── Helpers used inside updateWorkspace mutators ── */

export function logActivity(ws: Workspace, e: Omit<ActivityEvent, "id" | "at"> & { at?: string }) {
  ws.activity.unshift({ id: uid(), at: e.at ?? nowIso(), ...e });
}

export function notify(ws: Workspace, n: Omit<AppNotification, "id" | "at" | "read">) {
  if (!ws.notificationPrefs[n.kind]) return;
  ws.notifications.unshift({ id: uid(), at: nowIso(), read: false, ...n });
}

export function audit(ws: Workspace, action: string) {
  ws.audit.unshift({ at: nowIso(), action });
  ws.audit = ws.audit.slice(0, 200);
}
