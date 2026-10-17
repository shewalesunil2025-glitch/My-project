"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { product } from "@/config/product";
import { DemoVideo } from "@/components/demo/DemoVideo";
import { BrandLogo } from "@/components/app/ui";

/** "ibaxai in 2 minutes": the whole app in one video (English, Hindi, Marathi). */
export default function IntroDemoPage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/app/demo" aria-label="All demo videos" className="grid size-10 place-items-center rounded-full border border-white/10">
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
        <Link href="/app">
          <BrandLogo />
        </Link>
      </header>
      <main className="px-4 pb-10">
        <h1 className="mx-auto mb-4 max-w-[26rem] text-xl font-semibold">{product.name} in 2 minutes</h1>
        <DemoVideo id="tour" />
      </main>
    </div>
  );
}
