import { siteConfig } from "@/config/site";

/** Who runs IBAX AI — used on the Privacy Policy and Terms pages. */
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
  updated: "9 October 2026",
} as const;

export const operatorLine = `${legal.brand} is operated by ${legal.operator}, ${legal.form} based in ${legal.city}, ${legal.state}, ${legal.country}.`;
