"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { MousePointer2 } from "lucide-react";
import { BookDemoButton } from "@/components/cta/BookDemoButton";
import { introDelay } from "@/components/effects/IntroLoader";
import { Scramble } from "@/components/effects/Scramble";
import { PointCloud } from "@/components/scene/PointCloud";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Reference hero: a brain of green dots under a spotlight, the headline split to
 * either side of it. Scrolling pins the scene — the headline grows and flies apart
 * while the brain bursts into drifting dust and a green nebula.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [d] = useState(introDelay);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const leftX = useTransform(p, [0, 0.5], ["0vw", reduce ? "0vw" : "-38vw"]);
  const rightX = useTransform(p, [0, 0.5], ["0vw", reduce ? "0vw" : "38vw"]);
  const textScale = useTransform(p, [0, 0.5], [1, reduce ? 1 : 1.9]);
  const textOpacity = useTransform(p, [0.18, 0.45], [1, 0]);
  const disperse = useTransform(p, [0.12, 0.85], [0, 1]);
  const brainScale = useTransform(p, [0, 0.6], [1, reduce ? 1 : 1.35]);
  const nebula = useTransform(p, [0.3, 0.75], [0, 1]);
  const spot = useTransform(p, [0, 0.5], [1, 0.25]);
  const hint = useTransform(p, [0, 0.08], [1, 0]);

  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 30, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 1.2, delay: d + delay, ease },
  });

  return (
    <section ref={ref} id="top" aria-labelledby="hero-title" className="relative h-[260vh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* Spotlight from above */}
        <motion.div aria-hidden style={{ opacity: spot }} className="pointer-events-none absolute inset-0">
          <div className="absolute -top-[30vh] left-1/2 h-[95vh] w-[70vw] -translate-x-1/2 bg-[radial-gradient(50%_55%_at_50%_30%,rgb(125_255_58/0.32),rgb(40_140_30/0.14)_45%,transparent_75%)] blur-2xl" />
          <div className="absolute inset-x-0 top-0 h-[70vh] bg-[linear-gradient(to_bottom,rgb(30_110_30/0.35),transparent)]" />
        </motion.div>

        {/* Nebula the brain dissolves into */}
        <motion.div aria-hidden style={{ opacity: nebula }} className="pointer-events-none absolute inset-0">
          <div className="absolute top-[8%] left-[18%] h-[40vh] w-[46vw] md:animate-aurora rounded-full bg-[radial-gradient(circle,rgb(125_255_58/0.28),transparent_65%)] blur-3xl" />
          <div className="absolute top-[30%] right-[8%] h-[36vh] w-[34vw] md:animate-aurora rounded-full bg-[radial-gradient(circle,rgb(60_200_60/0.22),transparent_65%)] blur-3xl [animation-delay:-8s]" />
          <div className="stars absolute inset-0" />
        </motion.div>

        {/* The brain */}
        <motion.div
          style={{ scale: brainScale }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: d + 0.2 }}
          className="absolute inset-0 max-md:top-[22%]"
        >
          {/* Dimmer on phones, where the copy sits over the brain */}
          <div className="size-full max-md:opacity-45">
            <PointCloud shape="brain" disperse={disperse} size={0.82} />
          </div>
        </motion.div>

        {/* Headline, split around the brain */}
        <h1 id="hero-title" className="display pointer-events-none absolute inset-0 text-[clamp(2.8rem,7vw,6.6rem)] text-fg">
          <motion.span
            style={{ x: leftX, scale: textScale, opacity: textOpacity }}
            className="absolute top-[26%] left-[6%] origin-left md:top-[30%] md:left-[7%]"
          >
            <motion.span className="block" {...rise(0.1)}>
              The business
            </motion.span>
            <motion.span className="block" {...rise(0.2)}>
              that never
            </motion.span>
          </motion.span>
          <motion.span
            style={{ x: rightX, scale: textScale, opacity: textOpacity }}
            className="absolute right-[6%] bottom-[24%] origin-right text-right md:right-[8%] md:bottom-[22%]"
          >
            <motion.span className="block" {...rise(0.35)}>
              sleeps.
            </motion.span>
          </motion.span>
        </h1>

        {/* Eyebrow + call to action on the left */}
        <motion.div style={{ opacity: textOpacity }} className="absolute top-[18%] left-[6%] md:top-[22%] md:left-[7%]">
          <motion.p {...rise(0)} className="font-mono text-[0.68rem] tracking-[0.18em] text-flow uppercase">
            {"// "}
            <Scramble text="AI automation agency" delay={d + 0.3} />
            {" //"}
          </motion.p>
        </motion.div>
        <motion.div
          style={{ opacity: textOpacity }}
          className="absolute top-[52%] left-[6%] md:top-[60%] md:left-[7%]"
        >
          <motion.div {...rise(0.5)} className="flex flex-col items-start gap-3">
            <BookDemoButton size="md" />
            <p className="max-w-[16rem] text-xs text-fg-subtle">Free 30-minute AI automation call — proposal within 24 hours.</p>
            <a
              href="#digital-marketing"
              className="group mt-1 inline-flex items-center gap-2 rounded-full border border-flow/40 bg-flow/10 py-1 pr-3 pl-1 text-xs text-fg backdrop-blur transition-colors hover:border-flow hover:bg-flow/20"
            >
              <span className="rounded-full bg-flow px-2 py-0.5 text-[0.6rem] font-semibold tracking-wide text-ink-950 uppercase">
                New
              </span>
              Digital Marketing — see what&apos;s included
              <span aria-hidden className="text-flow transition-transform group-hover:translate-x-0.5">→</span>
            </a>
          </motion.div>
        </motion.div>

        {/* Small copy beside "sleeps." */}
        <motion.p
          style={{ opacity: textOpacity }}
          className="absolute right-[6%] bottom-[12%] max-w-[17rem] text-right text-xs leading-relaxed text-fg-muted md:right-[8%] md:bottom-[14%] md:text-[0.8rem]"
        >
          <motion.span className="block" {...rise(0.6)}>
            AI-powered websites, conversations and workflows that work together as one intelligent business system —
            answering, booking and following up around the clock.
          </motion.span>
        </motion.p>

        <motion.div
          style={{ opacity: hint }}
          className="absolute bottom-24 left-[6%] hidden items-center gap-2 text-[0.7rem] text-fg-subtle md:flex md:left-[7%]"
        >
          <MousePointer2 className="size-3.5" aria-hidden /> Scroll to explore
        </motion.div>
      </div>
    </section>
  );
}
