"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin neural-gradient line along the top edge that fills as the page is read. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-[linear-gradient(90deg,var(--color-flow-soft),var(--color-flow))] shadow-[0_0_12px_rgb(139_92_246/0.8)]"
      style={{ scaleX }}
    />
  );
}
