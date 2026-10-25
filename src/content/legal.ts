import { siteConfig } from "@/config/site";

/** Who runs ibaxai — used on the Privacy, Terms, Refund, Delivery and Contact pages. */
export const legal = {
  brand: siteConfig.name,
  operator: "Shewale Sunil",
  form: "a sole proprietor",
  city: "Chhatrapati Sambhajinagar",
  state: "Maharashtra",
  postcode: "431001",
  country: "India",
  email: siteConfig.email,
  phoneDisplay: siteConfig.phoneDisplay,
  /** Shown as "Last updated" on both pages. Change it whenever either page changes. */
  updated: "25 October 2026",
} as const;

/** The trade mark notice (™ until registered; then ®). */
export const trademarkLine = `${legal.brand}™, IBAX™, "Just say it. IBAX does it."™ and the ${legal.brand} logo are trademarks of ${legal.operator} (IBAXAI). Do not use them without written permission.`;

export const operatorLine = `${legal.brand} is operated by ${legal.operator}, ${legal.form} based in ${legal.city}, ${legal.state}, ${legal.country}.`;
