import Link from "next/link";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/config/site";

/** Lime gradient mark: three nodes joined into one flowing line. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id="nx-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b6ff8a" />
          <stop offset="1" stopColor="#4fd11c" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#nx-mark)" />
      <path d="M8 21c4 0 4-10 8-10s4 10 8 10" fill="none" stroke="#030703" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="8" cy="21" r="2.3" fill="#030703" />
      <circle cx="16" cy="11" r="2.3" fill="#030703" />
      <circle cx="24" cy="21" r="2.3" fill="#030703" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link href="#top" className={className} aria-label={`${siteConfig.name} — home`}>
      <span className="flex items-center gap-2.5">
        <LogoMark className={compact ? "size-7" : "size-8"} />
        {!compact && <span className="text-[0.95rem] font-medium tracking-tight text-fg">{siteConfig.wordmark}</span>}
      </span>
    </Link>
  );
}
