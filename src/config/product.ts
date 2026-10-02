/**
 * The business app's brand. Change `name` here and it updates everywhere in the app.
 *
 * "Munna AI" — the brand and its domain, www.munnaai.com. The assistant inside the
 * app and on the website is called Munna.
 */
export const product = {
  name: "Munna AI",
  /** The chatbot / assistant inside the app and on the website. */
  assistantName: "Munna",
  tagline: "Your AI Business Operating System",
  positioning: "One AI. One Platform. Your Entire Business.",
  description:
    "Munna AI runs your website, AI assistants, WhatsApp, calls, social media, reviews, content and leads from one app — you give the instructions, Munna AI handles the technology.",
  /** Currency for the placeholder prices in src/content/app/services.ts. */
  currency: "USD",
  supportEmail: "support@nexaflow.ai",
  company: "Nexa Flow AI",
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
