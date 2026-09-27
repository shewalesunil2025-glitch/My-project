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
  /** Marker to spotlight (e.g. the card being hovered). */
  active?: number | null;
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
 * Lime dotted globe on canvas (adapted from 21st.dev "Interactive Globe"): a
 * Fibonacci dot sphere whose "land" dots glow brighter, a lime atmosphere, arcs
 * that draw themselves between the markers with sparks racing along them, and
 * pinging markers. It leans toward the cursor and can spotlight one marker.
 * Pauses off-screen; draws a single still frame with reduced motion.
 */
export function DottedGlobe({ markers, links, className, radiusRatio = 0.42, centerY = 0.62, active = null }: DottedGlobeProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef<number | null>(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const N = 2600;
    const golden = (1 + Math.sqrt(5)) / 2;
    const dots: Vec[] = Array.from({ length: N }, (_, i) => {
      const theta = (2 * Math.PI * i) / golden;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
      return [Math.cos(theta) * Math.sin(phi), Math.cos(phi), Math.sin(theta) * Math.sin(phi)];
    });
    // Procedural "continents": smooth blobs on the sphere decide which dots are land.
    const land = dots.map(([x, y, z]) => {
      const n =
        Math.sin(x * 3.1 + 1.3) * Math.cos(y * 2.7 - 0.4) +
        Math.sin(z * 3.7 + y * 1.9) * 0.8 +
        Math.cos(x * 5.3 - z * 4.1) * 0.35;
      return n > 0.15;
    });

    const mouse = { x: 0, y: 0 };
    let tilt = 0;
    let lean = 0;
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
    };

    let w = 0;
    let h = 0;
    let frame = 0;
    let visible = true;
    let ry = 2.2;
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
      const rx = -0.35 + tilt;
      const act = activeRef.current;
      ctx.clearRect(0, 0, w, h);

      // Atmosphere / rim glow, breathing slowly
      const breathe = 0.85 + Math.sin(t * 0.9) * 0.15;
      const halo = ctx.createRadialGradient(cx, cy, r * 0.86, cx, cy, r * 1.25);
      halo.addColorStop(0, "rgba(125,255,58,0)");
      halo.addColorStop(0.22, `rgba(160,255,100,${(0.6 * breathe).toFixed(3)})`);
      halo.addColorStop(0.5, `rgba(90,210,40,${(0.2 * breathe).toFixed(3)})`);
      halo.addColorStop(1, "rgba(125,255,58,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.22, 0, Math.PI * 2);
      ctx.fill();

      // Planet body
      const body = ctx.createRadialGradient(cx, cy - r * 0.3, r * 0.1, cx, cy, r);
      body.addColorStop(0, "#0e1a0f");
      body.addColorStop(0.8, "#060d07");
      body.addColorStop(1, "#123a10");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(170,255,120,0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Dots
      dots.forEach((d, i) => {
        const p = rotY(rotX([d[0] * r, d[1] * r, d[2] * r], rx), ry + lean);
        if (p[2] > 0) return;
        const depth = Math.min(1, -p[2] / r);
        if (land[i]) {
          ctx.fillStyle = `rgba(190,255,150,${(0.25 + depth * 0.7).toFixed(3)})`;
          ctx.fillRect(cx + p[0] - 1.1, cy + p[1] - 1.1, 2.2, 2.2);
        } else {
          ctx.fillStyle = `rgba(130,210,115,${(0.14 + depth * 0.3).toFixed(3)})`;
          ctx.fillRect(cx + p[0] - 0.7, cy + p[1] - 0.7, 1.4, 1.4);
        }
      });

      const proj = markers.map((m) => rotY(rotX(latLng(m.lat, m.lng, r), rx), ry + lean));

      // Arcs with travelling sparks
      links.forEach(([a, b], i) => {
        const p1 = proj[a];
        const p2 = proj[b];
        if (p1[2] > r * 0.2 || p2[2] > r * 0.2) return;
        const mid: Vec = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2];
        const len = Math.hypot(...mid) || 1;
        const lift = r * 1.28;
        const c: [number, number] = [cx + (mid[0] / len) * lift, cy + (mid[1] / len) * lift];
        const at = (k: number): [number, number] => [
          (1 - k) ** 2 * (cx + p1[0]) + 2 * (1 - k) * k * c[0] + k * k * (cx + p2[0]),
          (1 - k) ** 2 * (cy + p1[1]) + 2 * (1 - k) * k * c[1] + k * k * (cy + p2[1]),
        ];
        // The arc draws itself, holds, then fades — staggered per link.
        const cycle = (t * 0.35 + i * 0.23) % 1;
        const grow = Math.min(1, cycle / 0.45);
        const fade = cycle > 0.85 ? 1 - (cycle - 0.85) / 0.15 : 1;
        const lit = act !== null && (a === act || b === act);
        ctx.beginPath();
        const steps = 28;
        for (let s2 = 0; s2 <= steps * grow; s2++) {
          const [px, py] = at(s2 / steps);
          if (s2 === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = `rgba(160,255,100,${((lit ? 0.9 : 0.5) * fade).toFixed(3)})`;
        ctx.lineWidth = lit ? 2 : 1.3;
        ctx.stroke();
        // Spark racing ahead of the line
        const [sx, sy] = at(grow);
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 7);
        g.addColorStop(0, `rgba(240,255,225,${fade.toFixed(3)})`);
        g.addColorStop(1, "rgba(125,255,58,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, 7, 0, Math.PI * 2);
        ctx.fill();
      });

      // Markers
      ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif";
      markers.forEach((m, i) => {
        const p = proj[i];
        if (p[2] > r * 0.05) return;
        const x = cx + p[0];
        const y = cy + p[1];
        const on = act === i;
        // Expanding ping rings
        for (let k = 0; k < 2; k++) {
          const ph = (t * 0.8 + i * 0.3 + k * 0.5) % 1;
          ctx.strokeStyle = `rgba(160,255,100,${((1 - ph) * (on ? 0.9 : 0.5)).toFixed(3)})`;
          ctx.lineWidth = on ? 1.6 : 1;
          ctx.beginPath();
          ctx.arc(x, y, 4 + ph * (on ? 22 : 14), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = on ? "#eaffd9" : "#7dff3a";
        ctx.beginPath();
        ctx.arc(x, y, on ? 4.5 : 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = on ? "600 14px ui-sans-serif, system-ui, sans-serif" : "600 12px ui-sans-serif, system-ui, sans-serif";
        ctx.fillStyle = on ? "#eaffd9" : "rgba(255,255,255,0.9)";
        ctx.fillText(m.label, x + 10, y + 4);
      });
    };

    const tick = () => {
      const act = activeRef.current;
      if (act !== null && markers[act]) {
        // Swing the hovered system round to face the viewer (shortest way).
        const m = markers[act];
        let best = ry;
        let bestZ = Infinity;
        for (let a = 0; a < Math.PI * 2; a += 0.08) {
          const z = rotY(rotX(latLng(m.lat, m.lng, 1), -0.35 + tilt), a + lean)[2] + Math.abs(rotY(rotX(latLng(m.lat, m.lng, 1), -0.35 + tilt), a + lean)[0]) * 0.6;
          if (z < bestZ) {
            bestZ = z;
            best = a;
          }
        }
        let diff = ((best - ry) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
        if (Math.abs(diff) < 0.001) diff = 0;
        ry += diff * 0.06;
      } else {
        ry += 0.0022;
      }
      t += 0.016;
      // Lean gently toward the cursor.
      tilt += (mouse.y * 0.35 - tilt) * 0.04;
      lean += (mouse.x * 0.6 - lean) * 0.04;
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
    window.addEventListener("pointermove", onMove, { passive: true });

    resize();
    draw();
    start();
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
    };
  }, [markers, links, radiusRatio, centerY]);

  return <canvas ref={ref} aria-hidden className={cn("block size-full", className)} />;
}
