"use client";

import { useState } from "react";
import { countryByName, countryFromPhone, countryList, flag, type Country } from "@/content/app/countries";
import { cn } from "@/lib/cn";

/**
 * Mobile number with a country picker: choosing a country fills in its code (+91 for India),
 * and the picked country decides the currency (₹ in India, $ elsewhere). The value is one
 * string like "+91 98765 43210"; `onCountry` reports the country name.
 */
export function PhoneInput({
  id,
  name,
  value,
  defaultValue = "",
  country: countryName,
  onChange,
  onCountry,
  required,
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
  className?: string;
}) {
  const initial = value ?? defaultValue;
  const [country, setCountry] = useState<Country>(() => countryFromPhone(initial) ?? countryByName(countryName ?? "") ?? countryByName("India")!);
  const [local, setLocal] = useState(() => {
    const c = countryFromPhone(initial);
    return c ? initial.replace(/^\s*\+\s*/, "").replace(/\D/g, "").slice(c.dial.length) : initial.replace(/^\s*\+?\s*/, "");
  });
  const full = (c: Country, n: string) => (n.trim() ? `+${c.dial} ${n.trim()}` : "");

  return (
    <div className={cn("flex gap-2", className)}>
      <label htmlFor={`${id}-country`} className="sr-only">
        Country code
      </label>
      <select
        id={`${id}-country`}
        value={country.iso}
        onChange={(e) => {
          const c = countryList.find((x) => x.iso === e.target.value)!;
          setCountry(c);
          onCountry?.(c.name);
          onChange?.(full(c, local));
        }}
        className="h-11 w-[7.5rem] shrink-0 rounded-xl border border-white/10 bg-ink-900 px-2 text-sm text-fg focus:border-flow/60 focus:outline-none"
      >
        {countryList.map((c) => (
          <option key={c.iso} value={c.iso}>
            {flag(c.iso)} {c.name} +{c.dial}
          </option>
        ))}
      </select>
      <div className="flex min-w-0 flex-1 items-center rounded-xl border border-white/10 bg-ink-900 focus-within:border-flow/60">
        <span className="pl-3 text-sm text-fg-muted tabular-nums">+{country.dial}</span>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required={required}
          value={local}
          onChange={(e) => {
            const n = e.target.value.replace(/[^\d\s-]/g, "").slice(0, 18);
            setLocal(n);
            onChange?.(full(country, n));
          }}
          className="h-11 min-w-0 flex-1 bg-transparent px-2 text-[16px] text-fg placeholder:text-fg-subtle focus:outline-none sm:text-sm"
        />
      </div>
      {name && <input type="hidden" name={name} value={full(country, local)} />}
      {name && <input type="hidden" name={`${name}Country`} value={country.name} />}
    </div>
  );
}
