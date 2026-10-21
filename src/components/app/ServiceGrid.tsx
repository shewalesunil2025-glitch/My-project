"use client";

import Link from "next/link";
import { Check, Crown, Link2 } from "lucide-react";
import { inTrial, isLive, providerInfo, services } from "@/content/app/services";
import type { ProviderId, Workspace } from "@/lib/app/types";
import { trialState } from "@/lib/app/trial";
import { appCurrency, money, svcPrice } from "@/lib/app/money";
import { onWaitlist } from "@/lib/app/agentActions";
import { automationStatus } from "./status";
import { ConnectAccount } from "./ConnectAccount";
import { Icon, Pill, SectionTitle } from "./ui";
import { cn } from "@/lib/cn";

const card = "glass relative rounded-[1.4rem]";

/**
 * Every service two per row (price, what it includes, one action), then the accounts to
 * connect. Ready-to-use services come first.
 */
export function ServiceGrid({ ws }: { ws: Workspace }) {
  const mine = ws.automations;
  const cur = appCurrency(ws);
  const trialOpen = !ws.sample && trialState(ws).phase !== "over";
  const all = [...services].sort((a, b) => Number(isLive(b.id)) - Number(isLive(a.id)));
  return (
    <>
      {/* Every service, two per row, with its price */}
      <section>
        <SectionTitle >
          <span className="inline-flex items-center gap-2">
            <Crown className="size-4 text-flow" aria-hidden /> All services
          </span>
        </SectionTitle>
        <ul className="mt-3 grid grid-cols-2 gap-3">
          {all.map((s) => {
            const a = mine.find((x) => x.serviceId === s.id);
            const available = isLive(s.id);
            const free = !a && available && trialOpen && inTrial(s.id);
            const action = a ? "Open" : !available ? (onWaitlist(ws, s.id) ? "On waitlist ✓" : "Coming soon") : s.price === null ? "Get a quote" : free ? "Start free" : "Get it";
            return (
              <li key={s.id}>
                <Link
                  href={a ? `/app/automations/${a.id}` : `/app/services/${s.id}`}
                  className={cn(card, "flex h-full flex-col p-3 transition-colors hover:border-flow/35 sm:p-4", available && "border-flow/20")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-flow/12 text-flow-soft ring-1 ring-flow/20">
                      <Icon name={s.icon} className="size-[1.1rem]" />
                    </span>
                    {a ? (
                      <Pill tone={automationStatus[a.status].tone} className="text-[0.62rem]">
                        {a.trialEndsAt && a.status !== "paused" ? "Trial" : automationStatus[a.status].label}
                      </Pill>
                    ) : free ? (
                      <Pill tone="green" className="text-[0.62rem]">
                        🎁 Free
                      </Pill>
                    ) : !available ? (
                      <Pill tone="amber" className="text-[0.62rem]">
                        Soon
                      </Pill>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-snug font-semibold">{s.name}</p>
                  <p className="mt-0.5 truncate text-xs leading-snug text-fg-subtle">{s.short}</p>
                  <ul className="mt-2 space-y-1">
                    {s.features.slice(0, 2).map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-[0.7rem] leading-snug text-fg-muted">
                        <Check className="mt-px size-3 shrink-0 text-flow" aria-hidden />
                        <span className="line-clamp-2">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <span aria-hidden className="flex-1" />
                  <p className="mt-2 text-sm">
                    {s.price === null ? (
                      <span className="font-semibold">Custom quote</span>
                    ) : (
                      <>
                        <span className="text-base font-semibold tabular-nums">{money(svcPrice(s, ws)!, cur)}</span>
                        <span className="text-xs text-fg-subtle">{s.billing === "one-time" ? " once" : " /mo"}</span>
                      </>
                    )}
                  </p>
                  <span
                    className={cn(
                      "mt-2 inline-flex h-8 items-center justify-center rounded-full text-xs font-semibold",
                      available || a ? "btn-3d btn-3d-sm text-white" : "border border-white/10 text-fg-muted",
                    )}
                  >
                    {action}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Link the accounts the services work with */}
      <section>
        <SectionTitle action={<Link href="/app/settings#accounts" className="text-xs font-semibold text-flow-soft">Settings</Link>}>
          <span className="inline-flex items-center gap-2">
            <Link2 className="size-4 text-flow" aria-hidden /> Connect your accounts
          </span>
        </SectionTitle>
        <div className="mt-3 space-y-3">
          {(Object.keys(providerInfo) as ProviderId[]).map((p) => (
            <ConnectAccount key={p} ws={ws} provider={p} />
          ))}
        </div>
      </section>

    </>
  );
}
