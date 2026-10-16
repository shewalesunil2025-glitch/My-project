import { describe, expect, it } from "vitest";
import { buildWaConversations } from "./whatsappChats";

describe("Inbox WhatsApp conversations", () => {
  it("groups messages per customer, marks failed replies and needs-attention", () => {
    const contacts = [{ instance: "ibax-911", phone: "9198", name: "Asha", lead_temp: "hot" as const, interest: "", bot_status: "paused" as const, needs_attention: true, last_at: "2026-10-16T10:00:00Z" }];
    const base = { instance: "ibax-911", phone: "9198", name: "Asha", needs_human: false, delivery: "sent" };
    const messages = [
      { ...base, id: "1", direction: "in" as const, text: "price?", created_at: "2026-10-16T09:00:00Z" },
      { ...base, id: "2", direction: "out" as const, text: "Rs 500", delivery: "failed", created_at: "2026-10-16T09:01:00Z" },
    ];
    const [c] = buildWaConversations(messages, contacts);
    expect(c.messages.map((m) => m.from)).toEqual(["customer", "assistant"]);
    expect(c.messages[1].text).toContain("not delivered");
    expect(c.failed).toBe(true);
    expect(c.important).toBe(true);
    expect(c.wa.botOn).toBe(false);
  });
});
