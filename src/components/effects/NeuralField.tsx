"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

type Node = { x: number; y: number; vx: number; vy: number; charge: number };
type Pulse = { a: number; b: number; t: number };

const LINK = 150; // px: nodes closer than this are connected
const FIRE_RADIUS = 170; // px around the cursor where neurons fire

/**
 * A living neural network (after the 21st.dev "Neurons Hero" pattern): nodes drift,
 * link up when close, and fire near the cursor — sending light pulses along their
 * connections. Canvas 2D, paused off-screen, a still frame for reduced motion.
 */
export function NeuralField({ className, density = 1 }: { className?: string; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    const pulses: Pulse[] = [];
    const mouse = { x: -1e4, y: -1e4 };
    let raf = 0;
    let visible = true;
    let last = performance.now();

    const seed = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const count = Math.round(Math.min(110, (w * h) / 14000) * density);
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        charge: 0,
      }));
    };

    const draw = (dt: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        n.charge *= Math.pow(0.94, dt);
        const md = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        if (md < FIRE_RADIUS) n.charge = Math.max(n.charge, 1 - md / FIRE_RADIUS);
      }

      // Connections, brighter where neurons are charged.
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > LINK) continue;
          const k = 1 - d / LINK;
          const c = Math.max(a.charge, b.charge);
          ctx.strokeStyle = `rgba(${Math.round(139 - 105 * c)}, ${Math.round(92 + 119 * c)}, ${Math.round(246 - 8 * c)}, ${0.08 * k + 0.45 * k * c})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          // Charged neurons occasionally fire a pulse down the link.
          if (!reduce && c > 0.55 && pulses.length < 60 && Math.random() < 0.012 * dt) {
            pulses.push(a.charge > b.charge ? { a: i, b: j, t: 0 } : { a: j, b: i, t: 0 });
          }
        }
      }

      for (const n of nodes) {
        ctx.fillStyle = `rgba(${Math.round(167 - 133 * n.charge)}, ${Math.round(139 + 72 * n.charge)}, 250, ${0.35 + 0.65 * n.charge})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.2 + n.charge * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pulses travelling along links.
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pl = pulses[p];
        pl.t += 0.035 * dt;
        const a = nodes[pl.a];
        const b = nodes[pl.b];
        if (pl.t >= 1 || !a || !b) {
          if (b) b.charge = Math.max(b.charge, 0.7);
          pulses.splice(p, 1);
          continue;
        }
        const x = a.x + (b.x - a.x) * pl.t;
        const y = a.y + (b.y - a.y) * pl.t;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
        g.addColorStop(0, "rgba(165, 243, 252, 0.95)");
        g.addColorStop(1, "rgba(34, 211, 238, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(now - last, 50) / 16.667;
      last = now;
      draw(dt);
      raf = visible ? requestAnimationFrame(loop) : 0;
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -1e4;
    };

    seed();
    if (reduce) {
      draw(0);
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(canvas);
    const ro = new ResizeObserver(seed);
    ro.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [density]);

  return <canvas ref={ref} aria-hidden className={cn("pointer-events-none size-full", className)} />;
}
