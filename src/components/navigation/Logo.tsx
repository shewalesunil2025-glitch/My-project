import Link from "next/link";
import { siteConfig } from "@/config/site";

/** Wordmark with a flowing-path mark: three nodes joined into one line. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="#top" className={className} aria-label={`${siteConfig.name} — home`}>
      <span className="flex items-center gap-2.5">
        <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
          <defs>
            <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#b7cbff" />
              <stop offset="1" stopColor="#5ef2c2" />
            </linearGradient>
          </defs>
          <rect x="1" y="1" width="30" height="30" rx="9" fill="none" stroke="rgb(255 255 255 / .14)" />
          <path d="M8 21c4 0 4-10 8-10s4 10 8 10" fill="none" stroke="url(#logo-g)" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="8" cy="21" r="2.2" fill="#b7cbff" />
          <circle cx="16" cy="11" r="2.2" fill="#7aa2ff" />
          <circle cx="24" cy="21" r="2.2" fill="#5ef2c2" />
        </svg>
        <span className="font-mono text-[0.8rem] font-medium tracking-[0.24em] text-fg">{siteConfig.wordmark}</span>
      </span>
    </Link>
  );
}
