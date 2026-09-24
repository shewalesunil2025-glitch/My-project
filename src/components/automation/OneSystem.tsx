"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ecosystem } from "@/content/flow";
import { CoreOrb } from "@/components/3d/CoreOrb";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { Reveal } from "@/components/effects/Reveal";

const RADIUS = 38; // % of stage

type System = (typeof ecosystem)[number];

export function OneSystem() {
  const ref = useRef<HTMLDivElement>(null);
  const pointer = usePointerParallax();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const spread = useTransform(scrollYProgress, [0.15, 1], [0, 1]);
  const stageScale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);

  return (
    <section id="about" aria-labelledby="one-title" className="relative overflow-hidden py-28 md:py-40">
      <div className="absolute inset-0 bg-[radial-gradient(45%_45%_at_50%_58%,rgb(22_179_140/0.12),transparent_70%)]" aria-hidden />
      <div className="container-x relative text-center">
        <Reveal>
          <p className="eyebrow mb-5">One system</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 id="one-title" className="display text-[clamp(2.6rem,7.5vw,6.5rem)]">
            <span className="text-metal block">ONE BUSINESS.</span>
            <span className="text-flow block">ONE INTELLIGENT FLOW.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-fg-muted md:text-xl">
            One AI in the middle runs all six. A new lead on your website becomes a WhatsApp chat, a booking and a
            review — automatically.
          </p>
        </Reveal>

        {/* Desktop & tablet — hub and spokes */}
        <motion.div
          ref={ref}
          style={{ scale: stageScale }}
          className="relative mx-auto mt-16 hidden aspect-square w-full max-w-[46rem] md:mt-20 md:block"
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
            <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="rgb(255 255 255 / .06)" strokeWidth="0.2" />
            {ecosystem.map((item, i) => (
              <Spoke key={item.label} index={i} spread={spread} />
            ))}
          </svg>

          <div className="absolute inset-[33%]">
            <CoreOrb pointerX={pointer.x} pointerY={pointer.y} className="size-full" />
          </div>
          <CoreLabel className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(50%+4.25rem)] rounded-2xl border border-white/10 bg-ink-900/90 px-4 py-2 backdrop-blur-sm" />

          <ul aria-label="Connected systems">
            {ecosystem.map((item, i) => (
              <Satellite key={item.label} index={i} spread={spread} item={item} />
            ))}
          </ul>
        </motion.div>

        {/* Mobile — simple list */}
        <div className="mt-14 md:hidden">
          <div className="mx-auto w-40">
            <CoreOrb pointerX={pointer.x} pointerY={pointer.y} className="size-full" />
          </div>
          <CoreLabel className="mt-4" />
          <ul aria-label="Connected systems" className="mt-8 grid grid-cols-2 gap-3 text-left">
            {ecosystem.map((item, i) => (
              <Reveal as="li" key={item.label} delay={i * 0.05}>
                <SystemCard item={item} />
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function CoreLabel({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-base font-semibold tracking-tight whitespace-nowrap">Nexa AI</p>
      <p className="text-sm whitespace-nowrap text-fg-muted">Connects everything</p>
    </div>
  );
}

function SystemCard({ item }: { item: System }) {
  return (
    <div className="flex h-full items-center gap-3 rounded-2xl border border-white/10 bg-ink-850 px-3.5 py-3 text-left shadow-[0_20px_40px_-20px_rgb(0_0_0/0.9)] md:px-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-flow/15 text-flow-soft">
        <item.icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{item.label}</span>
        <span className="block text-xs text-fg-muted">{item.benefit}</span>
      </span>
    </div>
  );
}

function point(i: number) {
  const a = (i / ecosystem.length) * Math.PI * 2 - Math.PI / 2;
  return { x: 50 + Math.cos(a) * RADIUS, y: 50 + Math.sin(a) * RADIUS };
}

function Spoke({ index, spread }: { index: number; spread: MotionValue<number> }) {
  const { x, y } = point(index);
  const d = `M50 50 L${x.toFixed(2)} ${y.toFixed(2)}`;
  return (
    <>
      <motion.path d={d} stroke="rgb(69 214 176 / .35)" strokeWidth="0.22" style={{ pathLength: spread }} />
      <path
        d={d}
        stroke="#a8f0dc"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeDasharray="0.5 9.5"
        className="animate-dash"
        style={{ animationDelay: `${index * -0.2}s`, animationDirection: index % 2 ? "reverse" : "normal" }}
      />
    </>
  );
}

function Satellite({ index, spread, item }: { index: number; spread: MotionValue<number>; item: System }) {
  const { x, y } = point(index);
  const left = useTransform(spread, [0, 1], ["50%", `${x}%`]);
  const top = useTransform(spread, [0, 1], ["50%", `${y}%`]);
  const opacity = useTransform(spread, [0, 0.4], [0, 1]);
  const scale = useTransform(spread, [0, 1], [0.4, 1]);

  return (
    <motion.li style={{ left, top, opacity, scale }} className="absolute w-52 -translate-1/2">
      <SystemCard item={item} />
    </motion.li>
  );
}
