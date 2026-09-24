"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ecosystem } from "@/content/flow";
import { CoreOrb } from "@/components/3d/CoreOrb";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { Reveal } from "@/components/effects/Reveal";

const RADIUS = 40; // % of stage

export function OneSystem() {
  const ref = useRef<HTMLDivElement>(null);
  const pointer = usePointerParallax();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const spread = useTransform(scrollYProgress, [0.15, 1], [0, 1]);
  const stageScale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);

  return (
    <section id="about" aria-labelledby="one-title" className="relative overflow-hidden py-28 md:py-40">
      <div className="absolute inset-0 bg-[radial-gradient(45%_45%_at_50%_58%,rgb(79_125_255/0.12),transparent_70%)]" aria-hidden />
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
            Every channel, tool and conversation connected through one central AI automation layer.
          </p>
        </Reveal>

        <motion.div
          ref={ref}
          style={{ scale: stageScale }}
          className="relative mx-auto mt-16 aspect-square w-full max-w-[44rem] md:mt-20"
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
            <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="rgb(255 255 255 / .06)" strokeWidth="0.2" />
            <circle cx="50" cy="50" r={RADIUS * 0.62} fill="none" stroke="rgb(255 255 255 / .04)" strokeWidth="0.2" strokeDasharray="0.6 1.2" />
            {ecosystem.map((item, i) => (
              <Spoke key={item.label} index={i} spread={spread} />
            ))}
          </svg>

          <div className="absolute inset-[31%]">
            <CoreOrb pointerX={pointer.x} pointerY={pointer.y} className="size-full" />
          </div>
          <p className="absolute top-1/2 left-1/2 -translate-1/2 pt-[calc(19%+1.5rem)] font-mono text-[0.6rem] tracking-[0.3em] whitespace-nowrap text-fg-subtle uppercase md:text-[0.65rem]">
            Nexa AI layer
          </p>

          <ul aria-label="Connected systems">
            {ecosystem.map((item, i) => (
              <Satellite key={item.label} index={i} spread={spread} label={item.label} Icon={item.icon} />
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

function angle(i: number) {
  return (i / ecosystem.length) * Math.PI * 2 - Math.PI / 2;
}

function Spoke({ index, spread }: { index: number; spread: MotionValue<number> }) {
  const a = angle(index);
  const x = 50 + Math.cos(a) * RADIUS;
  const y = 50 + Math.sin(a) * RADIUS;
  const d = `M50 50 L${x.toFixed(2)} ${y.toFixed(2)}`;
  return (
    <>
      <motion.path d={d} stroke="rgb(122 162 255 / .35)" strokeWidth="0.22" style={{ pathLength: spread }} />
      <path
        d={d}
        stroke="#b7cbff"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeDasharray="0.5 9.5"
        className="animate-dash"
        style={{ animationDelay: `${index * -0.2}s`, animationDirection: index % 2 ? "reverse" : "normal" }}
      />
    </>
  );
}

function Satellite({
  index,
  spread,
  label,
  Icon,
}: {
  index: number;
  spread: MotionValue<number>;
  label: string;
  Icon: (typeof ecosystem)[number]["icon"];
}) {
  const a = angle(index);
  const left = useTransform(spread, [0, 1], ["50%", `${50 + Math.cos(a) * RADIUS}%`]);
  const top = useTransform(spread, [0, 1], ["50%", `${50 + Math.sin(a) * RADIUS}%`]);
  const opacity = useTransform(spread, [0, 0.4], [0, 1]);
  const scale = useTransform(spread, [0, 1], [0.4, 1]);

  return (
    <motion.li style={{ left, top, opacity, scale }} className="absolute -translate-1/2">
      <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-ink-850 shadow-[0_20px_40px_-20px_rgb(0_0_0/0.9)] px-2.5 py-2.5 md:flex-row md:gap-2.5 md:px-4 md:py-3">
        <span className="grid size-7 place-items-center rounded-lg bg-flow/15 text-flow-soft md:size-8">
          <Icon className="size-3.5 md:size-4" aria-hidden />
        </span>
        <span className="text-[0.7rem] font-medium whitespace-nowrap md:text-sm">{label}</span>
      </div>
    </motion.li>
  );
}
