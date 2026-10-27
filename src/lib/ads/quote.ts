/**
 * What an ad campaign costs, worked out here on the server and shown to the client before they pay.
 * Two separate amounts: the ad spend, which the client's own Meta ad account pays to Meta, and
 * ibaxai's creative fee (the images, videos and copy it makes), the only thing paid to ibaxai.
 * No mark-up on the ad spend.
 */

/** ₹ per item. The owner can change these; they are read only by quote(). */
export const CREATIVE_PRICES_INR = {
  /** 3 image variations with headline, text and button, in English and/or Hindi. */
  imagePack: 199,
  /** A Reel / Story video made from the client's photos with text, subtitles and a voice-over. */
  templateVideo: 399,
  /** A fully AI-generated video (costs ibaxai real money per second; a later add-on). */
  aiVideo: 1499,
} as const;

/** GST is added here only once ibaxai is GST-registered (0 until then). */
export const TAX_RATE = 0;

/** Videos aren't built yet: until they are, only image packs can be bought (flip when the video pipeline exists). */
export const VIDEOS_AVAILABLE = false;

export const MIN_DAILY_BUDGET_INR = 100; // the form's floor; Meta's real minimum is checked when the campaign is created
export const MAX_DAILY_BUDGET_INR = 100_000;
export const MAX_DAYS = 90;
export const MAX_PER_KIND = 5;

export type QuoteInput = {
  dailyBudgetInr: number;
  days: number;
  imagePacks: number;
  templateVideos: number;
  aiVideos: number;
};

export type QuoteLine = { label: string; qty: number; unitInr: number; amountInr: number };
export type Quote = {
  /** Paid by the client's ad account to Meta, never to ibaxai. */
  adSpendInr: number;
  creativeFeeInr: number;
  taxInr: number;
  /** The only amount charged by ibaxai. */
  payableToIbaxInr: number;
  lines: QuoteLine[];
};

const money = (n: number) => Math.round(n * 100) / 100;
const whole = (v: unknown, min: number, max: number) => (typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null);

export function quote(input: QuoteInput): { ok: true; quote: Quote } | { ok: false; error: string } {
  const daily = whole(input.dailyBudgetInr, MIN_DAILY_BUDGET_INR, MAX_DAILY_BUDGET_INR);
  const days = whole(input.days, 1, MAX_DAYS);
  const packs = whole(input.imagePacks, 0, MAX_PER_KIND);
  const videos = whole(input.templateVideos, 0, MAX_PER_KIND);
  const ai = whole(input.aiVideos, 0, MAX_PER_KIND);
  if (daily === null) return { ok: false, error: `The daily budget must be a whole number from ₹${MIN_DAILY_BUDGET_INR} to ₹${MAX_DAILY_BUDGET_INR.toLocaleString("en-IN")}.` };
  if (days === null) return { ok: false, error: `Run the ad for 1 to ${MAX_DAYS} days.` };
  if (packs === null || videos === null || ai === null) return { ok: false, error: `Choose 0 to ${MAX_PER_KIND} of each creative.` };
  if (packs + videos + ai === 0) return { ok: false, error: "Choose at least one image pack or video." };

  const lines: QuoteLine[] = [
    { label: "Image pack (3 variations + copy)", qty: packs, unitInr: CREATIVE_PRICES_INR.imagePack, amountInr: packs * CREATIVE_PRICES_INR.imagePack },
    { label: "Reel / Story video", qty: videos, unitInr: CREATIVE_PRICES_INR.templateVideo, amountInr: videos * CREATIVE_PRICES_INR.templateVideo },
    { label: "AI-generated video", qty: ai, unitInr: CREATIVE_PRICES_INR.aiVideo, amountInr: ai * CREATIVE_PRICES_INR.aiVideo },
  ].filter((l) => l.qty > 0);
  const creativeFeeInr = money(lines.reduce((s, l) => s + l.amountInr, 0));
  const taxInr = money(creativeFeeInr * TAX_RATE);
  return { ok: true, quote: { adSpendInr: daily * days, creativeFeeInr, taxInr, payableToIbaxInr: money(creativeFeeInr + taxInr), lines } };
}

/** Shown before payment. */
export const POLICY_LINES = [
  "You pay Meta for the ads from your own Meta ad account. ibaxai adds nothing to that amount.",
  "You pay ibaxai only for the creatives it makes (images, videos, copy).",
  "The creative fee is for work already done once the creatives are made, so it is not refunded after they are delivered. If ibaxai cannot deliver them, the fee is refunded in full.",
  "Unused ad budget never passes through ibaxai: it stays in your Meta account.",
  "Nobody can promise results. Ads can bring more enquiries, but sales, leads and reach are never guaranteed.",
];
