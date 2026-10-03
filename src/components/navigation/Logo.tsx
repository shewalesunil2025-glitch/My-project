import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/config/site";

/** The IBAX symbol: a sparkle over an "i" on a blue-to-violet rounded tile. */
export function LogoMark({ className }: { className?: string }) {
  const id = `ibax-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 1024 1024" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" rx="250" fill={`url(#${id})`} />
      <path
        d="M512 102C526 214 548 238 664 256 548 274 526 298 512 410 498 298 476 274 360 256 476 238 498 214 512 102Z"
        fill="#fff"
      />
      <rect x="428" y="460" width="168" height="392" rx="84" fill="#fff" />
    </svg>
  );
}

/** The "ibaxai" wordmark: white "iba", a two-tone X, violet "ai". */
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
            <stop offset="0" stopColor="#38bdf8" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <line x1="12" y1="12" x2="88" y2="88" stroke="#fff" strokeWidth="19" strokeLinecap="round" />
        <line x1="12" y1="88" x2="88" y2="12" stroke={`url(#${id})`} strokeWidth="19" strokeLinecap="round" />
      </svg>
      <span aria-hidden className="bg-gradient-to-r from-[#818cf8] to-[#a78bfa] bg-clip-text text-transparent">ai</span>
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
