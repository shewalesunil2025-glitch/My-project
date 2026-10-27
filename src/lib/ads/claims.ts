/**
 * The AI must not make up prices, discounts or promises. Every money amount, percentage and strong
 * claim in generated ad text must come from what the owner typed (their offer, services, description).
 * Returns what is not backed by that text; an empty list means the text is safe to show.
 */

const digits = (s: string) => s.replace(/[,\s]/g, "");

const numbersIn = (s: string) => [...digits(s).matchAll(/\d+(?:\.\d+)?/g)].map((m) => m[0]);

const MONEY = /(?:₹|rs\.?|inr)\s*\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?\s*(?:₹|rs\b|rupees?|\/-)/gi;
const PERCENT = /\d+(?:\.\d+)?\s*%/g;
const STRONG = /\b(guarantee[d]?|guaranteed|no\.?\s?1|number\s?one|#1|best in|cheapest|100\s?%|risk[- ]free|cure[sd]?)\b/i;

export function unsupportedClaims(text: string, facts: string): string[] {
  const known = new Set(numbersIn(facts));
  const lowerFacts = facts.toLowerCase();
  const bad: string[] = [];
  for (const m of [...(text.match(MONEY) ?? []), ...(text.match(PERCENT) ?? [])]) {
    const n = numbersIn(m)[0];
    if (n && !known.has(n)) bad.push(m.trim());
  }
  const strong = text.match(STRONG);
  if (strong && !lowerFacts.includes(strong[0].toLowerCase())) bad.push(strong[0]);
  return [...new Set(bad)];
}
