"use client";

import { CalendarCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { Appear, Bubble, Frame } from "./parts";
import { useSequence } from "@/hooks/useSequence";

export function WebsitePreview() {
  const step = useSequence(4, 1100);
  return (
    <Frame title="yourbusiness.com">
      <div className="flex items-center justify-between">
        <span className="h-2 w-16 rounded-full bg-white/20" />
        <div className="flex gap-3">
          {[10, 12, 9].map((w, i) => (
            <span key={i} className="h-1.5 rounded-full bg-white/10" style={{ width: `${w * 3}px` }} />
          ))}
        </div>
      </div>
      <div className="mt-8 space-y-2.5">
        <span className="block h-4 w-3/4 rounded-md bg-white/20" />
        <span className="block h-4 w-1/2 rounded-md bg-white/20" />
        <span className="block h-2 w-2/3 rounded-full bg-white/[0.08]" />
      </div>
      <div className="mt-6 flex gap-2">
        <span
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[0.7rem] font-medium transition-all duration-500",
            step >= 3 ? "bg-live text-ink-950" : "bg-fg text-ink-950",
          )}
        >
          <CalendarCheck className="size-3.5" aria-hidden />
          {step >= 3 ? "Booked" : "Book now"}
        </span>
        <span className="h-8 w-24 rounded-full border border-white/10" />
      </div>
      <div className="absolute right-4 bottom-4 w-[62%] space-y-2 md:right-5 md:bottom-5">
        <Bubble from="user" show={step >= 1}>Do you have slots this week?</Bubble>
        <Bubble from="ai" show={step >= 2}>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3 text-flow-soft" aria-hidden /> Yes — Thursday 4:30 PM is open.
          </span>
        </Bubble>
        <Appear show={step >= 4}>
          <p className="rounded-xl border border-live/30 bg-live/10 px-3 py-2 font-mono text-[0.65rem] text-live">
            Lead captured · booking confirmed
          </p>
        </Appear>
      </div>
    </Frame>
  );
}
