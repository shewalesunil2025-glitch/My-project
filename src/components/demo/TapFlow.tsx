"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TapScreen = { screen: ReactNode; /** Where the finger taps, in % of the phone screen. */ tap?: { x: number; y: number } };

/**
 * App screens in motion: each screen slides in, a finger glides to the button and taps
 * it (with a ripple), then the next screen follows — like a screen recording, but drawn.
 */
export function TapFlow({ screens, ms = 2300 }: { screens: TapScreen[]; ms?: number }) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<"show" | "move" | "tap">("show");

  useEffect(() => {
    const move = setTimeout(() => setPhase("move"), ms * 0.35);
    const tap = setTimeout(() => setPhase("tap"), ms * 0.7);
    const next = setTimeout(() => {
      if (i < screens.length - 1) {
        setI(i + 1);
        setPhase("show");
      }
    }, ms);
    return () => [move, tap, next].forEach(clearTimeout);
  }, [i, ms, screens.length]);

  const s = screens[i];
  const at = s.tap && phase !== "show" ? s.tap : { x: 78, y: 92 };
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div key={i} className="h-full animate-[demo-screen-in_0.55s_var(--ease-out-expo)]">
        {s.screen}
      </div>
      {s.tap && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ left: `${at.x}%`, top: `${at.y}%` }}
        >
          {phase === "tap" && <span className="absolute inset-0 -m-3 animate-[demo-ripple_0.6s_ease-out_forwards] rounded-full border-2 border-flow" />}
          <span className={cn("block size-7 rounded-full border-2 border-white/90 bg-white/30 shadow-[0_6px_20px_rgb(0_0_0/0.5)] backdrop-blur-sm transition-transform duration-200", phase === "tap" && "scale-75 bg-flow/70")} />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-1 flex justify-center gap-1">
        {screens.map((_, k) => (
          <span key={k} className={cn("h-1 rounded-full transition-all", k === i ? "w-4 bg-flow" : "w-1 bg-white/25")} />
        ))}
      </div>
    </div>
  );
}
