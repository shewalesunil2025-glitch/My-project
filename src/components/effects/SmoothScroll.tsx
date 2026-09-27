"use client";

import { prefersReducedMotion } from "@/hooks/useReducedMotion";
import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Lenis smooth scrolling for wheel input. Touch scrolling stays native,
 * and it is disabled entirely when the user prefers reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -64 } });
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
