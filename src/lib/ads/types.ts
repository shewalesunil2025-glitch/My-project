/** AI Ads (Facebook + Instagram): the shapes shared by the wizard, the server and the dashboard. */

export const OBJECTIVES = [
  { id: "leads", label: "Get leads (enquiries)", cta: "SIGN_UP" },
  { id: "whatsapp", label: "Get WhatsApp enquiries", cta: "WHATSAPP_MESSAGE" },
  { id: "calls", label: "Get phone calls", cta: "CALL_NOW" },
  { id: "sales", label: "Increase sales", cta: "SHOP_NOW" },
  { id: "traffic", label: "Get more website visitors", cta: "LEARN_MORE" },
  { id: "new_product", label: "Promote a new product", cta: "LEARN_MORE" },
  { id: "store_visits", label: "Get more store visits", cta: "GET_DIRECTIONS" },
  { id: "awareness", label: "Build brand awareness", cta: "LEARN_MORE" },
] as const;
export type ObjectiveId = (typeof OBJECTIVES)[number]["id"];
export const objectiveIds = OBJECTIVES.map((o) => o.id) as ObjectiveId[];
export const objectiveLabel = (id: string) => OBJECTIVES.find((o) => o.id === id)?.label ?? id;

export type AdPlatform = "facebook" | "instagram" | "both";
export const platforms: readonly AdPlatform[] = ["facebook", "instagram", "both"];

export type AdLanguage = "en" | "hi" | "both";
export const languages: readonly AdLanguage[] = ["en", "hi", "both"];

/** Meta's call-to-action buttons we use (the API takes these exact names). */
export const CTAS = ["LEARN_MORE", "SHOP_NOW", "SIGN_UP", "CONTACT_US", "WHATSAPP_MESSAGE", "CALL_NOW", "GET_QUOTE", "BOOK_NOW", "ORDER_NOW", "GET_DIRECTIONS"] as const;
export type Cta = (typeof CTAS)[number];

export type Area =
  | { type: "radius"; km: number; label: string; lat?: number; lng?: number }
  | { type: "city"; name: string; state?: string }
  | { type: "state"; name: string }
  | { type: "india" };

export const STATUSES = [
  "draft",
  "creatives_ready",
  "awaiting_approval",
  "awaiting_payment",
  "paid",
  "ready_to_launch",
  "submitted",
  "active",
  "paused",
  "completed",
  "rejected",
  "failed",
] as const;
export type AdStatus = (typeof STATUSES)[number];
