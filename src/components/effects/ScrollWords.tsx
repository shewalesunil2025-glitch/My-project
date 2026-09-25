"use client";

import { useRef, type ElementType } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/cn";

type ScrollWordsProps = {
  text: string;
  as?: ElementType;
  id?: string;
  className?: string;
  /** Words (0-based) drawn in the accent colour. */
  accentFrom?: number;
  /** Starting opacity of words that have not been reached yet. */
  dim?: number;
};

/** Heading whose words light up one by one as it scrolls into view. */
export function ScrollWords({ text, as: Tag = "h2", id, className, accentFrom, dim = 0.18 }: ScrollWordsProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 88%", "start 38%"] });
  const words = text.split(" ");

  return (
    <Tag ref={ref} id={id} className={className} aria-label={text}>
      {words.map((w, i) => (
        <Word
          key={i}
          progress={scrollYProgress}
          range={[i / words.length, (i + 1) / words.length]}
          dim={reduce ? 1 : dim}
          className={accentFrom !== undefined && i >= accentFrom ? "text-flow" : undefined}
        >
          {w}
        </Word>
      ))}
    </Tag>
  );
}

function Word({
  children,
  progress,
  range,
  dim,
  className,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  dim: number;
  className?: string;
}) {
  const opacity = useTransform(progress, range, [dim, 1]);
  return (
    <motion.span aria-hidden style={{ opacity }} className={cn("inline-block whitespace-pre", className)}>
      {children}{" "}
    </motion.span>
  );
}
