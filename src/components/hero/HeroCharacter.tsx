"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { animate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { cn } from "@/lib/cn";
import { useFinePointer } from "@/hooks/useMediaQuery";
import type { CharacterFrame } from "@/config/site";

export type HeroCharacterProps = {
  frames: CharacterFrame[];
  alt: string;
  width: number;
  height: number;
  /** Face height in the frame (0–1); the cursor aim is measured from here. */
  faceY?: number;
  mobileBehavior?: "static" | "hidden";
  className?: string;
};

/** Index of the frame whose head direction is closest to (yaw, pitch). */
function nearest(frames: CharacterFrame[], yaw: number, pitch: number) {
  let best = 0;
  let bestD = Infinity;
  frames.forEach((f, i) => {
    const d = (f.yaw - yaw) ** 2 + (f.pitch - pitch) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/**
 * Cursor-following character built from turnaround-video frames.
 * The head direction follows the cursor through a spring, so the character
 * turns through the in-between frames instead of snapping from side to side.
 * Touch devices get a slow look-around; reduced motion shows the front frame.
 */
export function HeroCharacter({
  frames,
  alt,
  width,
  height,
  faceY = 0.34,
  mobileBehavior = "static",
  className,
}: HeroCharacterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentRef = useRef(0);
  const [ready, setReady] = useState(false);
  const fine = useFinePointer();
  const reduce = useReducedMotion();

  const yawTarget = useMotionValue(0);
  const pitchTarget = useMotionValue(0);
  const yaw = useSpring(yawTarget, { stiffness: 55, damping: 16, mass: 0.9 });
  const pitch = useSpring(pitchTarget, { stiffness: 55, damping: 16, mass: 0.9 });

  const front = nearest(frames, 0, 0);

  // Preload every frame, then switch from the static <Image> to the canvas.
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      frames.map(
        (f) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new window.Image();
            img.decoding = "async";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = f.src;
          }),
      ),
    )
      .then((imgs) => {
        if (cancelled) return;
        imagesRef.current = imgs;
        setReady(true);
      })
      .catch(() => {
        /* keep the static front frame */
      });
    return () => {
      cancelled = true;
    };
  }, [frames]);

  // Draw the frame nearest to the current (spring-smoothed) head direction,
  // cross-fading from the previous frame so the turn reads as continuous motion.
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const FADE_MS = 140;
    let from = currentRef.current;
    let fadeStart = 0;
    let raf = 0;

    const drawFrame = (index: number) => {
      const img = imagesRef.current[index];
      if (!img) return;
      if (frames[index].mirror) {
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
    const paint = (now: number) => {
      raf = 0;
      const to = currentRef.current;
      const t = fadeStart ? Math.min(1, (now - fadeStart) / FADE_MS) : 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (t < 1) {
        ctx.globalAlpha = 1;
        drawFrame(from);
        ctx.globalAlpha = t;
      }
      drawFrame(to);
      ctx.globalAlpha = 1;
      if (t < 1) raf = requestAnimationFrame(paint);
      else from = to;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.imageSmoothingQuality = "high";
      schedule();
    };
    const update = () => {
      const i = nearest(frames, yaw.get(), pitch.get());
      if (i !== currentRef.current) {
        // Start the fade from whatever is on screen now.
        from = currentRef.current;
        currentRef.current = i;
        fadeStart = performance.now();
        schedule();
      }
    };

    currentRef.current = nearest(frames, yaw.get(), pitch.get());
    from = currentRef.current;
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    const u1 = yaw.on("change", update);
    const u2 = pitch.on("change", update);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      u1();
      u2();
    };
  }, [ready, frames, yaw, pitch]);

  // Aim at the cursor (desktop) or look around slowly (touch).
  useEffect(() => {
    if (reduce) {
      yawTarget.set(0);
      pitchTarget.set(0);
      return;
    }
    if (!fine) {
      const opts = { repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" as const };
      const a = [
        animate(yawTarget, [-0.7, 0.7], { ...opts, duration: 6 }),
        animate(pitchTarget, [-0.3, 0.15], { ...opts, duration: 8 }),
      ];
      return () => a.forEach((c) => c.stop());
    }
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * faceY);
      // Full turn ~320px to the side of the face, full tilt ~260px above/below.
      yawTarget.set(Math.max(-1, Math.min(1, dx / 320)));
      pitchTarget.set(Math.max(-1, Math.min(1, dy / 260)));
    };
    const onLeave = () => {
      yawTarget.set(0);
      pitchTarget.set(0);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [fine, reduce, faceY, yawTarget, pitchTarget]);

  if (!frames.length) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none relative select-none [mask-image:linear-gradient(to_bottom,#000_70%,transparent_98%)]",
        mobileBehavior === "hidden" && "hidden lg:block",
        className,
      )}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <Image
        src={frames[front].src}
        alt={alt}
        width={width}
        height={height}
        priority
        sizes="(min-width: 1024px) 26rem, 70vw"
        className={cn("absolute inset-0 size-full", ready && "opacity-0")}
        draggable={false}
      />
      {ready && <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />}
    </div>
  );
}
