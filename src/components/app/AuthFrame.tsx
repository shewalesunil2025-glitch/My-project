import Link from "next/link";
import type { ReactNode } from "react";
import { product } from "@/config/product";
import { LumiMark } from "./ui";

export function AuthFrame({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_50%_0%,rgb(125_255_58/0.16),transparent_65%)]" />
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-4 py-8">
        <Link href="/app" className="mb-10 flex items-center gap-2 self-center">
          <LumiMark className="size-9" />
          <span className="text-xl font-bold tracking-tight">{product.name}</span>
        </Link>
        <h1 className="display text-center text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-center text-sm text-fg-muted">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 text-center text-sm text-fg-muted">{footer}</div>}
      </div>
    </div>
  );
}
