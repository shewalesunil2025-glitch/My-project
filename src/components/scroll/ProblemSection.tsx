"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { fragmentedTools } from "@/content/flow";
import { useMediaQuery } from "@/hooks/useMediaQuery";

type Pos = { x: number; y: number; r: number };

/** Where each tool floats while the business is fragmented (% of stage). */
const scattered: Pos[] = [
  { x: 14, y: 52, r: -8 },
  { x: 84, y: 48, r: 6 },
  { x: 32, y: 80, r: 5 },
  { x: 70, y: 70, r: -5 },
  { x: 52, y: 90, r: 9 },
  { x: 10, y: 80, r: -4 },
];
const scatteredMobile: Pos[] = [
  { x: 26, y: 50, r: -8 },
  { x: 74, y: 55, r: 6 },
  { x: 30, y: 67, r: 5 },
  { x: 72, y: 73, r: -5 },
  { x: 34, y: 85, r: 7 },
  { x: 70, y: 90, r: -4 },
];

const broken = ["No reply", "12 unread", "Missed call", "Double-booked", "Forgotten", "Never asked"];

export function ProblemSection() {
  const ref = useRef<HTMLElement>(null);
  const desktop = useMediaQuery("(min-width: 768px)");
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const problemOpacity = useTransform(p, [0, 0.05, 0.42, 0.52], [0.25, 1, 1, 0]);
  const problemY = useTransform(p, [0.42, 0.52], [0, -40]);
  const answerOpacity = useTransform(p, [0.66, 0.78], [0, 1]);
  const answerY = useTransform(p, [0.66, 0.78], [40, 0]);
  const lineScale = useTransform(p, [0.55, 0.72], [0, 1]);
  const pulse = useTransform(p, [0.74, 1], ["0%", "100%"]);

  const count = fragmentedTools.length;
  const aligned: Pos[] = fragmentedTools.map((_, i) =>
    desktop
      ? { x: 12 + (76 / (count - 1)) * i, y: 58, r: 0 }
      : { x: 50, y: 46 + (42 / (count - 1)) * i, r: 0 },
  );

  return (
    <section ref={ref} id="problem" aria-labelledby="problem-title" className="relative h-[320vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_60%,rgb(79_125_255/0.07),transparent_70%)]" aria-hidden />

        <div className="container-x relative z-10 pt-[calc(var(--header-h)+6vh)] text-center">
          <motion.div style={{ opacity: problemOpacity, y: problemY }}>
            <p className="eyebrow mb-5">The problem</p>
            <h2 id="problem-title" className="display text-metal mx-auto max-w-4xl text-[clamp(2rem,5.2vw,4.2rem)]">
              Your business shouldn&apos;t need 5 different tools to talk to one customer.
            </h2>
          </motion.div>
          <motion.div style={{ opacity: answerOpacity, y: answerY }} className="absolute inset-x-0 top-[calc(var(--header-h)+6vh)]">
            <p className="eyebrow mb-5">The answer</p>
            <p className="display mx-auto max-w-4xl text-[clamp(2.6rem,8vw,6.5rem)]">
              <span className="text-metal">WE CONNECT </span>
              <span className="text-flow">THE FLOW.</span>
            </p>
          </motion.div>
        </div>

        <div className="absolute inset-0" aria-hidden>
          {/* Connection spine */}
          <motion.div
            style={desktop ? { scaleX: lineScale } : { scaleY: lineScale }}
            className={
              desktop
                ? "absolute top-[58%] right-[12%] left-[12%] h-px origin-left bg-gradient-to-r from-flow-soft/10 via-flow to-live"
                : "absolute top-[46%] bottom-[12%] left-1/2 w-px origin-top bg-gradient-to-b from-flow-soft/10 via-flow to-live"
            }
          />
          <div
            className={
              desktop ? "absolute top-[58%] right-[12%] left-[12%] h-px" : "absolute top-[46%] bottom-[12%] left-1/2 w-px"
            }
          >
            <motion.span
              style={desktop ? { left: pulse, opacity: answerOpacity } : { top: pulse, opacity: answerOpacity }}
              className="absolute size-2 -translate-1/2 rounded-full bg-live shadow-[0_0_16px_4px_rgb(94_242_194/0.6)]"
            />
          </div>

          {fragmentedTools.map((tool, i) => (
            <ToolChip
              key={tool}
              label={tool}
              status={broken[i]}
              from={(desktop ? scattered : scatteredMobile)[i]}
              to={aligned[i]}
              progress={p}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ToolChip({
  label,
  status,
  from,
  to,
  progress,
}: {
  label: string;
  status: string;
  from: Pos;
  to: Pos;
  progress: MotionValue<number>;
}) {
  const range = [0.4, 0.66];
  const left = useTransform(progress, range, [`${from.x}%`, `${to.x}%`]);
  const top = useTransform(progress, range, [`${from.y}%`, `${to.y}%`]);
  const rotate = useTransform(progress, range, [from.r, to.r]);
  const drift = useTransform(progress, [0, 0.4], [from.r * 3, 0]);
  const brokenOpacity = useTransform(progress, [0.5, 0.6], [1, 0]);
  const okOpacity = useTransform(progress, [0.68, 0.76], [0, 1]);
  const borderColor = useTransform(progress, [0.6, 0.72], ["rgba(255,255,255,0.08)", "rgba(122,162,255,0.45)"]);

  return (
    <motion.div style={{ left, top, rotate, y: drift }} className="absolute -translate-1/2">
      <motion.div style={{ borderColor }} className="relative rounded-2xl border bg-ink-850 px-4 py-3 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)] md:px-5 md:py-3.5">
        <p className="text-sm font-medium whitespace-nowrap md:text-base">{label}</p>
        <div className="mt-1 grid font-mono text-[0.62rem] tracking-wider uppercase [&>*]:[grid-area:1/1]">
          <motion.span style={{ opacity: brokenOpacity }} className="whitespace-nowrap text-rose-300/80">
            {status}
          </motion.span>
          <motion.span style={{ opacity: okOpacity }} className="whitespace-nowrap text-live">
            Connected
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
}
