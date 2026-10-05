import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/config/site";

/** The IBAX symbol: a sparkle over an "i", cut in deep ink from a soft lime-to-green tile. */
export function LogoMark({ className }: { className?: string }) {
  const id = `ibax-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 1024 1024" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id={`${id}-tile`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#aaf087" />
          <stop offset="0.5" stopColor="#62cf4a" />
          <stop offset="1" stopColor="#36a03a" />
        </linearGradient>
        <radialGradient id={`${id}-shine`} cx="0.2" cy="0.12" r="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1024" height="1024" rx="250" fill={`url(#${id}-tile)`} />
      <rect width="1024" height="1024" rx="250" fill={`url(#${id}-shine)`} />
      <rect x="7" y="7" width="1010" height="1010" rx="244" fill="none" stroke="#c4f5ab" strokeOpacity="0.55" strokeWidth="10" />
      <path
        d="M512 150C524 250 544 272 650 288 544 304 524 326 512 426 500 326 480 304 374 288 480 272 500 250 512 150Z"
        fill="#06140a"
      />
      <rect x="440" y="500" width="144" height="340" rx="72" fill="#06140a" />
    </svg>
  );
}

/** The "ibaxai" wordmark: white "iba", a white X, green "ai". */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-baseline font-[family-name:var(--font-poppins)] font-bold tracking-[-0.03em] leading-none", className)}
      aria-label={siteConfig.name}
    >
      <span aria-hidden className="text-white">iba</span>
      <svg aria-hidden viewBox="0 0 100 100" className="mx-[0.03em] h-[0.6em] w-[0.6em]">
        <line x1="12" y1="12" x2="88" y2="88" stroke="#fff" strokeWidth="19" strokeLinecap="round" />
        <line x1="12" y1="88" x2="88" y2="12" stroke="#fff" strokeWidth="19" strokeLinecap="round" />
      </svg>
      <span aria-hidden className="bg-gradient-to-r from-[#8be860] to-[#55cb45] bg-clip-text text-transparent">ai</span>
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
