"use client";

import { product } from "@/config/product";
import { useWorkspace } from "@/components/app/AppShell";
import { ServiceGrid } from "@/components/app/ServiceGrid";
import { TrialBanner } from "@/components/app/TrialBanner";
import { PageHeader } from "@/components/app/ui";

/** Every service: the free trial first, then all services two per row, then the accounts to connect. */
export default function ServicesPage() {
  const ws = useWorkspace();
  if (!ws) return null;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="Automation Store" title="Choose your automation" subtitle={`Start free, then pay only for what you keep. ${product.assistantName} sets it up.`} />
      {!ws.sample && <TrialBanner ws={ws} compact />}
      <ServiceGrid ws={ws} />
    </div>
  );
}
