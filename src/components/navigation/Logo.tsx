import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/config/site";

/** The IBAX symbol: a sparkle over an "i", cut in ink from a glowing lime tile. */
export function LogoMark({ className }: { className?: string }) {
  const id = `ibax-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 1024 1024" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id={`${id}-tile`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e2ffcc" />
          <stop offset="0.45" stopColor="#7dff3a" />
          <stop offset="1" stopColor="#2f9e14" />
        </linearGradient>
        <radialGradient id={`${id}-shine`} cx="0.28" cy="0.18" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1024" height="1024" rx="250" fill={`url(#${id}-tile)`} />
      <rect width="1024" height="1024" rx="250" fill={`url(#${id}-shine)`} />
      <rect x="10" y="10" width="1004" height="1004" rx="242" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="14" />
      <path
        d="M512 102C526 214 548 238 664 256 548 274 526 298 512 410 498 298 476 274 360 256 476 238 498 214 512 102Z"
        fill="#04110a"
      />
      <rect x="428" y="460" width="168" height="392" rx="84" fill="#04110a" />
    </svg>
  );
}

/** The "ibaxai" wordmark: white "iba", a two-tone X, lime "ai". */
export function Wordmark({ className }: { className?: string }) {
  const id = `ibax-x-${useId().replace(/:/g, "")}`;
  return (
    <span
      className={cn("inline-flex items-baseline font-[family-name:var(--font-poppins)] font-bold tracking-[-0.03em] leading-none", className)}
      aria-label={siteConfig.name}
    >
      <span aria-hidden className="text-white">iba</span>
      <svg aria-hidden viewBox="0 0 100 100" className="mx-[0.03em] h-[0.6em] w-[0.6em]">
        <defs>
          <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#4fd11c" />
            <stop offset="1" stopColor="#d4ffb8" />
          </linearGradient>
        </defs>
        <line x1="12" y1="12" x2="88" y2="88" stroke="#fff" strokeWidth="19" strokeLinecap="round" />
        <line x1="12" y1="88" x2="88" y2="12" stroke={`url(#${id})`} strokeWidth="19" strokeLinecap="round" />
      </svg>
      <span aria-hidden className="bg-gradient-to-r from-[#b6ff8a] to-[#7dff3a] bg-clip-text text-transparent">ai</span>
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
