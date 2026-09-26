"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useDemo } from "@/components/cta/DemoProvider";

/**
 * Floating AI core in the corner — a living orb that opens the demo booking.
 * It says exactly what it does ("Book a demo"): no pretend chat.
 */
export function AiOrb() {
  const { openDemo } = useDemo();
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      aria-haspopup="dialog"
      aria-label="Book a free demo with Nexa Flow AI"
      onClick={() => openDemo("AI orb")}
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 2.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="group fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-full border border-white/10 bg-ink-900/80 p-1.5 sm:pr-4 text-sm font-semibold text-fg shadow-[0_20px_50px_-20px_rgb(139_92_246/0.8)] backdrop-blur-md transition-colors hover:border-flow/50 md:right-6 md:bottom-6"
    >
      <span className="relative grid size-10 place-items-center">
        <span className={reduce ? "ai-orb" : "ai-orb animate-orb"} />
        <span className="absolute inset-0 rounded-full ring-1 ring-white/15" />
      </span>
      <span className="hidden leading-tight sm:block">
        <span className="block text-[0.65rem] font-medium tracking-[0.14em] text-fg-subtle uppercase">Nexa AI</span>
        <span className="block">Book a demo</span>
      </span>
    </motion.button>
  );
}
