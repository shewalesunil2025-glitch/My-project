"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { customerFlow } from "@/content/flow";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/effects/Reveal";

/**
 * "What we build": the customer journey as one connected path.
 * The spine fills as you scroll and each stage lights up in turn.
 */
export function SystemFlow() {
  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 60%", "end 60%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(customerFlow.length - 1, Math.max(0, Math.floor(v * customerFlow.length))));
  });

  const current = customerFlow[active];

  return (
    <section id="system" aria-labelledby="system-title" className="relative py-28 md:py-40">
      <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+12vh)]">
            <Reveal>
              <p className="eyebrow mb-5">What we build</p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 id="system-title" className="display text-[clamp(2.3rem,5vw,4.4rem)]">
                <span className="text-metal">We don&apos;t just build a website.</span>{" "}
                <span className="text-flow">We build the system around it.</span>
              </h2>
            </Reveal>

            <div className="glass mt-10 hidden rounded-[var(--radius-panel)] p-6 lg:block" aria-live="polite">
              <div className="flex items-center justify-between font-mono text-[0.65rem] tracking-[0.2em] text-fg-subtle uppercase">
                <span>Stage {String(active + 1).padStart(2, "0")}</span>
                <span>/ {String(customerFlow.length).padStart(2, "0")}</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-5 flex items-start gap-4"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-flow/15 text-flow-soft">
                    <current.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-2xl font-medium tracking-tight">{current.label}</p>
                    <p className="mt-1 text-fg-muted">{current.detail}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="mt-6 flex gap-1" aria-hidden>
                {customerFlow.map((n, i) => (
                  <span
                    key={n.id}
                    className={cn("h-0.5 flex-1 rounded-full transition-colors duration-500", i <= active ? "bg-flow" : "bg-white/10")}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <ol ref={listRef} className="relative lg:col-span-6 lg:col-start-7" aria-label="The connected customer journey">
          <span className="absolute top-2 bottom-2 left-[1.45rem] w-px bg-white/[0.08]" aria-hidden />
          <motion.span
            style={{ scaleY: fill }}
            className="absolute top-2 bottom-2 left-[1.45rem] w-px origin-top bg-gradient-to-b from-flow-soft via-flow to-live"
            aria-hidden
          />
          {customerFlow.map((node, i) => {
            const on = i <= active;
            return (
              <li key={node.id} className="relative flex gap-6 py-7 md:py-12">
                <span
                  className={cn(
                    "relative z-10 grid size-12 shrink-0 place-items-center rounded-2xl border transition-all duration-700",
                    on
                      ? "border-flow/50 bg-ink-800 text-flow-soft shadow-[0_0_30px_-4px_rgb(122_162_255/0.55)]"
                      : "border-white/10 bg-ink-900 text-fg-subtle",
                  )}
                >
                  <node.icon className="size-5" aria-hidden />
                </span>
                <div className={cn("pt-1 transition-opacity duration-700", on ? "opacity-100" : "opacity-40")}>
                  <p className="font-mono text-[0.65rem] tracking-[0.2em] text-fg-subtle">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1 text-2xl font-medium tracking-tight md:text-3xl">{node.label}</h3>
                  <p className="mt-2 max-w-md text-fg-muted">{node.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
