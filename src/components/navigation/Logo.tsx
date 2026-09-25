import Link from "next/link";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/config/site";

/** Ember square mark: three nodes joined into one flowing line. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#ff5a1f" />
      <path d="M8 21c4 0 4-10 8-10s4 10 8 10" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="8" cy="21" r="2.3" fill="#fff" />
      <circle cx="16" cy="11" r="2.3" fill="#fff" />
      <circle cx="24" cy="21" r="2.3" fill="#fff" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link href="#top" className={className} aria-label={`${siteConfig.name} — home`}>
      <span className="flex items-center gap-2.5">
        <LogoMark className={compact ? "size-7" : "size-8"} />
        {!compact && <span className="text-[0.95rem] font-bold tracking-tight text-fg">{siteConfig.wordmark}</span>}
      </span>
    </Link>
  );
}
