"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Crop, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { businessCategories } from "@/content/app/services";
import type { Business } from "@/lib/app/types";
import { validUpi } from "@/lib/upi";
import { PhoneInput } from "./PhoneInput";

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

type Pic = { src: string; w: number; h: number };
const loadPic = (src: string) =>
  new Promise<Pic>((resolve, reject) => {
    const img = new Image();
    img.onload = () => (img.naturalWidth && img.naturalHeight ? resolve({ src, w: img.naturalWidth, h: img.naturalHeight }) : reject(new Error("unreadable")));
    img.onerror = () => reject(new Error("unreadable"));
    img.src = src;
  });

const FRAME = 280; // the crop square on screen (px)
const OUT = 400; // the saved photo (px)
const MAX_ZOOM = 4;

/**
 * Crop a photo into the square badge: drag to move it, pinch or use the slider to zoom.
 * The photo always fills the whole square. Saves a 400 px JPEG.
 */
export function PhotoCropper({ pic, onCancel, onSave }: { pic: Pic; onCancel: () => void; onSave: (dataUrl: string) => void }) {
  const base = FRAME / Math.min(pic.w, pic.h); // smallest scale that still fills the square
  const [view, setView] = useState(() => ({ z: 1, x: (FRAME - pic.w * base) / 2, y: (FRAME - pic.h * base) / 2 }));
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef(0);

  const fit = (z: number, x: number, y: number) => {
    const zoom = Math.min(MAX_ZOOM, Math.max(1, z));
    const sc = base * zoom;
    return { z: zoom, x: Math.min(0, Math.max(FRAME - pic.w * sc, x)), y: Math.min(0, Math.max(FRAME - pic.h * sc, y)) };
  };
  // Zoom keeping the middle of the square where it is.
  const zoomTo = (v: typeof view, z: number) => {
    const old = base * v.z;
    const now = base * Math.min(MAX_ZOOM, Math.max(1, z));
    const cx = (FRAME / 2 - v.x) / old;
    const cy = (FRAME / 2 - v.y) / old;
    return fit(z, FRAME / 2 - cx * now, FRAME / 2 - cy * now);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function save() {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = OUT;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const sc = base * view.z;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, OUT, OUT);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, -view.x / sc, -view.y / sc, FRAME / sc, FRAME / sc, 0, 0, OUT, OUT);
      onSave(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.src = pic.src;
  }

  const sc = base * view.z;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Adjust your photo" onClick={onCancel}>
      <div className="dash-sheet w-full max-w-sm rounded-t-3xl border border-white/10 bg-ink-900 p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-center text-base font-bold tracking-tight">Adjust your photo</p>
        <p className="mt-0.5 text-center text-xs text-fg-muted">Drag to move · pinch or slide to zoom</p>
        <div
          className="relative mx-auto mt-4 cursor-grab touch-none overflow-hidden rounded-3xl bg-black select-none active:cursor-grabbing"
          style={{ width: FRAME, height: FRAME }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (pointers.current.size === 2) {
              const [p1, p2] = [...pointers.current.values()];
              pinch.current = Math.hypot(p1!.x - p2!.x, p1!.y - p2!.y);
            }
          }}
          onPointerMove={(e) => {
            const last = pointers.current.get(e.pointerId);
            if (!last) return;
            const now = { x: e.clientX, y: e.clientY };
            pointers.current.set(e.pointerId, now);
            if (pointers.current.size === 1) setView((v) => fit(v.z, v.x + now.x - last.x, v.y + now.y - last.y));
            else if (pointers.current.size === 2 && pinch.current) {
              const [p1, p2] = [...pointers.current.values()];
              const d = Math.hypot(p1!.x - p2!.x, p1!.y - p2!.y);
              const ratio = d / pinch.current;
              pinch.current = d;
              setView((v) => zoomTo(v, v.z * ratio));
            }
          }}
          onPointerUp={(e) => {
            pointers.current.delete(e.pointerId);
            pinch.current = 0;
          }}
          onPointerCancel={(e) => {
            pointers.current.delete(e.pointerId);
            pinch.current = 0;
          }}
          onWheel={(e) => setView((v) => zoomTo(v, v.z * (e.deltaY < 0 ? 1.08 : 1 / 1.08)))}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a photo picked on this phone */}
          <img src={pic.src} alt="" draggable={false} className="pointer-events-none absolute top-0 left-0 max-w-none origin-top-left" style={{ width: pic.w * sc, height: pic.h * sc, transform: `translate(${view.x}px, ${view.y}px)` }} />
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-white/70 ring-inset" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_33%,rgb(255_255_255/0.25)_33%,rgb(255_255_255/0.25)_calc(33%+1px),transparent_calc(33%+1px),transparent_66%,rgb(255_255_255/0.25)_66%,rgb(255_255_255/0.25)_calc(66%+1px),transparent_calc(66%+1px)),linear-gradient(to_bottom,transparent_33%,rgb(255_255_255/0.25)_33%,rgb(255_255_255/0.25)_calc(33%+1px),transparent_calc(33%+1px),transparent_66%,rgb(255_255_255/0.25)_66%,rgb(255_255_255/0.25)_calc(66%+1px),transparent_calc(66%+1px))]" />
        </div>
        <label className="mt-4 flex items-center gap-3 text-fg-muted">
          <span className="text-xs">−</span>
          <input type="range" min={1} max={MAX_ZOOM} step={0.01} value={view.z} onChange={(e) => setView((v) => zoomTo(v, Number(e.target.value)))} className="flex-1 accent-[#25d366]" aria-label="Zoom" />
          <span className="text-sm">+</span>
        </label>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button type="button" onClick={onCancel} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold">
            Cancel
          </button>
          <button type="button" onClick={save} className="rounded-xl bg-flow px-4 py-3 text-sm font-bold text-ink-950">
            Save photo
          </button>
        </div>
      </div>
    </div>
  );
}

/** The owner's photo or logo (or initials) in a clean square badge. */
export function OwnerBadge({ name, logo, size = "md" }: { name: string; logo?: string; size?: "md" | "lg" }) {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "O";
  const big = size === "lg";
  return (
    <span className={cn("dash-badge relative inline-grid shrink-0 place-items-center", big ? "size-28" : "size-14")}>
      <span className={cn("dash-owner-box grid size-full place-items-center overflow-hidden font-bold", big ? "rounded-[1.75rem]" : "rounded-2xl", big ? "text-3xl" : "text-lg")}>
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- the owner's own photo (data URL)
          <img src={logo} alt="" className="size-full object-cover" />
        ) : (
          initials
        )}
      </span>
    </span>
  );
}

/** "Business profile": the photo (change it, adjust the crop) and the business and owner names. */
/** Home → ✎ Edit: the owner's photo, personal details and every business detail, all editable in one sheet. */
export function BusinessProfileSheet({ business, accountEmail, onClose, onSave }: { business: Business; accountEmail?: string; onClose: () => void; onSave: (b: Business) => void }) {
  const [draft, setDraft] = useState<Business>(business);
  const [pic, setPic] = useState<Pic | null>(null);
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !pic && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, pic]);

  const open = (src: string) =>
    loadPic(src)
      .then(setPic)
      .catch(() => window.alert("That photo couldn't be opened — please pick a JPG or PNG photo."));
  const set = (k: keyof Business) => (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const btn = "flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold hover:bg-white/[0.05]";
  const input = "mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-fg outline-none focus:border-flow/60";
  const field = (label: string, k: keyof Business, o: { type?: string; placeholder?: string; area?: boolean; max?: number; help?: string } = {}) => (
    <label className="mt-3 block text-xs font-medium text-fg-muted">
      {label}
      {o.area ? (
        <textarea className={cn(input, "min-h-20 resize-y")} value={String(draft[k] ?? "")} maxLength={o.max ?? 2000} placeholder={o.placeholder} onChange={set(k)} />
      ) : (
        <input className={input} type={o.type ?? "text"} value={String(draft[k] ?? "")} maxLength={o.max ?? 200} placeholder={o.placeholder} onChange={set(k)} />
      )}
      {o.help && <span className="mt-1 block text-[0.7rem] font-normal text-fg-subtle">{o.help}</span>}
    </label>
  );
  const heading = (t: string) => <p className="mt-6 text-[0.7rem] font-bold tracking-widest text-fg-subtle uppercase">{t}</p>;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Business profile" onClick={onClose}>
      <form
        className="dash-sheet flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-3xl border border-white/10 bg-ink-900 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.name.trim()) return setError("Please enter your business name.");
          if (draft.upiId?.trim() && !validUpi(draft.upiId)) return setError("Please check the UPI ID (like yourname@okhdfc).");
          const trimmed = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, typeof v === "string" && k !== "logo" ? v.trim() : v])) as Business;
          onSave({ ...trimmed, upiId: trimmed.upiId || undefined });
        }}
      >
        <div className="overflow-y-auto overscroll-contain p-5">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-fg-subtle/40 sm:hidden" aria-hidden />
          <p className="text-center text-base font-bold tracking-tight">Business profile</p>
          <div className="mt-5 flex justify-center">
            <OwnerBadge name={draft.ownerName || draft.name} logo={draft.logo} size="lg" />
          </div>
          <div className="mt-5 flex gap-2.5">
            <button type="button" className={btn} onClick={() => file.current?.click()}>
              <ImagePlus className="size-4" aria-hidden /> {draft.logo ? "Change photo" : "Add photo"}
            </button>
            {draft.logo && (
              <button type="button" className={btn} onClick={() => void open(draft.logo!)}>
                <Crop className="size-4" aria-hidden /> Adjust
              </button>
            )}
          </div>
          {draft.logo && (
            <button type="button" className="mx-auto mt-2 block text-xs font-medium text-fg-subtle hover:text-red-300" onClick={() => setDraft((d) => ({ ...d, logo: undefined }))}>
              Remove photo
            </button>
          )}
          <input
            ref={file}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              const reader = new FileReader();
              reader.onload = () => void open(String(reader.result));
              reader.readAsDataURL(f);
            }}
          />

          {heading("Personal")}
          {field("Your name (owner)", "ownerName", { max: 80 })}
          <div className="mt-3 text-xs font-medium text-fg-muted">
            <label htmlFor="bp-phone">Phone / WhatsApp</label>
            <div className="mt-1">
              <PhoneInput id="bp-phone" value={draft.phone} country={draft.country} onChange={(v) => setDraft((d) => ({ ...d, phone: v }))} onCountry={(c) => setDraft((d) => ({ ...d, country: c }))} />
            </div>
          </div>
          {field("Contact email", "email", { type: "email", max: 200 })}
          {accountEmail && <p className="mt-2 text-[0.7rem] text-fg-subtle">Login email: {accountEmail} (change it in Settings → Security).</p>}

          {heading("Business")}
          {field("Business name", "name", { max: 80 })}
          <label className="mt-3 block text-xs font-medium text-fg-muted">
            Business type
            <select className={cn(input, "appearance-none")} value={draft.category} onChange={set("category")}>
              {(businessCategories.includes(draft.category) ? businessCategories : [draft.category, ...businessCategories]).map((c) => (
                <option key={c} className="bg-ink-850">
                  {c}
                </option>
              ))}
            </select>
          </label>
          {field("Address", "address", { max: 200 })}
          {field("City", "city", { max: 80 })}
          {field("Working hours", "hours", { placeholder: "Mon–Sat, 10 AM – 8 PM", max: 120 })}
          {field("About your business", "description", { area: true, help: "IBAX uses this to answer your customers." })}
          {field("Services / products and prices", "services", { area: true })}
          {field("Who are your customers?", "targetCustomers", { area: true, max: 600 })}

          {heading("Online & payments")}
          {field("Website", "websiteUrl", { type: "url", placeholder: "https://", max: 200 })}
          {field("Social links", "socialLinks", { area: true, max: 600, placeholder: "Instagram, Facebook, YouTube links" })}
          {field("UPI ID for customer payments", "upiId", { placeholder: "yourname@okhdfc", max: 100, help: "Optional. IBAX sends customers a UPI link and QR on WhatsApp; the money comes straight to you." })}
          {error && <p className="mt-3 text-xs text-amber-200">{error}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2.5 border-t border-white/10 p-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold">
            Cancel
          </button>
          <button type="submit" className="rounded-xl bg-flow px-4 py-3 text-sm font-bold text-ink-950">
            Save
          </button>
        </div>
      </form>
      {pic && (
        <div onClick={(e) => e.stopPropagation()}>
          <PhotoCropper
            pic={pic}
            onCancel={() => setPic(null)}
            onSave={(url) => {
              setPic(null);
              setDraft((d) => ({ ...d, logo: url }));
            }}
          />
        </div>
      )}
    </div>
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
          <Link key={o.title} href={o.href} className={cn("dash-offer relative w-[82%] max-w-[22rem] shrink-0 snap-start overflow-hidden rounded-2xl p-4", `dash-offer-${o.tone}`)}>
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
