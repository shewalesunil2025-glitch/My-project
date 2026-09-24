"use client";

import { motion, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { PointerParallax } from "@/hooks/usePointerParallax";
import type { SolutionId } from "@/content/solutions";
import { SOLUTION_DEMO_ANCHOR, showSolution } from "@/lib/solutionLinks";

type FloatingPanelProps = {
  children: ReactNode;
  pointer: PointerParallax;
  /** Solution demo this panel opens when clicked. */
  solution: SolutionId;
  /** Accessible name, e.g. "See the AI voice receptionist demo". */
  label: string;
  /** Parallax depth — larger values feel closer to the viewer. */
  depth?: number;
  delay?: number;
  className?: string;
};

/** Clickable glass panel that floats at a given depth, reacts to the cursor and opens its solution demo. */
export function FloatingPanel({ children, pointer, solution, label, depth = 20, delay = 0, className }: FloatingPanelProps) {
  const x = useTransform(pointer.x, [-1, 1], [-depth, depth]);
  const y = useTransform(pointer.y, [-1, 1], [-depth * 0.7, depth * 0.7]);

  return (
    <motion.div style={{ x, y }} className={cn("absolute z-20", className)}>
      <motion.a
        href={SOLUTION_DEMO_ANCHOR}
        aria-label={label}
        onClick={() => showSolution(solution)}
        initial={{ opacity: 0, y: 24, scale: 0.94, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
        className="glass group pointer-events-auto block cursor-pointer rounded-2xl p-3.5 text-left transition-[border-color,box-shadow] duration-300 hover:border-flow/50 hover:shadow-[0_0_40px_-10px_rgb(69_214_176/0.55)] sm:p-4"
      >
        {children}
        <span className="mt-2.5 flex items-center gap-1 font-mono text-[0.6rem] tracking-[0.16em] text-flow-soft/70 uppercase transition-colors group-hover:text-flow-soft">
          View demo
          <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </span>
      </motion.a>
    </motion.div>
  );
}
