"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ButtonLink } from "@/components/ui/Button";
import { BookDemoButton } from "@/components/cta/BookDemoButton";
import { introDelay } from "@/components/effects/IntroLoader";
import { NeuralField } from "@/components/effects/NeuralField";
import { Scramble } from "@/components/effects/Scramble";
import { HeroCircuit } from "./HeroCircuit";

const ease = [0.16, 1, 0.3, 1] as const;

const STREAM =
  "AI-powered websites, conversations and workflows that work together as one intelligent business system — answering, booking and following up around the clock.";

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
      {/* Neural network that fires around the cursor */}
      <NeuralField className="absolute inset-0 -z-10 opacity-80" />
      {/* Aurora: violet and cyan light drifting behind everything */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div className="absolute -top-40 left-[8%] h-[34rem] w-[34rem] animate-aurora rounded-full bg-[radial-gradient(circle,rgb(124_58_237/0.35),transparent_65%)] blur-3xl" />
        <div className="absolute -top-24 right-[4%] h-[30rem] w-[30rem] animate-aurora rounded-full bg-[radial-gradient(circle,rgb(34_211_238/0.22),transparent_65%)] blur-3xl [animation-delay:-9s]" />
      </div>
      {/* Holographic floor the character stands on, with a scanning light */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[46%] overflow-hidden">
        <div className="grid-floor absolute inset-x-[-30%] top-0 h-[160%]" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 h-24 animate-scan bg-[linear-gradient(to_bottom,transparent,rgb(34_211_238/0.06),transparent)]" />
      </div>

      <motion.div style={{ y: copyY, opacity: copyOpacity }} className="container-x relative text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: d, ease }}
          className="badge font-mono tracking-wide uppercase before:hidden"
        >
          <span className="relative mr-1 inline-grid size-3.5 place-items-center">
            <span className="ai-orb animate-orb inset-0" />
          </span>
          <Scramble text="AI automation agency" delay={d + 0.2} />
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

        {/* The line streams in word by word, like an AI answer being written. */}
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-fg-muted md:text-lg">
          {STREAM.split(" ").map((word, i) => (
            <motion.span
              key={i}
              initial={reduce ? false : { opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.35, delay: d + 0.55 + i * 0.045 }}
            >
              {word}{" "}
            </motion.span>
          ))}
          <span aria-hidden className="ml-0.5 inline-block h-[1.05em] w-[0.5ch] translate-y-[0.18em] animate-caret rounded-[1px] bg-flow-soft" />
        </p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: d + 1.2, ease }}
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
