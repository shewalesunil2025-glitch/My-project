"use client";

import { product } from "@/config/product";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, Check, Globe, Sparkles, X } from "lucide-react";
import { serviceById } from "@/content/app/services";
import { suggestions } from "@/lib/app/assistant";
import { useWorkspace } from "@/components/app/AppShell";
import { AskBar } from "@/components/app/AskBar";
import { KindIcon } from "@/components/app/kinds";
import { automationStatus } from "@/components/app/status";
import { BtnLink, Card, EmptyState, Icon, Notice, Pill, SectionTitle, Stat, fmtTime } from "@/components/app/ui";

const isToday = (iso?: string) => !!iso && new Date(iso).toDateString() === new Date().toDateString();

function Dashboard() {
  const ws = useWorkspace();
  const params = useSearchParams();
  if (!ws?.business || !ws.assistant) return null;

  const name = product.name;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = ws.business.ownerName.split(" ")[0] || "there";

  const todayActivity = ws.activity.filter((e) => isToday(e.at));
  const leadsToday = ws.leads.filter((l) => isToday(l.createdAt)).length;
  const msgsToday = ws.conversations.filter((c) => isToday(c.at)).length;
  const callsToday = ws.calls.filter((c) => isToday(c.at)).length;
  const reviewsToday = ws.reviews.filter((r) => isToday(r.at)).length;
  const socialToday = todayActivity.filter((e) => ["instagram", "facebook", "youtube"].includes(e.kind)).length;
  const scheduled = ws.content.filter((c) => c.status === "scheduled").length;

  const followUps = ws.leads.filter((l) => l.status === "follow_up");
  const approvals = ws.content.filter((c) => c.status === "approval");
  const attention = ws.automations.filter((a) => ["attention", "failed"].includes(a.status));
  const unreplied = ws.reviews.filter((r) => !r.reply);
  const setupPending = ws.automations.filter((a) => a.status === "setup");
  const live = ws.automations.filter((a) => a.status !== "setup");

  const youtubeToday = ws.content.find((c) => c.platform === "youtube" && (isToday(c.scheduledAt) || isToday(c.publishedAt)));

  const fresh = ws.automations.length === 0;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm text-fg-muted">
          {greeting}, {first} 👋
        </p>
        <h1 className="display mt-1 text-2xl sm:text-3xl">{ws.business.name}</h1>
        <div className="mt-5">
          <AskBar name={name} examples={suggestions.slice(0, 6)} />
        </div>
      </section>

      {params.get("welcome") && !ws.sample && (
        <Notice className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="flex-1">
            <p className="font-semibold text-fg">{name} is ready for {ws.business.name}.</p>
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
              { done: true, label: "Create your account and business profile", href: "/app/settings" },
              { done: true, label: `Set up ${name}, your AI assistant`, href: "/app/settings#assistant" },
              { done: !!ws.website, label: ws.business.websiteUrl ? "Website connected" : "Build your website", href: "/app/website" },
              { done: false, label: "Choose your first service", href: "/app/services" },
              { done: Object.keys(ws.connections).length > 1, label: "Connect your accounts", href: "/app/settings#accounts" },
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

      <section aria-labelledby="today">
        <SectionTitle>
          <span id="today">Today</span>
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Leads" value={leadsToday} hint={`${ws.leads.length} total`} href="/app/leads" />
          <Stat label="Messages" value={msgsToday} hint="WhatsApp · DMs · email" href="/app/inbox" />
          <Stat label="Calls" value={callsToday} hint="Answered by AI" href="/app/calls" />
          <Stat label="Reviews" value={reviewsToday} hint={`${unreplied.length} to reply`} href="/app/reviews" />
          <Stat label="Social activity" value={socialToday} hint="Posts & uploads" href="/app/content" />
          <Stat label="Scheduled content" value={scheduled} hint={`${approvals.length} to approve`} href="/app/content" />
        </div>
      </section>

      {(followUps.length > 0 || approvals.length > 0 || attention.length > 0 || unreplied.length > 0 || setupPending.length > 0) && (
        <section aria-labelledby="needs">
          <SectionTitle>
            <span id="needs">Needs you</span>
          </SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {setupPending.map((a) => (
              <Link key={a.id} href={`/app/automations/${a.id}`} className="glass flex items-center gap-3 rounded-2xl p-4 hover:border-white/20">
                <KindIcon kind="automation" />
                <span className="text-sm">Finish setting up {serviceById(a.serviceId)?.name}</span>
                <ArrowRight className="ml-auto size-4 text-fg-subtle" aria-hidden />
              </Link>
            ))}
            {followUps.length > 0 && (
              <Link href="/app/leads" className="glass flex items-center gap-3 rounded-2xl p-4 hover:border-white/20">
                <KindIcon kind="lead" />
                <span className="text-sm">
                  {followUps.length} lead{followUps.length > 1 ? "s" : ""} need follow-up today
                </span>
                <ArrowRight className="ml-auto size-4 text-fg-subtle" aria-hidden />
              </Link>
            )}
            {approvals.length > 0 && (
              <Link href="/app/content" className="glass flex items-center gap-3 rounded-2xl p-4 hover:border-white/20">
                <KindIcon kind="instagram" />
                <span className="text-sm">
                  {approvals.length} post{approvals.length > 1 ? "s" : ""} waiting for your approval
                </span>
                <ArrowRight className="ml-auto size-4 text-fg-subtle" aria-hidden />
              </Link>
            )}
            {unreplied.length > 0 && (
              <Link href="/app/reviews" className="glass flex items-center gap-3 rounded-2xl p-4 hover:border-white/20">
                <KindIcon kind="review" />
                <span className="text-sm">
                  {unreplied.length} review{unreplied.length > 1 ? "s" : ""} — replies drafted
                </span>
                <ArrowRight className="ml-auto size-4 text-fg-subtle" aria-hidden />
              </Link>
            )}
            {attention.map((a) => (
              <Link key={a.id} href="/app/automations" className="glass flex items-center gap-3 rounded-2xl border-amber-400/25 p-4 hover:border-amber-400/40">
                <KindIcon kind="automation" />
                <span className="text-sm">
                  {serviceById(a.serviceId)?.name}: {a.note ?? "needs attention"}
                </span>
                <ArrowRight className="ml-auto size-4 shrink-0 text-fg-subtle" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 [&>*]:min-w-0 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="activity">
          <SectionTitle
            action={
              <Link href="/app/activity" className="text-xs font-semibold text-flow-soft hover:text-flow">
                See all
              </Link>
            }
          >
            <span id="activity">Today&apos;s activity</span>
          </SectionTitle>
          {todayActivity.length ? (
            <Card className="p-2">
              <ul>
                {todayActivity.slice(0, 6).map((e) => (
                  <li key={e.id}>
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

        <div className="space-y-6">
          {youtubeToday && (
            <section aria-labelledby="yt">
              <SectionTitle>
                <span id="yt">Today&apos;s YouTube video</span>
              </SectionTitle>
              <Link href="/app/content" className="glass block rounded-2xl p-4 hover:border-white/20">
                <div className="grid aspect-video place-items-center rounded-xl bg-[linear-gradient(135deg,#2a1208,#0a0a0b)]">
                  <Icon name="Youtube" className="size-8 text-red-300" />
                </div>
                <p className="mt-3 text-sm font-semibold">{youtubeToday.title}</p>
                <p className="mt-0.5 text-xs text-fg-muted">
                  {youtubeToday.status === "published" ? "Published today" : `Scheduled for ${fmtTime(youtubeToday.scheduledAt!)}`}
                </p>
              </Link>
            </section>
          )}

          <section aria-labelledby="services">
            <SectionTitle
              action={
                <Link href="/app/automations" className="text-xs font-semibold text-flow-soft hover:text-flow">
                  Manage
                </Link>
              }
            >
              <span id="services">Active services</span>
            </SectionTitle>
            {live.length ? (
              <Card className="p-2">
                <ul>
                  {live.map((a) => {
                    const svc = serviceById(a.serviceId)!;
                    const st = automationStatus[a.status];
                    return (
                      <li key={a.id} className="flex items-center gap-3 rounded-xl p-2.5">
                        <span className="grid size-9 place-items-center rounded-xl bg-flow/12 text-flow-soft">
                          <Icon name={svc.icon} className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm">{svc.name}</span>
                        <Pill tone={st.tone}>{st.label}</Pill>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ) : (
              <EmptyState title="No active services yet" action={<BtnLink href="/app/services" size="sm">Browse services</BtnLink>}>
                Start with one service — you can add more any time.
              </EmptyState>
            )}
          </section>

          {ws.metrics.length > 0 && (
            <section aria-labelledby="week">
              <SectionTitle
                action={
                  <Link href="/app/analytics" className="text-xs font-semibold text-flow-soft hover:text-flow">
                    Analytics
                  </Link>
                }
              >
                <span id="week">Leads, last 14 days</span>
              </SectionTitle>
              <Card>
                <div className="flex h-24 items-end gap-1" role="img" aria-label={`Leads per day: ${ws.metrics.slice(-14).map((m) => m.leads).join(", ")}`}>
                  {(() => {
                    const last = ws.metrics.slice(-14);
                    const max = Math.max(...last.map((m) => m.leads), 1);
                    return last.map((m, i) => (
                      <div key={m.date} className={`flex-1 rounded-t-[3px] ${i === last.length - 1 ? "bg-flow" : "bg-flow/40"}`} style={{ height: `${(m.leads / max) * 100}%` }} title={`${m.date}: ${m.leads}`} />
                    ));
                  })()}
                </div>
              </Card>
            </section>
          )}
        </div>
      </div>
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
