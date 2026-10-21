"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, CreditCard, Crown, Globe, LifeBuoy, Link2, Mail, MessageCircle } from "lucide-react";
import { product } from "@/config/product";
import { inTrial, isLive, providerInfo, services } from "@/content/app/services";
import type { ProviderId } from "@/lib/app/types";
import { trialState } from "@/lib/app/trial";
import { TrialBanner } from "@/components/app/TrialBanner";
import { ConnectAccount } from "@/components/app/ConnectAccount";
import { appCurrency, money, svcPrice } from "@/lib/app/money";
import { useWorkspace } from "@/components/app/AppShell";
import { automationStatus } from "@/components/app/status";
import { Icon, LumiMark, Pill, SectionTitle, withinDays } from "@/components/app/ui";
import { onWaitlist } from "@/lib/app/agentActions";
import { openIbaxChat } from "@/lib/app/ibaxEvents";
import { cn } from "@/lib/cn";

/** Things owners most often ask IBAX to do — one tap sends it to the chat. */
const prompts = ["Mujhe WhatsApp automation chahiye", "Meri website banao", "Aaj business me kya hua?", "Kaunsi service mere liye best hai?"];

/** Same card look as the rest of the app (Home, Services…). */
const card = "glass relative rounded-[1.4rem]";

export default function IbaxHubPage() {
  const ws = useWorkspace();
  if (!ws?.business) return null;

  const mine = ws.automations;
  const live = mine.filter((a) => a.status !== "setup").length;
  const connected = Object.values(ws.connections).filter(Boolean).length;
  const leadsWeek = ws.leads.filter((l) => withinDays(l.createdAt, 7)).length;
  const cur = appCurrency(ws);
  const trialOpen = !ws.sample && trialState(ws).phase !== "over";
  // Ready-to-use services first, then the ones coming soon.
  const all = [...services].sort((a, b) => Number(isLive(b.id)) - Number(isLive(a.id)));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* The free trial first: the easiest way to start. */}
      {!ws.sample && <TrialBanner ws={ws} />}

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[1.8rem] border border-flow/15 p-6 text-center shadow-[0_40px_100px_-40px_rgb(37_211_102/0.3)] [background:radial-gradient(ellipse_at_50%_-10%,rgb(37_211_102/0.16),transparent_60%),linear-gradient(180deg,rgb(37_211_102/0.045),rgb(255_255_255/0.01)),var(--color-ink-850)] sm:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-flow/70 to-transparent" />
        <LumiMark className="mx-auto size-16 animate-float" />
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{product.assistantName}</h1>
        <p className="mt-1 text-sm font-medium text-flow-soft">{product.slogan}</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-fg-muted">
          Your AI business manager for <span className="font-semibold text-fg">{ws.business.name || "your business"}</span>. Tell {product.assistantName} what you need — it sets up services, answers questions and keeps your business running.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-2 text-left">
          {[
            { label: "Services live", value: live, href: "/app/automations" },
            { label: "Accounts linked", value: connected, href: "/app/settings#accounts" },
            { label: "Leads this week", value: leadsWeek, href: "/app/leads" },
          ].map((s) => (
            <Link key={s.label} href={s.href} className="rounded-2xl border border-white/[0.07] bg-ink-950/50 p-3 transition-colors hover:border-flow/30">
              <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
              <p className="mt-0.5 text-[0.7rem] leading-tight text-fg-subtle">{s.label}</p>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={() => openIbaxChat()}
          className="btn-3d group mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full px-6 text-[0.95rem] font-semibold text-white sm:w-auto"
        >
          <MessageCircle className="size-4" aria-hidden /> Talk to {product.assistantName}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>
        <div className="no-scrollbar -mx-6 mt-4 flex gap-2 overflow-x-auto px-6 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
          {prompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => openIbaxChat(p)}
              className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-fg-muted transition-colors hover:border-flow/40 hover:text-fg"
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* Your services */}
      <section>
        <SectionTitle action={<Link href="/app/automations" className="text-xs font-semibold text-flow-soft">Manage</Link>}>Your services</SectionTitle>
        {mine.length ? (
          <ul className={cn(card, "mt-3 divide-y divide-white/[0.06]")}>
            {mine.map((a) => {
              const svc = services.find((s) => s.id === a.serviceId);
              const st = automationStatus[a.status];
              return (
                <li key={a.id}>
                  <Link href={`/app/automations/${a.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03]">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-flow/12 text-flow-soft ring-1 ring-flow/20">
                      <Icon name={svc?.icon ?? "Sparkles"} className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{svc?.name ?? a.serviceId}</span>
                      <span className="block truncate text-xs text-fg-subtle">{svc?.short}</span>
                    </span>
                    <Pill tone={st.tone}>{st.label}</Pill>
                    <ChevronRight className="size-4 text-fg-subtle" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className={cn(card, "mt-3 p-5 text-center")}>
            <p className="text-sm text-fg-muted">No services yet. Pick one below — {product.assistantName} sets it up for you in a few minutes.</p>
          </div>
        )}
      </section>

      {/* Every service, two per row, with its price */}
      <section>
        <SectionTitle action={<Link href="/app/services" className="text-xs font-semibold text-flow-soft">Details</Link>}>
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
                  className={cn(card, "flex h-full flex-col p-3.5 transition-colors hover:border-flow/35 sm:p-4", available && "border-flow/20")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-flow/12 text-flow-soft ring-1 ring-flow/20">
                      <Icon name={s.icon} className="size-5" />
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
                  <p className="mt-3 text-sm leading-snug font-semibold">{s.name}</p>
                  <p className="mt-1 line-clamp-2 flex-1 text-xs leading-snug text-fg-subtle">{s.short}</p>
                  <p className="mt-3 text-sm">
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
                      "mt-3 inline-flex h-9 items-center justify-center rounded-full text-xs font-semibold",
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

      {/* Account & help */}
      <section>
        <SectionTitle>Your account</SectionTitle>
        <ul className={cn(card, "mt-3 divide-y divide-white/[0.06]")}>
          {[
            { href: "/app/website", icon: Globe, title: "Your website", sub: ws.website?.status === "live" ? "Live" : "Build or edit your website" },
            { href: "/app/settings#accounts", icon: Link2, title: "Connected accounts", sub: connected ? `${connected} linked` : "Link WhatsApp and more" },
            { href: "/app/billing", icon: CreditCard, title: "Plan & billing", sub: "Payments, invoices and renewals" },
            { href: "/app/help", icon: LifeBuoy, title: "Help & support", sub: "Guides and answers" },
          ].map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03]">
                <r.icon className="size-5 text-fg-muted" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{r.title}</span>
                  <span className="block truncate text-xs text-fg-subtle">{r.sub}</span>
                </span>
                <ChevronRight className="size-4 text-fg-subtle" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <a
            href={`https://wa.me/${product.supportPhone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(card, "flex items-center gap-2 p-4 text-sm font-medium hover:border-flow/30")}
          >
            <MessageCircle className="size-4 text-flow" aria-hidden /> Talk to a person
          </a>
          <a href={`mailto:${product.supportEmail}`} className={cn(card, "flex items-center gap-2 p-4 text-sm font-medium hover:border-flow/30")}>
            <Mail className="size-4 text-flow" aria-hidden /> Email us
          </a>
        </div>
      </section>
    </div>
  );
}
