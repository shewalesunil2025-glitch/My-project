"use client";

import { prefersReducedMotion } from "@/hooks/useReducedMotion";
import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { cn } from "@/lib/cn";

export type CloudShape = "brain" | "helix" | "morph";

type Props = {
  shape: CloudShape;
  /** 0 → formed, 1 → blown apart into drifting dust (driven by scroll). */
  disperse?: MotionValue<number>;
  /** Particles scatter away from the cursor and the form turns toward it. */
  interactive?: boolean;
  /** Fraction of the canvas (by its smaller side) the form fills. */
  size?: number;
  className?: string;
};

type Vec = Float32Array; // x, y, z interleaved

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/* ── Shape generators (unit space, roughly −1.3…1.3) ───────────────────── */

/** Brain surface; `tone` marks the gyri (ridges, bright) against the sulci (grooves, dark). */
function brain(n: number, tone: Float32Array, normal: Float32Array): Vec {
  const out = new Float32Array(n * 3);
  let p = 0;
  const put = (x: number, y: number, z: number, t: number, nx = x, ny = y, nz = z) => {
    out[p * 3] = x;
    out[p * 3 + 1] = y;
    out[p * 3 + 2] = z;
    const l = Math.hypot(nx, ny, nz) || 1;
    normal[p * 3] = nx / l;
    normal[p * 3 + 1] = ny / l;
    normal[p * 3 + 2] = nz / l;
    tone[p] = t;
    p++;
  };
  while (p < n) {
    const r = Math.random();
    if (r < 0.84) {
      // Cerebrum: two hemispheres whose surface folds into ridges and grooves.
      const u = rand(-1, 1);
      const th = rand(0, Math.PI * 2);
      const s = Math.sqrt(1 - u * u);
      const ex = s * Math.cos(th);
      const ey = u;
      const ez = s * Math.sin(th);
      const fold =
        Math.sin(ex * 13 + Math.sin(ey * 6) * 2.6) * Math.sin(ez * 11 + Math.sin(ex * 5) * 2.4) +
        0.7 * Math.sin(ey * 15 + ez * 8 + Math.sin(ex * 9) * 1.5);
      const ridge = Math.tanh(fold * 1.8); // −1 groove … 1 ridge
      // Dots gather on the gyri, so the folds read as worm-like ridges.
      if (ridge < 0.1 && Math.random() > 0.12) continue;
      const shell = Math.random() < 0.94 ? rand(0.985, 1) : rand(0.6, 0.95);
      const k = (1 + 0.075 * ridge) * shell;
      let x = ex * 1.0 * k;
      const y = ey * (ey > 0 ? 0.74 : 0.88) * k; // flatter underside
      const z = ez * 1.28 * k;
      if (Math.abs(x) < 0.07) continue; // longitudinal fissure
      x += Math.sign(x) * 0.08;
      put(x, -y + 0.06, z, (ridge + 1) / 2, ex, -ey, ez);
    } else if (r < 0.95) {
      // Cerebellum: small striped lobe low at the back.
      const u = rand(-1, 1);
      const th = rand(0, Math.PI * 2);
      const s = Math.sqrt(1 - u * u);
      const folia = Math.sin(u * 42);
      const k = 1 + 0.05 * folia;
      put(0.64 * s * Math.cos(th) * k, 0.55 + 0.27 * u * k, -0.8 + 0.44 * s * Math.sin(th) * k, (folia + 1) / 2);
    } else {
      // Brain stem.
      const t = Math.random();
      const a = rand(0, Math.PI * 2);
      const rr = 0.13 * Math.sqrt(Math.random());
      put(rr * Math.cos(a), 0.45 + t * 0.7, -0.32 - t * 0.18 + rr * Math.sin(a), 0.4);
    }
  }
  return out;
}

function helix(n: number): Vec {
  const out = new Float32Array(n * 3);
  for (let p = 0; p < n; p++) {
    const r = Math.random();
    const t = Math.random();
    const y = (t - 0.5) * 3.4;
    const ang = t * Math.PI * 7;
    let x: number, z: number;
    if (r < 0.62) {
      // Two strands.
      const phase = r < 0.31 ? 0 : Math.PI;
      const jitter = 0.07;
      x = Math.cos(ang + phase) * 0.62 + rand(-jitter, jitter);
      z = Math.sin(ang + phase) * 0.62 + rand(-jitter, jitter);
    } else if (r < 0.8) {
      // Rungs between the strands.
      const step = Math.round(t * 42) / 42;
      const a = step * Math.PI * 7;
      const m = rand(-1, 1);
      x = Math.cos(a) * 0.62 * m;
      z = Math.sin(a) * 0.62 * m;
      out[p * 3 + 1] = (step - 0.5) * 3.4;
      out[p * 3] = x;
      out[p * 3 + 2] = z;
      continue;
    } else {
      // Loose dust around it.
      const a = rand(0, Math.PI * 2);
      const rr = rand(0.7, 1.6);
      x = Math.cos(a) * rr;
      z = Math.sin(a) * rr;
    }
    out[p * 3] = x;
    out[p * 3 + 1] = y;
    out[p * 3 + 2] = z;
  }
  return out;
}

function blob(n: number): Vec {
  const out = new Float32Array(n * 3);
  for (let p = 0; p < n; p++) {
    const u = rand(-1, 1);
    const th = rand(0, Math.PI * 2);
    const s = Math.sqrt(1 - u * u);
    const k = (1 + 0.12 * Math.sin(3 * th) * Math.cos(4 * u)) * rand(0.9, 1) * 0.85;
    out[p * 3] = s * Math.cos(th) * k;
    out[p * 3 + 1] = u * k;
    out[p * 3 + 2] = s * Math.sin(th) * k;
  }
  return out;
}

function torus(n: number): Vec {
  const out = new Float32Array(n * 3);
  for (let p = 0; p < n; p++) {
    const a = rand(0, Math.PI * 2);
    const b = rand(0, Math.PI * 2);
    const r = 0.32 * rand(0.85, 1);
    out[p * 3] = (0.72 + r * Math.cos(b)) * Math.cos(a);
    out[p * 3 + 1] = (0.72 + r * Math.cos(b)) * Math.sin(a);
    out[p * 3 + 2] = r * Math.sin(b);
  }
  return out;
}

function lobes(n: number): Vec {
  const out = new Float32Array(n * 3);
  for (let p = 0; p < n; p++) {
    const side = p % 2 ? 1 : -1;
    const u = rand(-1, 1);
    const th = rand(0, Math.PI * 2);
    const s = Math.sqrt(1 - u * u);
    const k = rand(0.9, 1) * 0.48;
    out[p * 3] = side * 0.5 + s * Math.cos(th) * k * 0.85;
    out[p * 3 + 1] = u * k * 1.25 - side * 0.12;
    out[p * 3 + 2] = s * Math.sin(th) * k;
  }
  return out;
}

const PALETTE = ["#0b2a0d", "#154f17", "#23801f", "#3cb81c", "#6cf02e", "#9dff5e", "#d8ffbe"];

/**
 * Particle forms from the reference: a brain made of green dots in the hero, a DNA
 * helix behind the solutions and a morphing blob by the contact call. Canvas 2D with
 * depth-sorted colour buckets; the cursor scatters nearby dots and the form turns to
 * face it. Paused off-screen; reduced motion draws a still frame.
 */
export function PointCloud({ shape, disperse, interactive = true, size = 0.8, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = prefersReducedMotion();
    const small = window.matchMedia("(max-width: 768px)").matches;
    const base = shape === "brain" ? 22000 : shape === "helix" ? 4200 : 4800;
    const n = Math.round(base * (small ? 0.45 : 1));

    const tone = new Float32Array(n).fill(0.5);
    const normal = new Float32Array(n * 3);
    const targets: Vec[] =
      shape === "brain"
        ? [brain(n, tone, normal)]
        : shape === "helix"
          ? [helix(n)]
          : [blob(n), torus(n), lobes(n), blob(n)];
    const lit = shape === "brain";
    // Key light from the upper left, in front.
    const L = [-0.3, -0.42, 0.86];
    const pos = new Float32Array(targets[0]);
    const dirs = new Float32Array(n * 3);
    for (let p = 0; p < n; p++) {
      const u = rand(-1, 1);
      const th = rand(0, Math.PI * 2);
      const s = Math.sqrt(1 - u * u);
      const m = rand(1.5, 7);
      dirs[p * 3] = s * Math.cos(th) * m;
      dirs[p * 3 + 1] = u * m;
      dirs[p * 3 + 2] = s * Math.sin(th) * m;
    }
    const glint = new Uint8Array(n).map(() => (Math.random() < 0.05 ? 1 : 0));
    const ox = new Float32Array(n);
    const oy = new Float32Array(n);
    const vx = new Float32Array(n);
    const vy = new Float32Array(n);
    const buckets: number[][] = PALETTE.map(() => []);

    let w = 0;
    let h = 0;
    let dpr = 1;
    let yaw = shape === "brain" ? 0.9 : 0;
    let pitch = shape === "brain" ? -0.2 : 0;
    let tYaw = yaw;
    let tPitch = pitch;
    const mouse = { x: -1e4, y: -1e4, nx: 0, ny: 0, active: false };
    let raf = 0;
    let visible = false;
    let last = performance.now();
    let morphT = 0;
    let morphIndex = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };

    const frame = (now: number) => {
      const dt = Math.min(now - last, 50) / 16.667;
      last = now;
      const time = now / 1000;
      const spread = disperse?.get() ?? 0;

      // Morph: hold a shape, then flow into the next one.
      if (targets.length > 1) {
        morphT += 0.004 * dt;
        if (morphT >= 1) {
          morphT = 0;
          morphIndex = (morphIndex + 1) % (targets.length - 1);
        }
      }
      const A = targets[targets.length > 1 ? morphIndex : 0];
      const B = targets[targets.length > 1 ? morphIndex + 1 : 0];
      const mt = targets.length > 1 ? Math.min(1, Math.max(0, (morphT - 0.45) / 0.45)) : 0;
      const e = mt * mt * (3 - 2 * mt);

      // Orientation: slow drift, and turn toward the cursor.
      const idleYaw = shape === "helix" ? time * 0.35 : Math.sin(time * 0.25) * 0.25 + (shape === "morph" ? time * 0.3 : 0);
      if (interactive && mouse.active) {
        tYaw = (shape === "brain" ? 0.9 : 0) + mouse.nx * 0.7;
        tPitch = (shape === "brain" ? -0.2 : 0) + mouse.ny * 0.4;
      } else {
        tYaw = shape === "brain" ? 0.9 : 0;
        tPitch = shape === "brain" ? -0.2 : 0;
      }
      yaw += (tYaw - yaw) * 0.04 * dt;
      pitch += (tPitch - pitch) * 0.04 * dt;
      const ry = yaw + idleYaw;
      const cy = Math.cos(ry);
      const sy = Math.sin(ry);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);

      const scale = Math.min(w, h) * size * 0.42;
      const cx0 = w / 2;
      const cy0 = h / 2;
      const cam = 3.4;
      const R = Math.min(w, h) * 0.16;

      for (const b of buckets) b.length = 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      for (let p = 0; p < n; p++) {
        const j = p * 3;
        let x = A[j] + (B[j] - A[j]) * e;
        let y = A[j + 1] + (B[j + 1] - A[j + 1]) * e;
        let z = A[j + 2] + (B[j + 2] - A[j + 2]) * e;
        // Ease live positions toward the target (smooth morphs).
        pos[j] += (x - pos[j]) * 0.2;
        pos[j + 1] += (y - pos[j + 1]) * 0.2;
        pos[j + 2] += (z - pos[j + 2]) * 0.2;
        x = pos[j] + dirs[j] * spread;
        y = pos[j + 1] + dirs[j + 1] * spread;
        z = pos[j + 2] + dirs[j + 2] * spread;

        // Rotate (yaw, then pitch).
        const x1 = x * cy + z * sy;
        const z1 = -x * sy + z * cy;
        const y1 = y * cp - z1 * sp;
        const z2 = y * sp + z1 * cp;

        const f = cam / (cam - z2);
        if (f <= 0 || f > 8) continue;
        let sx = cx0 + x1 * f * scale;
        let sy2 = cy0 + y1 * f * scale;

        // Cursor: push dots away with a little swirl, then spring back.
        if (interactive) {
          const dx = sx - mouse.x;
          const dy = sy2 - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1;
            const q = 1 - d / R;
            const force = q * q * (1.2 + (p % 7) * 0.25);
            vx[p] += (dx / d) * force * dt + (-dy / d) * force * 0.6 * dt;
            vy[p] += (dy / d) * force * dt + (dx / d) * force * 0.6 * dt;
          }
          vx[p] += -ox[p] * 0.02 * dt;
          vy[p] += -oy[p] * 0.02 * dt;
          vx[p] *= Math.pow(0.9, dt);
          vy[p] *= Math.pow(0.9, dt);
          ox[p] += vx[p] * dt;
          oy[p] += vy[p] * dt;
          sx += ox[p];
          sy2 += oy[p];
        }
        if (sx < -4 || sy2 < -4 || sx > w + 4 || sy2 > h + 4) continue;

        const depth = Math.min(1, Math.max(0, (z2 + 1.4) / 2.8));
        const stir = Math.min(1, Math.hypot(ox[p], oy[p]) / 30);
        let shade = 0.3 + depth * 0.75;
        if (lit) {
          // Rotate the surface normal like the point, then light it (Lambert).
          const nx0 = normal[j];
          const ny0 = normal[j + 1];
          const nz0 = normal[j + 2];
          const nx1 = nx0 * cy + nz0 * sy;
          const nz1 = -nx0 * sy + nz0 * cy;
          const ny1 = ny0 * cp - nz1 * sp;
          const nz2 = ny0 * sp + nz1 * cp;
          // Surface facing away: hidden behind the brain (unless blown apart).
          if (nz2 < -0.1 && spread < 0.05 && stir < 0.2) continue;
          const lam = Math.max(0, nx1 * L[0] + ny1 * L[1] + nz2 * L[2]);
          shade = 0.12 + lam * 0.55 + tone[p] * 0.4 + depth * 0.1;
        }
        let level = Math.round(Math.max(0, shade + stir * 0.5) * (PALETTE.length - 1));
        if (glint[p]) level = PALETTE.length - 1;
        buckets[Math.min(PALETTE.length - 1, level)].push(sx, sy2, (lit ? 1.3 + depth * 1.1 : 0.7 + depth * 1.2) * (1 - spread * 0.4));
      }

      ctx.globalAlpha = Math.max(0.15, 1 - spread * 0.55);
      buckets.forEach((b, k) => {
        ctx.fillStyle = PALETTE[k];
        for (let q = 0; q < b.length; q += 3) ctx.fillRect(b[q], b[q + 1], b[q + 2], b[q + 2]);
      });
      ctx.globalAlpha = 1;

      raf = visible && !reduce ? requestAnimationFrame(frame) : 0;
    };

    const aim = (clientX: number, clientY: number) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = clientX - r.left;
      mouse.y = clientY - r.top;
      mouse.nx = Math.max(-1, Math.min(1, (mouse.x - r.width / 2) / (r.width / 2)));
      mouse.ny = Math.max(-1, Math.min(1, (mouse.y - r.height / 2) / (r.height / 2)));
      mouse.active = true;
    };
    const onMove = (e: PointerEvent) => aim(e.clientX, e.clientY);
    // Phones: a finger works like the cursor — dots scatter under it, the form turns to it.
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) aim(t.clientX, t.clientY);
    };
    const onLeave = () => {
      mouse.x = mouse.y = -1e4;
      mouse.active = false;
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) frame(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(canvas);
    if (interactive) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("touchstart", onTouch, { passive: true });
      window.addEventListener("touchmove", onTouch, { passive: true });
      window.addEventListener("touchend", onLeave, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onLeave);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [shape, disperse, interactive, size]);

  return <canvas ref={ref} aria-hidden className={cn("pointer-events-none size-full", className)} />;
}
