"use client";

import { product } from "@/config/product";
import { LogoMark, Wordmark } from "@/components/navigation/Logo";

/**
 * Opening screen of the app: the IBAX symbol rises in with its glow, the wordmark
 * and tagline follow, then the screen fades away. Pure CSS, so it plays before the
 * app's JavaScript loads. Shown once per visit (each launch from the home screen).
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
        <div className="ibax-splash-mark">
          <LogoMark className="size-full" />
        </div>
        <div className="ibax-splash-word">
          <Wordmark className="text-[3.4rem] sm:text-[4.2rem]" />
        </div>
        <p className="ibax-splash-tag">{product.logoTagline}</p>
        <div className="ibax-splash-line">
          <span />
        </div>
      </div>
    </>
  );
}
