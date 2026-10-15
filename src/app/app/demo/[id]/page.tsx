"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { serviceById } from "@/content/app/services";
import { DemoPlayer } from "@/components/demo/DemoPlayer";
import { BrandLogo, BtnLink, EmptyState } from "@/components/app/ui";

export default function ServiceDemoPage() {
  const { id } = useParams<{ id: string }>();
  const svc = serviceById(id);
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/app" className="flex items-center gap-2">
          <BrandLogo tagline />
        </Link>
        <BtnLink href="/app/signup" size="sm">
          Create Account
        </BtnLink>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <Link href="/app/demo" className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
          <ArrowLeft className="size-4" aria-hidden /> All demo videos
        </Link>
        {svc && svc.id !== "custom" ? <DemoPlayer key={svc.id} svc={svc} /> : <EmptyState title="Demo not found" action={<BtnLink href="/app/demo">All demos</BtnLink>} />}
      </main>
    </div>
  );
}
