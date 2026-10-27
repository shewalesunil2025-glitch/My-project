import { CTAS, OBJECTIVES, type AdLanguage, type Cta, type ObjectiveId } from "./types";

/** Asking the AI for ad copy: the prompt, the answer's shape, and tidying what comes back. */

export const LIMITS = { headline: 40, primary: 125, description: 30 } as const;

export type CopyVariation = { language: "en" | "hi"; headline: string; primaryText: string; description: string; cta: Cta };

export const copySchema = {
  type: "object",
  properties: {
    variations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          language: { type: "string", enum: ["en", "hi"] },
          headline: { type: "string" },
          primary_text: { type: "string" },
          description: { type: "string" },
          cta: { type: "string", enum: [...CTAS] },
        },
        required: ["language", "headline", "primary_text", "description", "cta"],
      },
    },
  },
  required: ["variations"],
};

export type CopyBrief = {
  businessName: string;
  category: string;
  city: string;
  services: string;
  description: string;
  targetCustomers: string;
  objective: ObjectiveId;
  offer: string;
  language: AdLanguage;
  count: number;
};

/** Everything the owner told us: the only facts the ad text may use. */
export const factsOf = (b: Pick<CopyBrief, "businessName" | "category" | "city" | "services" | "description" | "offer" | "targetCustomers">) =>
  [b.businessName, b.category, b.city, b.services, b.description, b.offer, b.targetCustomers].filter(Boolean).join("\n");

export function copyPrompt(b: CopyBrief) {
  const objective = OBJECTIVES.find((o) => o.id === b.objective);
  const langs = b.language === "both" ? "English and Hindi (Devanagari). Give each language its own variations" : b.language === "hi" ? "Hindi (Devanagari)" : "English";
  const system = `You write Facebook and Instagram ad copy for a small business in India. Write ${langs}.
Rules:
- Use ONLY the facts below. Never invent prices, discounts, offers, opening dates, awards, ratings, customer quotes or results. If no price or offer is given, do not mention one.
- No guarantees, no "best", "No.1" or "100%" claims, no health or income promises.
- Simple, warm words a shop owner would use. No hashtags, no emojis except at most one per text.
- headline: at most ${LIMITS.headline} characters. primary_text: at most ${LIMITS.primary} characters. description: at most ${LIMITS.description} characters.
- cta: the best button for the goal. The goal is "${objective?.label ?? b.objective}" and its usual button is ${objective?.cta ?? "LEARN_MORE"}.
- Each variation must use a different angle (for example: the problem it solves, the place, the service itself).`;
  const user = `Business: ${b.businessName}${b.category ? ` (${b.category})` : ""}${b.city ? `, ${b.city}` : ""}
Services: ${b.services || "not provided"}
About: ${b.description || "not provided"}
Customers: ${b.targetCustomers || "not provided"}
Offer to promote (use exactly as written, or leave out if empty): ${b.offer || "none"}
Write ${b.count} variations${b.language === "both" ? " in each language" : ""}.`;
  return { system, user };
}

const clip = (s: unknown, n: number) => {
  const t = typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "";
  return t.length <= n ? t : `${t.slice(0, n - 1).trimEnd()}…`;
};

/** Tidies the AI's answer: fixed lengths, a valid button, only the asked languages. */
export function normalizeCopy(raw: unknown, language: AdLanguage, fallbackCta: Cta): CopyVariation[] {
  const list = (raw as { variations?: unknown[] } | null)?.variations;
  if (!Array.isArray(list)) return [];
  const out: CopyVariation[] = [];
  for (const v of list) {
    const x = v as Record<string, unknown>;
    const lang = x.language === "hi" ? "hi" : "en";
    if (language !== "both" && lang !== language) continue;
    const headline = clip(x.headline, LIMITS.headline);
    const primaryText = clip(x.primary_text, LIMITS.primary);
    if (!headline || !primaryText) continue;
    const cta = (CTAS as readonly string[]).includes(String(x.cta)) ? (x.cta as Cta) : fallbackCta;
    out.push({ language: lang, headline, primaryText, description: clip(x.description, LIMITS.description), cta });
  }
  return out;
}
