"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
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
        className="group relative mb-8 block overflow-hidden rounded-3xl border border-flow/30 bg-[linear-gradient(135deg,rgb(102_211_76/0.18),rgb(102_211_76/0.03)_60%)] p-6 sm:p-8"
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
          <ul className="grid gap-2 text-sm text-fg-muted sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
            {(premium.package ?? []).map((f) => (
              <li key={f.title} className="flex items-center gap-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-flow/12 text-flow-soft ring-1 ring-flow/20">
                  <Icon name={f.icon} className="size-3.5" />
                </span>
                {f.title}
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
              <Link
                href={`/app/services/${s.id}`}
                className="group flex h-full flex-col rounded-2xl border border-white/[0.07] bg-[linear-gradient(160deg,rgb(255_255_255/0.05),rgb(255_255_255/0.01))] p-5 transition-all hover:-translate-y-0.5 hover:border-flow/35 hover:shadow-[0_24px_50px_-30px_rgb(102_211_76/0.7)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-xl border border-flow/25 bg-flow/10 text-flow">
                    <Icon name={s.icon} className="size-5" />
                  </span>
                  {a && <Pill tone={automationStatus[a.status].tone}>{automationStatus[a.status].label}</Pill>}
                </div>
                <p className="mt-5 text-lg font-semibold tracking-tight">{s.name}</p>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-fg-muted">{s.short}</p>
                {s.price === null ? (
                  <p className="mt-5 text-xl font-semibold">Custom quote</p>
                ) : (
                  <>
                    <p className="mt-5 font-mono text-[0.65rem] tracking-[0.2em] text-fg-subtle uppercase">Starting at</p>
                    <p className="mt-1">
                      <span className="text-3xl font-semibold tracking-tight tabular-nums group-hover:text-flow">{formatPrice(s.price)}</span>
                      <span className="text-sm text-fg-muted">{s.billing === "one-time" ? " one-time" : " /mo"}</span>
                    </p>
                  </>
                )}
                <span className="mt-3 text-sm font-semibold text-flow">{a ? "Manage" : s.price === null ? "Request a quote" : "Get started"} →</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
