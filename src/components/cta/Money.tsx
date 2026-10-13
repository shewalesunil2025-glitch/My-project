"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Currency } from "@/config/product";
import { cn } from "@/lib/cn";

/**
 * Website prices: ₹ for visitors in India, $ for everyone else (from the visitor's country,
 * or their own choice in the ₹/$ switch). Payments are always taken in rupees.
 */

const KEY = "ibaxai-currency";
let current: Currency = "INR";
let started = false;
const listeners = new Set<() => void>();

function setCurrency(c: Currency, remember = true) {
  current = c;
  if (remember) {
    try {
      localStorage.setItem(KEY, c);
    } catch {
      /* private mode */
    }
  }
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    /* private mode */
  }
  if (saved === "INR" || saved === "USD") return setCurrency(saved, false);
  fetch("/api/geo")
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { country?: string } | null) => {
      if (d?.country && d.country !== "IN") setCurrency("USD", false);
    })
    .catch(() => {});
}

export function useCurrency(): [Currency, (c: Currency) => void] {
  const value = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => "INR" as Currency,
  );
  useEffect(start, []);
  return [value, setCurrency];
}

/** A price in the visitor's currency: <Money inr="₹699" usd="$9" />. */
export function Money({ inr, usd }: { inr: string; usd: string }) {
  const [c] = useCurrency();
  return <>{c === "USD" ? usd : inr}</>;
}

/** Small ₹ / $ switch for the price lists. */
export function CurrencySwitch({ className }: { className?: string }) {
  const [c, set] = useCurrency();
  return (
    <div role="group" aria-label="Currency" className={cn("inline-flex rounded-full border border-white/10 p-0.5 text-xs font-semibold", className)}>
      {(["INR", "USD"] as const).map((x) => (
        <button key={x} type="button" aria-pressed={c === x} onClick={() => set(x)} className={cn("rounded-full px-3 py-1", c === x ? "bg-flow text-ink-950" : "text-fg-muted")}>
          {x === "INR" ? "₹ India" : "$ Other countries"}
        </button>
      ))}
    </div>
  );
}
