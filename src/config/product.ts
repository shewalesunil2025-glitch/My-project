/**
 * The business app's brand. Change `name` here and it updates everywhere in the app.
 *
 * "IBAXAI" (Intelligent Business Automation Expert) — the brand and its
 * domain, www.ibaxai.com. The assistant inside the app and on the website is IBAX.
 */
export const product = {
  name: "IBAXAI",
  /** The chatbot / assistant inside the app and on the website. */
  assistantName: "IBAX",
  tagline: "Your AI Business Operating System",
  positioning: "One AI. One Platform. Your Entire Business.",
  /** Shown under the logo, as on the website. */
  logoTagline: "Intelligent Business Automation Expert",
  description:
    "IBAXAI runs your website, AI assistants, WhatsApp, calls, social media, reviews, content and leads from one app — you give the instructions, IBAXAI handles the technology.",
  /** Currency for the placeholder prices in src/content/app/services.ts. */
  currency: "USD",
  supportEmail: "ibaxai369@gmail.com",
  /** Support phone and WhatsApp (same number). */
  supportPhone: "+917499414443",
  supportPhoneDisplay: "+91 74994 14443",
  company: "IBAXAI",
  /**
   * Preview mode: accounts, payments, account connections and automations run on this
   * device only, so the whole journey can be tried before the backend is connected.
   * See docs/ARCHITECTURE.md for what replaces each simulated piece.
   */
  previewMode: true,
} as const;

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency, maximumFractionDigits: 0 }).format(amount);
}
