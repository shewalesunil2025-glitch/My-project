"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
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

  // Aim direction in [-1, 1], relative to the face.
  const aimX = useMotionValue(0);
  const aimY = useMotionValue(0);
  const eyeX = useSpring(aimX, { stiffness: 320, damping: 26, mass: 0.4 });
  const eyeY = useSpring(aimY, { stiffness: 320, damping: 26, mass: 0.4 });
  const headX = useSpring(aimX, { stiffness: 70, damping: 16, mass: 0.8 });
  const headY = useSpring(aimY, { stiffness: 70, damping: 16, mass: 0.8 });

  const rotateY = useTransform(headX, [-1, 1], [-headTurn, headTurn]);
  const rotateX = useTransform(headY, [-1, 1], [headTurn * 0.55, -headTurn * 0.55]);
  const rotateZ = useTransform(headX, [-1, 1], [-headTurn * 0.25, headTurn * 0.25]);
  const x = useTransform(headX, [-1, 1], [-intensity, intensity]);
  const y = useTransform(headY, [-1, 1], [-intensity * 0.5, intensity * 0.5]);

  useEffect(() => {
    if (!active) {
      aimX.set(0);
      aimY.set(0);
      return;
    }
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Face centre ≈ between the eyes.
      const fx = r.left + r.width * 0.5;
      const fy = r.top + r.height * 0.6;
      const nx = (e.clientX - fx) / (window.innerWidth * 0.45);
      const ny = (e.clientY - fy) / (window.innerHeight * 0.45);
      aimX.set(Math.max(-1, Math.min(1, nx)));
      aimY.set(Math.max(-1, Math.min(1, ny)));
    };
    const onLeave = () => {
      aimX.set(0);
      aimY.set(0);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [active, aimX, aimY]);

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
          className="h-auto w-full drop-shadow-[0_30px_60px_rgb(0_0_0/0.55)]"
          draggable={false}
        />
        {eyes.map((eye) => (
          <Eye key={eye.irisSrc} eye={eye} eyeX={eyeX} eyeY={eyeY} range={eyeRange} />
        ))}
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
  const y = useTransform(eyeY, (v) => `${v * range * 45}%`);
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
    </div>
  );
}
