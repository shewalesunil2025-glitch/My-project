/**
 * The business app's brand. Change `name` here and it updates everywhere in the app.
 *
 * "ibaxai" (AI Automation and Digital Marketing Agency) — the brand and its
 * domain, www.ibaxai.com. The assistant inside the app and on the website is IBAX.
 */
export const product = {
  name: "ibaxai",
  /** The chatbot / assistant inside the app and on the website. */
  assistantName: "IBAX",
  tagline: "Your AI Business Operating System",
  positioning: "One AI. One Platform. Your Entire Business.",
  /** The brand slogan, shown on the website hero, the app welcome screen and the footer. */
  slogan: "Just say it. IBAX does it.",
  /** Shown under the logo, as on the website. */
  logoTagline: "AI Automation and Digital Marketing Agency",
  description:
    "ibaxai runs your website, AI assistants, WhatsApp, calls, social media, reviews, content and leads from one app — you give the instructions, ibaxai handles the technology.",
  /** Currency for the prices in src/content/app/services.ts (Indian rupees, all-inclusive). */
  currency: "INR",
  supportEmail: "ibaxai369@gmail.com",
  /** Support phone and WhatsApp (same number). */
  supportPhone: "+917499414443",
  supportPhoneDisplay: "+91 74994 14443",
  company: "ibaxai",
  /**
   * Preview mode: accounts, payments, account connections and automations run on this
   * device only, so the whole journey can be tried before the backend is connected.
   * See docs/ARCHITECTURE.md for what replaces each simulated piece.
   */
  previewMode: true,
} as const;

export type Currency = "INR" | "USD";

/** "₹699" or "$9". Prices are whole numbers in both currencies. */
export function formatPrice(amount: number, currency: Currency = "INR") {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

/**
 * Customers outside India see US-dollar prices (round figures), but every payment is taken in
 * Indian rupees: a dollar price is charged as its rupee value at this rate.
 */
export const USD_TO_INR = 85;
export const chargeInInr = (amount: number, currency: Currency) => (currency === "INR" ? amount : Math.round(amount * USD_TO_INR));

/** India pays in rupees; every other country sees dollars. */
export const currencyForCountry = (country?: string | null): Currency => (!country || /^(india|in)$/i.test(country.trim()) ? "INR" : "USD");
