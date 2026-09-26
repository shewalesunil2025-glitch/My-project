import { normalizeMobile, normalizeServiceId } from './sanitize';

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

/**
 * Demo service-number formats:
 *   Officers   IC-12345A   (IC- + 5 digits + check letter)
 *   JCOs       JC-123456A  (JC- + 6 digits + check letter)
 *   Other Ranks 12345678A  (8 digits + check letter)
 * These mirror common public formats only; no real registry is queried.
 */
export const SERVICE_ID_PATTERNS = [/^IC-\d{5}[A-Z]$/, /^JC-\d{6}[A-Z]$/, /^\d{8}[A-Z]$/];

export function isValidServiceId(id: string): boolean {
  const v = normalizeServiceId(id);
  return SERVICE_ID_PATTERNS.some((re) => re.test(v));
}

export function isValidMobile(m: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizeMobile(m));
}

export function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
}

export function passwordIssues(p: string): string | null {
  if (p.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'Use letters and at least one number.';
  return null;
}

export function isValidName(n: string): boolean {
  return /^[A-Za-z][A-Za-z .'-]{1,59}$/.test(n.trim());
}
