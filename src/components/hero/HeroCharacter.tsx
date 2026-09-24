"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { DepthWarp } from "@/components/3d/DepthWarp";
import { cn } from "@/lib/cn";
import { useFinePointer } from "@/hooks/useMediaQuery";
import type { HeroEye } from "@/config/site";

export type HeroCharacterProps = {
  /** Transparent PNG/WebP cutout with the irises painted out. */
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Iris sprites + eye masks. Without them only the head follows the cursor. */
  eyes?: HeroEye[];
  /** Grayscale depth map for the WebGL 3D head turn. Without it the head only tilts. */
  depthSrc?: string;
  /** Depth-parallax strength (fraction of the image). */
  warpStrength?: number;
  /** Depth value (0–1) at the eyes, so the iris overlays travel with the warped face. */
  eyeDepth?: number;
  /** Max head travel in px at the viewport edge. */
  intensity?: number;
  /** Max head turn in degrees. */
  headTurn?: number;
  /** Iris travel as a fraction of the iris size. */
  eyeRange?: number;
  /** Behaviour on touch / coarse-pointer devices. */
  mobileBehavior?: "static" | "hidden";
  className?: string;
};

/**
 * Cursor-following hero character.
 * - Eyes: each iris moves inside its own eye mask toward the cursor (fast spring).
 * - Neck: the head turns and tilts toward the cursor around the base of the neck (slow spring).
 * Aim is measured from the character's face, so it looks *at* the cursor, not at the screen centre.
 * Static on touch devices and with reduced motion.
 */
export function HeroCharacter({
  src,
  alt,
  width,
  height,
  eyes = [],
  depthSrc,
  warpStrength = 0.06,
  eyeDepth = 0.84,
  intensity = 14,
  headTurn = 12,
  eyeRange = 0.2,
  mobileBehavior = "static",
  className,
}: HeroCharacterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const active = fine && !reduce;
  const [warpReady, setWarpReady] = useState(false);
  const onWarpReady = useCallback(() => setWarpReady(true), []);

  // Eyes: unit direction from the face to the cursor, eased in over the first ~180px.
  const lookX = useMotionValue(0);
  const lookY = useMotionValue(0);
  // Head: softer aim across the whole viewport.
  const aimX = useMotionValue(0);
  const aimY = useMotionValue(0);
  const eyeX = useSpring(lookX, { stiffness: 420, damping: 30, mass: 0.3 });
  const eyeY = useSpring(lookY, { stiffness: 420, damping: 30, mass: 0.3 });
  const headX = useSpring(aimX, { stiffness: 120, damping: 18, mass: 0.6 });
  const headY = useSpring(aimY, { stiffness: 120, damping: 18, mass: 0.6 });

  const rotateY = useTransform(headX, [-1, 1], [-headTurn, headTurn]);
  const rotateX = useTransform(headY, [-1, 1], [headTurn * 0.6, -headTurn * 0.6]);
  const rotateZ = useTransform(headX, [-1, 1], [-headTurn * 0.35, headTurn * 0.35]);
  const x = useTransform(headX, [-1, 1], [-intensity, intensity]);
  const y = useTransform(headY, [-1, 1], [-intensity * 0.6, intensity * 0.6]);
  const warpOn = Boolean(depthSrc) && warpReady;
  const faceShiftX = useTransform(headX, (v) => (warpOn ? `${v * warpStrength * (eyeDepth - 0.5) * 100}%` : "0%"));
  const faceShiftY = useTransform(headY, (v) => (warpOn ? `${v * warpStrength * 0.75 * (eyeDepth - 0.5) * 100}%` : "0%"));

  useEffect(() => {
    const reset = () => {
      lookX.set(0);
      lookY.set(0);
      aimX.set(0);
      aimY.set(0);
    };
    if (!active) {
      reset();
      if (reduce) return;
      // Touch devices: a slow, gentle look-around so the character still feels alive.
      const opts = { duration: 5, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" as const };
      const a = [
        animate(aimX, [-0.45, 0.45], opts),
        animate(lookX, [-0.7, 0.7], opts),
        animate(aimY, [-0.12, 0.12], { ...opts, duration: 7 }),
        animate(lookY, [-0.2, 0.2], { ...opts, duration: 7 }),
      ];
      return () => a.forEach((c) => c.stop());
    }
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Point between the eyes (≈ 50% across, 61% down the image).
      const fx = r.left + r.width * 0.5;
      const fy = r.top + r.height * 0.61;
      const dx = e.clientX - fx;
      const dy = e.clientY - fy;
      const dist = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, dist / 180);
      lookX.set((dx / dist) * reach);
      lookY.set((dy / dist) * reach);
      aimX.set(Math.max(-1, Math.min(1, dx / (window.innerWidth * 0.4))));
      aimY.set(Math.max(-1, Math.min(1, dy / (window.innerHeight * 0.4))));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", reset);
    };
  }, [active, reduce, lookX, lookY, aimX, aimY]);

  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none relative select-none [perspective:900px]",
        mobileBehavior === "hidden" && "hidden lg:block",
        className,
      )}
    >
      <motion.div
        style={{ rotateX, rotateY, rotateZ, x, y }}
        className="relative origin-[50%_95%] will-change-transform [transform-style:preserve-3d]"
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority
          sizes="(min-width: 1024px) 40vw, 90vw"
          className={cn("h-auto w-full drop-shadow-[0_30px_60px_rgb(0_0_0/0.55)]", warpOn && "opacity-0")}
          draggable={false}
        />
        {depthSrc && (
          <DepthWarp
            src={src}
            depthSrc={depthSrc}
            aimX={headX}
            aimY={headY}
            strength={warpStrength}
            onReady={onWarpReady}
            className="drop-shadow-[0_30px_60px_rgb(0_0_0/0.55)]"
          />
        )}
        <motion.div className="absolute inset-0" style={{ x: faceShiftX, y: faceShiftY }}>
          {eyes.map((eye) => (
            <Eye key={eye.irisSrc} eye={eye} eyeX={eyeX} eyeY={eyeY} range={eyeRange} />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

function Eye({
  eye,
  eyeX,
  eyeY,
  range,
}: {
  eye: HeroEye;
  eyeX: MotionValue<number>;
  eyeY: MotionValue<number>;
  range: number;
}) {
  const [left, top, w, h] = eye.box;
  const [cx, cy, size] = eye.iris;
  const x = useTransform(eyeX, (v) => `${v * range * 100}%`);
  const y = useTransform(eyeY, (v) => `${v * range * 40}%`);
  const mask = `url(${eye.maskSrc})`;

  return (
    <div
      aria-hidden
      className="absolute"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${w}%`,
        height: `${h}%`,
        maskImage: mask,
        WebkitMaskImage: mask,
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      }}
    >
      <motion.div
        className="absolute aspect-square -translate-1/2"
        style={{ left: `${cx}%`, top: `${cy}%`, width: `${size}%`, x, y }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny sprite, next/image adds nothing here */}
        <img src={eye.irisSrc} alt="" className="size-full" draggable={false} />
      </motion.div>
      {/* Upper-lid shadow so the iris sits under the lid instead of on top of it. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(40_20_10/0.45),transparent_38%,transparent_85%,rgb(40_20_10/0.15))]" />
    </div>
  );
}
