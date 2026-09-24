"use client";

import { motion, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PointerParallax } from "@/hooks/usePointerParallax";

type FloatingPanelProps = {
  children: ReactNode;
  pointer: PointerParallax;
  /** Parallax depth — larger values feel closer to the viewer. */
  depth?: number;
  delay?: number;
  className?: string;
};

/** Glass UI panel that floats at a given depth and reacts to the cursor. */
export function FloatingPanel({ children, pointer, depth = 20, delay = 0, className }: FloatingPanelProps) {
  const x = useTransform(pointer.x, [-1, 1], [-depth, depth]);
  const y = useTransform(pointer.y, [-1, 1], [-depth * 0.7, depth * 0.7]);

  return (
    <motion.div style={{ x, y }} className={cn("absolute", className)}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.94, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
        className="glass rounded-2xl p-3.5 text-left sm:p-4"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
