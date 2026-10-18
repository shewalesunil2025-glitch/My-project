import { describe, expect, it } from "vitest";
import { speechChunks } from "./naturalVoice";

describe("speechChunks", () => {
  it("says the first sentence on its own, then groups the rest", () => {
    const text = "Dhiru ji, namaste! Main IBAX hoon. Aaj main aapki kya madad kar sakta hoon? WhatsApp Automation ya Google Reviews ka setup kar sakte hain.";
    const chunks = speechChunks(text, 80);
    expect(chunks[0]).toBe("Dhiru ji, namaste!");
    expect(chunks.join(" ")).toBe(text);
    expect(chunks.every((c) => c.length <= 80)).toBe(true);
  });

  it("keeps every word of a long answer, in pieces the voice server accepts", () => {
    const text = Array.from({ length: 30 }, (_, i) => `Yeh line number ${i + 1} hai aur isme kuch shabd hain।`).join(" ");
    const chunks = speechChunks(text);
    expect(chunks.join(" ")).toBe(text);
    expect(chunks.every((c) => c.length <= 260)).toBe(true);
  });

  it("splits one very long sentence without losing words", () => {
    const text = "shabd ".repeat(120).trim();
    const chunks = speechChunks(text, 100);
    expect(chunks.join(" ").replace(/\s+/g, " ")).toBe(text);
    expect(chunks.every((c) => c.length <= 100)).toBe(true);
  });
});
