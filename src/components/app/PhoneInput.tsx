"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { countryByIso, countryByName, countryFromPhone, countryList, type Country } from "@/content/app/countries";
import { cn } from "@/lib/cn";

/**
 * Mobile number with a country picker: a flag and "+91" button opens a searchable list (India
 * first, then the countries our clients use most), and the number goes in beside it. The picked
 * country decides the currency (₹ in India, $ elsewhere). The value is one string like
 * "+91 98765 43210"; `onCountry` reports the country name.
 */

const POPULAR = ["IN", "AE", "SA", "QA", "OM", "KW", "US", "GB", "CA", "AU", "SG", "NP"];

/** Real flag pictures (emoji flags show as letters on Windows). */
export function Flag({ iso, className }: { iso: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small local SVG flags (flag-icons, MIT)
    <img src={`/flags/${iso.toLowerCase()}.svg`} alt="" aria-hidden width={22} height={16} loading="lazy" className={cn("h-4 w-[22px] shrink-0 rounded-[3px] object-cover ring-1 ring-white/15", className)} />
  );
}

export function PhoneInput({
  id,
  name,
  value,
  defaultValue = "",
  country: countryName,
  onChange,
  onCountry,
  required,
  autoFocus,
  className,
}: {
  id: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  /** Country name to start with when the number has no code yet (default India). */
  country?: string;
  onChange?: (phone: string) => void;
  onCountry?: (country: string) => void;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  const initial = value ?? defaultValue;
  const [country, setCountry] = useState<Country>(() => countryFromPhone(initial) ?? countryByName(countryName ?? "") ?? countryByName("India")!);
  const [local, setLocal] = useState(() => {
    const c = countryFromPhone(initial);
    return c ? initial.replace(/^\s*\+\s*/, "").replace(/\D/g, "").slice(c.dial.length) : initial.replace(/^\s*\+?\s*/, "");
  });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);
  const full = (c: Country, n: string) => (n.trim() ? `+${c.dial} ${n.trim()}` : "");
  const digits = local.replace(/\D/g, "").length;
  const complete = country.iso === "IN" ? digits === 10 : digits >= 6;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, "");
    if (q) return { popular: [], rest: countryList.filter((c) => c.name.toLowerCase().includes(q) || c.dial.startsWith(q) || c.iso.toLowerCase() === q) };
    const popular = POPULAR.map((iso) => countryByIso(iso)).filter((c): c is Country => Boolean(c));
    return { popular, rest: countryList.filter((c) => !POPULAR.includes(c.iso)) };
  }, [query]);

  function pick(c: Country) {
    setCountry(c);
    setOpen(false);
    setQuery("");
    onCountry?.(c.name);
    onChange?.(full(c, local));
    requestAnimationFrame(() => numberRef.current?.focus());
  }

  const row = (c: Country) => (
    <li key={c.iso}>
      <button
        type="button"
        onClick={() => pick(c)}
        className={cn("flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-white/[0.06]", c.iso === country.iso && "bg-flow/10")}
      >
        <Flag iso={c.iso} />
        <span className="min-w-0 flex-1 truncate text-fg">{c.name}</span>
        <span className="text-xs text-fg-muted tabular-nums">+{c.dial}</span>
        {c.iso === country.iso && <Check className="size-3.5 text-flow" aria-hidden />}
      </button>
    </li>
  );

  return (
    <div ref={box} className={cn("relative", className)}>
      <div className="flex h-12 items-stretch overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] transition-colors focus-within:border-flow/60 focus-within:shadow-[0_0_0_3px_rgb(37_211_102/0.12)]">
        <button
          type="button"
          id={`${id}-country`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Country code: ${country.name} +${country.dial}`}
          onClick={() => setOpen((o) => !o)}
          className="flex shrink-0 items-center gap-2 border-r border-white/10 bg-white/[0.03] pr-2.5 pl-3 text-sm font-semibold text-fg transition-colors hover:bg-white/[0.06]"
        >
          <Flag iso={country.iso} />
          <span className="tabular-nums">+{country.dial}</span>
          <ChevronDown className={cn("size-3.5 text-fg-muted transition-transform", open && "rotate-180")} aria-hidden />
        </button>
        <input
          ref={numberRef}
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          required={required}
          value={local}
          placeholder={country.iso === "IN" ? "98765 43210" : "Mobile number"}
          onChange={(e) => {
            const n = e.target.value.replace(/[^\d\s-]/g, "").slice(0, 18);
            setLocal(n);
            onChange?.(full(country, n));
          }}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[16px] tracking-wide text-fg tabular-nums placeholder:text-fg-subtle focus:outline-none sm:text-[15px]"
        />
        {complete && (
          <span className="grid place-items-center pr-3" aria-hidden>
            <span className="grid size-5 place-items-center rounded-full bg-flow/15 text-flow">
              <Check className="size-3" />
            </span>
          </span>
        )}
      </div>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+0.4rem)] z-50 overflow-hidden rounded-2xl border border-white/10 bg-ink-900/95 shadow-[0_18px_50px_-12px_rgb(0_0_0/0.7)] backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-3">
            <Search className="size-4 text-fg-subtle" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or code"
              aria-label="Search country or code"
              className="h-11 min-w-0 flex-1 bg-transparent text-[16px] text-fg placeholder:text-fg-subtle focus:outline-none sm:text-sm"
            />
          </div>
          <ul role="listbox" aria-label="Countries" className="max-h-72 overflow-y-auto overscroll-contain p-1.5">
            {shown.popular.length > 0 && <li className="px-2.5 pt-1 pb-1 text-[0.62rem] font-semibold tracking-[0.14em] text-fg-subtle uppercase">Popular</li>}
            {shown.popular.map(row)}
            {shown.popular.length > 0 && <li className="mx-2.5 my-1.5 h-px bg-white/[0.06]" aria-hidden />}
            {shown.rest.map(row)}
            {shown.rest.length === 0 && <li className="px-2.5 py-3 text-center text-xs text-fg-subtle">No country found</li>}
          </ul>
        </div>
      )}

      {name && <input type="hidden" name={name} value={full(country, local)} />}
      {name && <input type="hidden" name={`${name}Country`} value={country.name} />}
    </div>
  );
}
