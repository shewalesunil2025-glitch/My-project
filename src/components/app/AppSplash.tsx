"use client";

import { product } from "@/config/product";

/**
 * Opening screen of the app, IBAX's signature moment — "the spark of automation":
 * the IBAX star streaks in like a shooting star and lands where it belongs. Where it
 * lands, light traces the tile's outline, the green fills out from the star, the "i"
 * rises and little nodes circle once, like automations starting up. Then a shine,
 * "ibaxai" letter by letter, and the tagline. Pure CSS, so it plays before the app's
 * JavaScript loads; shown once per visit. The mark is drawn exactly like LogoMark.
 */
const letters = ["i", "b", "a", "x", "a", "i"];
const SPARK = "M512 150C524 250 544 272 650 288 544 304 524 326 512 426 500 326 480 304 374 288 480 272 500 250 512 150Z";

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
              <clipPath id="ibax-splash-reveal">
                <circle className="ibax-splash-reveal" cx="512" cy="288" r="900" />
              </clipPath>
              <clipPath id="ibax-splash-tileclip">
                <rect width="1024" height="1024" rx="250" />
              </clipPath>
            </defs>
            {/* The green fills out from where the star landed. */}
            <g clipPath="url(#ibax-splash-reveal)">
              <rect width="1024" height="1024" rx="250" fill="url(#ibax-splash-tile)" />
              <rect width="1024" height="1024" rx="250" fill="url(#ibax-splash-gloss)" />
              <rect x="7" y="7" width="1010" height="1010" rx="244" fill="none" stroke="#c4f5ab" strokeOpacity="0.55" strokeWidth="10" />
            </g>
            {/* Light traces the outline from the star, both ways round. */}
            <g className="ibax-splash-trace" fill="none" stroke="#d9f7e6" strokeWidth="12" strokeLinecap="round">
              <path pathLength="100" d="M512 7H774A243 243 0 0 1 1017 250V774A243 243 0 0 1 774 1017H512" />
              <path pathLength="100" d="M512 7H250A243 243 0 0 0 7 250V774A243 243 0 0 0 250 1017H512" />
            </g>
            <g clipPath="url(#ibax-splash-tileclip)">
              <rect className="ibax-splash-sweep" x="-500" y="-300" width="240" height="1700" fill="#fff" />
            </g>
            <path className="ibax-splash-spark" d={SPARK} fill="#06140a" />
            <rect className="ibax-splash-stem" x="440" y="500" width="144" height="340" rx="72" fill="#06140a" />
          </svg>
          {/* Automation nodes circle the mark once. */}
          <span className="ibax-splash-orbit">
            <i />
            <i />
            <i />
          </span>
          <span className="ibax-splash-burst" />
          {/* The shooting star. */}
          <span className="ibax-splash-comet">
            <svg viewBox="374 150 276 276">
              <path d={SPARK} fill="#f2fff7" />
            </svg>
          </span>
        </div>
        <div className="ibax-splash-word font-[family-name:var(--font-poppins)]" aria-label={product.name}>
          {letters.map((l, i) =>
            l === "x" ? (
              <svg key={i} viewBox="0 0 100 100" className="ibax-splash-letter mx-[0.03em] h-[0.6em] w-[0.6em]" style={{ animationDelay: `${2.15 + i * 0.07}s` }}>
                <line x1="12" y1="12" x2="88" y2="88" stroke="#fff" strokeWidth="19" strokeLinecap="round" />
                <line x1="12" y1="88" x2="88" y2="12" stroke="#fff" strokeWidth="19" strokeLinecap="round" />
              </svg>
            ) : (
              <span key={i} className={`ibax-splash-letter ${i > 3 ? "ibax-splash-ai" : ""}`} style={{ animationDelay: `${2.15 + i * 0.07}s` }}>
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
