"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { BookDemoButton } from "@/components/cta/BookDemoButton";
import { ParticleField } from "@/components/effects/ParticleField";
import { HeroVisual } from "./HeroVisual";

const ease = [0.16, 1, 0.3, 1] as const;
const headline = ["BUILD THE", "BUSINESS", "OF 2035."];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const visualScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.12]);
  const visualY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);

  return (
    <section
      ref={ref}
      id="top"
      aria-labelledby="hero-title"
      className="noise relative isolate flex min-h-[100svh] items-center overflow-hidden pt-[var(--header-h)]"
    >
      {/* Horizon light */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(60%_50%_at_70%_40%,rgb(22_179_140/0.16),transparent_70%),radial-gradient(40%_30%_at_10%_90%,rgb(232_201_135/0.06),transparent_70%)]"
      />
      <ParticleField className="-z-10 opacity-80" />

      <div className="container-x grid items-center gap-10 py-12 lg:grid-cols-12 lg:gap-6 lg:py-0">
        <motion.div style={{ y: contentY, opacity: contentOpacity }} className="lg:col-span-6 xl:col-span-6">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease }}
            className="glass mb-8 inline-flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-2 text-xs text-fg-muted"
          >
            <span className="rounded-full bg-live/15 px-2 py-0.5 font-mono text-[0.62rem] tracking-widest text-live uppercase">
              AI
            </span>
            Automation agency for intelligent businesses
          </motion.p>

          <h1 id="hero-title" className="display text-[clamp(3.1rem,9.4vw,7.6rem)]">
            {headline.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <motion.span
                  className={i === 2 ? "text-flow block" : "text-metal block"}
                  initial={reduce ? { opacity: 0 } : { y: "105%" }}
                  animate={reduce ? { opacity: 1 } : { y: "0%" }}
                  transition={{ duration: 1.2, delay: 0.15 + i * 0.12, ease }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7, ease }}
            className="mt-7 max-w-xl text-lg leading-relaxed text-fg-muted md:text-xl"
          >
            AI-powered websites, conversations and workflows that work together as one intelligent business system.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.85, ease }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <BookDemoButton size="lg" icon />
            <ButtonLink href="#system" variant="ghost" size="lg">
              Explore the System
            </ButtonLink>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-12 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[0.68rem] tracking-[0.18em] text-fg-subtle uppercase"
            aria-label="What we connect"
          >
            {["Websites", "WhatsApp", "Voice", "Chat", "Automation"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="size-1 rounded-full bg-flow/70" aria-hidden />
                {t}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div style={{ scale: visualScale, y: visualY }} className="lg:col-span-6 xl:col-span-6">
          <HeroVisual />
        </motion.div>
      </div>

      <motion.a
        href="#problem"
        aria-label="Scroll to learn more"
        style={{ opacity: contentOpacity }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-fg-subtle md:flex"
      >
        <span className="font-mono text-[0.6rem] tracking-[0.3em] uppercase">Scroll</span>
        <ArrowDown className="size-4 animate-float" aria-hidden />
      </motion.a>
    </section>
  );
}
