"use client";

import { product } from "@/config/product";

/**
 * Opening screen of the app, IBAX's signature moment: a seed of light pulses, then the
 * two halves of the logo glide in from both sides — you and IBAX — and click together.
 * The click sends out a ring of light, the "i" rises and the sparkle is born from the
 * join with a burst of rays; a shine crosses the tile and "ibaxai" appears letter by
 * letter. Pure CSS, so it plays before the app's JavaScript loads; shown once per visit.
 * The mark is drawn exactly like LogoMark, split into parts so each can move.
 */
const letters = ["i", "b", "a", "x", "a", "i"];

export function AppSplash() {
  return (
    <>
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html:
            "try{if(sessionStorage.getItem('ibax-splash'))document.documentElement.classList.add('ibax-splash-seen');else sessionStorage.setItem('ibax-splash','1')}catch(e){}",
        }}
      />
      <div aria-hidden className="ibax-splash">
        <div className="ibax-splash-glow" />
        <div className="ibax-splash-stage">
          <span className="ibax-splash-seed" />
          <span className="ibax-splash-wave" />
          <span className="ibax-splash-wave ibax-splash-wave-2" />
          <svg viewBox="0 0 1024 1024" className="ibax-splash-mark">
            <defs>
              <linearGradient id="ibax-splash-tile" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#aaf087" />
                <stop offset="0.5" stopColor="#62cf4a" />
                <stop offset="1" stopColor="#36a03a" />
              </linearGradient>
              <radialGradient id="ibax-splash-gloss" cx="205" cy="123" r="717" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
                <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
              <clipPath id="ibax-splash-left">
                <rect x="0" y="0" width="512" height="1024" />
              </clipPath>
              <clipPath id="ibax-splash-right">
                <rect x="512" y="0" width="512" height="1024" />
              </clipPath>
              <clipPath id="ibax-splash-tileclip">
                <rect width="1024" height="1024" rx="250" />
              </clipPath>
            </defs>
            {(["left", "right"] as const).map((side) => (
              <g key={side} className={`ibax-splash-half ibax-splash-${side}`}>
                <g clipPath={`url(#ibax-splash-${side})`}>
                  <rect width="1024" height="1024" rx="250" fill="url(#ibax-splash-tile)" />
                  <rect width="1024" height="1024" rx="250" fill="url(#ibax-splash-gloss)" />
                  <rect x="7" y="7" width="1010" height="1010" rx="244" fill="none" stroke="#c4f5ab" strokeOpacity="0.55" strokeWidth="10" />
                </g>
              </g>
            ))}
            <rect className="ibax-splash-seam" x="500" y="0" width="24" height="1024" fill="#eafff1" />
            <g clipPath="url(#ibax-splash-tileclip)">
              <rect className="ibax-splash-sweep" x="-500" y="-300" width="240" height="1700" fill="#fff" />
            </g>
            <g className="ibax-splash-rays" stroke="#06140a" strokeWidth="14" strokeLinecap="round">
              <line x1="512" y1="120" x2="512" y2="70" />
              <line x1="512" y1="456" x2="512" y2="506" />
              <line x1="342" y1="288" x2="292" y2="288" />
              <line x1="682" y1="288" x2="732" y2="288" />
            </g>
            <path
              className="ibax-splash-spark"
              d="M512 150C524 250 544 272 650 288 544 304 524 326 512 426 500 326 480 304 374 288 480 272 500 250 512 150Z"
              fill="#06140a"
            />
            <rect className="ibax-splash-stem" x="440" y="500" width="144" height="340" rx="72" fill="#06140a" />
          </svg>
        </div>
        <div className="ibax-splash-word font-[family-name:var(--font-poppins)]" aria-label={product.name}>
          {letters.map((l, i) =>
            l === "x" ? (
              <svg key={i} viewBox="0 0 100 100" className="ibax-splash-letter mx-[0.03em] h-[0.6em] w-[0.6em]" style={{ animationDelay: `${1.85 + i * 0.07}s` }}>
                <line x1="12" y1="12" x2="88" y2="88" stroke="#fff" strokeWidth="19" strokeLinecap="round" />
                <line x1="12" y1="88" x2="88" y2="12" stroke="#fff" strokeWidth="19" strokeLinecap="round" />
              </svg>
            ) : (
              <span key={i} className={`ibax-splash-letter ${i > 3 ? "ibax-splash-ai" : ""}`} style={{ animationDelay: `${1.85 + i * 0.07}s` }}>
                {l}
              </span>
            ),
          )}
        </div>
        <p className="ibax-splash-tag">{product.logoTagline}</p>
      </div>
    </>
  );
}
