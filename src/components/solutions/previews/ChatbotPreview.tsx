"use client";

import { Bot } from "lucide-react";
import { Appear, Bubble, Frame, Typing } from "./parts";
import { useSequence } from "@/hooks/useSequence";

const quick = ["Pricing", "Book a visit", "Talk to a human"];

export function ChatbotPreview() {
  const step = useSequence(5, 1000);
  return (
    <Frame title="AI assistant — trained on your business">
      <div className="flex h-full flex-col justify-end gap-2.5">
        <Bubble from="ai" show={step >= 0}>
          <span className="inline-flex items-center gap-1.5">
            <Bot className="size-3.5 text-flow-soft" aria-hidden /> Hi! Ask me anything about our services.
          </span>
        </Bubble>
        <Bubble from="user" show={step >= 1}>Do you deliver to Andheri?</Bubble>
        <Typing show={step === 2} />
        <Bubble from="ai" show={step >= 3}>
          Yes — same-day delivery to Andheri for orders before 3 PM. Want me to start an order?
        </Bubble>
        <Appear show={step >= 4} className="flex flex-wrap gap-2 pt-1">
          {quick.map((q) => (
            <span key={q} className="rounded-full border border-white/12 px-3 py-1.5 text-[0.72rem] text-fg-muted">
              {q}
            </span>
          ))}
        </Appear>
      </div>
    </Frame>
  );
}
