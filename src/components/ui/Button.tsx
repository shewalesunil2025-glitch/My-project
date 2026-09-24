import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Magnetic } from "@/components/effects/Magnetic";

type Variant = "primary" | "ghost";
type Size = "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight whitespace-nowrap " +
  "transition-[background-color,color,box-shadow,border-color] duration-500 ease-[var(--ease-out-expo)] " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-fg text-ink-950 shadow-[0_0_0_1px_rgb(255_255_255/0.4),0_10px_40px_-10px_rgb(122_162_255/0.55)] " +
    "hover:shadow-[0_0_0_1px_rgb(255_255_255/0.7),0_14px_50px_-8px_rgb(122_162_255/0.8)] hover:bg-white",
  ghost:
    "border border-white/12 bg-white/[0.03] text-fg backdrop-blur-md hover:border-white/25 hover:bg-white/[0.07]",
};

const sizes: Record<Size, string> = {
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
