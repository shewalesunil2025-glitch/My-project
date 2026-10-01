/**
 * The business app's brand. Change `name` here and it updates everywhere in the app.
 *
 * "Lumi" — two syllables, easy to say in every language, no regional meaning that
 * gets in the way, and warm (it comes from "light"). Each customer can still give
 * their own assistant any name during setup; "Lumi" is only the default.
 */
export const product = {
  name: "Lumi",
  tagline: "Your AI Business Operating System",
  positioning: "One AI. One Platform. Your Entire Business.",
  description:
    "Lumi runs your website, AI assistants, WhatsApp, calls, social media, reviews, content and leads from one app — you give the instructions, Lumi handles the technology.",
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
