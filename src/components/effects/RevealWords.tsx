"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

type RevealWordsProps = {
  text: string;
  className?: string;
  delay?: number;
};

/** Words rise out of their line and sharpen one after another when the heading scrolls into view. */
export function RevealWords({ text, className, delay = 0 }: RevealWordsProps) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text} role="text">
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.1em] align-top">
          <motion.span
            className={cn("inline-block whitespace-pre")}
            initial={reduce ? { opacity: 0 } : { y: "100%", opacity: 0, filter: "blur(6px)" }}
            whileInView={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: reduce ? 0.2 : 0.9, delay: delay + i * 0.055, ease: [0.16, 1, 0.3, 1] }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
