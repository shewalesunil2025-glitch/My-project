import Link from "next/link";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/config/site";
import { ShambhuBot } from "@/components/shambhu/ShambhuBot";

/** The brand mark: Shambhu, the chatbot robot, in a rounded tile. */
export function LogoMark({ className }: { className?: string }) {
  return <ShambhuBot className={cn("size-8 overflow-hidden rounded-[9px]", className)} />;
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link href="#top" className={className} aria-label={`${siteConfig.name} — home`}>
      <span className="flex items-center gap-2.5">
        <LogoMark className={compact ? "size-8" : "size-9"} />
        {!compact && <span className="text-[0.95rem] font-medium tracking-tight text-fg">{siteConfig.wordmark}</span>}
      </span>
    </Link>
  );
}
