"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import { chargeInInr, product } from "@/config/product";
import { annualPrice, isLive, serviceById } from "@/content/app/services";
import { activateService, buyService, setAutopay } from "@/lib/app/agentActions";
import { currentWorkspace } from "@/lib/app/store";
import { AUTOPAY_MAX_INR, collectPayment, paymentsEnabled, startAutopay } from "@/lib/app/payment";
import type { PlanPeriod } from "@/lib/app/types";
import { appCurrency, inrNote, money, svcPrice } from "@/lib/app/money";
import { useWorkspace } from "@/components/app/AppShell";
import { Btn, BtnLink, Card, EmptyState, Icon, Notice, Spinner } from "@/components/app/ui";

function Checkout() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const ws = useWorkspace();
  const [paying, setPaying] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");
  const [autopay, setAutopayOn] = useState(true);
  useEffect(() => {
    void paymentsEnabled().then(setLive);
  }, []);
  const svc = serviceById(id);
  const period: PlanPeriod = svc?.billing === "one-time" ? "one-time" : params.get("period") === "annual" ? "annual" : "monthly";

  if (!ws) return null;
  if (!svc || svc.price === null) return <EmptyState title="This service can't be bought online" action={<BtnLink href="/app/services">Back to services</BtnLink>} />;
  if (!isLive(svc.id)) return <EmptyState title={`${svc.name} is coming soon`} action={<BtnLink href={`/app/services/${svc.id}`}>Join the waitlist</BtnLink>} />;
  const existing = ws.automations.find((a) => a.serviceId === svc.id);
  if (existing && !existing.trialEndsAt && svc.billing === "one-time") return <EmptyState title={`You already have ${svc.name}`} action={<BtnLink href={`/app/automations/${existing.id}`}>Manage it</BtnLink>} />;

  const cur = appCurrency(ws);
  const base = svcPrice(svc, ws) ?? svc.price;
  const amount = period === "annual" ? annualPrice(base) : base;
  const sub = existing && !existing.trialEndsAt ? ws.subscriptions.find((x) => x.id === existing.subscriptionId) : undefined;
  // Renewing: the new period starts from the current end date, so paying early loses nothing.
  const renews = new Date();
  // An active plan that runs a while yet: Autopay only sets up the mandate now and charges on its end date.
  const laterStart = Boolean(sub && sub.status === "active" && Date.parse(sub.renewsAt) > renews.getTime() + 15 * 60_000);
  if (sub && Date.parse(sub.renewsAt) > renews.getTime()) renews.setTime(Date.parse(sub.renewsAt));
  if (period === "monthly") renews.setMonth(renews.getMonth() + 1);
  else if (period === "annual") renews.setFullYear(renews.getFullYear() + 1);

  const canAutopay = period !== "one-time" && chargeInInr(amount, cur) <= AUTOPAY_MAX_INR && !sub?.autopayId;
  const useAutopay = canAutopay && autopay;
  const mandateOnly = useAutopay && laterStart;

  async function pay() {
    setPaying(true);
    setError("");
    const result = useAutopay ? await startAutopay(svc!.id, period, mandateOnly ? sub!.renewsAt : undefined) : await collectPayment(svc!.id, period);
    if (result.status === "cancelled") return setPaying(false);
    if (result.status === "error") {
      setError(result.message);
      return setPaying(false);
    }
    // Autopay set up for a plan that's still running: nothing paid today, Razorpay charges on its end date.
    if (result.status === "paid" && result.autopayId && !result.charged && sub) {
      setAutopay(sub.id, result.autopayId);
      return router.replace("/app/billing?autopay=1");
    }
    // Paid (or a test payment in preview mode): create the service and carry on with its setup.
    const paid = result.status === "paid" ? { paymentRef: result.paymentId, autopayId: result.autopayId } : undefined;
    const automationId = buyService(svc!.id, period, paid);
    // A trial service that was already on: tell the automation server it's paid now, so it keeps running.
    const after = currentWorkspace()?.automations.find((a) => a.id === automationId);
    if (existing && after?.status === "active") void activateService(svc!.id);
    router.replace(automationId ? `/app/automations/${automationId}?paid=1` : "/app/services");
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href={`/app/services/${svc.id}`} className="mb-5 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> Back
      </Link>
      <h1 className="display text-2xl sm:text-3xl">{sub ? `Renew ${svc.name}` : "Payment"}</h1>

      <Card className="mt-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-flow/12 text-flow-soft">
            <Icon name={svc.icon} className="size-5" />
          </span>
          <div>
            <p className="font-semibold">{svc.name}</p>
            <p className="text-xs text-fg-muted capitalize">{period === "one-time" ? "One-time payment" : `${period} plan`}</p>
          </div>
        </div>
        <dl className="space-y-2 border-t border-white/[0.06] pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-fg-muted">Plan</dt>
            <dd>
              {money(amount, cur)}
              {period !== "one-time" && ` / ${period === "monthly" ? "month" : "year"}`}
            </dd>
          </div>
          {period !== "one-time" && (
            <div className="flex justify-between">
              <dt className="text-fg-muted">{mandateOnly ? "Autopay charges on" : sub ? "Runs until" : "Renews on"}</dt>
              <dd>{(mandateOnly ? new Date(sub!.renewsAt) : renews).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-white/[0.06] pt-3 text-base font-semibold">
            <dt>Due today</dt>
            <dd>{money(mandateOnly ? 0 : amount, cur)}</dd>
          </div>
          {cur !== "INR" && <p className="text-right text-xs text-fg-subtle">{inrNote(amount, cur)} (all payments are in rupees)</p>}
        </dl>
      </Card>

      {canAutopay && (
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-flow/30 bg-flow/[0.06] p-4">
          <input type="checkbox" checked={autopay} onChange={(e) => setAutopayOn(e.target.checked)} className="mt-1 size-4 accent-[#4fb336]" />
          <span className="text-sm">
            <span className="flex items-center gap-1.5 font-semibold">
              <RefreshCw className="size-4 text-flow" aria-hidden /> Autopay — renew automatically
            </span>
            <span className="mt-0.5 block text-fg-muted">
              {mandateOnly
                ? `Nothing is charged today. ${money(amount, cur)} is taken automatically on the end date, then every ${period === "monthly" ? "month" : "year"}.`
                : `${money(amount, cur)} every ${period === "monthly" ? "month" : "year"} with UPI AutoPay or your card, so your service never stops.`}{" "}
              Turn it off any time from Billing.
            </span>
          </span>
        </label>
      )}

      {error && (
        <Notice tone="amber" className="mt-4">
          {error}
        </Notice>
      )}

      {product.previewMode && !live && (
        <Notice tone="amber" className="mt-4">
          Preview mode — this is a test payment. No card is needed and nothing is charged. When the payment provider is connected, this button opens its secure checkout.
        </Notice>
      )}

      <Btn size="lg" className="mt-6 w-full" onClick={pay} disabled={paying}>
        {paying ? (
          <>
            <Spinner /> Opening payment…
          </>
        ) : (
          <>{mandateOnly ? "Set up Autopay" : useAutopay ? "Pay & turn on Autopay" : "Pay"}</>
        )}
      </Btn>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-fg-subtle">
        <ShieldCheck className="size-3.5" aria-hidden /> Card details are handled only by the payment provider — never stored by {product.name}.
      </p>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <Checkout />
    </Suspense>
  );
}
