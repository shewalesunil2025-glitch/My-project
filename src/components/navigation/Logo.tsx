import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/config/site";

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

/** The "ibaxai" wordmark in one bold font: white "ibax", green "ai", and a small ™. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block font-[family-name:var(--font-poppins)] font-bold tracking-[-0.03em] whitespace-nowrap leading-none", className)}
      aria-label={siteConfig.name}
    >
      <span aria-hidden className="text-white">ibax</span>
      <span aria-hidden className="bg-gradient-to-r from-[#8be860] to-[#55cb45] bg-clip-text text-transparent">ai</span>
      {/* ™: an unregistered trade mark (® only once it is registered). */}
      <sup aria-hidden className="ml-[0.08em] align-super text-[0.3em] font-semibold tracking-normal text-white opacity-60">
        TM
      </sup>
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
