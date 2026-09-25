import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Magnetic } from "@/components/effects/Magnetic";

type Variant = "primary" | "ghost" | "light" | "dark";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight whitespace-nowrap " +
  "transition-[background-color,color,box-shadow,border-color,transform] duration-300 ease-[var(--ease-out-expo)] " +
  "active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  /** Ember pill — the main call to action. */
  primary:
    "btn-shine bg-flow text-white shadow-[0_10px_30px_-10px_rgb(255_90_31/0.8)] hover:bg-flow-strong hover:shadow-[0_14px_40px_-8px_rgb(255_90_31/0.9)]",
  /** Transparent on dark. */
  ghost: "border border-white/12 bg-white/[0.04] text-fg hover:border-white/25 hover:bg-white/[0.08]",
  /** White pill on dark (used in the floating nav and final CTA). */
  light: "bg-white text-ink-950 hover:bg-white/90",
  /** Black pill on paper sections. */
  dark: "bg-ink-950 text-white hover:bg-ink-800",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.8rem]",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-[0.95rem]",
};

type Common = {
  variant?: Variant;
  size?: Size;
  magnetic?: boolean;
  icon?: boolean;
  children: ReactNode;
  className?: string;
};

function Inner({ children, icon }: { children: ReactNode; icon?: boolean }) {
  return (
    <>
      <span>{children}</span>
      {icon && (
        <ArrowUpRight
          aria-hidden
          className="size-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      )}
    </>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  magnetic = true,
  icon,
  className,
  children,
  ...props
}: Common & Omit<ComponentProps<"button">, "children">) {
  const el = (
    <button type="button" className={cn(base, variants[variant], sizes[size], className)} {...props}>
      <Inner icon={icon}>{children}</Inner>
    </button>
  );
  return magnetic ? <Magnetic>{el}</Magnetic> : el;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  magnetic = true,
  icon,
  className,
  children,
  href,
  ...props
}: Common & Omit<ComponentProps<typeof Link>, "children">) {
  const el = (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      <Inner icon={icon}>{children}</Inner>
    </Link>
  );
  return magnetic ? <Magnetic>{el}</Magnetic> : el;
}
