"use client";

import { product } from "@/config/product";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { ArrowRight, Check, Globe, Sparkles, X } from "lucide-react";
import { serviceById, TRIAL_DAYS } from "@/content/app/services";
import { suggestions } from "@/lib/app/assistant";
import { useWorkspace } from "@/components/app/AppShell";
import { AddBusinessCard } from "@/components/app/AddBusinessCard";
import { AppLockTip } from "@/components/app/AppLockTip";
import { businessReady } from "@/lib/app/store";
import { AskBar } from "@/components/app/AskBar";
import { RenewalBanner } from "@/components/app/RenewalBanner";
import { KindIcon } from "@/components/app/kinds";
import { automationStatus } from "@/components/app/status";
import { CountUp, DetailRow, DetailSheet, OfferCarousel, OwnerAvatar, type Offer } from "@/components/app/dashboard";
import { appCurrency, money, svcPrice } from "@/lib/app/money";
import { BtnLink, Card, EmptyState, Icon, Notice, Pill, SectionTitle, fmtDateTime, fmtTime } from "@/components/app/ui";
import type { Call, Conversation, Lead, Review, Workspace } from "@/lib/app/types";
import { cn } from "@/lib/cn";

const isToday = (iso?: string) => !!iso && new Date(iso).toDateString() === new Date().toDateString();
const stars = (n: number) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));
const lastText = (c: Conversation) => c.messages[c.messages.length - 1]?.text ?? "";

type MetricKey = "calls" | "messages" | "leads" | "followups" | "reviews" | "emails";
type Metric = {
  key: MetricKey;
  emoji: string;
  label: string;
  value: number;
  tone: string;
  title: string;
  href: string;
  hrefLabel: string;
};

const callOutcome: Record<Call["outcome"], string> = {
  answered: "Answered by IBAX",
  appointment: "Booked an appointment",
  lead: "Became a lead",
  transferred: "Sent to you",
  missed: "Missed",
};
const leadState = (l: Lead) =>
  l.auto
    ? `IBAX sent ${l.auto.sent} follow-up${l.auto.sent === 1 ? "" : "s"} · ${{ waiting: "waiting for reply", replied: "replied ✓", done: "done", stopped: "stopped", failed: "couldn't send" }[l.auto.state]}`
    : l.followUpAt
      ? `Follow up ${fmtDateTime(l.followUpAt)}`
      : "Follow-up due";

/** Today's items behind each number; when there are none today, the latest ones are shown as "Earlier". */
function details(ws: Workspace, key: MetricKey) {
  const byNew = <T,>(list: T[], at: (x: T) => string | undefined) => [...list].sort((a, b) => (at(b) ?? "").localeCompare(at(a) ?? ""));
  const split = <T,>(list: T[], at: (x: T) => string | undefined) => {
    const sorted = byNew(list, at);
    const today = sorted.filter((x) => isToday(at(x)));
    return { today, earlier: today.length ? [] : sorted.slice(0, 5) };
  };
  const call = (c: Call) => (
    <DetailRow
      key={c.id}
      href="/app/calls"
      icon="📞"
      title={c.caller || c.number}
      meta={`${c.number} · ${fmtTime(c.at)}${c.durationSec ? ` · ${Math.max(1, Math.round(c.durationSec / 60))} min` : ""}`}
      body={c.summary}
      right={<span className={cn("shrink-0 text-[0.7rem] font-bold", c.outcome === "missed" ? "text-red-300" : "text-emerald-300")}>{callOutcome[c.outcome]}</span>}
    />
  );
  const chat = (c: Conversation) => (
    <DetailRow
      key={c.id}
      href="/app/inbox"
      icon={c.channel === "email" ? "✉️" : c.channel === "whatsapp" ? "💬" : c.channel === "instagram" ? "📸" : "👍"}
      title={c.contact}
      meta={`${c.channel === "whatsapp" ? "WhatsApp" : c.channel[0]!.toUpperCase() + c.channel.slice(1)} · ${fmtTime(c.at)} · ${c.messages.length} message${c.messages.length === 1 ? "" : "s"}`}
      body={lastText(c)}
      right={c.important ? <span className="shrink-0 text-[0.7rem] font-bold text-amber-300">Important</span> : undefined}
    />
  );
  const lead = (l: Lead, follow = false) => (
    <DetailRow
      key={l.id}
      href="/app/leads"
      icon={follow ? "🔁" : "🎯"}
      title={l.name}
      meta={`${l.phone || l.email}${l.source ? ` · from ${l.source}` : ""}`}
      body={follow ? leadState(l) : l.interest || l.notes}
      right={<span className="shrink-0 text-[0.7rem] text-fg-subtle">{fmtTime(l.createdAt)}</span>}
    />
  );
  const review = (r: Review) => (
    <DetailRow
      key={r.id}
      href="/app/reviews"
      icon="⭐"
      title={r.author}
      meta={`${stars(r.rating)} · ${fmtDateTime(r.at)}`}
      body={r.text}
      right={<span className={cn("shrink-0 text-[0.7rem] font-bold", r.reply ? "text-emerald-300" : "text-amber-300")}>{r.reply ? "Replied ✓" : "Reply due"}</span>}
    />
  );
  switch (key) {
    case "calls":
      return { ...split(ws.calls, (c) => c.at), row: call };
    case "messages":
      return {
        ...split(
          ws.conversations.filter((c) => c.channel !== "email"),
          (c) => c.at,
        ),
        row: chat,
      };
    case "emails":
      return {
        ...split(
          ws.conversations.filter((c) => c.channel === "email"),
          (c) => c.at,
        ),
        row: chat,
      };
    case "leads":
      return {
        ...split(ws.leads, (l) => l.createdAt),
        row: (l: Lead) => lead(l),
      };
    case "followups": {
      const due = byNew(
        ws.leads.filter((l) => l.status === "follow_up" || l.auto?.state === "waiting"),
        (l) => l.followUpAt ?? l.createdAt,
      );
      return { today: due, earlier: [], row: (l: Lead) => lead(l, true) };
    }
    case "reviews":
      return { ...split(ws.reviews, (r) => r.at), row: review };
  }
}

function MetricSheet({ ws, metric, onClose }: { ws: Workspace; metric: Metric; onClose: () => void }) {
  const d = details(ws, metric.key) as {
    today: unknown[];
    earlier: unknown[];
    row: (x: never) => ReactNode;
  };
  return (
    <DetailSheet
      title={metric.title}
      subtitle={d.today.length ? `${d.today.length} ${metric.key === "followups" ? "waiting" : "today"} · tap one to open it` : "Nothing today yet"}
      href={metric.href}
      hrefLabel={metric.hrefLabel}
      onClose={onClose}
    >
      {d.today.length > 0 && <div>{d.today.map((x) => d.row(x as never))}</div>}
      {d.today.length === 0 && (
        <div className="px-2 pb-2">
          <p className="rounded-2xl bg-white/[0.04] p-4 text-center text-sm text-fg-muted">
            {metric.emoji} No {metric.label.toLowerCase()} today yet — they appear here the moment they happen.
          </p>
          {d.earlier.length > 0 && <p className="mt-4 mb-1 px-1 text-xs font-semibold tracking-wide text-fg-subtle uppercase">Earlier</p>}
        </div>
      )}
      {d.earlier.length > 0 && <div>{d.earlier.map((x) => d.row(x as never))}</div>}
    </DetailSheet>
  );
}

function Dashboard() {
  const ws = useWorkspace();
  const params = useSearchParams();
  const [open, setOpen] = useState<MetricKey | null>(null);
  if (!ws?.business || !ws.assistant) return null;

  const name = product.assistantName;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const owner = ws.business.ownerName.trim();
  const first = owner.split(" ")[0] || "there";
  const cur = appCurrency(ws);

  const todayActivity = ws.activity.filter((e) => isToday(e.at));
  const today = <T,>(list: T[], at: (x: T) => string | undefined) => list.filter((x) => isToday(at(x)));
  const callsToday = today(ws.calls, (c) => c.at);
  const missedToday = callsToday.filter((c) => c.outcome === "missed");
  const chatsToday = today(ws.conversations, (c) => c.at);
  const followUps = ws.leads.filter((l) => l.status === "follow_up" || l.auto?.state === "waiting");
  const approvals = ws.content.filter((c) => c.status === "approval");
  const attention = ws.automations.filter((a) => ["attention", "failed"].includes(a.status));
  const unreplied = ws.reviews.filter((r) => !r.reply);
  const setupPending = ws.automations.filter((a) => a.status === "setup");
  const live = ws.automations.filter((a) => a.status !== "setup");
  const rating = ws.reviews.length ? ws.reviews.reduce((t, r) => t + r.rating, 0) / ws.reviews.length : 0;
  const fresh = ws.automations.length === 0;

  const metrics: Metric[] = [
    {
      key: "calls",
      emoji: "📞",
      label: "Calls",
      value: callsToday.length,
      tone: "blue",
      title: "Today's calls",
      href: "/app/calls",
      hrefLabel: "All calls",
    },
    {
      key: "messages",
      emoji: "💬",
      label: "Messages",
      value: chatsToday.filter((c) => c.channel !== "email").length,
      tone: "green",
      title: "Today's messages",
      href: "/app/inbox",
      hrefLabel: "Open inbox",
    },
    {
      key: "leads",
      emoji: "🎯",
      label: "New leads",
      value: today(ws.leads, (l) => l.createdAt).length,
      tone: "violet",
      title: "Today's new leads",
      href: "/app/leads",
      hrefLabel: "All leads",
    },
    {
      key: "followups",
      emoji: "🔁",
      label: "Follow-ups",
      value: followUps.length,
      tone: "amber",
      title: "Follow-ups",
      href: "/app/leads",
      hrefLabel: "All leads",
    },
    {
      key: "reviews",
      emoji: "⭐",
      label: "Reviews",
      value: today(ws.reviews, (r) => r.at).length,
      tone: "gold",
      title: "Today's reviews",
      href: "/app/reviews",
      hrefLabel: "All reviews",
    },
    {
      key: "emails",
      emoji: "✉️",
      label: "Emails",
      value: chatsToday.filter((c) => c.channel === "email").length,
      tone: "sky",
      title: "Today's emails",
      href: "/app/inbox",
      hrefLabel: "Open inbox",
    },
  ];
  const metric = metrics.find((m) => m.key === open);

  const pack = serviceById("social-pack");
  const dm = serviceById("digital-marketing");
  const offers: Offer[] = [
    pack && {
      tag: "👑 PREMIUM",
      title: pack.name,
      body: "Instagram + Facebook + YouTube posts, made by IBAX",
      price: `${money(svcPrice(pack, ws)!, cur)}/mo`,
      cta: `${TRIAL_DAYS} days free`,
      href: "/app/ibax",
      tone: "violet" as const,
    },
    dm && {
      tag: "🚀 PREMIUM",
      title: dm.name,
      body: "Ads, content and a monthly report — done for you",
      price: `${money(svcPrice(dm, ws)!, cur)}/mo`,
      cta: "See the package",
      href: "/app/ibax",
      tone: "gold" as const,
    },
    {
      tag: "🎁 FREE",
      title: `${TRIAL_DAYS}-day free trial`,
      body: "Try any live service free — pay only if you love it",
      cta: "Start free",
      href: "/app/services",
      tone: "green" as const,
    },
  ].filter(Boolean) as Offer[];

  // Things that didn't happen yet and need the owner.
  const needs: {
    key: string;
    emoji: string;
    text: string;
    action: string;
    href?: string;
    onClick?: () => void;
  }[] = [
    ...(missedToday.length
      ? [
          {
            key: "missed",
            emoji: "📞",
            text: `${missedToday.length} missed call${missedToday.length > 1 ? "s" : ""} — call back`,
            action: "See",
            onClick: () => setOpen("calls"),
          },
        ]
      : []),
    ...(followUps.length
      ? [
          {
            key: "follow",
            emoji: "🎯",
            text: `${followUps.length} lead${followUps.length > 1 ? "s" : ""} waiting for follow-up`,
            action: "See",
            onClick: () => setOpen("followups"),
          },
        ]
      : []),
    ...(unreplied.length
      ? [
          {
            key: "reviews",
            emoji: "⭐",
            text: `${unreplied.length} review${unreplied.length > 1 ? "s" : ""} — reply drafted`,
            action: "Reply",
            href: "/app/reviews",
          },
        ]
      : []),
    ...(approvals.length
      ? [
          {
            key: "approve",
            emoji: "📝",
            text: `${approvals.length} post${approvals.length > 1 ? "s" : ""} waiting for your OK`,
            action: "Check",
            href: "/app/content",
          },
        ]
      : []),
    ...setupPending.map((a) => ({
      key: a.id,
      emoji: "⚙️",
      text: `Finish setting up ${serviceById(a.serviceId)?.name}`,
      action: "Finish",
      href: `/app/automations/${a.id}`,
    })),
    ...attention.map((a) => ({
      key: a.id,
      emoji: "⚠️",
      text: `${serviceById(a.serviceId)?.name}: ${a.note ?? "needs attention"}`,
      action: "Fix",
      href: "/app/automations",
    })),
  ];

  const rise = (n: number) => ({
    className: "dash-in",
    style: { animationDelay: `${0.06 * n}s` },
  });

  return (
    <div className="space-y-7">
      {!ws.sample && !businessReady(ws) && <AddBusinessCard />}
      {!ws.sample && <RenewalBanner ws={ws} className="mb-4" />}
      {!ws.sample && <AppLockTip />}

      {/* The owner's card */}
      <section {...rise(1)}>
        <div className="dash-hero relative overflow-hidden rounded-[1.75rem] p-5 sm:p-7">
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-flow/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <p className="pt-1 text-[0.7rem] font-bold tracking-[0.14em] opacity-80">
                {new Date()
                  .toLocaleDateString([], {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })
                  .toUpperCase()}
              </p>
              <span className="dash-owner-pill inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-bold tracking-[0.12em]">♛ OWNER</span>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <OwnerAvatar name={owner || ws.business.name} logo={ws.business.logo} />
              <div className="min-w-0">
                <p className="truncate text-sm opacity-85">
                  {greeting}, {first} 👋
                </p>
                <h1 className="text-[1.65rem] leading-tight font-extrabold tracking-tight sm:text-4xl">
                  {ws.business.name || product.name} <span className="dash-gold">Dashboard</span>
                </h1>
              </div>
            </div>
            <p className="mt-4 text-sm opacity-90">
              Today {name} did{" "}
              <b className="font-extrabold">
                <CountUp value={todayActivity.length} /> task
                {todayActivity.length === 1 ? "" : "s"}
              </b>{" "}
              for you
              {needs.length ? ` · ${needs.length} need${needs.length === 1 ? "s" : ""} you` : " · nothing pending 🎉"}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                [rating ? `${rating.toFixed(1)}★` : "—", "rating"],
                [String(ws.leads.length), "total leads"],
                [String(live.length), `service${live.length === 1 ? "" : "s"} live`],
              ].map(([v, l]) => (
                <div key={l} className="dash-stat rounded-2xl px-3 py-2.5">
                  <p className="text-xl font-extrabold tracking-tight tabular-nums">{v}</p>
                  <p className="text-[0.68rem] opacity-80">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Offers */}
      <section {...rise(2)} aria-labelledby="offers">
        <SectionTitle>
          <span id="offers">Offers for you</span>
        </SectionTitle>
        <OfferCarousel offers={offers} />
      </section>

      {params.get("welcome") && !ws.sample && (
        <Notice className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="flex-1">
            <p className="font-semibold text-fg">
              {name} is ready for {ws.business.name || "you"}.
            </p>
            <p className="mt-0.5 text-fg-muted">
              {params.get("welcome") === "website"
                ? "You told us you don't have a website yet — build one in minutes, then pick the services you want."
                : "Pick your first service — WhatsApp, calls, social media or reviews — and I'll set it up with you."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {params.get("welcome") === "website" && (
                <BtnLink href="/app/website" size="sm">
                  <Globe className="size-4" aria-hidden /> Build My Website
                </BtnLink>
              )}
              <BtnLink href="/app/services" size="sm" variant={params.get("welcome") === "website" ? "ghost" : "primary"}>
                Choose a service
              </BtnLink>
            </div>
          </div>
          <Link href="/app/home" aria-label="Dismiss" className="text-fg-muted hover:text-fg">
            <X className="size-4" aria-hidden />
          </Link>
        </Notice>
      )}

      {fresh && (
        <Card>
          <SectionTitle>Get started</SectionTitle>
          <ol className="space-y-2">
            {[
              {
                done: true,
                label: "Create your account and business profile",
                href: "/app/settings",
              },
              {
                done: true,
                label: `Set up ${name}, your AI assistant`,
                href: "/app/settings#assistant",
              },
              {
                done: !!ws.website,
                label: ws.business.websiteUrl ? "Website connected" : "Build your website",
                href: "/app/website",
              },
              {
                done: false,
                label: "Choose your first service",
                href: "/app/services",
              },
              {
                done: Object.keys(ws.connections).length > 1,
                label: "Connect your accounts",
                href: "/app/settings#accounts",
              },
            ].map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-white/[0.04]">
                  <span className={`grid size-6 place-items-center rounded-full ${s.done ? "bg-emerald-400/20 text-emerald-300" : "border border-white/15"}`}>
                    {s.done && <Check className="size-3.5" aria-hidden />}
                  </span>
                  <span className={s.done ? "text-fg-muted line-through" : ""}>{s.label}</span>
                  {!s.done && <ArrowRight className="ml-auto size-4 text-fg-subtle" aria-hidden />}
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* What didn't happen yet */}
      <section {...rise(3)} aria-labelledby="needs">
        <SectionTitle>
          <span id="needs">{needs.length ? "🚨 Needs your attention" : "✅ All caught up"}</span>
        </SectionTitle>
        {needs.length ? (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {needs.map((n) => {
              const inner = (
                <>
                  <span className="text-lg" aria-hidden>
                    {n.emoji}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold">{n.text}</span>
                  <span className="shrink-0 rounded-xl bg-flow px-3 py-1.5 text-xs font-bold text-ink-950">{n.action}</span>
                </>
              );
              return n.href ? (
                <Link key={n.key} href={n.href} className="dash-alert flex items-center gap-3 rounded-2xl p-3">
                  {inner}
                </Link>
              ) : (
                <button key={n.key} type="button" onClick={n.onClick} className="dash-alert flex items-center gap-3 rounded-2xl p-3 text-left">
                  {inner}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="glass rounded-2xl p-4 text-sm text-fg-muted">Nothing is waiting for you right now — {name} is handling everything. 🎉</p>
        )}
      </section>

      {/* Today's numbers — each opens the details */}
      <section {...rise(4)} aria-labelledby="today">
        <SectionTitle>
          <span id="today">Today&apos;s numbers</span>
        </SectionTitle>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {metrics.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setOpen(m.key)}
              className={cn("dash-tile group rounded-2xl p-3 text-left transition-transform active:scale-[0.97]", `dash-tile-${m.tone}`)}
              aria-label={`${m.label}: ${m.value}. Show details`}
            >
              <span className="flex items-center justify-between text-base">
                <span aria-hidden>{m.emoji}</span>
                <ArrowRight className="size-3.5 opacity-40 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
              <CountUp value={m.value} className="mt-1.5 block text-2xl font-extrabold tracking-tight" />
              <span className="block truncate text-[0.7rem] font-semibold text-fg-muted">{m.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-[0.7rem] text-fg-subtle">Tap a number to see who called, wrote or reviewed</p>
      </section>

      <div className="mx-auto max-w-3xl">
        <AskBar name={name} examples={suggestions.slice(0, 6)} />
      </div>

      <div className="grid grid-cols-1 gap-7 [&>*]:min-w-0 lg:grid-cols-[1.4fr_1fr]">
        {/* What IBAX did today */}
        <section {...rise(5)} aria-labelledby="activity">
          <SectionTitle
            action={
              <Link href="/app/activity" className="text-xs font-semibold text-flow-soft hover:text-flow">
                See all
              </Link>
            }
          >
            <span id="activity">✅ {name} did today</span>
          </SectionTitle>
          {todayActivity.length ? (
            <Card className="p-2">
              <ul className="relative before:absolute before:top-6 before:bottom-6 before:left-[1.69rem] before:w-px before:bg-gradient-to-b before:from-flow/40 before:to-transparent">
                {todayActivity.slice(0, 6).map((e) => (
                  <li key={e.id} className="relative">
                    <Link href={e.href ?? "/app/activity"} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/[0.04]">
                      <KindIcon kind={e.kind} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{e.title}</p>
                        {e.detail && <p className="truncate text-xs text-fg-subtle">{e.detail}</p>}
                      </div>
                      <span className="shrink-0 text-xs text-fg-subtle">{fmtTime(e.at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : (
            <EmptyState title="Nothing yet today">Calls, messages, leads, uploads and reviews appear here as they happen.</EmptyState>
          )}
        </section>

        {/* Services */}
        <section {...rise(6)} aria-labelledby="services">
          <SectionTitle
            action={
              <Link href="/app/services" className="text-xs font-semibold text-flow-soft hover:text-flow">
                + Add
              </Link>
            }
          >
            <span id="services">Services</span>
          </SectionTitle>
          {live.length ? (
            <div className="grid grid-cols-2 gap-2.5">
              {live.map((a) => {
                const svc = serviceById(a.serviceId)!;
                const st = automationStatus[a.status];
                return (
                  <Link key={a.id} href={`/app/automations/${a.id}`} className="glass flex items-center gap-2.5 rounded-2xl p-3 hover:border-white/20">
                    <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-flow/12 text-flow-soft ring-1 ring-flow/20">
                      <Icon name={svc.icon} className="size-4" />
                      {a.status === "active" && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-ink-900 bg-flow shadow-[0_0_8px_rgb(37_211_102/0.9)]" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{svc.name}</p>
                      <Pill tone={st.tone} className="mt-0.5">
                        {st.label}
                      </Pill>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No active services yet"
              action={
                <BtnLink href="/app/services" size="sm">
                  Browse services
                </BtnLink>
              }
            >
              Start with one service — you can add more any time.
            </EmptyState>
          )}
        </section>
      </div>

      {metric && <MetricSheet ws={ws} metric={metric} onClose={() => setOpen(null)} />}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
