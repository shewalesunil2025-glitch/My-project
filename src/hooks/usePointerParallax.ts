"use client";

import { useEffect } from "react";
import { useMotionValue, useReducedMotion, useSpring, type MotionValue } from "framer-motion";
import { useFinePointer } from "./useMediaQuery";

export type PointerParallax = { x: MotionValue<number>; y: MotionValue<number>; enabled: boolean };

/**
 * Normalised pointer position in [-1, 1] relative to the viewport centre,
 * smoothed with a spring. Stays at 0 on touch devices and with reduced motion.
 */
export function usePointerParallax(spring = { stiffness: 60, damping: 18, mass: 0.6 }): PointerParallax {
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const enabled = fine && !reduce;
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, spring);
  const y = useSpring(rawY, spring);

  useEffect(() => {
    if (!enabled) {
      rawX.set(0);
      rawY.set(0);
      return;
    }
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth) * 2 - 1);
      rawY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, rawX, rawY]);

  return { x, y, enabled };
}
