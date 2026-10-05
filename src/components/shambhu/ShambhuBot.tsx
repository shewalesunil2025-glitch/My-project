"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

export type BotMood = "idle" | "listening" | "thinking" | "speaking";

/**
 * IBAX's own chatbot face, drawn in SVG: a glossy white helmet with a dark
 * glass visor, glowing lime dot-matrix eyes, ear lights, an antenna and the brand
 * logo on its chest. The eyes blink and glance around; `mood` changes them:
 * listening — eyes widen and the antenna pulses faster, thinking — eyes look
 * up to one side, speaking — a little equaliser mouth talks under the eyes.
 */
export function ShambhuBot({ mood = "idle", className }: { mood?: BotMood; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;

  const eyeShift = mood === "thinking" ? "translate(6px,-6px)" : undefined;
  const eyeScale = mood === "listening" ? 1.14 : 1;

  return (
    <svg viewBox="0 0 200 200" className={cn("block", className)} aria-hidden data-mood={mood}>
      <defs>
        <radialGradient id={id("bg")} cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#24461a" />
          <stop offset="60%" stopColor="#0b170c" />
          <stop offset="100%" stopColor="#040904" />
        </radialGradient>
        <linearGradient id={id("shell")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#e7eee4" />
          <stop offset="100%" stopColor="#aebbab" />
        </linearGradient>
        <linearGradient id={id("logo")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bdf59c" />
          <stop offset="0.45" stopColor="#6ed94e" />
          <stop offset="1" stopColor="#36a03b" />
        </linearGradient>
        <linearGradient id={id("visor")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12201a" />
          <stop offset="100%" stopColor="#020604" />
        </linearGradient>
        <pattern id={id("dots")} width="4.2" height="4.2" patternUnits="userSpaceOnUse">
          <circle cx="2.1" cy="2.1" r="1.45" fill="#b6ff8a" />
        </pattern>
        <filter id={id("glow")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={id("visorClip")}>
          <rect x="46" y="64" width="108" height="62" rx="31" />
        </clipPath>
      </defs>

      {/* Backdrop */}
      <rect width="200" height="200" fill={url("bg")} />
      <circle cx="100" cy="96" r="72" fill="#7dff3a" opacity="0.08" />

      {/* Body with the brand logo glowing on the chest */}
      <path d="M48 200 C50 168 66 152 100 152 C134 152 150 168 152 200 Z" fill={url("shell")} />
      <path d="M62 200 C64 176 76 166 100 166 C124 166 136 176 138 200 Z" fill="#000" opacity="0.06" />
      <rect x="84" y="164" width="32" height="32" rx="10" fill="#7dff3a" opacity="0.35" filter={url("glow")} className="bot-pulse" />
      <svg x="86" y="166" width="28" height="28" viewBox="0 0 1024 1024">
        <rect width="1024" height="1024" rx="236" fill={url("logo")} />
        <path d="M512 179C525 284 546 307 655 324 546 341 525 364 512 469 499 364 478 341 369 324 478 307 499 284 512 179Z" fill="#06140a" />
        <rect x="434" y="564" width="156" height="342" rx="78" fill="#06140a" />
      </svg>

      {/* Neck */}
      <rect x="84" y="142" width="32" height="14" rx="6" fill="#26332a" />

      {/* Antenna */}
      <line x1="100" y1="40" x2="100" y2="22" stroke="#cfd8cc" strokeWidth="4" strokeLinecap="round" />
      <circle
        cx="100"
        cy="19"
        r="6"
        fill="#7dff3a"
        filter={url("glow")}
        className={mood === "listening" || mood === "speaking" ? "bot-pulse-fast" : "bot-pulse"}
      />

      {/* Ears with light rings */}
      {[26, 174].map((cx) => (
        <g key={cx}>
          <rect x={cx - 9} y="76" width="18" height="40" rx="9" fill={url("shell")} />
          <rect x={cx - 3} y="84" width="6" height="24" rx="3" fill="#7dff3a" opacity="0.85" filter={url("glow")} />
        </g>
      ))}

      {/* Helmet */}
      <rect x="32" y="36" width="136" height="114" rx="54" fill={url("shell")} />
      <path d="M52 52 C70 40 108 36 136 46" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.9" fill="none" />

      {/* Visor */}
      <rect x="44" y="62" width="112" height="66" rx="33" fill="#cfd8cc" />
      <rect x="46" y="64" width="108" height="62" rx="31" fill={url("visor")} />
      <g clipPath={url("visorClip")}>
        {/* Eyes: dot-matrix lights that blink and glance around */}
        <g className={mood === "idle" ? "bot-look" : undefined} style={{ transform: eyeShift, transition: "transform .4s ease" }}>
          {[76, 124].map((cx) => (
            <g
              key={cx}
              className="bot-blink"
              style={{ transformOrigin: `${cx}px 92px`, transformBox: "view-box", scale: String(eyeScale), transition: "scale .3s ease" }}
            >
              <circle cx={cx} cy="92" r="15" fill="#7dff3a" opacity="0.25" filter={url("glow")} />
              <circle cx={cx} cy="92" r="14" fill={url("dots")} />
            </g>
          ))}
        </g>

        {/* Mouth: a tiny equaliser while speaking, a soft smile otherwise */}
        {mood === "speaking" ? (
          <g fill="#b6ff8a" filter={url("glow")}>
            {[88, 94, 100, 106, 112].map((x, i) => (
              <rect key={x} x={x - 1.5} y="108" width="3" height="10" rx="1.5" className="bot-talk" style={{ animationDelay: `${i * 0.09}s` }} />
            ))}
          </g>
        ) : (
          <path d="M91 114 Q100 119 109 114" stroke="#7dff3a" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.75" />
        )}

        {/* Glass reflection */}
        <path d="M58 70 C74 64 96 63 112 66" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.18" fill="none" />
      </g>
    </svg>
  );
}
