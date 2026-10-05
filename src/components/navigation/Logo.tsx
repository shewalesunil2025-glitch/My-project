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
          <stop offset="0" stopColor="#bdf59c" />
          <stop offset="0.45" stopColor="#6ed94e" />
          <stop offset="1" stopColor="#36a03b" />
        </linearGradient>
        <radialGradient id={`${id}-shine`} cx="0.28" cy="0.18" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1024" height="1024" rx="236" fill={`url(#${id}-tile)`} />
      <rect width="1024" height="1024" rx="236" fill={`url(#${id}-shine)`} />
      <rect x="10" y="10" width="1004" height="1004" rx="228" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="10" />
      <path
        d="M512 179C525 284 546 307 655 324 546 341 525 364 512 469 499 364 478 341 369 324 478 307 499 284 512 179Z"
        fill="#06140a"
      />
      <rect x="434" y="564" width="156" height="342" rx="78" fill="#06140a" />
    </svg>
  );
}

/** The "ibaxai" wordmark: white "ibax" with a rounded X, green "ai". */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-baseline font-[family-name:var(--font-poppins)] font-bold tracking-[-0.03em] leading-none", className)}
      aria-label={siteConfig.name}
    >
      <span aria-hidden className="text-white">iba</span>
      <svg aria-hidden viewBox="0 0 100 100" className="mx-[0.03em] h-[0.56em] w-[0.56em]">
        <path d="M14 14 86 86M14 86 86 14" stroke="#fff" strokeWidth="20" strokeLinecap="round" />
      </svg>
      <span aria-hidden className="bg-gradient-to-r from-[#8fe865] to-[#5fd24a] bg-clip-text text-transparent">ai</span>
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
