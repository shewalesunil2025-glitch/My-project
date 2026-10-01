"use client";

import Link from "next/link";
import { useId, type ComponentProps, type ReactNode } from "react";
import {
  Bell,
  CircleDot,
  Camera,
  Globe,
  Mail,
  MessageCircle,
  PhoneCall,
  Rocket,
  Share2,
  Sparkles,
  Star,
  ThumbsUp,
  UserCheck,
  Wand2,
  MonitorPlay,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

/* ── Brand mark: a friendly glowing face ── */
export function LumiMark({ className, glow = true }: { className?: string; glow?: boolean }) {
  // Unique per instance: a shared id breaks when its first copy sits in a hidden element.
  const gid = `lumi-g${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#eaffd9" />
          <stop offset="0.45" stopColor="#7dff3a" />
          <stop offset="1" stopColor="#3fae12" />
        </radialGradient>
      </defs>
      {glow && <circle cx="20" cy="20" r="19" fill="#7dff3a" opacity="0.2" />}
      <circle cx="20" cy="20" r="15.5" fill={`url(#${gid})`} />
      <ellipse cx="15.2" cy="18.2" rx="1.9" ry="2.5" fill="#052405" />
      <ellipse cx="24.8" cy="18.2" rx="1.9" ry="2.5" fill="#052405" />
      <path d="M15 24.2c2.9 2.6 7.1 2.6 10 0" fill="none" stroke="#052405" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const icons: Record<string, LucideIcon> = {
  Globe,
  PhoneCall,
  MessageCircle,
  Instagram: Camera,
  Facebook: ThumbsUp,
  Youtube: MonitorPlay,
  Mail,
  Star,
  UserCheck,
  Share2,
  Rocket,
  Wand2,
  Bell,
  Sparkles,
};
export function Icon({ name, className }: { name: string; className?: string }) {
  const I = icons[name] ?? CircleDot;
  return <I className={className} aria-hidden />;
}

/* ── Buttons ── */
type BtnVariant = "primary" | "ghost" | "light" | "danger" | "subtle";
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight whitespace-nowrap transition-colors duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-flow text-ink-950 hover:bg-flow-soft shadow-[0_0_28px_-6px_rgb(125_255_58/0.7)]",
  ghost: "border border-white/12 bg-white/[0.04] text-fg hover:border-white/25 hover:bg-white/[0.08]",
  light: "bg-white text-ink-950 hover:bg-white/90",
  danger: "border border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20",
  subtle: "text-fg-muted hover:text-fg hover:bg-white/[0.06]",
};
const btnSizes = { sm: "h-9 px-3.5 text-[0.8rem]", md: "h-11 px-5 text-sm", lg: "h-12 px-6 text-[0.95rem]" };

export function Btn({
  variant = "primary",
  size = "md",
  className,
  ...props
}: { variant?: BtnVariant; size?: keyof typeof btnSizes } & ComponentProps<"button">) {
  return <button type="button" className={cn(btnBase, btnVariants[variant], btnSizes[size], className)} {...props} />;
}

export function BtnLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: { variant?: BtnVariant; size?: keyof typeof btnSizes } & ComponentProps<typeof Link>) {
  return <Link className={cn(btnBase, btnVariants[variant], btnSizes[size], className)} {...props} />;
}

/* ── Surfaces ── */
export function Card({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("glass rounded-2xl p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action, eyebrow }: { title: string; subtitle?: ReactNode; action?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="display text-2xl text-fg sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[0.95rem] font-semibold text-fg">{children}</h2>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint, href }: { label: string; value: ReactNode; hint?: ReactNode; href?: string }) {
  const inner = (
    <>
      <p className="text-xs font-medium text-fg-muted">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-fg tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-fg-subtle">{hint}</p>}
    </>
  );
  const cls = "glass block rounded-2xl p-4 transition-colors";
  return href ? (
    <Link href={href} className={cn(cls, "hover:border-white/20")}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

const pillTones = {
  green: "bg-emerald-400/12 text-emerald-300 border-emerald-400/25",
  amber: "bg-amber-400/12 text-amber-200 border-amber-400/25",
  red: "bg-red-400/12 text-red-300 border-red-400/25",
  blue: "bg-sky-400/12 text-sky-300 border-sky-400/25",
  gray: "bg-white/[0.06] text-fg-muted border-white/10",
  ember: "bg-flow/15 text-flow-soft border-flow/30",
};
export type PillTone = keyof typeof pillTones;
export function Pill({ tone = "gray", children, className }: { tone?: PillTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.72rem] font-medium whitespace-nowrap", pillTones[tone], className)}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 px-6 py-10 text-center">
      {icon && <div className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-white/[0.05] text-flow-soft">{icon}</div>}
      <p className="font-semibold text-fg">{title}</p>
      {children && <p className="mx-auto mt-1.5 max-w-md text-sm text-fg-muted">{children}</p>}
      {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
    </div>
  );
}

/* ── Forms ── */
const inputCls =
  "w-full rounded-xl border border-white/10 bg-ink-900 px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-subtle/80 transition-colors focus:border-flow/60 focus:outline-none focus-visible:outline-none";

export function Field({ label, help, children, htmlFor, required }: { label: string; help?: ReactNode; children: ReactNode; htmlFor?: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[0.8rem] font-medium text-fg">
        {label}
        {required && <span className="text-flow-soft"> *</span>}
      </label>
      {children}
      {help && <p className="text-xs text-fg-subtle">{help}</p>}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputCls, className)} {...props} />;
}
export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputCls, "min-h-24 resize-y", className)} {...props} />;
}
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(inputCls, "appearance-none bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-9", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a6a6ad' stroke-width='1.6' fill='none'/%3E%3C/svg%3E\")" }} {...props}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/10 bg-ink-900 px-3.5 py-2.5 text-left text-sm text-fg"
    >
      <span>{label}</span>
      <span className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", checked ? "bg-flow" : "bg-white/15")}>
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[1.125rem]" : "translate-x-0.5")} />
      </span>
    </button>
  );
}

/** Segmented control / tabs. */
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-full border border-white/10 bg-ink-900 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 shrink-0 rounded-full px-3.5 text-[0.8rem] font-medium whitespace-nowrap transition-colors",
            value === o.value ? "bg-white text-ink-950" : "text-fg-muted hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Notice({ tone = "ember", children, className }: { tone?: "ember" | "amber" | "blue"; children: ReactNode; className?: string }) {
  const t = {
    ember: "border-flow/25 bg-flow/[0.07] text-flow-soft",
    amber: "border-amber-400/25 bg-amber-400/[0.07] text-amber-100",
    blue: "border-sky-400/25 bg-sky-400/[0.07] text-sky-100",
  }[tone];
  return <div className={cn("rounded-xl border px-4 py-3 text-sm leading-relaxed", t, className)}>{children}</div>;
}

export function Spinner({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block size-4 animate-spin rounded-full border-2 border-white/25 border-t-white", className)} />;
}

export function FullScreenLoader() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-label="Loading">
      <LumiMark className="size-12 animate-pulse" />
    </div>
  );
}

/* ── Formatting ── */
export function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const future = diff < 0;
  const s = Math.abs(diff);
  const fmt = (n: number, u: string) => (future ? `in ${n} ${u}` : `${n} ${u} ago`);
  if (s < 60) return future ? "in a moment" : "just now";
  if (s < 3600) return fmt(Math.round(s / 60), "min");
  if (s < 86400) return fmt(Math.round(s / 3600), Math.round(s / 3600) === 1 ? "hour" : "hours");
  if (s < 86400 * 7) return fmt(Math.round(s / 86400), Math.round(s / 86400) === 1 ? "day" : "days");
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/** True when `iso` is within the last `days` days. */
export const withinDays = (iso: string, days: number) => Date.now() - new Date(iso).getTime() < days * 86400_000;
export const yesterday = () => new Date(Date.now() - 86400_000);
