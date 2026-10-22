"use client";

import Link from "next/link";
import { ArrowRight, Check, Crown } from "lucide-react";
import { product } from "@/config/product";
import { isLive, serviceById } from "@/content/app/services";
import { appCurrency, money, svcPrice } from "@/lib/app/money";
import { onWaitlist } from "@/lib/app/agentActions";
import { useWorkspace } from "@/components/app/AppShell";
import { automationStatus } from "@/components/app/status";
import { Icon, PageHeader, Pill } from "@/components/app/ui";
import { cn } from "@/lib/cn";

/** The two packages IBAX runs end to end; single services are on the Services page. */
const packages = ["social-pack", "digital-marketing"];

export default function IbaxPackagesPage() {
  const ws = useWorkspace();
  if (!ws) return null;
  const cur = appCurrency(ws);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow={product.assistantName} title="Packages" subtitle={`Let ${product.assistantName} run your social media and marketing — everything in one plan.`} />
      {packages.map((id, i) => {
        const s = serviceById(id);
        if (!s) return null;
        const a = ws.automations.find((x) => x.serviceId === s.id);
        const live = isLive(s.id);
        const items = s.package?.length ? s.package.map((p) => ({ title: p.title, icon: p.icon })) : s.features.map((f) => ({ title: f, icon: "" }));
        return (
          <Link
            key={s.id}
            href={a ? `/app/automations/${a.id}` : `/app/services/${s.id}`}
            className={cn(
              "group relative block overflow-hidden rounded-3xl border p-5 transition-colors sm:p-7",
              i === 1 ? "border-flow/40 bg-[linear-gradient(135deg,rgb(37_211_102/0.2),rgb(37_211_102/0.03)_60%)]" : "glass border-flow/20 hover:border-flow/40",
            )}
          >
            <div aria-hidden className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-flow/15 blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-flow/12 text-flow ring-1 ring-flow/25">
                  <Icon name={s.icon} className="size-6" />
                </span>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {i === 1 && (
                    <Pill tone="ember">
                      <Crown className="size-3" aria-hidden /> Premium
                    </Pill>
                  )}
                  {a ? <Pill tone={automationStatus[a.status].tone}>{automationStatus[a.status].label}</Pill> : !live && <Pill tone="amber">Coming soon</Pill>}
                </div>
              </div>
              <h2 className="display mt-4 text-2xl sm:text-3xl">{s.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.description}</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {items.map((f) => (
                  <li key={f.title} className="flex items-start gap-2.5 text-sm">
                    <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-flow/12 text-flow ring-1 ring-flow/20">
                      {f.icon ? <Icon name={f.icon} className="size-3.5" /> : <Check className="size-3.5" aria-hidden />}
                    </span>
                    <span className="pt-0.5">{f.title}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
                <p>
                  <span className="text-3xl font-semibold tracking-tight tabular-nums">{money(svcPrice(s, ws)!, cur)}</span>
                  <span className="text-sm text-fg-muted"> / month</span>
                </p>
                <span
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold",
                    live || a ? "btn-3d text-white" : "border border-white/12 text-fg-muted group-hover:text-fg",
                  )}
                >
                  {a ? "Open" : live ? "Get started" : onWaitlist(ws, s.id) ? "On the waitlist ✓" : "Join the waitlist"}
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
      <p className="text-center text-sm text-fg-muted">
        Need just one service?{" "}
        <Link href="/app/services" className="font-semibold text-flow hover:underline">
          See all services →
        </Link>
      </p>
    </div>
  );
}
