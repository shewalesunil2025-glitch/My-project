"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { formatPrice, product } from "@/config/product";
import { annualPrice, isLive, serviceById } from "@/content/app/services";
import { buyService } from "@/lib/app/agentActions";
import type { PlanPeriod } from "@/lib/app/types";
import { useWorkspace } from "@/components/app/AppShell";
import { Btn, BtnLink, Card, EmptyState, Icon, Notice, Spinner } from "@/components/app/ui";

function Checkout() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const ws = useWorkspace();
  const [paying, setPaying] = useState(false);
  const svc = serviceById(id);
  const period: PlanPeriod = svc?.billing === "one-time" ? "one-time" : params.get("period") === "annual" ? "annual" : "monthly";

  if (!ws) return null;
  if (!svc || svc.price === null) return <EmptyState title="This service can't be bought online" action={<BtnLink href="/app/services">Back to services</BtnLink>} />;
  if (!isLive(svc.id)) return <EmptyState title={`${svc.name} is coming soon`} action={<BtnLink href={`/app/services/${svc.id}`}>Join the waitlist</BtnLink>} />;
  const existing = ws.automations.find((a) => a.serviceId === svc.id);
  if (existing) return <EmptyState title={`You already have ${svc.name}`} action={<BtnLink href={`/app/automations/${existing.id}`}>Manage it</BtnLink>} />;

  const amount = period === "annual" ? annualPrice(svc.price) : svc.price;
  const renews = new Date();
  if (period === "monthly") renews.setMonth(renews.getMonth() + 1);
  else if (period === "annual") renews.setFullYear(renews.getFullYear() + 1);

  function pay() {
    setPaying(true);
    // Preview mode: the payment provider call is simulated. In production this is a
    // hosted checkout (Stripe / Razorpay) and the subscription is created by its webhook.
    setTimeout(() => {
      const automationId = buyService(svc!.id, period);
      router.replace(automationId ? `/app/automations/${automationId}?paid=1` : "/app/services");
    }, 900);
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href={`/app/services/${svc.id}`} className="mb-5 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> Back
      </Link>
      <h1 className="display text-2xl sm:text-3xl">Payment</h1>

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
              {formatPrice(amount)}
              {period !== "one-time" && ` / ${period === "monthly" ? "month" : "year"}`}
            </dd>
          </div>
          {period !== "one-time" && (
            <div className="flex justify-between">
              <dt className="text-fg-muted">Renews on</dt>
              <dd>{renews.toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-white/[0.06] pt-3 text-base font-semibold">
            <dt>Due today</dt>
            <dd>{formatPrice(amount)}</dd>
          </div>
        </dl>
      </Card>

      {product.previewMode && (
        <Notice tone="amber" className="mt-4">
          Preview mode — this is a test payment. No card is needed and nothing is charged. When the payment provider is connected, this button opens its secure checkout.
        </Notice>
      )}

      <Btn size="lg" className="mt-6 w-full" onClick={pay} disabled={paying}>
        {paying ? (
          <>
            <Spinner /> Confirming payment…
          </>
        ) : (
          <>
            Pay
          </>
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
