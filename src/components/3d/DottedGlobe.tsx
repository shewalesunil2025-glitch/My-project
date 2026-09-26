"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

export type GlobeMarker = { lat: number; lng: number; label: string };

type DottedGlobeProps = {
  markers: GlobeMarker[];
  /** Pairs of marker indexes joined by glowing arcs. */
  links: [number, number][];
  className?: string;
  /** Radius as a fraction of the canvas width. */
  radiusRatio?: number;
  /** Vertical centre as a fraction of canvas height (>0.5 sinks the globe). */
  centerY?: number;
};

type Vec = [number, number, number];

function latLng(lat: number, lng: number, r: number): Vec {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return [-(r * Math.sin(phi) * Math.cos(theta)), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}
const rotY = ([x, y, z]: Vec, a: number): Vec => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
const rotX = ([x, y, z]: Vec, a: number): Vec => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];

/**
 * Violet dotted globe on canvas (adapted from 21st.dev "Interactive Globe"):
 * Fibonacci dot sphere, glowing rim, labelled markers and travelling arcs.
 * Pauses off-screen; draws a single still frame with reduced motion.
 */
export function DottedGlobe({ markers, links, className, radiusRatio = 0.42, centerY = 0.62 }: DottedGlobeProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const N = 1600;
    const golden = (1 + Math.sqrt(5)) / 2;
    const dots: Vec[] = Array.from({ length: N }, (_, i) => {
      const theta = (2 * Math.PI * i) / golden;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
      return [Math.cos(theta) * Math.sin(phi), Math.cos(phi), Math.sin(theta) * Math.sin(phi)];
    });

    let w = 0;
    let h = 0;
    let frame = 0;
    let visible = true;
    let ry = 2.2;
    const rx = -0.35;
    let t = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const r = w * radiusRatio;
      const cx = w / 2;
      const cy = h * centerY;
      ctx.clearRect(0, 0, w, h);

      // Atmosphere / rim glow
      const halo = ctx.createRadialGradient(cx, cy, r * 0.86, cx, cy, r * 1.22);
      halo.addColorStop(0, "rgba(255,90,31,0)");
      halo.addColorStop(0.25, "rgba(255,110,40,0.55)");
      halo.addColorStop(0.5, "rgba(255,90,31,0.18)");
      halo.addColorStop(1, "rgba(255,90,31,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.22, 0, Math.PI * 2);
      ctx.fill();

      // Planet body
      const body = ctx.createRadialGradient(cx, cy - r * 0.3, r * 0.1, cx, cy, r);
      body.addColorStop(0, "#1b1512");
      body.addColorStop(0.8, "#0f0c0b");
      body.addColorStop(1, "#2a140a");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,140,80,0.55)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Dots
      for (const d of dots) {
        const p = rotY(rotX([d[0] * r, d[1] * r, d[2] * r], rx), ry);
        if (p[2] > 0) continue;
        const depth = Math.min(1, -p[2] / r);
        ctx.fillStyle = `rgba(235,225,220,${(0.12 + depth * 0.55).toFixed(3)})`;
        ctx.fillRect(cx + p[0] - 0.9, cy + p[1] - 0.9, 1.8, 1.8);
      }

      const proj = markers.map((m) => rotY(rotX(latLng(m.lat, m.lng, r), rx), ry));

      // Arcs with travelling sparks
      links.forEach(([a, b], i) => {
        const p1 = proj[a];
        const p2 = proj[b];
        if (p1[2] > r * 0.2 || p2[2] > r * 0.2) return;
        const mid: Vec = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2];
        const len = Math.hypot(...mid) || 1;
        const lift = r * 1.28;
        const c: [number, number] = [cx + (mid[0] / len) * lift, cy + (mid[1] / len) * lift];
        ctx.beginPath();
        ctx.moveTo(cx + p1[0], cy + p1[1]);
        ctx.quadraticCurveTo(c[0], c[1], cx + p2[0], cy + p2[1]);
        ctx.strokeStyle = "rgba(255,120,60,0.45)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        const k = (Math.sin(t * 1.3 + i) + 1) / 2;
        const sx = (1 - k) ** 2 * (cx + p1[0]) + 2 * (1 - k) * k * c[0] + k * k * (cx + p2[0]);
        const sy = (1 - k) ** 2 * (cy + p1[1]) + 2 * (1 - k) * k * c[1] + k * k * (cy + p2[1]);
        ctx.fillStyle = "#ffd2b8";
        ctx.beginPath();
        ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Markers
      ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif";
      markers.forEach((m, i) => {
        const p = proj[i];
        if (p[2] > r * 0.05) return;
        const x = cx + p[0];
        const y = cy + p[1];
        const pulse = (Math.sin(t * 2 + i) + 1) / 2;
        ctx.strokeStyle = `rgba(255,120,60,${(0.25 + pulse * 0.3).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(x, y, 5 + pulse * 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#8b5cf6";
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText(m.label, x + 9, y + 4);
      });
    };

    const tick = () => {
      ry += 0.0016;
      t += 0.016;
      draw();
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (reduce || !visible || document.hidden || frame) return;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    resize();
    draw();
    start();
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [markers, links, radiusRatio, centerY]);

  return <canvas ref={ref} aria-hidden className={cn("block size-full", className)} />;
}
