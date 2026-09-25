"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ButtonLink } from "@/components/ui/Button";
import { BookDemoButton } from "@/components/cta/BookDemoButton";
import { introDelay } from "@/components/effects/IntroLoader";
import { HeroCircuit } from "./HeroCircuit";

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  // Start the entrances as the intro curtain lifts (0 when there was no intro).
  const [d] = useState(introDelay);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -80]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  return (
    <section
      ref={ref}
      id="top"
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden pt-[calc(var(--header-h)+2.25rem)]"
    >
      {/* Faint architectural grid */}
      <div aria-hidden className="grid-backdrop absolute inset-0 -z-10 opacity-60" />
      {/* Ember light beam from the top-right corner */}
      <div aria-hidden className="pointer-events-none absolute -top-40 right-[-12%] -z-10 h-[46rem] w-[46rem] md:right-[-4%]">
        <div className="absolute top-1/2 left-1/2 h-[7rem] w-[52rem] -translate-1/2 rotate-[-38deg] animate-beam rounded-full bg-[linear-gradient(90deg,transparent,rgb(255_90_31/0.15)_30%,rgb(255_110_50/0.75)_62%,rgb(255_200_170/0.9)_78%,transparent)] blur-2xl" />
        <div className="absolute top-1/2 left-1/2 h-[1.4rem] w-[40rem] -translate-1/2 rotate-[-38deg] rounded-full bg-[linear-gradient(90deg,transparent,rgb(255_120_60/0.6)_55%,rgb(255_230_210/0.95)_80%,transparent)] blur-md" />
      </div>
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(40%_50%_at_75%_0%,rgb(255_90_31/0.14),transparent_70%)]" />

      <motion.div style={{ y: copyY, opacity: copyOpacity }} className="container-x relative text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: d, ease }}
          className="badge"
        >
          AI automation agency
        </motion.p>

        <h1 id="hero-title" className="display mx-auto mt-6 max-w-4xl text-[clamp(2.6rem,6.6vw,5.4rem)]">
          {["The business", "that never sleeps."].map((line, i) => (
            <span key={line} className="block overflow-hidden pb-[0.08em]">
              <motion.span
                // Gradient on each moving line: Chrome paints clipped text late on moving children.
                className="text-metal block"
                initial={reduce ? { opacity: 0 } : { y: "105%" }}
                animate={reduce ? { opacity: 1 } : { y: "0%" }}
                transition={{ duration: 1.1, delay: d + 0.1 + i * 0.12, ease }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: d + 0.5, ease }}
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-fg-muted md:text-lg"
        >
          AI-powered websites, conversations and workflows that work together as one intelligent business system —
          answering, booking and following up around the clock.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: d + 0.65, ease }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <BookDemoButton size="lg" />
          <ButtonLink href="#solutions" variant="ghost" size="lg">
            See What We Build
          </ButtonLink>
        </motion.div>
      </motion.div>

      <HeroCircuit delay={d} />
    </section>
  );
}
