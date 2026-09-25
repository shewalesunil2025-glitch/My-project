"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/cn";
import { useFinePointer } from "@/hooks/useMediaQuery";
import type { CharacterEyes, CharacterFrame } from "@/config/site";

export type HeroCharacterProps = {
  frames: CharacterFrame[];
  alt: string;
  width: number;
  height: number;
  /** Face height in the frame (0–1); the cursor aim is measured from here. */
  faceY?: number;
  /** Movable irises for the front frame, so the eyes can lead the head. */
  eyes?: CharacterEyes;
  mobileBehavior?: "static" | "hidden";
  className?: string;
};

type Drawable = ImageBitmap | HTMLImageElement;

const dist2 = (f: CharacterFrame, yaw: number, pitch: number) => (f.yaw - yaw) ** 2 + (f.pitch - pitch) ** 2;

/** Frames beyond this pose distance are too different to blend without ghosting. */
const BLEND_RADIUS = 0.3;

/** Position of a frame in the source video (from its file name), used to blend only neighbours. */
const seqOf = (f: CharacterFrame) => Number(/(\d+)\.\w+$/.exec(f.src)?.[1] ?? NaN);

/** Two frames blend cleanly only if they sit next to each other in the video and face the same way. */
const canBlend = (a: CharacterFrame, b: CharacterFrame) =>
  Boolean(a.mirror) === Boolean(b.mirror) && Math.abs(seqOf(a) - seqOf(b)) <= 7;

/** Jumps between frames that can't blend are cross-faded over this long instead of cut. */
const FADE_MS = 170;

const clamp = (v: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v));

/** The head ignores tiny cursor moves (the eyes cover those) and turns for the rest. */
const headFrom = (aim: number, dead: number) => Math.sign(aim) * Math.max(0, Math.abs(aim) - dead) / (1 - dead);

/**
 * Cursor-following character built from turnaround-video frames.
 *
 * Like a person, it looks with the eyes first: a quick spring moves the irises
 * toward the cursor, while a slower one turns the head after them. The head is
 * drawn from the video frame (or the blend of two neighbouring frames) closest
 * to its direction; frames that can't blend are cross-faded. No frame with
 * closed or blinking eyelids is used. Frames stream in nearest-to-front first.
 * Touch devices get a slow look-around; reduced motion shows the front frame.
 */
export function HeroCharacter({
  frames,
  alt,
  width,
  height,
  faceY = 0.34,
  eyes,
  mobileBehavior = "static",
  className,
}: HeroCharacterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Decoded image per frame index (mirrored frames share their source). */
  const loadedRef = useRef<(Drawable | null)[]>([]);
  const eyeImgRef = useRef<{ plate: Drawable; iris: Drawable } | null>(null);
  const redrawRef = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);
  const fine = useFinePointer();
  const reduce = useReducedMotion();

  const yawTarget = useMotionValue(0);
  const pitchTarget = useMotionValue(0);
  const gazeYawTarget = useMotionValue(0);
  const gazePitchTarget = useMotionValue(0);
  // Head: a gentle, slightly over-damped glide — smooth and calm, never bouncy.
  const yaw = useSpring(yawTarget, { stiffness: 70, damping: 20, mass: 0.9 });
  const pitch = useSpring(pitchTarget, { stiffness: 70, damping: 20, mass: 0.9 });
  // Eyes: quick but still eased, so they arrive well before the head.
  const gazeYaw = useSpring(gazeYawTarget, { stiffness: 260, damping: 30, mass: 0.6 });
  const gazePitch = useSpring(gazePitchTarget, { stiffness: 260, damping: 30, mass: 0.6 });

  // Weight shift: the body leans a touch toward where the head turns.
  const leanX = useTransform(yaw, [-1, 1], [-7, 7]);
  const leanRotate = useTransform(yaw, [-1, 1], [-1.2, 1.2]);
  const leanY = useTransform(pitch, [-1, 1], [-3, 3]);

  const front = frames.reduce((best, f, i) => (dist2(f, 0, 0) < dist2(frames[best], 0, 0) ? i : best), 0);

  // Stream frames in, closest to the front pose first; start as soon as the front frame is ready.
  useEffect(() => {
    let cancelled = false;
    loadedRef.current = frames.map(() => null);
    const bySrc = new Map<string, number[]>();
    frames.forEach((f, i) => bySrc.set(f.src, [...(bySrc.get(f.src) ?? []), i]));
    const order = [...bySrc.keys()].sort((a, b) => {
      const da = Math.min(...bySrc.get(a)!.map((i) => dist2(frames[i], 0, 0)));
      const db = Math.min(...bySrc.get(b)!.map((i) => dist2(frames[i], 0, 0)));
      return da - db;
    });

    const load = async (src: string) => {
      const img = new window.Image();
      img.src = src;
      await img.decode();
      const drawable: Drawable = "createImageBitmap" in window ? await createImageBitmap(img) : img;
      if (cancelled) return;
      for (const i of bySrc.get(src)!) loadedRef.current[i] = drawable;
      if (bySrc.get(src)!.includes(front)) setReady(true);
      redrawRef.current();
    };

    if (eyes) {
      Promise.all(
        [eyes.plate, eyes.iris].map(async (src) => {
          const img = new window.Image();
          img.src = src;
          await img.decode();
          return "createImageBitmap" in window ? await createImageBitmap(img) : img;
        }),
      )
        .then(([plate, iris]) => {
          if (cancelled) return;
          eyeImgRef.current = { plate, iris };
          redrawRef.current();
        })
        .catch(() => {});
    }

    (async () => {
      // A few at a time keeps the first frames fast without flooding the network.
      const queue = [...order];
      const worker = async () => {
        while (queue.length && !cancelled) {
          const src = queue.shift()!;
          try {
            await load(src);
          } catch {
            /* skip a frame that fails to load */
          }
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
    })();

    return () => {
      cancelled = true;
    };
  }, [frames, front, eyes]);

  // Paint: blend the two loaded frames closest to the head direction, then the irises.
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;
    const fade = document.createElement("canvas");
    const fctx = fade.getContext("2d");
    const eyeLayer = document.createElement("canvas");
    const ectx = eyeLayer.getContext("2d");
    let shown = -1;
    let fadeStart = -Infinity;

    const drawFrame = (i: number, alpha: number) => {
      const img = loadedRef.current[i];
      if (!img || alpha <= 0) return;
      ctx.globalAlpha = alpha;
      if (frames[i].mirror) {
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };

    // Re-draw the irises of the front frame shifted toward the gaze, clipped by the eyelids.
    const drawEyes = () => {
      const e = eyeImgRef.current;
      if (!eyes || !e || !ectx) return;
      const W = canvas.width;
      const H = canvas.height;
      const rx = eyes.box[0] * W;
      const ry = eyes.box[1] * H;
      const rw = Math.ceil(eyes.box[2] * W);
      const rh = Math.ceil(eyes.box[3] * H);
      const gy = clamp(gazeYaw.get() * 1.5);
      const gp = clamp(gazePitch.get() * 1.5);
      const dx = gy * eyes.shift[0] * W;
      const dy = (gp < 0 ? gp * eyes.shift[1] : gp * eyes.shift[2]) * H;
      ctx.globalAlpha = 1;
      ctx.drawImage(e.plate, rx, ry, rw, rh);
      if (eyeLayer.width !== rw || eyeLayer.height !== rh) {
        eyeLayer.width = rw;
        eyeLayer.height = rh;
      }
      ectx.globalCompositeOperation = "source-over";
      ectx.clearRect(0, 0, rw, rh);
      ectx.drawImage(e.iris, dx, dy, rw, rh);
      ectx.globalCompositeOperation = "destination-in";
      ectx.drawImage(e.plate, 0, 0, rw, rh);
      ctx.drawImage(eyeLayer, rx, ry);
    };

    const paint = (now: number) => {
      raf = 0;
      const y = yaw.get();
      const p = pitch.get();
      let a = -1;
      let b = -1;
      let da = Infinity;
      let db = Infinity;
      loadedRef.current.forEach((img, i) => {
        if (!img) return;
        const d = dist2(frames[i], y, p);
        if (d < da) {
          b = a;
          db = da;
          a = i;
          da = d;
        } else if (d < db) {
          b = i;
          db = d;
        }
      });
      if (a < 0) return;

      // A jump to a frame that doesn't blend with the one on screen: keep a
      // snapshot of the old picture and fade it out over the new one.
      if (shown >= 0 && a !== shown && !canBlend(frames[a], frames[shown]) && fctx) {
        fade.width = canvas.width;
        fade.height = canvas.height;
        fctx.drawImage(canvas, 0, 0);
        fadeStart = now;
      }
      shown = a;

      const ra = Math.sqrt(da);
      const rb = Math.sqrt(db);
      // Weight of the second frame: 0 on top of frame a, 0.5 half-way between them.
      const w = b >= 0 && rb < BLEND_RADIUS && canBlend(frames[a], frames[b]) ? ra / (ra + rb || 1) : 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawFrame(a, 1);
      if (w > 0.02) drawFrame(b, w);
      if (a === front) drawEyes();

      const t = (now - fadeStart) / FADE_MS;
      if (t < 1) {
        ctx.globalAlpha = 1 - t * t * (3 - 2 * t);
        ctx.drawImage(fade, 0, 0);
        raf = requestAnimationFrame(paint);
      }
      ctx.globalAlpha = 1;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    redrawRef.current = schedule;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      fadeStart = -Infinity;
      schedule();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    const unsub = [yaw, pitch, gazeYaw, gazePitch].map((v) => v.on("change", schedule));
    return () => {
      cancelAnimationFrame(raf);
      redrawRef.current = () => {};
      ro.disconnect();
      unsub.forEach((u) => u());
    };
  }, [ready, frames, front, eyes, yaw, pitch, gazeYaw, gazePitch]);

  // Aim at the cursor (desktop) or look around slowly (touch).
  useEffect(() => {
    // Eyes go straight to the target; the head follows only the part the eyes
    // can't cover. The video has no clean downward look, so the head tilts
    // down only a little and the eyes do the rest.
    const lookAt = (y: number, p: number) => {
      gazeYawTarget.set(y);
      gazePitchTarget.set(p);
      yawTarget.set(headFrom(y, 0.14));
      pitchTarget.set(clamp(headFrom(p, 0.18), -1, 0.35));
    };
    if (reduce) {
      lookAt(0, 0);
      return;
    }
    if (!fine) {
      const opts = { repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" as const };
      const ty = animate(-0.7, 0.7, { ...opts, duration: 6, onUpdate: (v) => lookAt(v, gazePitchTarget.get()) });
      const tp = animate(-0.3, 0.15, { ...opts, duration: 8, onUpdate: (v) => lookAt(gazeYawTarget.get(), v) });
      return () => {
        ty.stop();
        tp.stop();
      };
    }
    let aimYaw = 0;
    let aimPitch = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;
    let back: ReturnType<typeof setTimeout> | undefined;
    // After a few still seconds the eyes glance a little to one side and come
    // back — the small, unprompted movement that makes a character feel alive.
    const armIdle = () => {
      clearTimeout(idle);
      clearTimeout(back);
      idle = setTimeout(() => {
        const side = Math.random() < 0.5 ? -1 : 1;
        gazeYawTarget.set(clamp(aimYaw + side * (0.35 + Math.random() * 0.25)));
        gazePitchTarget.set(clamp(aimPitch + (Math.random() - 0.5) * 0.3));
        back = setTimeout(() => {
          lookAt(aimYaw, aimPitch);
          armIdle();
        }, 900 + Math.random() * 700);
      }, 3000 + Math.random() * 2500);
    };
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * faceY);
      // Full turn ~320px to the side of the face, full tilt ~260px above/below.
      aimYaw = clamp(dx / 320);
      aimPitch = clamp(dy / 260);
      lookAt(aimYaw, aimPitch);
      armIdle();
    };
    const onLeave = () => {
      aimYaw = 0;
      aimPitch = 0;
      lookAt(0, 0);
    };
    armIdle();
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      clearTimeout(idle);
      clearTimeout(back);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [fine, reduce, faceY, yawTarget, pitchTarget, gazeYawTarget, gazePitchTarget]);

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
      <motion.div
        className="absolute inset-0 origin-[50%_100%] animate-breathe"
        style={reduce ? undefined : { x: leanX, y: leanY, rotate: leanRotate }}
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
      </motion.div>
    </div>
  );
}
