"use client";

import Link from "next/link";
import demoVideos from "../../../../../../public/demo/manifest.json";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import type { PlanPeriod } from "@/lib/app/types";
import { ArrowLeft, Check, CirclePlay, Clock, Gift, Info, Link2 } from "lucide-react";
import { annualPrice, inTrial, isLive, providerInfo, serviceById, services, TRIAL_DAYS } from "@/content/app/services";
import { joinWaitlist, onWaitlist, startTrialService } from "@/lib/app/agentActions";
import { timeLeft, trialOver, trialState } from "@/lib/app/trial";
import { audit, businessReady, logActivity, notify, nowIso, uid, updateWorkspace } from "@/lib/app/store";
import { appCurrency, money, svcPrice } from "@/lib/app/money";
import { useWorkspace } from "@/components/app/AppShell";
import { automationStatus } from "@/components/app/status";
import { Btn, BtnLink, Card, EmptyState, Field, Icon, Notice, Pill, TextArea } from "@/components/app/ui";
import { cn } from "@/lib/cn";

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ws = useWorkspace();
  const router = useRouter();
  const svc = serviceById(id);
  const [period, setPeriod] = useState<PlanPeriod>(svc?.billing === "one-time" ? "one-time" : "monthly");
  const [request, setRequest] = useState("");
  const [sent, setSent] = useState(false);

  if (!ws) return null;
  if (!svc) return <EmptyState title="Service not found" action={<BtnLink href="/app/services">Back to services</BtnLink>} />;

  const owned = ws.automations.find((a) => a.serviceId === svc.id);
  const included = svc.includes?.map((i) => serviceById(i)!).filter(Boolean) ?? [];
  const coveredBy = ws.automations.find((a) => serviceById(a.serviceId)?.includes?.includes(svc.id));
  const trial = trialState(ws);
  const cur = appCurrency(ws);
  const canTrial = !owned && !ws.sample && isLive(svc.id) && inTrial(svc.id) && trial.phase !== "over";

  function startTrial() {
    // The trial clock starts only once the business details are in (they're what the service uses).
    if (!businessReady(ws)) return router.push(`/app/setup?next=${encodeURIComponent(`/app/services/${svc!.id}`)}`);
    const id = startTrialService(svc!.id);
    if (id) router.push(`/app/automations/${id}`);
  }

  const planChooser = (label: string) => (
      <>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Choose a plan</legend>
          <div className="space-y-2">
            {(svc.billing === "one-time" ? (["one-time"] as const) : (["monthly", "annual"] as const)).map((p) => {
              const base = svcPrice(svc, ws)!;
              const amount = p === "annual" ? annualPrice(base) : base;
              return (
                <label
                  key={p}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-sm",
                    period === p ? "border-flow/60 bg-flow/10" : "border-white/10 bg-ink-900",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input type="radio" name="period" value={p} checked={period === p} onChange={() => setPeriod(p)} className="accent-[var(--color-flow)]" />
                    <span>
                      <span className="font-medium capitalize">{p === "one-time" ? "One-time payment" : p}</span>
                      {p === "annual" && <span className="ml-2 text-xs text-emerald-300">2 months free</span>}
                    </span>
                  </span>
                  <span className="font-semibold">
                    {money(amount, cur)}
                    {p !== "one-time" && <span className="text-xs font-normal text-fg-muted">/{p === "monthly" ? "mo" : "yr"}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <Btn className="w-full" size="lg" variant={canTrial ? "ghost" : "primary"} onClick={() => router.push(`/app/services/${svc.id}/checkout?period=${period}`)}>
          {label}
        </Btn>
        <p className="text-center text-xs text-fg-subtle">{svc.billing === "one-time" ? "Paid once — no monthly fee." : "Cancel anytime from Billing."}</p>
      </>
  );

  function requestCustom() {
    if (!request.trim()) return;
    updateWorkspace((w) => {
      const number = `T-${2000 + w.tickets.length + 1}`;
      w.tickets.unshift({ id: uid(), number, subject: "Custom automation request", message: request.trim(), status: "open", createdAt: nowIso() });
      logActivity(w, { kind: "automation", title: "Custom automation requested", detail: request.trim().slice(0, 80), href: "/app/help" });
      notify(w, { kind: "message", title: `Request ${number} received`, detail: "Our team will reply with a quote within 2 working days.", href: "/app/help" });
      audit(w, "Requested a custom automation");
    });
    setSent(true);
  }

  return (
    <div>
      <Link href="/app/services" className="mb-5 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> All services
      </Link>

      <div className="grid grid-cols-1 gap-6 [&>*]:min-w-0 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-flow/12 text-flow-soft">
              <Icon name={svc.icon} className="size-7" />
            </span>
            <div>
              <h1 className="display text-2xl sm:text-3xl">{svc.name}</h1>
              <p className="mt-1 text-sm text-fg-muted">{svc.short}</p>
              {svc.id in demoVideos && <Link href={`/app/demo/${svc.id}`} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-flow/15 px-3 py-1 text-xs font-semibold text-flow ring-1 ring-flow/30 hover:bg-flow/25">
                <CirclePlay className="size-3.5" aria-hidden /> Watch demo video
              </Link>}
            </div>
          </div>
          <p className="leading-relaxed text-fg-muted">{svc.description}</p>

          {svc.package && (
            <section aria-labelledby="package">
              <p className="font-mono text-[0.65rem] tracking-[0.2em] text-flow uppercase">[ What you get ]</p>
              <h2 id="package" className="display mt-1 text-xl sm:text-2xl">
                Everything in one package.
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {svc.package.map((f) => (
                  <li key={f.title} className="flex gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-flow/25 bg-flow/10 text-flow">
                      <Icon name={f.icon} className="size-5" />
                    </span>
                    <div>
                      <p className="font-semibold">{f.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-fg-muted">{f.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!svc.package && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold">What you get</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {svc.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-fg-muted">
                    <Check className="mt-0.5 size-4 shrink-0 text-flow" aria-hidden /> {f}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {included.length > 0 && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold">Includes these services</h2>
              <ul className="flex flex-wrap gap-2">
                {included.map((s) => (
                  <li key={s.id}>
                    <Pill>{s.name}</Pill>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-fg-subtle">
                Bought separately: {money(included.reduce((sum, s) => sum + (svcPrice(s, ws) ?? 0), 0), cur)}/month.
              </p>
            </Card>
          )}

          <Card>
            <h2 className="mb-3 text-sm font-semibold">Setup</h2>
            <ul className="space-y-2.5 text-sm text-fg-muted">
              <li className="flex gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden /> {svc.setupTime}
              </li>
              {svc.connect.map((p) => (
                <li key={p} className="flex gap-2">
                  <Link2 className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
                  <span>
                    Connect {providerInfo[p].name} — {providerInfo[p].help}
                  </span>
                </li>
              ))}
              {svc.approvalNote && (
                <li className="flex gap-2">
                  <Info className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden /> {svc.approvalNote}
                </li>
              )}
            </ul>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="space-y-4">
            {owned?.trialEndsAt ? (
              <>
                {trialOver(owned) ? <Pill tone="amber">Free trial ended</Pill> : <Pill tone="green">🎁 Free trial · {trial.phase === "on" ? timeLeft(trial.msLeft) : "ends soon"}</Pill>}
                <p className="text-sm text-fg-muted">
                  {trialOver(owned)
                    ? `Your free trial has ended and ${svc.name} is paused. Pay to switch it back on — your settings are kept.`
                    : `${svc.name} is free until your trial ends. Pay now to keep it running without a break.`}
                </p>
                {!trialOver(owned) && (
                  <BtnLink variant="ghost" href={`/app/automations/${owned.id}`} className="w-full">
                    {owned.status === "setup" ? "Continue setup" : "Manage"}
                  </BtnLink>
                )}
                {planChooser(`Pay & keep ${svc.name}`)}
              </>
            ) : owned ? (
              <>
                <Pill tone={automationStatus[owned.status].tone}>{automationStatus[owned.status].label}</Pill>
                <p className="text-sm text-fg-muted">You already have this service.</p>
                <BtnLink href={`/app/automations/${owned.id}`} className="w-full">
                  {owned.status === "setup" ? "Continue setup" : "Manage"}
                </BtnLink>
              </>
            ) : !isLive(svc.id) ? (
              <>
                <Pill tone="amber">Coming soon</Pill>
                <p className="text-sm text-fg-muted">
                  We&apos;re finishing {svc.name}. Join the waitlist and we&apos;ll tell you here the day it launches — no payment now.
                </p>
                <p className="text-sm">
                  <span className="text-2xl font-semibold">{money(svcPrice(svc, ws)!, cur)}</span>
                  <span className="text-fg-muted">{svc.billing === "one-time" ? " one-time" : " / month"} at launch</span>
                </p>
                {onWaitlist(ws, svc.id) ? (
                  <Notice>
                    <Check className="mr-1.5 inline size-4" aria-hidden />
                    You&apos;re on the waitlist.
                  </Notice>
                ) : (
                  <Btn className="w-full" size="lg" onClick={() => joinWaitlist(svc.id)}>
                    Join the waitlist
                  </Btn>
                )}
              </>
            ) : svc.price === null ? (
              sent ? (
                <Notice>Thanks! Your request is with our team — you&apos;ll get a quote within 2 working days. Track it in Help & Support.</Notice>
              ) : (
                <>
                  <Field label="What should be automated?" htmlFor="custom">
                    <TextArea id="custom" value={request} onChange={(e) => setRequest(e.target.value)} placeholder={svc.info[0].placeholder} />
                  </Field>
                  <Btn className="w-full" onClick={requestCustom} disabled={!request.trim()}>
                    Request a quote
                  </Btn>
                </>
              )
            ) : (
              <>
                {coveredBy && <Notice tone="blue">Already included in your {serviceById(coveredBy.serviceId)?.name} plan.</Notice>}
                {canTrial && (
                  <div className="rounded-2xl border border-flow/40 bg-[linear-gradient(135deg,rgb(37_211_102/0.22),rgb(37_211_102/0.04))] p-4">
                    <p className="flex items-center gap-2 font-semibold">
                      <Gift className="size-4 text-flow" aria-hidden /> {TRIAL_DAYS}-day FREE trial
                    </p>
                    <p className="mt-1 text-sm text-fg-muted">
                      Try {svc.name} free for {TRIAL_DAYS} days{trial.phase === "on" ? ` (${timeLeft(trial.msLeft)} on your trial)` : ""}. No payment now — pay only if you want to keep it.
                    </p>
                    <Btn className="mt-3 w-full" size="lg" onClick={startTrial}>
                      Start free trial
                    </Btn>
                  </div>
                )}
                {planChooser(canTrial ? `Or buy ${svc.name} now` : `Buy ${svc.name}`)}
              </>
            )}
          </Card>
          {svc.group !== "premium" && svc.price !== null && (
            <p className="mt-3 text-center text-xs text-fg-muted">
              Want everything?{" "}
              <Link href={`/app/services/${services.find((s) => s.group === "premium")!.id}`} className="font-semibold text-flow-soft underline-offset-2 hover:underline">
                See Digital Marketing
              </Link>
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
