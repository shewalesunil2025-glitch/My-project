"use client";

/*
 * App lock: the client's own 6-digit PIN, plus the phone's fingerprint or Face ID if they want,
 * so nobody who picks up their phone can open their ibaxai account. It lives on this device only
 * (each account on the phone has its own lock); the PIN is stored only as a salted hash, and the
 * fingerprint/Face ID check is done by the phone itself (WebAuthn) — ibaxai never sees it.
 * Forgetting the PIN means logging in again with the account password.
 */

export type AppLock = {
  /** PBKDF2-SHA-256 of the PIN, base64. */
  hash: string;
  salt: string;
  /** The phone's fingerprint / Face ID key for this app, if turned on (base64url id). */
  credentialId?: string;
  /** Lock again after the app was in the background this long (seconds; 0 = every time). */
  after: number;
  /** Wrong PINs in a row, and until when entering is blocked (ms). */
  fails: number;
  blockedUntil: number;
};

const key = (userId: string) => `ibax-lock:${userId}`;
const OPEN = "ibax-unlocked"; // sessionStorage: { userId, at } while the app is open and unlocked
export const PIN_LENGTH = 6;
/** Wrong PINs before a pause, and before the account is logged out (password needed). */
export const PAUSE_AFTER = 5;
export const LOGOUT_AFTER = 10;

export function getLock(userId: string): AppLock | null {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as AppLock) : null;
  } catch {
    return null;
  }
}

function saveLock(userId: string, lock: AppLock | null) {
  try {
    if (lock) localStorage.setItem(key(userId), JSON.stringify(lock));
    else localStorage.removeItem(key(userId));
  } catch {
    /* storage off: the lock simply isn't kept */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(LOCK_EVENT));
}

const b64 = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (bytes: ArrayBuffer) => b64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s: string) => unb64(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
const random = (n: number) => crypto.getRandomValues(new Uint8Array(n));

async function hashPin(pin: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: 150_000 }, base, 256);
  return b64(bits);
}

export const validPin = (pin: string) => new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
/** Too easy to guess: all the same digit, or a straight run like 123456 / 654321. */
export function weakPin(pin: string) {
  const d = [...pin].map(Number);
  const step = d[1] - d[0];
  return d.every((x) => x === d[0]) || ((step === 1 || step === -1) && d.every((x, i) => i === 0 || x - d[i - 1] === step));
}

/** Turns the lock on (or changes the PIN), keeping the fingerprint setting. */
export async function setPin(userId: string, pin: string, after = 60) {
  const salt = random(16);
  const old = getLock(userId);
  saveLock(userId, { hash: await hashPin(pin, salt), salt: b64(salt), credentialId: old?.credentialId, after: old?.after ?? after, fails: 0, blockedUntil: 0 });
  markUnlocked(userId);
}

export function updateLock(userId: string, change: Partial<Pick<AppLock, "after" | "credentialId">>) {
  const lock = getLock(userId);
  if (lock) saveLock(userId, { ...lock, ...change });
}

export function removeLock(userId: string) {
  saveLock(userId, null);
}

export type PinResult = { ok: true } | { ok: false; left: number; blockedFor: number; logout: boolean };

/** Checks a PIN; counts wrong ones (a pause after 5, logged out after 10). */
export async function checkPin(userId: string, pin: string): Promise<PinResult> {
  const lock = getLock(userId);
  if (!lock) return { ok: true };
  if (Date.now() < lock.blockedUntil) return { ok: false, left: LOGOUT_AFTER - lock.fails, blockedFor: lock.blockedUntil - Date.now(), logout: false };
  if ((await hashPin(pin, unb64(lock.salt))) === lock.hash) {
    saveLock(userId, { ...lock, fails: 0, blockedUntil: 0 });
    markUnlocked(userId);
    return { ok: true };
  }
  const fails = lock.fails + 1;
  // From the 5th wrong PIN on, each one is followed by a wait that doubles (30 s, 60 s, 2 min…).
  const blockedFor = fails >= PAUSE_AFTER ? 30_000 * 2 ** (fails - PAUSE_AFTER) : 0;
  saveLock(userId, { ...lock, fails, blockedUntil: Date.now() + blockedFor });
  return { ok: false, left: LOGOUT_AFTER - fails, blockedFor, logout: fails >= LOGOUT_AFTER };
}

/* ── Fingerprint / Face ID (the phone's own screen-lock check, through WebAuthn) ── */

/** True when this phone can check a fingerprint, face or its screen lock for the app. */
export async function biometricAvailable() {
  try {
    return typeof PublicKeyCredential !== "undefined" && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
  } catch {
    return false;
  }
}

/** Asks the phone to register a fingerprint / Face ID key for this account. Call from a tap. */
export async function enrollBiometric(userId: string, label: string) {
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: random(32),
      rp: { name: "ibaxai", id: location.hostname },
      user: { id: random(16), name: label, displayName: label },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "discouraged" },
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error("cancelled");
  updateLock(userId, { credentialId: b64url(cred.rawId) });
}

/** The phone checks the fingerprint / face. True when it matched. Call from a tap. */
export async function unlockWithBiometric(userId: string) {
  const lock = getLock(userId);
  if (!lock?.credentialId) return false;
  try {
    const got = await navigator.credentials.get({
      publicKey: {
        challenge: random(32),
        rpId: location.hostname,
        allowCredentials: [{ type: "public-key", id: unb64url(lock.credentialId), transports: ["internal"] }],
        userVerification: "required",
        timeout: 60_000,
      },
    });
    if (!got) return false;
    saveLock(userId, { ...lock, fails: 0, blockedUntil: 0 });
    markUnlocked(userId);
    return true;
  } catch {
    return false;
  }
}

/* ── When to ask ── */

/** Tells every lock screen on the page to look again (after unlocking, or a change in Settings). */
export const LOCK_EVENT = "ibax-lock-change";
const changed = () => window.dispatchEvent(new Event(LOCK_EVENT));

export function markUnlocked(userId: string) {
  try {
    sessionStorage.setItem(OPEN, JSON.stringify({ userId, at: Date.now() }));
  } catch {
    /* ignore */
  }
  changed();
}

type Open = { userId: string; at: number; away?: number };
const readOpen = () => {
  try {
    return JSON.parse(sessionStorage.getItem(OPEN) ?? "null") as Open | null;
  } catch {
    return null;
  }
};

/** The app went to the background (another app, screen off): the clock for "lock after" starts. */
export function markAway() {
  const open = readOpen();
  if (!open || open.away) return;
  try {
    sessionStorage.setItem(OPEN, JSON.stringify({ ...open, away: Date.now() }));
  } catch {
    /* ignore */
  }
}

/**
 * Still unlocked: this app session was unlocked for this account and wasn't away too long.
 * A fresh start of the app (new session) always asks.
 */
export function isUnlocked(userId: string, lock: AppLock) {
  const open = readOpen();
  if (open?.userId !== userId) return false;
  return !open.away || Date.now() - open.away < lock.after * 1000;
}

export function forgetUnlocked() {
  try {
    sessionStorage.removeItem(OPEN);
  } catch {
    /* ignore */
  }
}
