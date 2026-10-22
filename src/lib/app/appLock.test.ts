import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LOGOUT_AFTER, PAUSE_AFTER, checkPin, forgetUnlocked, getLock, isUnlocked, markAway, removeBiometric, removePin, setPin, updateLock, weakPin } from "./appLock";

/* A browser's two storages, in memory. */
const storage = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.UTC(2030, 0, 1));
  vi.stubGlobal("localStorage", storage());
  vi.stubGlobal("sessionStorage", storage());
  vi.stubGlobal("window", { dispatchEvent: () => true });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("app lock PIN", () => {
  it("keeps only a hash of the PIN and opens with the right one", async () => {
    await setPin("u1", "482915");
    expect(JSON.stringify(getLock("u1"))).not.toContain("482915");
    expect((await checkPin("u1", "482915")).ok).toBe(true);
    expect((await checkPin("u1", "000000")).ok).toBe(false);
  });

  it("pauses after 5 wrong PINs and logs out after 10", async () => {
    await setPin("u1", "482915");
    let r = await checkPin("u1", "111111");
    for (let i = 2; i < PAUSE_AFTER; i++) r = await checkPin("u1", "111111");
    expect(r).toMatchObject({ ok: false, blockedFor: 0 });
    r = await checkPin("u1", "111111"); // 5th
    expect(r).toMatchObject({ ok: false, blockedFor: 30_000, logout: false });
    // While paused, even the right PIN waits.
    expect((await checkPin("u1", "482915")).ok).toBe(false);
    for (let i = PAUSE_AFTER + 1; i <= LOGOUT_AFTER; i++) {
      vi.advanceTimersByTime(10 * 60_000);
      r = await checkPin("u1", "111111");
    }
    expect(r).toMatchObject({ ok: false, logout: true });
  });

  it("starts counting again after the right PIN", async () => {
    await setPin("u1", "482915");
    for (let i = 0; i < 4; i++) await checkPin("u1", "111111");
    expect((await checkPin("u1", "482915")).ok).toBe(true);
    expect(getLock("u1")?.fails).toBe(0);
  });

  it("refuses PINs that are too easy to guess", () => {
    for (const p of ["111111", "123456", "654321", "000000"]) expect(weakPin(p)).toBe(true);
    for (const p of ["482915", "120456", "135790"]) expect(weakPin(p)).toBe(false);
  });
});

describe("when the app asks", () => {
  it("asks on a fresh start of the app, not right after unlocking", async () => {
    await setPin("u1", "482915", 60);
    const lock = getLock("u1")!;
    expect(isUnlocked("u1", lock)).toBe(true);
    forgetUnlocked(); // the app was closed and opened again
    expect(isUnlocked("u1", lock)).toBe(false);
  });

  it("asks again after the app was in the background longer than chosen", async () => {
    await setPin("u1", "482915", 60);
    const lock = getLock("u1")!;
    markAway();
    vi.advanceTimersByTime(30_000);
    expect(isUnlocked("u1", lock)).toBe(true);
    vi.advanceTimersByTime(31_000);
    expect(isUnlocked("u1", lock)).toBe(false);
  });

  it("never opens another account's unlocked session", async () => {
    await setPin("u1", "482915");
    await setPin("u2", "739104");
    // u2 was unlocked last on this phone: u1 must enter its own PIN.
    expect(isUnlocked("u1", getLock("u1")!)).toBe(false);
  });
});

describe("PIN, Face ID and fingerprint on their own", () => {
  it("keeps the lock when the PIN goes but Face ID stays", async () => {
    await setPin("u1", "482915");
    updateLock("u1", { credentialId: "abc", bioKind: "face" });
    removePin("u1");
    const lock = getLock("u1");
    expect(lock?.hash).toBeUndefined();
    expect(lock?.credentialId).toBe("abc");
    // With no PIN, no PIN opens it.
    expect((await checkPin("u1", "482915")).ok).toBe(false);
    removeBiometric("u1");
    expect(getLock("u1")).toBeNull();
  });

  it("keeps the PIN when fingerprint is turned off, and keeps the fingerprint when the PIN changes", async () => {
    await setPin("u1", "482915");
    updateLock("u1", { credentialId: "abc", bioKind: "fingerprint" });
    await setPin("u1", "593104");
    expect(getLock("u1")).toMatchObject({ credentialId: "abc", bioKind: "fingerprint" });
    removeBiometric("u1");
    expect(getLock("u1")?.credentialId).toBeUndefined();
    expect((await checkPin("u1", "593104")).ok).toBe(true);
  });
});
