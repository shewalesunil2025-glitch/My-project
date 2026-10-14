"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, X } from "lucide-react";
import { product } from "@/config/product";
import { annualPrice, priceIn, serviceById } from "@/content/app/services";
import { paymentsAreLive } from "@/lib/app/payment";
import { audit, logActivity, nowIso, updateWorkspace } from "@/lib/app/store";
import type { Invoice } from "@/lib/app/types";
import { appCurrency, money, svcPrice } from "@/lib/app/money";
import { renewHref, wasPaid } from "@/lib/app/renewal";
import { useWorkspace } from "@/components/app/AppShell";
import { Btn, BtnLink, Card, EmptyState, Notice, PageHeader, Pill, SectionTitle, Stat, fmtDate } from "@/components/app/ui";

export default function BillingPage() {
  const ws = useWorkspace();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  if (!ws?.business) return null;

  const active = ws.subscriptions.filter((s) => s.status === "active");
  const recurring = active.filter((s) => s.period !== "one-time");
  const cur = appCurrency(ws);
  const monthly = recurring.filter((x) => (x.currency ?? "INR") === cur).reduce((s, x) => s + (x.period === "monthly" ? x.price : x.price / 12), 0);
  const nextRenewal = [...recurring].sort((a, b) => a.renewsAt.localeCompare(b.renewsAt))[0];
  const dm = active.find((s) => s.serviceId === "digital-marketing");
  const covered = active.filter((s) => serviceById("digital-marketing")!.includes!.includes(s.serviceId));

  function switchPeriod(id: string) {
    updateWorkspace((w) => {
      const s = w.subscriptions.find((x) => x.id === id);
      const svc = s && serviceById(s.serviceId);
      const base = svc && priceIn(svc, s?.currency ?? "INR");
      if (!s || !svc || !base) return;
      s.period = s.period === "monthly" ? "annual" : "monthly";
      s.price = s.period === "annual" ? annualPrice(base) : base;
      audit(w, `${svc.name}: switched to ${s.period} billing from next renewal`);
    });
  }

  function cancel(id: string) {
    updateWorkspace((w) => {
      const s = w.subscriptions.find((x) => x.id === id);
      if (!s) return;
      s.status = "cancelled";
      const a = w.automations.find((x) => x.subscriptionId === id);
      const name = serviceById(s.serviceId)?.name;
      if (a) {
        a.status = "paused";
        a.note = `Subscription cancelled — runs until ${fmtDate(s.renewsAt)}, then stops.`;
        a.logs.unshift({ at: nowIso(), level: "warning", message: "Subscription cancelled" });
      }
      logActivity(w, { kind: "payment", title: `${name} subscription cancelled`, href: "/app/billing" });
      audit(w, `Cancelled ${name}`);
    });
    setConfirmCancel(null);
  }

  return (
    <div>
      <PageHeader eyebrow="Billing & Subscriptions" title="Billing" subtitle="Your services, renewals and invoices." />
      {product.previewMode && !paymentsAreLive() && <Notice tone="amber" className="mb-6">Preview mode — invoices are test invoices; no money has been charged.</Notice>}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Active services" value={active.length} />
        <Stat label="Monthly total" value={money(monthly, cur)} hint="Recurring plans; annual spread per month" />
        <Stat label="Next renewal" value={nextRenewal ? fmtDate(nextRenewal.renewsAt) : "—"} hint={nextRenewal && serviceById(nextRenewal.serviceId)?.name} />
      </div>

      {!dm && covered.length >= 2 && (
        <Notice className="mb-6">
          {covered.map((s) => serviceById(s.serviceId)?.name).join(", ")} {covered.length === 1 ? "is" : "are"} included in{" "}
          <Link href="/app/services/digital-marketing" className="font-semibold underline">
            Digital Marketing
          </Link>{" "}
          — together with ads, SEO, content and a monthly report — for {money(svcPrice(serviceById("digital-marketing")!, ws)!, cur)}/month.
        </Notice>
      )}

      <section className="mb-8">
        <SectionTitle>Subscriptions</SectionTitle>
        {ws.subscriptions.length === 0 ? (
          <EmptyState title="No subscriptions yet" action={<BtnLink href="/app/services">Browse services</BtnLink>} />
        ) : (
          <ul className="space-y-3">
            {ws.subscriptions.map((s) => {
              const svc = serviceById(s.serviceId)!;
              const planEnded = s.status === "expired" && wasPaid(ws, s);
              return (
                <li key={s.id} className="glass rounded-2xl p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {svc.name} {s.serviceId === "digital-marketing" && <Pill tone="ember">Package</Pill>}
                      </p>
                      <p className="text-xs text-fg-subtle">
                        {planEnded ? `${money(s.price, s.currency ?? "INR")} / ${s.period === "monthly" ? "month" : "year"} · ended ${fmtDate(s.renewsAt)}` : s.status === "trial" || s.status === "expired" ? `Free trial · ${s.status === "trial" ? "ends" : "ended"} ${fmtDate(s.renewsAt)}` : s.period === "one-time" ? `${money(s.price, s.currency ?? "INR")} · paid once on ${fmtDate(s.startedAt)}` : `${money(s.price, s.currency ?? "INR")} / ${s.period === "monthly" ? "month" : "year"} · ${s.status === "active" ? `renews ${fmtDate(s.renewsAt)}` : `ends ${fmtDate(s.renewsAt)}`}`}
                      </p>
                    </div>
                    {planEnded ? (
                      <Pill tone="amber">Plan ended</Pill>
                    ) : s.status === "trial" || s.status === "expired" ? (
                      <Pill tone={s.status === "trial" ? "green" : "amber"}>{s.status === "trial" ? "Free trial" : "Trial ended"}</Pill>
                    ) : (
                      <Pill tone={s.status === "active" ? "green" : "gray"}>{s.period === "one-time" ? "Paid" : s.status === "active" ? "Active" : "Cancelled"}</Pill>
                    )}
                  </div>
                  {planEnded && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
                      <BtnLink size="sm" href={renewHref(s)}>
                        Renew {svc.name}
                      </BtnLink>
                      <span className="text-xs text-fg-subtle">Paused — renew to switch it back on. Your settings are kept.</span>
                    </div>
                  )}
                  {!planEnded && (s.status === "trial" || s.status === "expired") && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
                      <BtnLink size="sm" href={`/app/services/${s.serviceId}`}>
                        Pay & keep {svc.name}
                      </BtnLink>
                      <span className="text-xs text-fg-subtle">{s.status === "trial" ? `Free until ${fmtDate(s.renewsAt)}, then ${money(priceIn(svc, s.currency ?? "INR") ?? s.price, s.currency)}/month.` : "Paused — pay to switch it back on."}</span>
                    </div>
                  )}
                  {s.status === "active" && s.period !== "one-time" && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
                      <BtnLink size="sm" href={renewHref(s)}>
                        Renew now
                      </BtnLink>
                      <Btn size="sm" variant="ghost" onClick={() => switchPeriod(s.id)}>
                        {s.period === "monthly" ? "Upgrade to annual (2 months free)" : "Switch to monthly"}
                      </Btn>
                      {s.serviceId !== "digital-marketing" && (
                        <BtnLink size="sm" variant="ghost" href="/app/services/digital-marketing">
                          Upgrade to Digital Marketing
                        </BtnLink>
                      )}
                      {confirmCancel === s.id ? (
                        <>
                          <Btn size="sm" variant="danger" onClick={() => cancel(s.id)}>
                            Yes, cancel {svc.name}
                          </Btn>
                          <Btn size="sm" variant="subtle" onClick={() => setConfirmCancel(null)}>
                            Keep it
                          </Btn>
                        </>
                      ) : (
                        <Btn size="sm" variant="subtle" onClick={() => setConfirmCancel(s.id)}>
                          Cancel
                        </Btn>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <SectionTitle>Payment history</SectionTitle>
        {ws.invoices.length === 0 ? (
          <p className="text-sm text-fg-muted">No payments yet.</p>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="text-left text-xs text-fg-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {ws.invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-white/[0.05]">
                    <td className="px-4 py-3 font-mono text-xs">{inv.number}</td>
                    <td className="px-4 py-3">{serviceById(inv.serviceId)?.name}</td>
                    <td className="px-4 py-3 text-fg-muted">{fmtDate(inv.date)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{money(inv.amount, inv.currency ?? "INR")}</td>
                    <td className="px-4 py-3 text-right">
                      <Btn size="sm" variant="subtle" onClick={() => setInvoice(inv)}>
                        <FileText className="size-3.5" aria-hidden /> View
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      {invoice && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={`Invoice ${invoice.number}`} onClick={() => setInvoice(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-ink" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-bold">{product.name}</p>
                <p className="text-xs text-ink-muted">{product.company}</p>
              </div>
              <button type="button" onClick={() => setInvoice(null)} aria-label="Close invoice" className="print:hidden">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <p className="mt-6 text-xs text-ink-muted">Invoice {invoice.status === "test" && "(test — not charged)"}</p>
            <p className="font-mono text-sm">{invoice.number}</p>
            <p className="mt-4 text-xs text-ink-muted">Billed to</p>
            <p className="text-sm">
              {ws.business.name}
              <br />
              {ws.business.address && (
                <>
                  {ws.business.address}
                  <br />
                </>
              )}
              {ws.business.city}, {ws.business.country}
            </p>
            <table className="mt-6 w-full text-sm">
              <tbody>
                <tr className="border-b border-paper-line">
                  <td className="py-2">
                    {serviceById(invoice.serviceId)?.name} — {invoice.period}
                  </td>
                  <td className="py-2 text-right">{money(invoice.amount, invoice.currency ?? "INR")}</td>
                </tr>
                <tr className="font-semibold">
                  <td className="py-2">Total</td>
                  <td className="py-2 text-right">{money(invoice.amount, invoice.currency ?? "INR")}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4 text-xs text-ink-muted">Date: {fmtDate(invoice.date)}</p>
            <button type="button" onClick={() => window.print()} className="mt-6 h-10 w-full rounded-full bg-ink-950 text-sm font-semibold text-white print:hidden">
              Print / Save as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
