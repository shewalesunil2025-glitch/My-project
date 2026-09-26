"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

const GLYPHS = "01<>/\\{}[]#$%&*+=?ABCDEFXYZ";

/**
 * Decrypts its text from cipher glyphs, left to right, when it scrolls into view
 * (after the 21st.dev "Scramble Text" pattern). Screen readers get the real text.
 */
export function Scramble({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [out, setOut] = useState(text);

  useEffect(() => {
    if (!inView || reduce) return;
    let frame = 0;
    let raf = 0;
    const total = text.length * 2 + 8;
    const start = performance.now() + delay * 1000;
    const tick = (now: number) => {
      if (now < start) {
        raf = requestAnimationFrame(tick);
        return;
      }
      frame++;
      const revealed = Math.max(0, (frame - 8) / 2);
      setOut(
        text
          .split("")
          .map((ch, i) => (ch === " " || i < revealed ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join(""),
      );
      if (frame < total) raf = requestAnimationFrame(tick);
      else setOut(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, text, delay]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden>{out}</span>
    </span>
  );
}
