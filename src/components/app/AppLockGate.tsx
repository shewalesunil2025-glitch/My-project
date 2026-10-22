"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { Delete, Eye, EyeOff, Fingerprint } from "lucide-react";
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

/** When a key was last touched (the click that follows is the same press). */
let touchedAt = -Infinity;

/**
 * Lights a key up straight away, like an iPhone's passcode screen. It's done on the element itself
 * (not through React state) so the light appears in the same frame as the touch, then fades out.
 */
function flash(el: HTMLElement | null) {
  if (!el) return;
  el.classList.remove("lock-key-lit");
  void el.offsetWidth; // restart the fade when the same key is pressed again quickly
  el.classList.add("lock-key-lit");
  clearTimeout(Number(el.dataset.timer));
  el.dataset.timer = String(window.setTimeout(() => el.classList.remove("lock-key-lit"), 160));
}

function LockScreen({ userId, name }: { userId: string; name: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
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
      navigator.vibrate?.(8); // a tiny buzz on Android
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
      if (/^\d$/.test(e.key)) {
        flash(document.querySelector<HTMLElement>(`.lock-key[data-key="${e.key}"]`));
        press(e.key);
      }
      else if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const letters: Record<string, string> = { "2": "ABC", "3": "DEF", "4": "GHI", "5": "JKL", "6": "MNO", "7": "PQRS", "8": "TUV", "9": "WXYZ" };
  // Keys react the moment the finger touches them (not when it lifts, which feels late on phones);
  // a keyboard's Enter / Space still works through the click.
  const tap = (fn: () => void) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      touchedAt = e.timeStamp;
      flash(e.currentTarget);
      fn();
    },
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      // The click that follows a touch is the same press — only a keyboard's click counts here.
      if (e.timeStamp - touchedAt > 1000) fn();
    },
  });
  const digit = (d: string) => (
    <button key={d} type="button" {...tap(() => press(d))} className="lock-key" data-key={d} aria-label={d}>
      <span className="text-[2.1rem] leading-none font-light">{d}</span>
      <span className="mt-0.5 h-3 text-[0.6rem] font-bold tracking-[0.16em] opacity-80">{letters[d] ?? ""}</span>
    </button>
  );
  return (
    <div className="lock-screen fixed inset-0 z-[300] flex flex-col items-center overflow-hidden px-6 pt-[max(env(safe-area-inset-top),3rem)] pb-[max(env(safe-area-inset-bottom),1.25rem)]" role="dialog" aria-modal="true" aria-label="App locked">
      <div aria-hidden className="lock-bg pointer-events-none absolute -inset-10" />
      <div className="relative flex flex-col items-center text-center">
        <BrandMark className="size-13" />
        <h1 className="mt-4 text-xl font-medium">Enter Passcode</h1>
        <p className="lock-sub mt-1 text-xs">{name ? `${name} · ibaxai` : "ibaxai"}</p>
        <div className="relative mt-6 flex items-center">
          <div className={cn("flex h-7 items-center gap-3.5", shake && "animate-[lock-shake_0.45s]")} aria-label={show ? `PIN so far: ${pin.split("").join(" ") || "empty"}` : `${pin.length} of ${PIN_LENGTH} digits entered`}>
            {Array.from({ length: PIN_LENGTH }, (_, i) =>
              show && i < pin.length ? (
                <span key={i} className="w-3.5 text-center text-xl font-semibold tabular-nums">
                  {pin[i]}
                </span>
              ) : (
                <span key={i} className={cn("lock-dot size-3.5 rounded-full transition", i < pin.length && "lock-dot-on", show && "scale-50")} />
              ),
            )}
          </div>
          <button type="button" onClick={() => setShow((v) => !v)} className="lock-eye absolute -right-12 grid size-9 place-items-center rounded-full" aria-label={show ? "Hide PIN" : "Show PIN"} aria-pressed={show}>
            {show ? <Eye className="size-5" aria-hidden /> : <EyeOff className="size-5" aria-hidden />}
          </button>
        </div>
        <p role="alert" className="mt-3 min-h-10 max-w-xs text-sm text-red-300">
          {error}
        </p>
      </div>

      <div className="relative mt-auto grid grid-cols-3 gap-x-6 gap-y-3.5 sm:mt-6">
        {keys.map(digit)}
        {hasBio ? (
          <button type="button" onClick={() => void bio()} className="lock-key-plain text-flow" aria-label="Unlock with fingerprint or Face ID">
            <Fingerprint className="size-8" aria-hidden />
          </button>
        ) : (
          <span />
        )}
        {digit("0")}
        <button type="button" {...tap(() => setPin((p) => p.slice(0, -1)))} className="lock-key-plain" aria-label="Delete last digit">
          <Delete className="size-6" aria-hidden />
        </button>
      </div>

      <button type="button" onClick={forgot} className="lock-sub relative mt-3 ml-auto py-2 pr-3 text-sm hover:underline">
        Forgot PIN?
      </button>
    </div>
  );
}
