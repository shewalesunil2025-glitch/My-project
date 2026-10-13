import { chargeInInr, currencyForCountry, formatPrice, type Currency } from "@/config/product";
import { priceIn, type ServiceDef } from "@/content/app/services";
import { currentWorkspace } from "./store";
import type { Workspace } from "./types";

/**
 * Prices in the app follow the business's country: rupees in India, US dollars everywhere
 * else. Payments are always taken in rupees (dollar prices at their rupee value).
 */
export const appCurrency = (ws?: Workspace | null): Currency => currencyForCountry((ws === undefined ? currentWorkspace() : ws)?.business?.country);

/** The service's monthly (or one-time) price in the owner's currency. */
export const svcPrice = (svc: Pick<ServiceDef, "price" | "usd">, ws?: Workspace | null) => priceIn(svc, appCurrency(ws));

export const money = (amount: number, currency?: Currency) => formatPrice(amount, currency ?? appCurrency());

/** "Charged as ₹765" note for dollar prices; empty in India. */
export const inrNote = (amount: number, currency: Currency) => (currency === "INR" ? "" : `Charged in Indian rupees: ${formatPrice(chargeInInr(amount, currency))}`);
