import { describe, expect, it } from "vitest";
import { dialForCountry, fullDigits, phoneAccount, phoneDigits } from "./phone";

describe("phone numbers", () => {
  it("keeps Indian 10-digit numbers working", () => {
    expect(phoneDigits("98765 43210")).toBe("919876543210");
    expect(phoneAccount("098765 43210")).toBe("+919876543210");
    expect(phoneDigits("+91 98765 43210")).toBe("919876543210");
  });
  it("does not treat an international number as Indian", () => {
    expect(phoneDigits("+1 415 555 0100")).toBe("14155550100");
    expect(phoneDigits("0044 20 7946 0958")).toBe("442079460958");
  });
  it("uses the business country for a national number", () => {
    expect(phoneDigits("415 555 0100", "1")).toBe("14155550100");
  });
  it("rejects invalid numbers", () => {
    expect(phoneDigits("12345")).toBeNull();
    expect(phoneDigits("abc")).toBeNull();
    expect(fullDigits("+0 1234")).toBeNull();
  });
  it("fullDigits never adds a code", () => {
    expect(fullDigits("14155550100")).toBe("14155550100");
  });
  it("defaults to India", () => {
    expect(dialForCountry(undefined)).toBe("91");
  });
});
