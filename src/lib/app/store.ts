"use client";

import { useSyncExternalStore } from "react";
import type { ActivityEvent, AppNotification, Database, NotificationKind, User, Workspace } from "./types";
import {
  cloudChangePassword,
  cloudCurrent,
  cloudDeleteAccount,
  cloudEnabled,
  cloudSaveWorkspace,
  cloudSignIn,
  cloudSignOut,
  cloudSignUp,
  cloudSiteLeads,
  type CloudAccount,
} from "./cloud";

/**
 * The app state lives in this browser's localStorage. Every read and write goes through
 * the signed-in user's own workspace. When Supabase is configured (see ./cloud.ts),
 * accounts are real and each change to the workspace is also saved to the database,
 * so the owner gets the same workspace on any device.
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
  startCloudSync();
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

export type AuthResult = { ok: true; confirmEmail?: boolean } | { ok: false; error: string };

export async function signUp(input: Omit<User, "id" | "createdAt" | "passwordHash"> & { password: string }): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (cloudEnabled) {
    const res = await cloudSignUp({ ...input, email });
    if (!res.ok) return res;
    if (res.value === "confirm-email") return { ok: true, confirmEmail: true };
    openCloudAccount(res.value);
    return { ok: true };
  }
  const db = structuredClone(load());
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
  const email = emailRaw.trim().toLowerCase();
  if (cloudEnabled) return cloudLogIn(email, password);
  const db = structuredClone(load());
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
  if (user.cloud) {
    const res = await cloudChangePassword(user.email, current, next);
    if (!res.ok) return res;
    updateWorkspace((ws) => {
      ws.security.lastPasswordChange = nowIso();
      audit(ws, "Password changed");
    });
    return { ok: true };
  }
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
  const user = db.users.find((u) => u.id === db.sessionUserId);
  if (user?.cloud) {
    flushCloud();
    void cloudSignOut();
  }
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
  if (db.users.find((u) => u.id === db.sessionUserId)?.cloud) scheduleCloudSave(db.sessionUserId, ws);
}

export async function deleteAccount(): Promise<boolean> {
  const id = load().sessionUserId;
  if (!id) return false;
  if (load().users.find((u) => u.id === id)?.cloud) {
    clearTimeout(pending?.timer);
    pending = null;
    if (!(await cloudDeleteAccount())) return false;
  }
  const db = structuredClone(load());
  db.users = db.users.filter((u) => u.id !== id);
  delete db.workspaces[id];
  db.sessionUserId = null;
  save(db);
  return true;
}

/* ── Supabase sync ── */

const DIRTY_KEY = "ibax-cloud-dirty";
let pending: { timer: ReturnType<typeof setTimeout>; ownerId: string; ws: Workspace } | null = null;
let syncStarted = false;

function markDirty(ownerId: string | null) {
  try {
    if (ownerId) localStorage.setItem(DIRTY_KEY, ownerId);
    else localStorage.removeItem(DIRTY_KEY);
  } catch {
    /* storage blocked */
  }
}

function isDirty(ownerId: string) {
  try {
    return localStorage.getItem(DIRTY_KEY) === ownerId;
  } catch {
    return false;
  }
}

async function pushWorkspace(ownerId: string, ws: Workspace) {
  if (await cloudSaveWorkspace(ownerId, ws)) markDirty(null);
}

function scheduleCloudSave(ownerId: string, ws: Workspace) {
  markDirty(ownerId);
  if (pending) clearTimeout(pending.timer);
  pending = { ownerId, ws, timer: setTimeout(flushCloud, 800) };
}

function flushCloud() {
  if (!pending) return;
  clearTimeout(pending.timer);
  const { ownerId, ws } = pending;
  pending = null;
  void pushWorkspace(ownerId, ws);
}

/** Puts a Supabase account on this device and signs it in here. */
function openCloudAccount(acc: CloudAccount, fallback?: Workspace) {
  const db = structuredClone(load());
  const user: User = { id: acc.id, name: acc.name, email: acc.email, phone: acc.phone, country: acc.country, passwordHash: "", createdAt: acc.createdAt, cloud: true };
  db.users = [...db.users.filter((u) => u.id !== acc.id && u.email !== acc.email), user];
  let ws = acc.workspace;
  const fresh = !ws;
  if (!ws) {
    ws = fallback ?? db.workspaces[acc.id] ?? newWorkspace(acc.id);
    ws.ownerId = acc.id;
    if (!ws.team.some((m) => m.role === "owner")) ws.team.push({ id: uid(), name: acc.name, email: acc.email, role: "owner" });
  }
  db.workspaces[acc.id] = ws;
  db.sessionUserId = acc.id;
  save(db);
  if (fresh) void pushWorkspace(acc.id, ws);
}

async function cloudLogIn(email: string, password: string): Promise<AuthResult> {
  const res = await cloudSignIn(email, password);
  if (res.ok) {
    openCloudAccount(res.value);
    updateWorkspace((ws) => audit(ws, "Signed in"));
    return { ok: true };
  }
  // An account made on this device before accounts moved to Supabase: move it across.
  const db = load();
  const legacy = db.users.find((u) => u.email === email && !u.cloud && u.passwordHash);
  if (legacy && legacy.passwordHash === (await hashPassword(email, password))) {
    const created = await cloudSignUp({ email, password, name: legacy.name, phone: legacy.phone, country: legacy.country });
    if (!created.ok) return res;
    if (created.value === "confirm-email") return { ok: true, confirmEmail: true };
    const ws = db.workspaces[legacy.id];
    const moved = structuredClone(load());
    delete moved.workspaces[legacy.id];
    moved.users = moved.users.filter((u) => u.id !== legacy.id);
    save(moved);
    openCloudAccount(created.value, ws ? structuredClone(ws) : undefined);
    return { ok: true };
  }
  return res;
}

/** Once per page load: pick up the Supabase session and the latest saved workspace. */
function startCloudSync() {
  if (syncStarted || !cloudEnabled || typeof window === "undefined") return;
  syncStarted = true;
  window.addEventListener("pagehide", flushCloud);
  void cloudCurrent()
    .then((acc) => {
      const db = load();
      const signedIn = db.users.find((u) => u.id === db.sessionUserId);
      if (!acc) {
        // Signed out or expired elsewhere: don't keep showing a cloud workspace.
        if (signedIn?.cloud) {
          const next = structuredClone(db);
          next.sessionUserId = null;
          save(next);
        }
        return;
      }
      // Leave someone exploring the sample workspace where they are.
      if (db.sessionUserId && db.sessionUserId !== acc.id) return;
      const local = db.workspaces[acc.id];
      if (local && isDirty(acc.id)) {
        openCloudAccount({ ...acc, workspace: local });
        void pushWorkspace(acc.id, local);
      } else openCloudAccount(acc);
      void syncSiteLeads();
    })
    .catch(() => {
      /* offline: keep working from this device's copy */
    });
}

/** Copies new enquiries from the owner's published website into Leads (and notifies once). */
export async function syncSiteLeads() {
  const db = load();
  if (!cloudEnabled || !db.users.find((u) => u.id === db.sessionUserId)?.cloud) return;
  const rows = await cloudSiteLeads().catch(() => []);
  const ws = currentWorkspace();
  if (!ws || !rows.length) return;
  const known = new Set(ws.leads.map((l) => l.id));
  const fresh = rows.filter((r) => !known.has(`site-${r.id}`));
  if (!fresh.length) return;
  updateWorkspace((w) => {
    for (const r of [...fresh].reverse()) {
      w.leads.unshift({
        id: `site-${r.id}`,
        name: r.name,
        phone: r.phone,
        email: "",
        source: "Website",
        interest: r.message,
        status: "new",
        returning: false,
        createdAt: r.created_at,
        notes: "",
      });
      logActivity(w, { kind: "lead", title: `New website enquiry from ${r.name}`, detail: r.message || r.phone, href: "/app/leads", at: r.created_at });
    }
    notify(w, {
      kind: "lead",
      title: fresh.length === 1 ? `New website enquiry from ${fresh[0].name}` : `${fresh.length} new website enquiries`,
      detail: fresh.length === 1 ? fresh[0].message || fresh[0].phone : "See them in Leads.",
      href: "/app/leads",
    });
  });
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
