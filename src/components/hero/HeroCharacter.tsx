"use client";

import Image from "next/image";
import { motion, useTransform } from "framer-motion";
import { cn } from "@/lib/cn";
import type { PointerParallax } from "@/hooks/usePointerParallax";

export type HeroCharacterProps = {
  /** Transparent PNG/WebP cutout (body or full figure). */
  src: string;
  /** Optional separate head layer for a stronger, more natural head-follow. */
  headSrc?: string;
  alt: string;
  width: number;
  height: number;
  /** Max translation in px at the viewport edge. Head moves ~1.6× this. */
  intensity?: number;
  /** Behaviour on touch / coarse-pointer devices. */
  mobileBehavior?: "static" | "hidden";
  pointer: PointerParallax;
  className?: string;
};

/**
 * Mouse-following character slot for the hero.
 * - Body drifts gently with the cursor, head (if provided) follows further and tilts.
 * - Disabled on touch devices and for reduced motion (pointer values stay at 0).
 * - Swap the image via `heroCharacterConfig` in `src/config/site.ts`.
 */
export function HeroCharacter({
  src,
  headSrc,
  alt,
  width,
  height,
  intensity = 18,
  mobileBehavior = "hidden",
  pointer,
  className,
}: HeroCharacterProps) {
  const bodyX = useTransform(pointer.x, [-1, 1], [-intensity, intensity]);
  const bodyY = useTransform(pointer.y, [-1, 1], [-intensity * 0.4, intensity * 0.4]);
  const headX = useTransform(pointer.x, [-1, 1], [-intensity * 1.6, intensity * 1.6]);
  const headY = useTransform(pointer.y, [-1, 1], [-intensity * 0.8, intensity * 0.8]);
  const headRotate = useTransform(pointer.x, [-1, 1], [-6, 6]);
  const bodyRotateY = useTransform(pointer.x, [-1, 1], [-5, 5]);

  return (
    <div
      className={cn(
        "pointer-events-none relative [perspective:1000px]",
        mobileBehavior === "hidden" && "hidden lg:block",
        className,
      )}
    >
      <motion.div style={{ x: bodyX, y: bodyY, rotateY: bodyRotateY }} className="relative will-change-transform">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority
          sizes="(min-width: 1024px) 40vw, 80vw"
          className="h-auto w-full select-none drop-shadow-[0_30px_60px_rgb(0_0_0/0.6)]"
          draggable={false}
        />
        {headSrc && (
          <motion.div
            style={{ x: headX, y: headY, rotate: headRotate }}
            className="absolute inset-0 origin-[50%_30%] will-change-transform"
          >
            <Image src={headSrc} alt="" width={width} height={height} className="h-auto w-full select-none" draggable={false} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
