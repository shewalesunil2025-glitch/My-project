"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useFinePointer } from "@/hooks/useMediaQuery";

/** Card that tilts slightly toward the cursor with a moving light edge. */
export function TiltCard({ children, className, max = 5 }: { children: ReactNode; className?: string; max?: number }) {
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 160, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 160, damping: 20 });
  const glow = useTransform(
    [px, py],
    ([x, y]: number[]) => `radial-gradient(600px circle at ${x * 100}% ${y * 100}%, rgb(122 162 255 / 0.10), transparent 40%)`,
  );
  const active = fine && !reduce;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!active) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <div className="[perspective:1400px]">
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={reset}
        style={active ? { rotateX: rx, rotateY: ry } : undefined}
        className={cn("relative [transform-style:preserve-3d]", className)}
      >
        {active && <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]" style={{ background: glow }} />}
        {children}
      </motion.div>
    </div>
  );
}
