"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { industries } from "@/content/industries";
import { cn } from "@/lib/cn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BookDemoButton } from "@/components/cta/BookDemoButton";

export function Industries() {
  const [activeId, setActiveId] = useState(industries[1].id);
  const active = industries.find((i) => i.id === activeId) ?? industries[0];

  return (
    <section id="industries" aria-labelledby="industries-title" className="relative py-28 md:py-40">
      <div className="container-x">
        <SectionHeading
          id="industries-title"
          eyebrow="Industries"
          title={
            <>
              Built for businesses <span className="text-flow">that talk to customers.</span>
            </>
          }
          lead="Choose an industry to see the flow we'd build."
        />

        <div className="mt-12 flex flex-wrap gap-2" role="group" aria-label="Choose an industry">
          {industries.map((ind) => {
            const selected = ind.id === activeId;
            return (
              <button
                key={ind.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setActiveId(ind.id)}
                className={cn(
                  "relative rounded-full border px-4 py-2.5 text-sm transition-colors duration-300",
                  selected ? "border-transparent text-ink-950" : "border-white/10 text-fg-muted hover:border-white/25 hover:text-fg",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="industry-active"
                    className="absolute inset-0 rounded-full bg-fg"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{ind.name}</span>
              </button>
            );
          })}
        </div>

        <div className="glass relative mt-8 overflow-hidden rounded-[1.75rem] p-6 md:p-10" aria-live="polite">
          <div className="grid-backdrop absolute inset-0 opacity-50" aria-hidden />
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                  <p className="font-mono text-[0.65rem] tracking-[0.2em] text-fg-subtle uppercase">Example flow</p>
                  <motion.h3
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="display mt-3 text-[clamp(2rem,4.5vw,3.6rem)]"
                  >
                    {active.name}
                  </motion.h3>
                  <p className="mt-3 max-w-lg text-fg-muted">{active.outcome}</p>
                </div>
                <BookDemoButton label="Build this flow" interest={`${active.name} automation`} variant="ghost" icon />
              </div>

              <ol className="relative mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6 xl:gap-0">
                <motion.span
                  className="absolute top-7 right-[8%] left-[8%] hidden h-px origin-left bg-gradient-to-r from-flow-soft/30 via-flow to-live xl:block"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.4, delay: 0.2, ease: [0.65, 0, 0.35, 1] }}
                  aria-hidden
                />
                {active.flow.map((step, i) => (
                  <motion.li
                    key={step}
                    initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.6, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                    className="relative flex flex-col items-start gap-3 rounded-2xl border border-white/[0.07] bg-ink-900/60 p-4 xl:items-center xl:border-0 xl:bg-transparent xl:p-0 xl:text-center"
                  >
                    <span className="relative z-10 grid size-14 place-items-center rounded-2xl border border-flow/30 bg-ink-850 font-mono text-xs text-flow-soft shadow-[0_0_30px_-8px_rgb(69_214_176/0.6)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-medium md:text-base">{step}</span>
                  </motion.li>
                ))}
              </ol>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
