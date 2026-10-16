"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { Globe2, X } from "lucide-react";
import type { Currency } from "@/config/product";
import { countryByIso, countryList, flag } from "@/content/app/countries";
import { cn } from "@/lib/cn";

/**
 * Website prices stay hidden until the visitor picks their country: India shows ₹, every
 * other country shows $. The choice is remembered on this device. Payments are always in rupees.
 */

const KEY = "ibaxai-price-country";
type State = { country: string | null; open: boolean; suggested: string };
let state: State = { country: null, open: false, suggested: "IN" };
let started = false;
const listeners = new Set<() => void>();
const emit = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

function start() {
  if (started) return;
  started = true;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && countryByIso(saved)) emit({ country: saved });
  } catch {
    /* private mode */
  }
  // Only pre-selects the country in the picker; prices still wait for the visitor's choice.
  fetch("/api/geo")
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { country?: string } | null) => {
      if (d?.country && countryByIso(d.country)) emit({ suggested: d.country.toUpperCase() });
    })
    .catch(() => {});
}

export function chooseCountry(iso: string) {
  try {
    localStorage.setItem(KEY, iso);
  } catch {
    /* private mode */
  }
  emit({ country: iso, open: false });
}

export const openCountryPicker = () => emit({ open: true });

const server: State = { country: null, open: false, suggested: "IN" };
function usePriceState(): State {
  const s = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => server,
  );
  useEffect(start, []);
  return s;
}

/** The visitor's currency, or null until they pick a country. */
export function useCurrency(): Currency | null {
  const { country } = usePriceState();
  return country ? (country === "IN" ? "INR" : "USD") : null;
}

/** "See price" button shown in place of a price until a country is chosen. */
export function SeePrice({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openCountryPicker();
      }}
      className={cn("inline-flex items-center gap-1 rounded-full border border-flow/40 px-2.5 py-0.5 text-xs font-semibold text-flow hover:bg-flow/10", className)}
    >
      <Globe2 className="size-3" aria-hidden /> See price
    </button>
  );
}

/** A price in the visitor's currency: <Money inr="₹699" usd="$9" />, or "See price" until they choose a country. */
export function Money({ inr, usd }: { inr: string; usd: string }) {
  const c = useCurrency();
  if (!c) return <SeePrice className="align-middle" />;
  return <>{c === "USD" ? usd : inr}</>;
}

/** Shows the chosen country with a "change" link, or a button to choose one. */
export function CountryChip({ className }: { className?: string }) {
  const { country } = usePriceState();
  const c = country ? countryByIso(country) : null;
  return (
    <button
      type="button"
      onClick={openCountryPicker}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold",
        c ? "border-white/15 text-fg-muted hover:border-flow/40" : "border-flow/50 bg-flow/10 text-flow hover:bg-flow/15",
        className,
      )}
    >
      {c ? (
        <>
          {flag(c.iso)} Prices for {c.name} ({c.iso === "IN" ? "₹" : "$"}) · <span className="text-flow underline underline-offset-4">change</span>
        </>
      ) : (
        <>
          <Globe2 className="size-4" aria-hidden /> Choose your country to see prices
        </>
      )}
    </button>
  );
}

/** One dialog for the whole page: pick a country, then every price on the page shows. */
export function CountryDialog() {
  const { open, country, suggested } = usePriceState();
  const [pick, setPick] = useState("");
  const value = pick || country || suggested;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && emit({ open: false });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    chooseCountry(value);
    setPick("");
  };
  const india = countryList.find((c) => c.iso === "IN");
  const others = countryList.filter((c) => c.iso !== "IN");

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => emit({ open: false })}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-country-title"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-ink-900 p-6 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)]"
      >
        <button type="button" onClick={() => emit({ open: false })} aria-label="Close" className="absolute top-3 right-3 text-fg-muted hover:text-fg">
          <X className="size-5" aria-hidden />
        </button>
        <h2 id="price-country-title" className="text-lg font-semibold">
          Where is your business?
        </h2>
        <p className="mt-1 text-sm text-fg-muted">We&apos;ll show prices in your currency: ₹ for India, $ for other countries.</p>
        <label htmlFor="price-country" className="sr-only">
          Country
        </label>
        <select
          id="price-country"
          value={value}
          onChange={(e) => setPick(e.target.value)}
          className="mt-4 h-11 w-full rounded-xl border border-white/10 bg-ink-850 px-3 text-sm focus:border-flow/50 focus:outline-none"
        >
          {india && (
            <option value={india.iso}>
              {flag(india.iso)} {india.name}
            </option>
          )}
          {others.map((c) => (
            <option key={c.iso} value={c.iso}>
              {flag(c.iso)} {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="mt-4 h-11 w-full rounded-full bg-flow text-sm font-semibold text-ink-950">
          Show prices
        </button>
      </form>
    </div>
  );
}
