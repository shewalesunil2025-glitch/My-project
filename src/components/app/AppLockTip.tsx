"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { LockKeyhole, X } from "lucide-react";
import { LOCK_EVENT } from "@/lib/app/appLock";
import { useSession } from "@/lib/app/store";

const hiddenKey = (userId: string) => `ibax-lock-tip-hidden:${userId}`;
const subscribe = (onChange: () => void) => {
  window.addEventListener(LOCK_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(LOCK_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
};
const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};

/** Home: a short nudge to turn on the app lock, until it's on (or the client hides it). */
export function AppLockTip() {
  const userId = useSession().user?.id ?? "";
  const show = useSyncExternalStore(subscribe, () => Boolean(userId) && !read(`ibax-lock:${userId}`) && !read(hiddenKey(userId)), () => false);
  if (!show) return null;
  const hide = () => {
    try {
      localStorage.setItem(hiddenKey(userId), "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(LOCK_EVENT));
  };
  return (
    <div className="glass relative flex items-center gap-3 rounded-2xl p-4 pr-10">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-flow/12 text-flow">
        <LockKeyhole className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Keep your account safe</p>
        <p className="text-sm text-fg-muted">Lock ibaxai with a PIN, fingerprint or Face ID — takes 30 seconds.</p>
        <Link href="/app/settings#security" className="mt-1.5 inline-block text-sm font-semibold text-flow hover:underline">
          Turn on app lock →
        </Link>
      </div>
      <button type="button" onClick={hide} aria-label="Hide" className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full text-fg-subtle hover:bg-white/[0.06] hover:text-fg">
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
