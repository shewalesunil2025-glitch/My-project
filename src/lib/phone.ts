import { countryByName } from "@/content/app/countries";

/**
 * Phone numbers as WhatsApp wants them: digits with the country code, no "+".
 *
 *  - A number typed with "+" or "00" already has its country code: it is never prefixed, whatever
 *    its length (a Singapore number "+65 8123 4567" has 10 digits and is NOT Indian).
 *  - A number without a code is national: it gets `defaultDial` (the business's country code).
 *    The default is India ("91"), which keeps every existing Indian number working.
 *  - Longer numbers typed without "+" are taken as already having their code.
 */

export type ParsedPhone = { digits: string; international: boolean };

const INDIA = "91";

/** The calling code of a country name from the business profile ("India" → "91"); India when unknown. */
export function dialForCountry(country?: string | null): string {
  return (country && countryByName(country)?.dial) || INDIA;
}

export function parsePhone(input: string, defaultDial: string = INDIA): ParsedPhone | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  const hasPlus = /^\+/.test(raw);
  const hasZeros = /^00(?!0)/.test(raw);
  let digits = raw.replace(/\D/g, "");

  if (hasPlus || hasZeros) {
    if (hasZeros) digits = digits.slice(2);
    return /^[1-9]\d{7,14}$/.test(digits) ? { digits, international: true } : null;
  }

  // Without a country code: drop the leading trunk zero(s) people write at home.
  digits = digits.replace(/^0+/, "");
  const dial = /^[1-9]\d{0,3}$/.test(defaultDial) ? defaultDial : INDIA;
  const national = dial === INDIA ? digits.length === 10 : digits.length >= 6 && digits.length <= 10;
  if (national) {
    const full = `${dial}${digits}`;
    return /^[1-9]\d{7,14}$/.test(full) ? { digits: full, international: false } : null;
  }
  return /^[1-9]\d{10,14}$/.test(digits) ? { digits, international: false } : null;
}

/** Digits with country code, or null when it isn't a valid number. */
export const phoneDigits = (input: string, defaultDial?: string) => parsePhone(input, defaultDial)?.digits ?? null;

/** "+<country code><number>", the way the app stores a connected WhatsApp. */
export const phoneAccount = (input: string, defaultDial?: string) => {
  const d = phoneDigits(input, defaultDial);
  return d ? `+${d}` : null;
};

/**
 * A number that already comes with its country code (WhatsApp's own "jid", or one we stored):
 * digits only, never prefixed. A 10-digit Singapore number stays a Singapore number.
 */
export const fullDigits = (input: string) => {
  const d = String(input ?? "").replace(/\D/g, "");
  return /^[1-9]\d{7,14}$/.test(d) ? d : null;
};
