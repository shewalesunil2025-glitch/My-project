"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { formatPrice, product } from "@/config/product";
import { services, type ServiceDef } from "@/content/app/services";
import { useWorkspace } from "@/components/app/AppShell";
import { automationStatus } from "@/components/app/status";
import { Icon, PageHeader, Pill, Segmented } from "@/components/app/ui";

const groups: { value: "all" | ServiceDef["group"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "assistant", label: "AI Assistants" },
  { value: "social", label: "Social & Content" },
  { value: "growth", label: "Growth" },
  { value: "web", label: "Website" },
];

export default function ServicesPage() {
  const ws = useWorkspace();
  const [group, setGroup] = useState<(typeof groups)[number]["value"]>("all");
  if (!ws) return null;

  const owned = (id: string) => ws.automations.find((a) => a.serviceId === id);
  const premium = services.find((s) => s.group === "premium")!;
  const list = services.filter((s) => s.group !== "premium" && (group === "all" || s.group === group));

  return (
    <div>
      <PageHeader eyebrow="Automation Store" title="Choose your automation" subtitle={`Buy any service on its own, or let ${product.name} run everything with Digital Marketing.`} />

      {/* Premium package */}
      <Link
        href={`/app/services/${premium.id}`}
        className="group relative mb-8 block overflow-hidden rounded-3xl border border-flow/30 bg-[linear-gradient(135deg,rgb(125_255_58/0.18),rgb(125_255_58/0.03)_60%)] p-6 sm:p-8"
      >
        <div aria-hidden className="absolute -top-20 -right-16 size-64 rounded-full bg-flow/20 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <Pill tone="ember">Premium · Complete package</Pill>
            <h2 className="display mt-3 text-2xl sm:text-3xl">{premium.name}</h2>
            <p className="mt-2 max-w-lg text-sm text-fg-muted">{premium.description}</p>
            <p className="mt-4 text-sm">
              <span className="text-2xl font-semibold">{formatPrice(premium.price!)}</span>
              <span className="text-fg-muted"> / month</span>
            </p>
            {owned(premium.id) ? (
              <Pill tone={automationStatus[owned(premium.id)!.status].tone} className="mt-3">
                {automationStatus[owned(premium.id)!.status].label}
              </Pill>
            ) : (
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-flow-soft group-hover:text-flow">
                See what&apos;s included <ArrowRight className="size-4" aria-hidden />
              </span>
            )}
          </div>
          <ul className="grid gap-1.5 text-sm text-fg-muted sm:grid-cols-2 md:grid-cols-1">
            {premium.features.slice(0, 6).map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-flow" aria-hidden /> {f}
              </li>
            ))}
          </ul>
        </div>
      </Link>

      <div className="mb-4">
        <Segmented label="Filter services" value={group} onChange={setGroup} options={groups} />
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => {
          const a = owned(s.id);
          return (
            <li key={s.id}>
              <Link href={`/app/services/${s.id}`} className="glass flex h-full flex-col rounded-2xl p-5 transition-colors hover:border-white/20">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-flow/12 text-flow-soft">
                    <Icon name={s.icon} className="size-5" />
                  </span>
                  {a && <Pill tone={automationStatus[a.status].tone}>{automationStatus[a.status].label}</Pill>}
                </div>
                <p className="mt-4 font-semibold">{s.name}</p>
                <p className="mt-1 flex-1 text-sm text-fg-muted">{s.short}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm">
                    {s.price === null ? (
                      <span className="font-semibold">Custom quote</span>
                    ) : (
                      <>
                        <span className="font-semibold">{formatPrice(s.price)}</span>
                        <span className="text-fg-muted"> / mo</span>
                      </>
                    )}
                  </p>
                  <span className="text-xs font-semibold text-flow-soft">{a ? "Manage" : s.price === null ? "Request" : "Buy"} →</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
