"use client";

import { motion } from "framer-motion";
import { Check, PhoneCall } from "lucide-react";
import { cn } from "@/lib/cn";
import { Appear } from "./parts";
import { useSequence } from "@/hooks/useSequence";

const transcript = [
  { who: "Caller", text: "Hi, do you open on Sundays?" },
  { who: "AI", text: "We're open 10 to 4 on Sundays. Would you like to book?" },
  { who: "Caller", text: "Yes, for a cleaning." },
  { who: "AI", text: "Sunday at 11:30 is free — shall I confirm?" },
];

export function VoicePreview() {
  const step = useSequence(transcript.length + 2, 1200);
  const live = step >= 1 && step <= transcript.length;

  return (
    <div className="mx-auto flex h-full max-w-sm flex-col items-center rounded-[1.75rem] border border-white/10 bg-ink-900/80 p-5 text-center">
      <div className="relative mt-2 grid size-20 place-items-center">
        {live &&
          [0, 1].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border border-flow/40"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.7, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, delay: i, ease: "easeOut" }}
            />
          ))}
        <span className={cn("grid size-16 place-items-center rounded-full transition-colors", live ? "bg-flow/25 text-flow-soft" : "bg-white/[0.06] text-fg-muted")}>
          <PhoneCall className="size-6" aria-hidden />
        </span>
      </div>
      <p className="mt-4 font-mono text-[0.65rem] tracking-[0.2em] text-fg-subtle uppercase">
        {step === 0 ? "Incoming call" : step > transcript.length ? "Call complete" : "AI receptionist · live"}
      </p>
      <div className="mt-5 w-full flex-1 space-y-2.5 text-left">
        {transcript.map((line, i) => (
          <Appear key={i} show={step >= i + 1}>
            <p className="text-[0.8rem] leading-snug md:text-sm">
              <span className={cn("mr-2 font-mono text-[0.6rem] uppercase", line.who === "AI" ? "text-flow-soft" : "text-fg-subtle")}>
                {line.who}
              </span>
              <span className="text-fg-muted">{line.text}</span>
            </p>
          </Appear>
        ))}
      </div>
      <Appear show={step > transcript.length} className="w-full">
        <p className="flex items-center justify-center gap-2 rounded-xl border border-live/30 bg-live/10 px-3 py-2 text-xs text-live">
          <Check className="size-3.5" aria-hidden /> Booked · confirmation sent on WhatsApp
        </p>
      </Appear>
    </div>
  );
}
