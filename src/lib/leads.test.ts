import { describe, expect, it } from "vitest";
import { validateCallback } from "./leads";

describe("validateCallback", () => {
  it("accepts a name and a mobile number, email optional", () => {
    expect(validateCallback({ name: "Ravi", phone: "+91 98765 43210" }).req).toMatchObject({ name: "Ravi", phone: "+91 98765 43210", email: "" });
  });
  it("needs a name and a real-looking number", () => {
    expect(validateCallback({ name: "", phone: "9876543210" }).error).toBeTruthy();
    expect(validateCallback({ name: "Ravi", phone: "12345" }).error).toBeTruthy();
  });
  it("rejects a wrong email but allows an empty one", () => {
    expect(validateCallback({ name: "Ravi", phone: "9876543210", email: "ravi@" }).error).toBeTruthy();
    expect(validateCallback({ name: "Ravi", phone: "9876543210", email: "" }).req).toBeTruthy();
  });
});
