"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/cn";

type CoreOrbProps = {
  className?: string;
  /** Pointer values in [-1, 1] that tilt the orb in 3D. */
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  label?: string;
};

/**
 * The "AI core": a luminous sphere wrapped in orbit rings, built with CSS 3D
 * transforms instead of WebGL — same depth, a fraction of the cost.
 */
export function CoreOrb({ className, pointerX, pointerY, label }: CoreOrbProps) {
  const rotateY = useTransform(pointerX, [-1, 1], [-14, 14]);
  const rotateX = useTransform(pointerY, [-1, 1], [12, -12]);

  return (
    <div className={cn("relative aspect-square [perspective:1200px]", className)} aria-hidden>
      <motion.div className="absolute inset-0 [transform-style:preserve-3d]" style={{ rotateX, rotateY }}>
        {/* Ambient bloom */}
        <div className="absolute inset-[-25%] rounded-full bg-[radial-gradient(circle,rgb(22_179_140/0.22),transparent_60%)] blur-2xl" />

        {/* Orbit rings */}
        <div className="absolute inset-0 [transform-style:preserve-3d] [transform:rotateX(72deg)]">
          <div className="absolute inset-0 animate-spin-slow rounded-full border border-flow/25">
            <span className="absolute top-1/2 -left-1 size-2 rounded-full bg-flow-soft shadow-[0_0_12px_2px_rgb(69_214_176/0.8)]" />
          </div>
        </div>
        <div className="absolute inset-[9%] [transform-style:preserve-3d] [transform:rotateX(72deg)_rotateY(38deg)]">
          <div className="absolute inset-0 animate-spin-slower rounded-full border border-white/10">
            <span className="absolute -top-1 left-1/2 size-1.5 rounded-full bg-live shadow-[0_0_10px_2px_rgb(232_201_135/0.7)]" />
          </div>
        </div>
        <div className="absolute inset-[16%] [transform-style:preserve-3d] [transform:rotateX(72deg)_rotateY(-42deg)]">
          <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-white/[0.07]" />
        </div>

        {/* Sphere */}
        <div className="absolute inset-[30%] rounded-full bg-[radial-gradient(circle_at_32%_28%,#f4fffb_0%,#a8f0dc_14%,#16b38c_42%,#0b3a31_72%,#06100e_100%)] shadow-[0_0_60px_10px_rgb(22_179_140/0.35),inset_-12px_-18px_40px_rgb(0_0_0/0.55)]" />
        <div className="absolute inset-[30%] rounded-full bg-[conic-gradient(from_0deg,transparent,rgb(232_201_135/0.25),transparent_40%)] mix-blend-screen animate-spin-slow" />
        <div className="absolute inset-[30%] rounded-full ring-1 ring-white/20" />
      </motion.div>
      {label && (
        <span className="absolute inset-x-0 -bottom-2 text-center font-mono text-[0.65rem] tracking-[0.3em] text-fg-subtle uppercase">
          {label}
        </span>
      )}
    </div>
  );
}
