"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useFinePointer } from "@/hooks/useMediaQuery";
import type { CharacterEyes } from "@/config/site";

export type HeroCharacterProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Point between the eyes (fractions of the image) — the aim is measured from here. */
  face: { x: number; y: number };
  /** Height of the neck (fraction of the image): the head turns above it, the body stays below. */
  neckY: number;
  /** Largest head rotation toward the cursor, in degrees. */
  maxHeadTurn: { yaw: number; pitch: number };
  eyes: CharacterEyes;
  blink?: boolean;
  className?: string;
};

/** Cursor distance (px) at which the character looks as far as it can. */
const REACH = 380;
/** Per-frame easing at 60fps: the eyes are quick, the head trails a little behind. */
const EYE_EASE = 0.12;
const HEAD_EASE = 0.06;

const pct = (v: number) => `${v * 100}%`;

/**
 * A character that stays exactly where it is and watches the cursor.
 *
 * One image, split at the neck with CSS masks: the body layer never moves, and
 * the head layer turns and tilts a few degrees toward the cursor. On the face, the
 * irises are redrawn on their own layer, clipped by the eyelid opening, and slide
 * toward the cursor. Both ease with requestAnimationFrame and write transforms
 * straight to the DOM, so moving the mouse never re-renders React. The character
 * keeps looking at the last cursor position when the mouse stops. Touch devices
 * and reduced motion get the neutral, front-facing pose.
 */
export function HeroCharacter({
  src,
  alt,
  width,
  height,
  face,
  neckY,
  maxHeadTurn,
  eyes,
  blink = false,
  className,
}: HeroCharacterProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const irisRef = useRef<HTMLDivElement>(null);
  const lidRef = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    const head = headRef.current;
    const iris = irisRef.current;
    if (!root || !head || !iris) return;

    const apply = (hx: number, hy: number, ex: number, ey: number) => {
      head.style.transform =
        `perspective(1400px) translate3d(${hx * 0.6}%, ${hy * 0.35}%, 0) ` +
        `rotateY(${hx * maxHeadTurn.yaw}deg) rotateX(${-hy * maxHeadTurn.pitch}deg) rotate(${hx * 0.8}deg)`;
      // Shift in % of the eye box, so it scales with the character.
      const sx = (ex * eyes.shift[0]) / eyes.box[2];
      const sy = (ey < 0 ? ey * eyes.shift[1] : ey * eyes.shift[2]) / eyes.box[3];
      iris.style.transform = `translate3d(${sx * 100}%, ${sy * 100}%, 0)`;
    };

    if (!fine || reduce) {
      apply(0, 0, 0, 0);
      return;
    }

    // Target direction (−1…1 on each axis) and the eased values that chase it.
    let tx = 0;
    let ty = 0;
    let ex = 0;
    let ey = 0;
    let hx = 0;
    let hy = 0;
    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      const steps = Math.min(now - last, 64) / (1000 / 60);
      last = now;
      // Frame-rate independent lerp: the same feel at 60Hz and 120Hz.
      const ke = 1 - Math.pow(1 - EYE_EASE, steps);
      const kh = 1 - Math.pow(1 - HEAD_EASE, steps);
      ex += (tx - ex) * ke;
      ey += (ty - ey) * ke;
      hx += (tx - hx) * kh;
      hy += (ty - hy) * kh;
      apply(hx, hy, ex, ey);
      const moving = Math.max(Math.abs(tx - hx), Math.abs(ty - hy), Math.abs(tx - ex), Math.abs(ty - ey)) > 0.001;
      raf = moving ? requestAnimationFrame(tick) : 0;
    };

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width * face.x);
      const dy = e.clientY - (r.top + r.height * face.y);
      const d = Math.hypot(dx, dy) || 1;
      // Direction toward the cursor, scaled down when the cursor is close to the face.
      const reach = Math.min(d / REACH, 1);
      tx = (dx / d) * reach;
      ty = (dy / d) * reach;
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    let blinkTimer: ReturnType<typeof setTimeout> | undefined;
    const lid = lidRef.current;
    const scheduleBlink = () => {
      blinkTimer = setTimeout(() => {
        lid?.animate(
          [{ transform: "scaleY(0)" }, { transform: "scaleY(1)", offset: 0.45 }, { transform: "scaleY(0)" }],
          { duration: 190, easing: "ease-in-out" },
        );
        scheduleBlink();
      }, 3500 + Math.random() * 3500);
    };
    if (blink) scheduleBlink();

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      clearTimeout(blinkTimer);
    };
  }, [fine, reduce, face.x, face.y, maxHeadTurn.yaw, maxHeadTurn.pitch, eyes, blink]);

  if (!src) return null;

  const [bx, by, bw, bh] = eyes.box;
  const eyeBox: CSSProperties = { left: pct(bx), top: pct(by), width: pct(bw), height: pct(bh) };
  const neck = neckY * 100;
  const image = (
    <Image
      src={src}
      alt=""
      width={width}
      height={height}
      priority
      sizes="(min-width: 1024px) 26rem, 70vw"
      className="absolute inset-0 size-full"
      draggable={false}
    />
  );

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={alt}
      className={cn(
        "pointer-events-none relative select-none [mask-image:linear-gradient(to_bottom,#000_70%,transparent_98%)]",
        className,
      )}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {/* Body: everything below the chin. It never moves. */}
      <div
        className="absolute inset-0"
        style={{ maskImage: `linear-gradient(to bottom, transparent ${neck - 5}%, #000 ${neck - 1.5}%)` }}
      >
        {image}
      </div>

      {/* Head: turns a few degrees around the neck. */}
      <div
        ref={headRef}
        className="absolute inset-0 will-change-transform"
        style={{
          transformOrigin: `50% ${neck}%`,
          maskImage: `linear-gradient(to bottom, #000 ${neck - 2.5}%, transparent ${neck + 2}%)`,
        }}
      >
        {image}
        {/* Eye whites over the original irises, then the moving irises clipped to the eyelids. */}
        <div
          aria-hidden
          className="absolute bg-[length:100%_100%]"
          style={{ ...eyeBox, backgroundImage: `url(${eyes.plate})` }}
        />
        <div
          aria-hidden
          className="absolute overflow-hidden"
          style={{
            ...eyeBox,
            maskImage: `url(${eyes.plate})`,
            maskSize: "100% 100%",
            WebkitMaskImage: `url(${eyes.plate})`,
            WebkitMaskSize: "100% 100%",
          }}
        >
          <div
            ref={irisRef}
            className="absolute inset-0 bg-[length:100%_100%] will-change-transform"
            style={{ backgroundImage: `url(${eyes.iris})` }}
          />
          {blink && (
            <div
              ref={lidRef}
              className="absolute inset-0 origin-top bg-[linear-gradient(to_bottom,#c98355,#b3683a_82%,#3a1c0c)]"
              style={{ transform: "scaleY(0)" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
