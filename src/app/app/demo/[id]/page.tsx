"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { serviceById } from "@/content/app/services";
import { DemoVideo } from "@/components/demo/DemoVideo";
import { BrandLogo, BtnLink, EmptyState } from "@/components/app/ui";

export default function ServiceDemoPage() {
  const { id } = useParams<{ id: string }>();
  const svc = serviceById(id);
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
      <main className="px-4 pb-10">{svc && svc.id !== "custom" ? <DemoVideo key={svc.id} svc={svc} /> : <EmptyState title="Demo not found" action={<BtnLink href="/app/demo">All demos</BtnLink>} />}</main>
    </div>
  );
}
