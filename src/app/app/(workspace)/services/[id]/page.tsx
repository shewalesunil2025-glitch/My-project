"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import type { PlanPeriod } from "@/lib/app/types";
import { ArrowLeft, Check, Clock, Info, Link2 } from "lucide-react";
import { formatPrice } from "@/config/product";
import { annualPrice, providerInfo, serviceById, services } from "@/content/app/services";
import { audit, logActivity, notify, nowIso, uid, updateWorkspace } from "@/lib/app/store";
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
            </div>
          </div>
          <p className="leading-relaxed text-fg-muted">{svc.description}</p>

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
                Bought separately: {formatPrice(included.reduce((sum, s) => sum + (s.price ?? 0), 0))}/month.
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
            {owned ? (
              <>
                <Pill tone={automationStatus[owned.status].tone}>{automationStatus[owned.status].label}</Pill>
                <p className="text-sm text-fg-muted">You already have this service.</p>
                <BtnLink href={`/app/automations/${owned.id}`} className="w-full">
                  {owned.status === "setup" ? "Continue setup" : "Manage"}
                </BtnLink>
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
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold">Choose a plan</legend>
                  <div className="space-y-2">
                    {(svc.billing === "one-time" ? (["one-time"] as const) : (["monthly", "annual"] as const)).map((p) => {
                      const amount = p === "annual" ? annualPrice(svc.price!) : svc.price!;
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
                            {formatPrice(amount)}
                            {p !== "one-time" && <span className="text-xs font-normal text-fg-muted">/{p === "monthly" ? "mo" : "yr"}</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <Btn className="w-full" size="lg" onClick={() => router.push(`/app/services/${svc.id}/checkout?period=${period}`)}>
                  Buy {svc.name}
                </Btn>
                <p className="text-center text-xs text-fg-subtle">{svc.billing === "one-time" ? "Paid once — no monthly fee." : "Cancel anytime from Billing."}</p>
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
