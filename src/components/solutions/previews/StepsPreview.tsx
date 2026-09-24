"use client";

import { Check, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useSequence } from "@/hooks/useSequence";

export type PreviewStep = { label: string; meta: string; icon: LucideIcon };

/** Vertical timeline that completes one stage at a time. Used for booking & reviews. */
export function StepsPreview({ title, steps }: { title: string; steps: PreviewStep[] }) {
  const step = useSequence(steps.length, 1000);
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-ink-900/80 p-5 md:p-6">
      <p className="font-mono text-[0.65rem] tracking-[0.2em] text-fg-subtle uppercase">{title}</p>
      <ol className="relative mt-6 flex-1 space-y-5">
        <span className="absolute top-4 bottom-4 left-[1.1rem] w-px bg-white/[0.08]" aria-hidden />
        <motion.span
          className="absolute top-4 left-[1.1rem] w-px origin-top bg-flow"
          animate={{ height: `calc(${(Math.max(0, step - 1) / (steps.length - 1)) * 100}% - 2rem)` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden
        />
        {steps.map((s, i) => {
          const done = step > i;
          return (
            <li key={s.label} className="relative flex items-center gap-4">
              <span
                className={cn(
                  "relative z-10 grid size-9 shrink-0 place-items-center rounded-xl border transition-all duration-500",
                  done ? "border-flow/50 bg-ink-800 text-flow-soft shadow-[0_0_24px_-6px_rgb(69_214_176/0.7)]" : "border-white/10 bg-ink-900 text-fg-subtle",
                )}
              >
                {done && i === steps.length - 1 ? <Check className="size-4 text-live" aria-hidden /> : <s.icon className="size-4" aria-hidden />}
              </span>
              <div className={cn("transition-opacity duration-500", done ? "opacity-100" : "opacity-40")}>
                <p className="text-sm font-medium md:text-base">{s.label}</p>
                <p className="font-mono text-[0.65rem] text-fg-subtle">{s.meta}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
