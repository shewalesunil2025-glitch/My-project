"use client";

import { useId } from "react";

/** Deterministic pseudo-random numbers, so server and client draw the same print. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const CX = 150;
const CY = 196;

type Ridge = { d: string; dash: string; offset: number; width: number; dotted: boolean };

/** Builds the ridges: a whorl at the core, widening into an egg-shaped print. */
function buildRidges(): Ridge[] {
  const rand = seeded(7);
  const ridges: Ridge[] = [];
  const count = 24;
  for (let i = 0; i < count; i++) {
    const base = 7 + i * 5.6;
    const pts: string[] = [];
    // The core spirals slightly so the centre reads as a whorl, not rings.
    const twist = i < 5 ? 0.5 : 0.12;
    for (let k = 0; k <= 96; k++) {
      const t = (k / 96) * Math.PI * 2;
      const wobble = 1 + 0.07 * Math.sin(2 * t + i * 0.45) + 0.035 * Math.sin(5 * t + i);
      const r = base * wobble * (1 + twist * (k / 96 - 0.5) * (i < 5 ? 1 : 0.2));
      // Egg shape: taller than wide, a little narrower at the top.
      const narrow = 1 - 0.12 * Math.max(0, -Math.sin(t)) * (i / count);
      const x = CX + r * 0.8 * Math.cos(t) * narrow;
      const y = CY + r * 1.08 * Math.sin(t);
      pts.push(`${k === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    const outer = i > count - 7;
    const a = 14 + rand() * 30;
    const b = 3 + rand() * 6;
    const c = 6 + rand() * 18;
    ridges.push({
      d: pts.join(" "),
      // Inner ridges are long broken lines; the outer ones dissolve into dots.
      dash: outer ? `0.1 ${5 + rand() * 4}` : `${a.toFixed(1)} ${b.toFixed(1)} ${c.toFixed(1)} ${(b + 2).toFixed(1)}`,
      offset: Math.round(rand() * 80),
      width: outer ? 3.2 : 2.4,
      dotted: outer,
    });
  }
  return ridges;
}

const RIDGES = buildRidges();

/** Sparks scattered on the floor glow under the print. */
const SPARKS = (() => {
  const rand = seeded(42);
  return Array.from({ length: 70 }, () => {
    const a = rand() * Math.PI;
    const r = 30 + rand() * 120;
    return { x: CX + Math.cos(a) * r * 1.1 - 0, y: 352 + Math.sin(a) * 14 * rand(), r: 0.6 + rand() * 1.6, o: 0.3 + rand() * 0.7 };
  });
})();

/**
 * Shambhu's fingerprint, drawn in SVG: broken glowing ridges around a whorl,
 * fading into dots at the edge, standing on a glowing floor. A scan band sweeps
 * down and lights the ridges up as it passes.
 */
export function FingerprintScan({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const id = (n: string) => `${n}-${uid}`;
  const url = (n: string) => `url(#${id(n)})`;

  const ridges = (stroke: string, opacity: number) =>
    RIDGES.map((r, i) => (
      <path
        key={i}
        d={r.d}
        fill="none"
        stroke={stroke}
        strokeWidth={r.width}
        strokeLinecap="round"
        strokeDasharray={r.dash}
        strokeDashoffset={r.offset}
        opacity={opacity}
      />
    ));

  return (
    <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Shambhu's glowing fingerprint being scanned">
      <defs>
        <radialGradient id={id("bg")} cx="50%" cy="48%" r="65%">
          <stop offset="0%" stopColor="#0f2412" />
          <stop offset="100%" stopColor="#030703" />
        </radialGradient>
        <linearGradient id={id("ink")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b6ff8a" />
          <stop offset="55%" stopColor="#7dff3a" />
          <stop offset="100%" stopColor="#3ff2c4" />
        </linearGradient>
        <radialGradient id={id("floor")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7dff3a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#7dff3a" stopOpacity="0" />
        </radialGradient>
        <filter id={id("glow")} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* The bright band that travels with the scan line */}
        <linearGradient id={id("band")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="70%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={id("scan")}>
          <rect x="0" y="-120" width="300" height="120" fill={url("band")}>
            <animate attributeName="y" values="-120;400" dur="3.2s" repeatCount="indefinite" />
          </rect>
        </mask>
        <pattern id={id("grid")} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="#7dff3a" strokeOpacity="0.06" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width="300" height="400" fill={url("bg")} />
      <rect width="300" height="400" fill={url("grid")} />

      {/* Floor glow and sparks */}
      <ellipse cx={CX} cy="352" rx="130" ry="22" fill={url("floor")} />
      {SPARKS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#b6ff8a" opacity={s.o} />
      ))}

      {/* Base print, softly lit */}
      <g filter={url("glow")}>{ridges(url("ink"), 0.55)}</g>
      {/* The same ridges at full brightness, revealed only under the scan band */}
      <g filter={url("glow")} mask={url("scan")}>
        {ridges("#eaffd9", 1)}
      </g>

      {/* Scan line */}
      <g>
        <rect x="18" y="-2" width="264" height="3" rx="1.5" fill="#d4ffb8" filter={url("glow")}>
          <animate attributeName="y" values="-36;484" dur="3.2s" repeatCount="indefinite" />
        </rect>
      </g>
    </svg>
  );
}
