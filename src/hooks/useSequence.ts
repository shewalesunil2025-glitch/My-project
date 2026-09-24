"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Steps through 0…total at a fixed interval, holds on the final frame,
 * then loops. With reduced motion it jumps straight to the final frame.
 */
export function useSequence(total: number, interval = 900, hold = 2600, enabled = true) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduce || !enabled) return;
    const delay = step >= total ? hold : step === 0 ? 500 : interval;
    const t = setTimeout(() => setStep((s) => (s >= total ? 0 : s + 1)), delay);
    return () => clearTimeout(t);
  }, [step, total, interval, hold, reduce, enabled]);

  return reduce ? total : step;
}
