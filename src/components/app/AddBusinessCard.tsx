"use client";

import Link from "next/link";
import { ArrowRight, Bot, Building2, CirclePlay, LayoutGrid } from "lucide-react";
import { product } from "@/config/product";

/**
 * Home, until the business details are in: the one big next step. Everything else in the app
 * stays open to explore — services, automations, IBAX and the demo.
 */
export function AddBusinessCard() {
  return (
    <section aria-labelledby="add-business-h" className="relative overflow-hidden rounded-[1.75rem] border-2 border-flow/50 bg-flow/[0.07] p-5 sm:p-7">
      <div aria-hidden className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-flow/20 blur-3xl" />
      <div className="relative">
        <span className="grid size-12 place-items-center rounded-2xl bg-flow/15 text-flow">
          <Building2 className="size-6" aria-hidden />
        </span>
        <h2 id="add-business-h" className="mt-4 text-2xl leading-tight font-bold tracking-tight uppercase sm:text-3xl">
          Add your business details
        </h2>
        <p className="mt-2 max-w-xl text-sm text-fg-muted">
          Takes 2 minutes. {product.assistantName} then answers your customers, posts and follows up for <em>your</em> business. Until then, look around freely — see every service, automation and what {product.assistantName} can do.
        </p>
        <Link
          href="/app/setup"
          className="btn-3d group mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full px-6 text-base font-bold sm:w-auto"
        >
          Add your business details
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/app/services" className="inline-flex items-center gap-1.5 text-fg-muted hover:text-fg">
            <LayoutGrid className="size-4 text-flow" aria-hidden /> See all services
          </Link>
          <Link href="/app/ibax" className="inline-flex items-center gap-1.5 text-fg-muted hover:text-fg">
            <Bot className="size-4 text-flow" aria-hidden /> Talk to {product.assistantName}
          </Link>
          <Link href="/app/demo" className="inline-flex items-center gap-1.5 text-fg-muted hover:text-fg">
            <CirclePlay className="size-4 text-flow" aria-hidden /> Watch Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
