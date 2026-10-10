"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, CreditCard, Crown, Globe, LifeBuoy, Link2, Mail, MessageCircle, Sparkles } from "lucide-react";
import { formatPrice, product } from "@/config/product";
import { isLive, services } from "@/content/app/services";
import { useWorkspace } from "@/components/app/AppShell";
import { automationStatus } from "@/components/app/status";
import { Icon, LumiMark, Pill, SectionTitle, withinDays } from "@/components/app/ui";
import { onWaitlist } from "@/lib/app/agentActions";
import { openIbaxChat } from "@/lib/app/ibaxEvents";
import { cn } from "@/lib/cn";

/** Things owners most often ask IBAX to do — one tap sends it to the chat. */
const prompts = ["Mujhe WhatsApp automation chahiye", "Meri website banao", "Aaj business me kya hua?", "Kaunsi service mere liye best hai?"];

const card = "rounded-[1.4rem] border border-white/[0.07] bg-[linear-gradient(160deg,rgb(255_255_255/0.06),rgb(255_255_255/0.015))]";

export default function IbaxHubPage() {
  const ws = useWorkspace();
  if (!ws?.business) return null;

  const mine = ws.automations;
  const live = mine.filter((a) => a.status !== "setup").length;
  const connected = Object.values(ws.connections).filter(Boolean).length;
  const leadsWeek = ws.leads.filter((l) => withinDays(l.createdAt, 7)).length;
  const owned = new Set(mine.map((a) => a.serviceId));
  const offer = services.filter((s) => s.price !== null && !owned.has(s.id)).sort((a, b) => Number(isLive(b.id)) - Number(isLive(a.id)));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[1.8rem] border border-flow/25 p-6 text-center shadow-[0_40px_100px_-40px_rgb(102_211_76/0.55)] [background:radial-gradient(ellipse_at_50%_-10%,rgb(102_211_76/0.32),transparent_60%),linear-gradient(180deg,rgb(255_255_255/0.05),rgb(255_255_255/0.01)),var(--color-ink-900)] sm:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-flow/70 to-transparent" />
        <LumiMark className="mx-auto size-16 animate-float" />
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{product.assistantName}</h1>
        <p className="mt-1 text-sm font-medium text-flow-soft">{product.slogan}</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-fg-muted">
          Your AI business manager for <span className="font-semibold text-fg">{ws.business.name}</span>. Tell {product.assistantName} what you need — it sets up services, answers questions and keeps your business running.
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
          className="group mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-flow px-6 text-sm font-semibold text-ink-950 shadow-[0_14px_40px_-12px_rgb(102_211_76/0.8)] transition-transform active:scale-[0.98] sm:w-auto"
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

      {/* Premium services */}
      <section>
        <SectionTitle action={<Link href="/app/services" className="text-xs font-semibold text-flow-soft">All services</Link>}>
          <span className="inline-flex items-center gap-2">
            <Crown className="size-4 text-flow" aria-hidden /> Premium services
          </span>
        </SectionTitle>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {offer.map((s) => {
            const available = isLive(s.id);
            const waiting = onWaitlist(ws, s.id);
            return (
              <li key={s.id} className={cn(card, "relative flex flex-col overflow-hidden p-4", available && "border-flow/25")}>
                {available && <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-flow/15 blur-3xl" />}
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-flow/12 text-flow-soft ring-1 ring-flow/20">
                    <Icon name={s.icon} className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="mt-0.5 text-xs leading-snug text-fg-subtle">{s.short}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className="text-sm">
                    <span className="font-semibold">{formatPrice(s.price!)}</span>
                    <span className="text-xs text-fg-subtle">{s.billing === "one-time" ? " one-time" : " /month"}</span>
                  </p>
                  {available ? (
                    <button
                      type="button"
                      onClick={() => openIbaxChat(`I want ${s.name}`)}
                      className="inline-flex items-center gap-1 rounded-full bg-flow px-3 py-1.5 text-xs font-semibold text-ink-950"
                    >
                      <Sparkles className="size-3.5" aria-hidden /> Start with {product.assistantName}
                    </button>
                  ) : waiting ? (
                    <Pill tone="green">On the waitlist</Pill>
                  ) : (
                    <Link href={`/app/services/${s.id}`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-fg-muted hover:text-fg">
                      Coming soon
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
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
