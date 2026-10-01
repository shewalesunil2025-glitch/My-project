"use client";

import { useEffect } from "react";

/**
 * One listener for the whole page: cards (`.glass` and `[data-spotlight]`) get a
 * soft light that follows the cursor across them.
 */
export function Spotlight() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    let last: PointerEvent | null = null;
    const update = () => {
      raf = 0;
      const e = last;
      const el = (e?.target as Element | null)?.closest?.<HTMLElement>(".glass, [data-spotlight]");
      if (!e || !el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
