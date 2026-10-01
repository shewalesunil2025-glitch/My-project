"use client";

import { useId } from "react";
import { FINGERPRINT_RIDGES } from "./fingerprintPath";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/** Minutiae the scanner "finds": ridge features marked on the print, with labels. */
const MARKERS = [
  { x: 160, y: 170, label: "CORE", side: "right" as const, ring: true },
  { x: 128, y: 246, label: "DELTA", side: "left" as const },
  { x: 214, y: 106, label: "RIDGE END", side: "left" as const },
  { x: 100, y: 140, label: "BIFURCATION", side: "right" as const },
  { x: 200, y: 268, label: "ISLAND", side: "right" as const },
];

/** Tick marks for the HUD ring around the print. */
const TICKS = Array.from({ length: 72 }, (_, i) => {
  const a = (i / 72) * Math.PI * 2;
  const long = i % 6 === 0;
  const r1 = 142;
  const r2 = long ? 134 : 138;
  return {
    x1: +(150 + Math.cos(a) * r1 * 0.78).toFixed(2),
    y1: +(192 + Math.sin(a) * r1).toFixed(2),
    x2: +(150 + Math.cos(a) * r2 * 0.78).toFixed(2),
    y2: +(192 + Math.sin(a) * r2).toFixed(2),
    long,
  };
});

/**
 * Shambhu's fingerprint, drawn in SVG: an original loop-pattern print whose
 * filled ridges glow lime to teal and fade out toward the edge, set in a
 * scanner HUD — grid, crosshair on the core, labelled minutiae, a tick ring and
 * a scan band that sweeps down and lights the ridges up as it passes.
 */
export function FingerprintScan({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const id = (n: string) => `${n}-${uid}`;
  const url = (n: string) => `url(#${id(n)})`;
  // Phones draw the print without the blur glow and the re-lit copy under the
  // scan band: both repaint a large, detailed path every frame.
  const full = useMediaQuery("(min-width: 768px)");

  return (
    <svg
      viewBox="0 0 300 400"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label="Shambhu's glowing fingerprint being scanned"
    >
      <defs>
        <radialGradient id={id("bg")} cx="50%" cy="46%" r="70%">
          <stop offset="0%" stopColor="#0e2211" />
          <stop offset="100%" stopColor="#020502" />
        </radialGradient>
        <linearGradient id={id("ink")} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#d4ffb8" />
          <stop offset="45%" stopColor="#7dff3a" />
          <stop offset="100%" stopColor="#2fe0b4" />
        </linearGradient>
        {/* Ridges fade out toward the finger's edge */}
        <radialGradient id={id("fadeG")} cx="50%" cy="46%" r="52%">
          <stop offset="62%" stopColor="#fff" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.15" />
        </radialGradient>
        <mask id={id("fade")}>
          <rect width="300" height="400" fill={url("fadeG")} />
        </mask>
        <filter id={id("glow")} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={id("band")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="75%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={id("scan")}>
          <rect x="0" y="-110" width="300" height="110" fill={url("band")}>
            <animate
              attributeName="y"
              values="-110;400"
              dur="3.6s"
              repeatCount="indefinite"
            />
          </rect>
        </mask>
        <pattern
          id={id("grid")}
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M20 0H0V20"
            fill="none"
            stroke="#7dff3a"
            strokeOpacity="0.07"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      <rect width="300" height="400" fill={url("bg")} />
      <rect width="300" height="400" fill={url("grid")} />

      {/* HUD ring with ticks around the print */}
      <g stroke="#7dff3a">
        {TICKS.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            strokeOpacity={t.long ? 0.55 : 0.22}
            strokeWidth={t.long ? 1.4 : 1}
          />
        ))}
      </g>

      {/* Everything on the print is scaled so the whole finger fits inside the card */}
      <g transform="translate(150 192) scale(0.78) translate(-150 -168)">
        {/* The print: dim base, then full brightness under the scan band */}
        <g mask={url("fade")}>
          <path
            d={FINGERPRINT_RIDGES}
            fill={url("ink")}
            fillRule="evenodd"
            opacity={full ? 0.62 : 0.85}
            filter={full ? url("glow") : undefined}
          />
          {full && (
            <g mask={url("scan")}>
              <path d={FINGERPRINT_RIDGES} fill="#f2ffe9" fillRule="evenodd" filter={url("glow")} />
            </g>
          )}
        </g>

        {/* Crosshair on the core */}
        <g stroke="#d4ffb8" strokeWidth="1" opacity="0.8">
          <line x1="160" y1="140" x2="160" y2="156" />
          <line x1="160" y1="184" x2="160" y2="200" />
          <line x1="130" y1="170" x2="146" y2="170" />
          <line x1="174" y1="170" x2="190" y2="170" />
        </g>

        {/* Minutiae markers */}
        <g
          fontFamily="ui-monospace, monospace"
          fontSize="9.5"
          letterSpacing="1"
        >
          {MARKERS.map((m) => {
            const dir = m.side === "right" ? 1 : -1;
            const lx = m.x + 34 * dir;
            return (
              <g key={m.label}>
                {m.ring ? (
                  <circle
                    cx={m.x}
                    cy={m.y}
                    r="7"
                    fill="none"
                    stroke="#d4ffb8"
                    strokeWidth="1.4"
                  />
                ) : (
                  <rect
                    x={m.x - 4.5}
                    y={m.y - 4.5}
                    width="9"
                    height="9"
                    fill="none"
                    stroke="#d4ffb8"
                    strokeWidth="1.3"
                  />
                )}
                <circle cx={m.x} cy={m.y} r="1.6" fill="#d4ffb8" />
                <polyline
                  points={`${m.x + 6 * dir},${m.y - 4} ${lx},${m.y - 14} ${lx + 26 * dir},${m.y - 14}`}
                  fill="none"
                  stroke="#7dff3a"
                  strokeOpacity="0.7"
                  strokeWidth="0.8"
                />
                <text
                  x={lx + 2 * dir}
                  y={m.y - 17}
                  fill="#b6ff8a"
                  textAnchor={dir === 1 ? "start" : "end"}
                >
                  {m.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* Scan line, travelling with the bright band */}
        <rect
          x="20"
          y="-28"
          width="260"
          height="2.5"
          rx="1.25"
          fill="#eaffd9"
          filter={url("glow")}
        >
          <animate
            attributeName="y"
            values="-28;482"
            dur="3.6s"
            repeatCount="indefinite"
          />
        </rect>
      </g>

      {/* Readout */}
      <text
        x="150"
        y="364"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="8"
        letterSpacing="2"
        fill="#7dff3a"
        opacity="0.85"
      >
        BIOMETRIC ID · SCANNING
      </text>
    </svg>
  );
}
