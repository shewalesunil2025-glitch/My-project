"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Delete, Fingerprint, LockKeyhole } from "lucide-react";
import { logOut } from "@/lib/app/store";
import {
  LOCK_EVENT,
  PIN_LENGTH,
  checkPin,
  forgetUnlocked,
  getLock,
  isUnlocked,
  markAway,
  removeLock,
  unlockWithBiometric,
} from "@/lib/app/appLock";
import { BrandMark } from "./ui";
import { cn } from "@/lib/cn";

/** Watches the app going to the background and coming back, and lock changes. */
function subscribe(onChange: () => void) {
  const onVisibility = () => {
    if (document.visibilityState === "hidden") markAway();
    onChange();
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener(LOCK_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener(LOCK_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * The account opens only after the client's PIN, fingerprint or Face ID — when they turned the
 * app lock on in Settings. Nothing of the workspace is shown until then.
 */
export function AppLockGate({ userId, name, children }: { userId: string; name: string; children: ReactNode }) {
  const state = useSyncExternalStore(
    subscribe,
    () => {
      const lock = getLock(userId);
      return !lock || isUnlocked(userId, lock) ? "open" : "locked";
    },
    () => "open",
  );
  if (state === "open") return children;
  return <LockScreen userId={userId} name={name} />;
}

function LockScreen({ userId, name }: { userId: string; name: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const hasBio = Boolean(getLock(userId)?.credentialId);

  const bio = useCallback(async () => {
    setError("");
    if (!(await unlockWithBiometric(userId))) setError("Fingerprint / Face ID didn't match. Use your PIN.");
  }, [userId]);

  const forgot = useCallback(() => {
    // The PIN can't be recovered: log in again with the password, then set a new one.
    removeLock(userId);
    forgetUnlocked();
    logOut();
    router.replace("/app/login");
  }, [router, userId]);

  const submit = useCallback(
    async (value: string) => {
      setBusy(true);
      const r = await checkPin(userId, value);
      setBusy(false);
      if (r.ok) return;
      setPin("");
      setShake(true);
      setTimeout(() => setShake(false), 450);
      if (r.logout) return forgot();
      setError(
        r.blockedFor
          ? `Too many wrong PINs. Try again in ${Math.ceil(r.blockedFor / 1000)} seconds.`
          : `Wrong PIN. ${r.left} ${r.left === 1 ? "try" : "tries"} left before you need to log in again.`,
      );
    },
    [userId, forgot],
  );

  const press = useCallback(
    (d: string) => {
      if (busy) return;
      setError("");
      setPin((p) => {
        const next = (p + d).slice(0, PIN_LENGTH);
        if (next.length === PIN_LENGTH) void submit(next);
        return next;
      });
    },
    [busy, submit],
  );

  // Ask for the fingerprint / face straight away (Android allows it; on iPhone the button does it).
  useEffect(() => {
    if (hasBio) void unlockWithBiometric(userId);
  }, [hasBio, userId]);

  // A keyboard works too (tablet, desktop).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const key = "grid size-[4.25rem] place-items-center rounded-full text-2xl font-medium transition active:scale-95";
  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-between bg-ink-950 px-6 pt-[max(env(safe-area-inset-top),3rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]" role="dialog" aria-modal="true" aria-label="App locked">
      <div className="flex flex-col items-center text-center">
        <BrandMark className="size-14" />
        <p className="mt-5 flex items-center gap-1.5 text-sm text-fg-muted">
          <LockKeyhole className="size-4" aria-hidden /> {name ? `${name}'s account is locked` : "Your account is locked"}
        </p>
        <h1 className="mt-2 text-xl font-semibold">Enter your {PIN_LENGTH}-digit PIN</h1>
        <div className={cn("mt-6 flex gap-3.5", shake && "animate-[lock-shake_0.45s]")} aria-label={`${pin.length} of ${PIN_LENGTH} digits entered`}>
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <span key={i} className={cn("size-3.5 rounded-full border-2 border-flow/60 transition", i < pin.length && "bg-flow")} />
          ))}
        </div>
        <p role="alert" className="mt-4 min-h-10 max-w-xs text-sm text-red-300">
          {error}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-x-7 gap-y-4">
        {keys.map((d) => (
          <button key={d} type="button" onClick={() => press(d)} className={cn(key, "bg-white/[0.06] hover:bg-white/[0.1]")} aria-label={d}>
            {d}
          </button>
        ))}
        {hasBio ? (
          <button type="button" onClick={() => void bio()} className={cn(key, "text-flow hover:bg-flow/10")} aria-label="Unlock with fingerprint or Face ID">
            <Fingerprint className="size-8" aria-hidden />
          </button>
        ) : (
          <span />
        )}
        <button type="button" onClick={() => press("0")} className={cn(key, "bg-white/[0.06] hover:bg-white/[0.1]")} aria-label="0">
          0
        </button>
        <button type="button" onClick={() => setPin((p) => p.slice(0, -1))} className={cn(key, "text-fg-muted hover:bg-white/[0.06]")} aria-label="Delete last digit">
          <Delete className="size-6" aria-hidden />
        </button>
      </div>

      <button type="button" onClick={forgot} className="mt-4 py-2 text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline">
        Forgot PIN? Log in with your password
      </button>
    </div>
  );
}

