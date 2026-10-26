import Link from "next/link";
import { useId, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/config/site";
import { WORDMARK_GLYPHS, WORDMARK_VIEWBOX } from "./wordmarkGlyphs";

/** The IBAX symbol: a sparkle over a short, wide "i", in deep ink on a soft lime-to-green tile. */
export function LogoMark({ className }: { className?: string }) {
  const id = `ibax-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 1024 1024" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id={`${id}-tile`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dff99a" />
          <stop offset="0.5" stopColor="#86e45e" />
          <stop offset="1" stopColor="#20c55a" />
        </linearGradient>
        <radialGradient id={`${id}-shine`} cx="0.2" cy="0.12" r="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1024" height="1024" rx="250" fill={`url(#${id}-tile)`} />
      <rect width="1024" height="1024" rx="250" fill={`url(#${id}-shine)`} />
      <rect x="7" y="7" width="1010" height="1010" rx="244" fill="none" stroke="#eafcc4" strokeOpacity="0.55" strokeWidth="10" />
      <path
        d="M512 140C526 256 549 281 672 300 549 319 526 344 512 460 498 344 475 319 352 300 475 281 498 256 512 140Z"
        fill="#06140a"
      />
      <rect x="434" y="523" width="156" height="312" rx="78" fill="#06140a" />
    </svg>
  );
}

type LetterProps = { className?: string; style?: CSSProperties };

/** The "ibaxai" wordmark, drawn exactly like the brand artwork: "ibax" in ink (white on dark), "ai" in green, and a small ™. */
export function Wordmark({ className, tm = true, letterProps }: { className?: string; tm?: boolean; letterProps?: (index: number) => LetterProps }) {
  const id = `ibaxw-${useId().replace(/:/g, "")}`;
  return (
    <span className={cn("relative inline-block leading-none", className)} role="img" aria-label={siteConfig.name}>
      <svg viewBox={WORDMARK_VIEWBOX} className="block h-[0.8em] w-auto overflow-visible text-white" aria-hidden>
        <defs>
          <linearGradient id={`${id}-ai`} x1="334" y1="0" x2="468" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#86e45e" />
            <stop offset="1" stopColor="#22c55a" />
          </linearGradient>
        </defs>
        {WORDMARK_GLYPHS.map((g, i) => (
          <path key={i} d={g.d} fill={g.ai ? `url(#${id}-ai)` : "currentColor"} {...letterProps?.(i)} />
        ))}
      </svg>
      {/* ™: an unregistered trade mark (® only once it is registered). Placed beside the letters so they stay centred. */}
      {tm && (
        <sup aria-hidden className="absolute top-[-0.05em] left-full ml-[0.08em] text-[0.22em] leading-none font-semibold tracking-normal text-white opacity-60">
          TM
        </sup>
      )}
    </span>
  );
}

/**
 * Symbol centred above the wordmark, in the brand artwork's proportions: the tile is 48.7% of
 * the word's width, with a gap of 4.5%. Size it with a width class (e.g. "w-60").
 */
export function LogoLockup({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("flex flex-col items-center", className)}>
      <LogoMark className={cn("aspect-square size-auto w-[48.7%]", markClassName)} />
      <Wordmark className="mt-[4.5%] w-full [&>svg]:h-auto [&>svg]:w-full" />
    </span>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link href="#top" className={className} aria-label={`${siteConfig.name} — home`}>
      <span className="flex items-center gap-2.5">
        <LogoMark className={compact ? "size-8" : "size-9"} />
        <Wordmark className={compact ? "text-[1.2rem]" : "text-[1.35rem]"} />
      </span>
    </Link>
  );
}
