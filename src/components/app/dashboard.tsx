"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Crown, X } from "lucide-react";
import { cn } from "@/lib/cn";

/* Pieces of the owner's Home dashboard (src/app/app/(workspace)/home/page.tsx). */

/** A number that counts up from 0 when the page opens. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 1100);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span className={cn("tabular-nums", className)}>{shown}</span>;
}

/** The owner's badge: their logo (or initials) with a gold crown on top. */
export function OwnerAvatar({ name, logo }: { name: string; logo?: string }) {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "O";
  return (
    <span className="dash-owner relative inline-grid size-14 shrink-0 place-items-center">
      <Crown className="dash-crown absolute -top-3.5 left-1/2 size-6" aria-hidden />
      <span className="grid size-14 place-items-center overflow-hidden rounded-2xl text-lg font-bold">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- the owner's own logo (data URL or any host)
          <img src={logo} alt="" className="size-full object-cover" />
        ) : (
          initials
        )}
      </span>
    </span>
  );
}

export type Offer = {
  tag: string;
  title: string;
  body: string;
  price?: string;
  cta: string;
  href: string;
  tone: "violet" | "gold" | "green";
};

/** Offer cards that slide by themselves every few seconds (and can be swiped). */
export function OfferCarousel({ offers }: { offers: Offer[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const held = useRef(false);

  useEffect(() => {
    const el = track.current;
    if (!el || offers.length < 2) return;
    const timer = setInterval(() => {
      if (held.current) return;
      const card = el.children[0] as HTMLElement | undefined;
      if (!card) return;
      const width = card.offsetWidth + 12;
      const next = (Math.round(el.scrollLeft / width) + 1) % offers.length;
      el.scrollTo({ left: next * width, behavior: "smooth" });
    }, 3200);
    return () => clearInterval(timer);
  }, [offers.length]);

  return (
    <div>
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          const card = el.children[0] as HTMLElement | undefined;
          if (card) setAt(Math.round(el.scrollLeft / (card.offsetWidth + 12)));
        }}
        onPointerDown={() => (held.current = true)}
        onPointerUp={() => (held.current = false)}
        onPointerCancel={() => (held.current = false)}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth"
      >
        {offers.map((o) => (
          <Link key={o.title} href={o.href} className={cn("dash-offer dash-shine relative w-[82%] max-w-[22rem] shrink-0 snap-start overflow-hidden rounded-2xl p-4", `dash-offer-${o.tone}`)}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.7rem] font-bold tracking-[0.1em]">{o.tag}</span>
              {o.price && <span className="dash-chip rounded-lg px-2 py-0.5 text-xs font-bold">{o.price}</span>}
            </div>
            <p className="mt-1.5 text-lg font-bold tracking-tight">{o.title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs opacity-85">{o.body}</p>
            <span className="dash-offer-cta mt-3 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold">
              {o.cta} <ArrowRight className="size-3.5" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
      {offers.length > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5" aria-hidden>
          {offers.map((o, i) => (
            <span key={o.title} className={cn("h-1.5 rounded-full transition-all duration-500", i === at ? "w-5 bg-flow" : "w-1.5 bg-fg-subtle/30")} />
          ))}
        </div>
      )}
    </div>
  );
}

/** A bottom sheet (a centred box on big screens) with the details behind a number. */
export function DetailSheet({ title, subtitle, href, hrefLabel, onClose, children }: { title: string; subtitle?: string; href: string; hrefLabel: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="dash-sheet flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl border border-white/10 bg-ink-900 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-fg-subtle/40 sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-fg-muted">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-xl border border-white/10 text-fg-muted hover:text-fg">
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">{children}</div>
        <div className="border-t border-white/10 p-3">
          <Link href={href} className="flex items-center justify-center gap-1.5 rounded-xl bg-flow px-4 py-3 text-sm font-bold text-ink-950">
            {hrefLabel} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}

/** One row in a detail sheet. */
export function DetailRow({ href, icon, title, meta, body, right }: { href: string; icon: ReactNode; title: ReactNode; meta?: ReactNode; body?: ReactNode; right?: ReactNode }) {
  return (
    <Link href={href} className="flex gap-3 rounded-2xl p-2.5 hover:bg-white/[0.04]">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-lg">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold">{title}</p>
          {right}
        </div>
        {meta && <p className="truncate text-xs text-fg-subtle">{meta}</p>}
        {body && <p className="mt-1 line-clamp-2 text-xs text-fg-muted">{body}</p>}
      </div>
    </Link>
  );
}
