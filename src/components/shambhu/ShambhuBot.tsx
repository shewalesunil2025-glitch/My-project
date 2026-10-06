"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

export type BotMood = "idle" | "listening" | "thinking" | "speaking";

/** IBAX greens for the rim of light, the glass core and the inner glow. */
const RIM = ["#d6ff7a", "#8ff05e", "#4fd84a", "#2ec27e", "#2fe0b0", "#1fb7a6", "#0e8f6a", "#7ae86a", "#f0ff9e", "#d6ff7a"];
const CORE = ["#0f4a3a", "#0a2f25", "#03120d"];
const WISP = ["#9be35a", "#5ff0b0"];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

type Ribbon = { r: number; w: number; a2: number; a3: number; a5: number; s2: number; s3: number; p2: number; p3: number; ox: number; oy: number; rot: number; alpha: number };

/**
 * IBAX's chatbot face: a living orb. A rim of green light wobbles and breaks into
 * liquid swirls, a dark glass core glows from inside, and two white eyes glance
 * around, turn with the "head" and blink down to dots. Drawn on a canvas so it
 * stays smooth; it pauses when off screen. `mood`: listening — the light swirls
 * faster and the eyes face the visitor; thinking — the eyes become dots and scan;
 * speaking — smiling eyes.
 *
 * `bleed` (0–1) is how much of the box the orb fills: lower values leave room for
 * the outer glow when the canvas is drawn larger than its button.
 */
export function ShambhuBot({ mood = "idle", className, bleed = 0.92 }: { mood?: BotMood; className?: string; bleed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const moodRef = useRef(mood);
  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const ribbons: Ribbon[] = Array.from({ length: 6 }, () => ({
      r: rand(0.84, 0.95), w: rand(0.09, 0.17), a2: rand(0.5, 1), a3: rand(0.3, 0.8), a5: rand(0.1, 0.4),
      s2: rand(0.4, 1.1) * (Math.random() < 0.5 ? -1 : 1), s3: rand(0.5, 1.4) * (Math.random() < 0.5 ? -1 : 1),
      p2: rand(0, 6.28), p3: rand(0, 6.28), ox: rand(0, 6.28), oy: rand(0, 6.28), rot: rand(-0.4, 0.4), alpha: rand(0.45, 0.8),
    }));
    const look = { x: 0, y: 0, tx: 0, ty: 0, next: 1 };
    const blink = { open: 1, t: 0, next: rand(1.5, 3), dotsUntil: 0, double: false };
    let size = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const px = Math.round(canvas.clientWidth * dpr);
      if (px && px !== size) { size = px; canvas.width = px; canvas.height = px; }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Calm sphere most of the time, with swells of liquid turbulence.
    const turbulence = (t: number) => {
      const m = moodRef.current;
      if (m === "listening") return 0.55 + 0.45 * Math.abs(Math.sin(t * 2.6));
      if (m === "thinking") return 0.35 + 0.2 * Math.sin(t * 1.7);
      const base = 0.5 + 0.5 * Math.sin(t * 0.85 + Math.sin(t * 0.31) * 2.2);
      const k = Math.pow(clamp((base - 0.35) / 0.65, 0, 1), 1.6);
      return m === "speaking" ? 0.25 + k * 0.4 : k;
    };

    const update = (t: number, dt: number) => {
      const m = moodRef.current;
      look.next -= dt;
      if (look.next <= 0) {
        if (m === "listening") { look.tx = rand(-0.15, 0.15); look.ty = rand(-0.1, 0.1); look.next = rand(0.8, 1.6); }
        else if (Math.random() < 0.35) { look.tx = 0; look.ty = 0; look.next = rand(1.2, 2.4); }
        else { const a = rand(0, 6.28), d = rand(0.5, 1); look.tx = Math.cos(a) * d; look.ty = Math.sin(a) * d * 0.7; look.next = rand(1.2, 2.6); }
      }
      if (m === "thinking") { look.tx = Math.sin(t * 2.2) * 0.75; look.ty = -0.25; }
      const ease = 1 - Math.pow(0.0025, dt);
      look.x = lerp(look.x, look.tx, ease);
      look.y = lerp(look.y, look.ty, ease);

      // Blink: the eyes collapse to dots, sometimes twice, sometimes holding as dots.
      blink.next -= dt;
      if (blink.next <= 0 && blink.t <= 0) {
        blink.t = 0.24; blink.next = rand(2.2, 4.8);
        if (Math.random() < 0.25) blink.double = true;
        if (Math.random() < 0.18) blink.dotsUntil = t + rand(0.5, 0.9);
      }
      let target = 1;
      if (blink.t > 0) {
        blink.t -= dt;
        const p = 1 - blink.t / 0.24;
        target = p < 0.5 ? 1 - p * 2 : (p - 0.5) * 2;
        if (blink.t <= 0 && blink.double) { blink.double = false; blink.t = 0.22; }
      }
      if (t < blink.dotsUntil || m === "thinking") target = 0;
      blink.open = blink.t > 0 ? clamp(target, 0, 1) : lerp(blink.open, target, 1 - Math.pow(0.0001, dt));
    };

    const draw = (t: number) => {
      const m = moodRef.current;
      const S = size, R = (S / 2) * bleed * 0.78, k = turbulence(t);
      ctx.clearRect(0, 0, S, S);
      const hx = S / 2 + look.x * R * 0.06 + Math.sin(t * 1.3) * R * 0.015 * (1 + k);
      const hy = S / 2 + look.y * R * 0.06 + Math.cos(t * 1.1) * R * 0.02 * (1 + k);
      const sq = 1 + Math.sin(t * 2.1) * 0.025 * k;

      // Outer glow
      const halo = ctx.createRadialGradient(hx, hy, R * 0.6, hx, hy, R * 1.28);
      halo.addColorStop(0, "rgba(110,217,78,0.24)");
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(hx, hy, R * 1.28, 0, 6.2832); ctx.fill();

      // Glass core
      const Rc = R * 0.8;
      ctx.save();
      ctx.translate(hx, hy); ctx.scale(sq, 2 - sq); ctx.translate(-hx, -hy);
      const core = ctx.createRadialGradient(hx - Rc * 0.15, hy - Rc * 0.3, Rc * 0.1, hx, hy, Rc);
      core.addColorStop(0, CORE[0]); core.addColorStop(0.55, CORE[1]); core.addColorStop(1, CORE[2]);
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(hx, hy, Rc, 0, 6.2832); ctx.fill();

      // Inner glow and liquid wisps, clipped to the glass
      ctx.save();
      ctx.beginPath(); ctx.arc(hx, hy, Rc, 0, 6.2832); ctx.clip();
      const gx = hx + look.x * R * 0.25, gy = hy + look.y * R * 0.2;
      const heart = ctx.createRadialGradient(gx, gy, 0, gx, gy, Rc * 0.7);
      heart.addColorStop(0, "rgba(110,217,78,0.45)"); heart.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = heart; ctx.fillRect(hx - Rc, hy - Rc, Rc * 2, Rc * 2);
      ctx.globalCompositeOperation = "lighter";
      for (let w = 0; w < 3; w++) {
        const ang = t * (0.35 + w * 0.17) + w * 2.1;
        ctx.globalAlpha = 0.015 + 0.15 * k;
        ctx.strokeStyle = WISP[w % 2];
        ctx.lineWidth = Rc * (0.18 + 0.1 * w);
        ctx.beginPath();
        ctx.ellipse(hx + Math.cos(ang) * Rc * 0.55, hy + Math.sin(ang * 1.3) * Rc * 0.5, Rc * (0.9 + 0.2 * w), Rc * (0.35 + 0.1 * w), ang * 0.6, 0, 6.2832);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.08 + 0.06 * Math.sin(t * 0.7);
      ctx.strokeStyle = "#bfffe8"; ctx.lineWidth = Rc * 0.05;
      const sy = Math.sin(t * 0.5) * Rc * 0.3;
      ctx.beginPath(); ctx.moveTo(hx - Rc * 0.9, hy + Rc * 0.1 + sy); ctx.lineTo(hx + Rc * 0.9, hy + Rc * 0.65 + sy); ctx.stroke();
      ctx.restore();

      // Rim of light: overlapping wobbling ribbons, painted additively in soft layers
      ctx.globalCompositeOperation = "lighter";
      const drift = m === "thinking" ? t * 2.4 : t * 0.5;
      const grad = "createConicGradient" in ctx ? ctx.createConicGradient(drift, hx, hy) : null;
      if (grad) RIM.forEach((c, i) => grad.addColorStop(i / (RIM.length - 1), c));
      const speed = m === "listening" ? 2.2 : 1;
      ribbons.forEach((rb, r) => {
        const amp = 0.012 + 0.09 * k;
        const ox = Math.sin(t * 0.9 * speed + rb.ox) * R * 0.09 * k, oy = Math.cos(t * 0.8 * speed + rb.oy) * R * 0.09 * k;
        const tilt = rb.rot * k + Math.sin(t * 0.6 + r) * 0.15 * k;
        const squash = 1 - 0.12 * k * Math.abs(Math.sin(t * 0.7 + r));
        ctx.beginPath();
        for (let i = 0; i <= 72; i++) {
          const th = (i / 72) * 6.2832;
          const rr = R * rb.r * (1 + amp * (rb.a2 * Math.sin(2 * th + rb.p2 + t * rb.s2 * speed) + rb.a3 * Math.sin(3 * th + rb.p3 + t * rb.s3 * speed) + rb.a5 * Math.sin(5 * th + t * 1.7)));
          const x = rr * Math.cos(th), y = rr * Math.sin(th) * squash;
          const xr = x * Math.cos(tilt) - y * Math.sin(tilt), yr = x * Math.sin(tilt) + y * Math.cos(tilt);
          if (i === 0) ctx.moveTo(hx + ox + xr, hy + oy + yr);
          else ctx.lineTo(hx + ox + xr, hy + oy + yr);
        }
        ctx.closePath();
        ctx.strokeStyle = grad ?? RIM[r % RIM.length];
        const lw = R * rb.w * (0.8 + 0.5 * k), a = rb.alpha * (r < 2 ? 1 : 0.35 + 0.65 * k);
        ctx.globalAlpha = a * 0.06; ctx.lineWidth = lw * 3.6; ctx.stroke();
        ctx.globalAlpha = a * 0.12; ctx.lineWidth = lw * 2.4; ctx.stroke();
        ctx.globalAlpha = a * 0.22; ctx.lineWidth = lw * 1.4; ctx.stroke();
        ctx.globalAlpha = a * 0.3; ctx.lineWidth = lw * 0.75; ctx.stroke();
      });
      ctx.globalAlpha = 0.5; ctx.lineWidth = R * 0.018; ctx.strokeStyle = grad ?? "#fff";
      ctx.beginPath(); ctx.arc(hx, hy, Rc * 1.01, 0, 6.2832); ctx.stroke();
      ctx.restore();
      ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;

      // Eyes: follow the gaze, foreshorten and tilt as the head turns, blink to dots
      const ew = R * 0.085, eh = R * 0.2, turn = look.x;
      const gap = R * 0.2 * (1 - 0.3 * Math.abs(turn));
      ctx.save();
      ctx.translate(hx + look.x * R * 0.36, hy + look.y * R * 0.32 - R * 0.02);
      ctx.rotate(turn * look.y * 0.5 + turn * 0.08);
      ctx.shadowColor = "rgba(255,255,255,0.95)"; ctx.shadowBlur = R * 0.09;
      ctx.fillStyle = "#fff"; ctx.strokeStyle = "#fff"; ctx.lineCap = "round";
      for (const e of [-1, 1]) {
        if (m === "speaking") {
          ctx.lineWidth = ew * 0.75;
          ctx.beginPath(); ctx.arc(e * gap, eh * 0.15, ew * 1.3, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
          continue;
        }
        const outer = (e === 1 && turn > 0) || (e === -1 && turn < 0);
        const hScale = 1 - (outer ? 0.28 : 0.05) * Math.abs(turn);
        const wFull = ew * (outer ? 1 - 0.25 * Math.abs(turn) : 1), dot = ew * 0.7;
        const h = lerp(dot, eh * hScale, blink.open) * (m === "listening" ? 1.15 : 1), w = lerp(dot, wFull, blink.open);
        const x0 = e * gap - w / 2, y0 = -h / 2, rad = w / 2;
        ctx.beginPath();
        ctx.moveTo(x0 + rad, y0);
        ctx.arcTo(x0 + w, y0, x0 + w, y0 + h, rad); ctx.arcTo(x0 + w, y0 + h, x0, y0 + h, rad);
        ctx.arcTo(x0, y0 + h, x0, y0, rad); ctx.arcTo(x0, y0, x0 + w, y0, rad);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    };

    // Run only while visible on screen and the tab is in front.
    let raf = 0, visible = true, last = performance.now();
    const start = last - rand(0, 4000);
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (size) { update((now - start) / 1000, dt); draw((now - start) / 1000); }
      raf = requestAnimationFrame(frame);
    };
    const play = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const pause = () => { cancelAnimationFrame(raf); raf = 0; };
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) play(); else pause(); });
    io.observe(canvas);
    const onVis = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVis);
    play();

    return () => { pause(); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [bleed]);

  return <canvas ref={ref} aria-hidden data-mood={mood} className={cn("block aspect-square", className)} />;
}
