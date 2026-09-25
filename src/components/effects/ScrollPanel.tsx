"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/cn";

type ScrollPanelProps = {
  children: ReactNode;
  /**
   * "paper": the light section opens from a small dot into the full panel.
   * "dark": the section grows in from slightly smaller and brightens.
   * Both ease back a little as they scroll away.
   */
  variant?: "paper" | "dark";
  className?: string;
};

/** Scroll-driven entrance and exit for a whole section, like the reference site's panels. */
export function ScrollPanel({ children, variant = "dark", className }: ScrollPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: enter } = useScroll({ target: ref, offset: ["start 0.98", "start 0.3"] });
  const { scrollYProgress: exit } = useScroll({ target: ref, offset: ["end 0.75", "end 0.05"] });

  const scale = useTransform(() => {
    const e = enter.get();
    const x = exit.get();
    const inScale = variant === "paper" ? 0.96 + 0.04 * e : 0.92 + 0.08 * e;
    return inScale * (1 - 0.05 * x);
  });
  const opacity = useTransform(() => Math.min(0.25 + enter.get() * 1.1, 1) * (1 - 0.55 * exit.get()));
  const clipPath = useTransform(enter, (e) =>
    e >= 0.999 ? "none" : `circle(${(3 + e * 147).toFixed(2)}% at 50% 14%)`,
  );

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={cn("origin-[50%_0%] will-change-transform", className)}
      style={variant === "paper" ? { scale, clipPath } : { scale, opacity }}
    >
      {children}
    </motion.div>
  );
}
