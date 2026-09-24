"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { processSteps } from "@/content/process";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/effects/Reveal";

/**
 * Desktop: a pinned stage where each scroll step swaps in the next phase.
 * Mobile/tablet: a simple vertical sequence — no pinning.
 */
export function Process() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(processSteps.length - 1, Math.floor(v * processSteps.length)));
  });

  const step = processSteps[active];

  return (
    <section id="process" aria-labelledby="process-title process-title-m" className="relative">
      {/* Desktop — pinned */}
      <div ref={ref} className="relative hidden h-[300vh] lg:block">
        <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
          <div className="container-x">
            <div className="flex items-end justify-between gap-10">
              <div>
                <p className="eyebrow mb-5">How it works</p>
                <h2 id="process-title" className="display text-metal text-[clamp(2.4rem,5vw,4.4rem)]">
                  Four steps. One flow.
                </h2>
              </div>
              <p className="max-w-xs text-fg-muted">From first conversation to a live system — usually in a few weeks.</p>
            </div>

            <div className="relative mt-16 grid grid-cols-12 items-center gap-10">
              <div className="relative col-span-5 h-[16rem]">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={step.index}
                    initial={{ opacity: 0, y: 80, filter: "blur(12px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -80, filter: "blur(12px)" }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="display text-flow absolute inset-0 text-[16rem] leading-none"
                    aria-hidden
                  >
                    {step.index}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="col-span-6 col-start-7 min-h-[12rem]" aria-live="polite">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h3 className="text-5xl font-semibold tracking-tight uppercase">{step.title}</h3>
                    <p className="mt-5 max-w-md text-xl text-fg-muted">{step.body}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <ol className="mt-16 grid grid-cols-4 gap-4">
              {processSteps.map((s, i) => (
                <li key={s.index} className="relative">
                  <span className="block h-px w-full bg-white/10" />
                  <motion.span
                    className="absolute top-0 left-0 block h-px w-full origin-left bg-flow"
                    initial={false}
                    animate={{ scaleX: i <= active ? 1 : 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <p className={cn("mt-4 flex gap-3 text-sm transition-colors duration-500", i <= active ? "text-fg" : "text-fg-subtle")}>
                    <span className="font-mono">{s.index}</span>
                    <span className="font-medium tracking-wide uppercase">{s.title}</span>
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Mobile & tablet — stacked */}
      <div className="container-x py-28 lg:hidden">
        <Reveal>
          <p className="eyebrow mb-5">How it works</p>
          <h2 id="process-title-m" className="display text-metal text-[clamp(2.4rem,8vw,4rem)]">
            Four steps. One flow.
          </h2>
        </Reveal>
        <ol className="mt-12 space-y-4">
          {processSteps.map((s, i) => (
            <Reveal as="li" key={s.index} delay={i * 0.06} className="glass rounded-2xl p-6">
              <span className="display text-flow text-5xl">{s.index}</span>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight uppercase">{s.title}</h3>
              <p className="mt-2 text-fg-muted">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
