import { describe, expect, it } from "vitest";
import { upiAmount, upiUri, validUpi } from "./upi";

describe("upi", () => {
  it("accepts real-looking UPI IDs only", () => {
    expect(validUpi("ravicafe@okhdfc")).toBe(true);
    expect(validUpi("9876543210@ybl")).toBe(true);
    expect(validUpi("ravi cafe@okhdfc")).toBe(false);
    expect(validUpi("ravicafe")).toBe(false);
    expect(validUpi("ravi@")).toBe(false);
  });
  it("reads amounts and rejects silly ones", () => {
    expect(upiAmount("₹1,500")).toBe(1500);
    expect(upiAmount("0")).toBeUndefined();
    expect(upiAmount("abc")).toBeUndefined();
    expect(upiAmount("200000")).toBeUndefined();
  });
  it("builds the upi:// link", () => {
    expect(upiUri({ upiId: "ravicafe@okhdfc", name: "Ravi Cafe", amount: 250 })).toBe("upi://pay?pa=ravicafe%40okhdfc&pn=Ravi+Cafe&cu=INR&am=250.00");
  });
});
