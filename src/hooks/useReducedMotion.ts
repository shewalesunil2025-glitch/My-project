"use client";

import { useReducedMotion as useSystemReducedMotion } from "framer-motion";

/**
 * Site owner's choice: every animation runs on every device, even when the phone
 * or OS asks for reduced motion (many phones switch that on with battery saver,
 * which silently stopped all animations). Flip to `true` to honour the setting again.
 */
export const RESPECT_REDUCED_MOTION = false;

/** Drop-in for framer-motion's `useReducedMotion`, gated by the site setting. */
export function useReducedMotion(): boolean {
  const system = useSystemReducedMotion();
  return RESPECT_REDUCED_MOTION ? Boolean(system) : false;
}

/** Non-hook check for canvas effects and plain DOM code. */
export function prefersReducedMotion(): boolean {
  return RESPECT_REDUCED_MOTION && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
