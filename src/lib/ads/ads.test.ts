import { describe, expect, it } from "vitest";
import { copyPrompt, factsOf, normalizeCopy } from "./copy";
import { unsupportedClaims } from "./claims";
import { CREATIVE_PRICES_INR, MIN_DAILY_BUDGET_INR, quote } from "./quote";
import { canMove, EDITABLE } from "./status";
import { describeAreas, MAX_AREAS, radiiHavePins, validateAreas } from "./targeting";

describe("targeting", () => {
  it("accepts 5, 10 and 15 km radius with a place, and a city, a state and All India", () => {
    for (const km of [5, 10, 15]) expect(validateAreas([{ type: "radius", km, label: "Shop, Cidco, Aurangabad" }]).ok).toBe(true);
    expect(validateAreas([{ type: "city", name: "Pune", state: "Maharashtra" }, { type: "state", name: "Gujarat" }]).ok).toBe(true);
    expect(validateAreas([{ type: "india" }])).toEqual({ ok: true, areas: [{ type: "india" }] });
  });
  it("rejects what the platform can't do", () => {
    expect(validateAreas([]).ok).toBe(false);
    expect(validateAreas([{ type: "radius", km: 0.5, label: "x shop" }]).ok).toBe(false);
    expect(validateAreas([{ type: "radius", km: 200, label: "x shop" }]).ok).toBe(false);
    expect(validateAreas([{ type: "radius", km: 10, label: "" }]).ok).toBe(false);
    expect(validateAreas([{ type: "state", name: "Atlantis" }]).ok).toBe(false);
    expect(validateAreas([{ type: "india" }, { type: "city", name: "Pune" }]).ok).toBe(false);
    expect(validateAreas(Array.from({ length: MAX_AREAS + 1 }, () => ({ type: "city", name: "Pune" }))).ok).toBe(false);
  });
  it("catches a map pin outside India (e.g. latitude and longitude swapped)", () => {
    expect(validateAreas([{ type: "radius", km: 10, label: "Shop", lat: 19.87, lng: 75.34 }]).ok).toBe(true);
    expect(validateAreas([{ type: "radius", km: 10, label: "Shop", lat: 75.34, lng: 19.87 }]).ok).toBe(false);
    expect(validateAreas([{ type: "radius", km: 10, label: "Shop", lat: 19.87 }]).ok).toBe(false);
  });
  it("describes areas and knows when a radius still needs a pin", () => {
    const r = validateAreas([{ type: "radius", km: 5, label: "Cidco" }, { type: "city", name: "Pune", state: "Maharashtra" }]);
    if (!r.ok) throw new Error("expected ok");
    expect(describeAreas(r.areas)).toBe("Within 5 km of Cidco · Pune, Maharashtra");
    expect(radiiHavePins(r.areas)).toBe(false);
  });
});

describe("quote", () => {
  it("keeps the ad spend (paid to Meta) apart from ibaxai's creative fee, with no mark-up", () => {
    const r = quote({ dailyBudgetInr: 500, days: 7, imagePacks: 1, templateVideos: 2, aiVideos: 0 });
    if (!r.ok) throw new Error(r.error);
    expect(r.quote.adSpendInr).toBe(3500);
    expect(r.quote.creativeFeeInr).toBe(CREATIVE_PRICES_INR.imagePack + 2 * CREATIVE_PRICES_INR.templateVideo);
    expect(r.quote.payableToIbaxInr).toBe(r.quote.creativeFeeInr + r.quote.taxInr);
    expect(r.quote.payableToIbaxInr).not.toBeGreaterThan(r.quote.creativeFeeInr * 1.5);
    expect(r.quote.lines).toHaveLength(2);
  });
  it("rejects bad numbers", () => {
    const ok = { dailyBudgetInr: 200, days: 5, imagePacks: 1, templateVideos: 0, aiVideos: 0 };
    expect(quote({ ...ok, dailyBudgetInr: MIN_DAILY_BUDGET_INR - 1 }).ok).toBe(false);
    expect(quote({ ...ok, dailyBudgetInr: 150.5 }).ok).toBe(false);
    expect(quote({ ...ok, days: 0 }).ok).toBe(false);
    expect(quote({ ...ok, days: 91 }).ok).toBe(false);
    expect(quote({ ...ok, imagePacks: 0 }).ok).toBe(false);
    expect(quote({ ...ok, imagePacks: -1 }).ok).toBe(false);
    expect(quote({ ...ok, imagePacks: "2" as unknown as number }).ok).toBe(false);
  });
});

describe("status", () => {
  it("only moves forward, and never straight to active", () => {
    expect(canMove("draft", "awaiting_payment")).toBe(false);
    expect(canMove("awaiting_payment", "paid")).toBe(true);
    expect(canMove("paid", "active")).toBe(false);
    expect(canMove("ready_to_launch", "active")).toBe(false);
    expect(canMove("ready_to_launch", "submitted")).toBe(true);
    expect(canMove("submitted", "active")).toBe(true);
    expect(canMove("completed", "active")).toBe(false);
  });
  it("the brief can no longer change once payment starts", () => {
    expect(EDITABLE).not.toContain("awaiting_payment");
    expect(EDITABLE).not.toContain("paid");
  });
});

describe("ad text must not invent claims", () => {
  const facts = "Sharma Sweets, Aurangabad. Diwali box of 12 mithai for Rs 499. Fresh sweets daily.";
  it("lets through amounts the owner gave", () => {
    expect(unsupportedClaims("Diwali box of 12 mithai for ₹499", facts)).toEqual([]);
    expect(unsupportedClaims("Rs. 499 only", facts)).toEqual([]);
    expect(unsupportedClaims("Fresh sweets daily in Aurangabad", facts)).toEqual([]);
  });
  it("flags invented prices, discounts and guarantees", () => {
    expect(unsupportedClaims("Now only ₹299!", facts)).toEqual(["₹299"]);
    expect(unsupportedClaims("Get 20% off today", facts)).toEqual(["20%"]);
    expect(unsupportedClaims("100% guaranteed taste", facts).length).toBeGreaterThan(0);
    expect(unsupportedClaims("The best in town, risk-free", facts).length).toBeGreaterThan(0);
  });
  it("a claim is fine when the owner wrote it", () => {
    expect(unsupportedClaims("Flat 10% off", "Flat 10% off on all orders")).toEqual([]);
  });
});

describe("copy", () => {
  it("asks for facts only and the right language", () => {
    const { system, user } = copyPrompt({ businessName: "Sharma Sweets", category: "Sweet shop", city: "Aurangabad", services: "mithai", description: "", targetCustomers: "", objective: "whatsapp", offer: "", language: "hi", count: 3 });
    expect(system).toMatch(/Hindi/);
    expect(system).toMatch(/Never invent prices/);
    expect(system).toMatch(/WHATSAPP_MESSAGE/);
    expect(user).toMatch(/Sharma Sweets/);
    expect(factsOf({ businessName: "A", category: "", city: "B", services: "", description: "", offer: "O", targetCustomers: "" })).toBe("A\nB\nO");
  });
  it("trims lengths, fixes buttons and drops the wrong language", () => {
    const out = normalizeCopy(
      { variations: [
        { language: "en", headline: "x".repeat(60), primary_text: "Fresh sweets, made today.", description: "Order now", cta: "NOT_A_BUTTON" },
        { language: "hi", headline: "ताज़ा मिठाई", primary_text: "आज ही आर्डर करें", description: "", cta: "SHOP_NOW" },
        { language: "en", headline: "", primary_text: "empty headline", description: "", cta: "SHOP_NOW" },
      ] },
      "en",
      "LEARN_MORE",
    );
    expect(out).toHaveLength(1);
    expect(out[0].headline.length).toBeLessThanOrEqual(40);
    expect(out[0].cta).toBe("LEARN_MORE");
    expect(normalizeCopy(null, "en", "LEARN_MORE")).toEqual([]);
  });
});
