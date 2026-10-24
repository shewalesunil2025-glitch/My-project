/**
 * UPI payments for a client's own customers: the client saves their UPI ID (Settings → Business),
 * IBAX shares https://www.ibaxai.com/pay/<instance> on WhatsApp, and the customer pays the client
 * directly from any UPI app. The money never passes through ibaxai.
 */

/** name@bank, e.g. ravicafe@okhdfc or 9876543210@ybl. */
export const validUpi = (v: unknown): v is string => typeof v === "string" && /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/.test(v.trim());

/** Rupee amount from a query value: 1 to 1,00,000 with up to 2 decimals, else undefined. */
export function upiAmount(v: unknown) {
  const n = Number(typeof v === "string" ? v.replace(/[,₹\s]/g, "") : v);
  return Number.isFinite(n) && n >= 1 && n <= 100_000 ? Math.round(n * 100) / 100 : undefined;
}

/** The upi://pay link every UPI app (GPay, PhonePe, Paytm, BHIM…) opens. */
export function upiUri(p: { upiId: string; name: string; amount?: number; note?: string }) {
  const q = new URLSearchParams({ pa: p.upiId.trim(), pn: p.name.slice(0, 50), cu: "INR" });
  if (p.amount) q.set("am", p.amount.toFixed(2));
  if (p.note) q.set("tn", p.note.slice(0, 60));
  return `upi://pay?${q.toString()}`;
}
