"use client";

import { product } from "@/config/product";
import { Wordmark } from "@/components/navigation/Logo";

/**
 * Opening screen of the app, a short premium logo reveal: the tile settles in with its
 * glow, the "i" rises, the sparkle pops and twinkles, a ring of light circles the mark
 * and a soft shine sweeps across it; then the wordmark is unveiled and the tagline
 * settles. Pure CSS, so it plays before the app's JavaScript loads. Shown once per
 * visit (each launch from the home screen). The mark is drawn exactly like LogoMark,
 * split into parts so each can move.
 */
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
          <svg className="ibax-splash-ring" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="ibax-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#c5f2d6" stopOpacity="0.9" />
                <stop offset="0.5" stopColor="#25d366" stopOpacity="0.7" />
                <stop offset="1" stopColor="#25d366" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="96" pathLength="100" />
          </svg>
          <div className="ibax-splash-mark">
            <svg viewBox="0 0 1024 1024" className="size-full">
              <defs>
                <linearGradient id="ibax-splash-tile" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#aaf087" />
                  <stop offset="0.5" stopColor="#62cf4a" />
                  <stop offset="1" stopColor="#36a03a" />
                </linearGradient>
                <radialGradient id="ibax-splash-shine" cx="0.2" cy="0.12" r="0.7">
                  <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
                  <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
                <clipPath id="ibax-splash-clip">
                  <rect width="1024" height="1024" rx="250" />
                </clipPath>
              </defs>
              <rect width="1024" height="1024" rx="250" fill="url(#ibax-splash-tile)" />
              <rect width="1024" height="1024" rx="250" fill="url(#ibax-splash-shine)" />
              <g clipPath="url(#ibax-splash-clip)">
                <rect className="ibax-splash-sweep" x="-420" y="-200" width="260" height="1500" fill="#fff" transform="rotate(20 512 512)" />
              </g>
              <rect x="7" y="7" width="1010" height="1010" rx="244" fill="none" stroke="#c4f5ab" strokeOpacity="0.55" strokeWidth="10" />
              <path
                className="ibax-splash-spark"
                d="M512 150C524 250 544 272 650 288 544 304 524 326 512 426 500 326 480 304 374 288 480 272 500 250 512 150Z"
                fill="#06140a"
              />
              <rect className="ibax-splash-stem" x="440" y="500" width="144" height="340" rx="72" fill="#06140a" />
            </svg>
          </div>
        </div>
        <div className="ibax-splash-word">
          <Wordmark className="text-[3.4rem] sm:text-[4.2rem]" />
        </div>
        <p className="ibax-splash-tag">{product.logoTagline}</p>
      </div>
    </>
  );
}
