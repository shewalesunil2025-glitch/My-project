"use client";

import { RefreshCw } from "lucide-react";
import { serviceById } from "@/content/app/services";
import { renewHref, renewalsDue } from "@/lib/app/renewal";
import type { Workspace } from "@/lib/app/types";
import { BtnLink, fmtDate } from "./ui";
import { cn } from "@/lib/cn";

/** Paid plans ending in the next few days (or already ended): one tap to renew. */
export function RenewalBanner({ ws, className }: { ws: Workspace; className?: string }) {
  const { soon, ended } = renewalsDue(ws);
  const first = ended[0] ?? soon[0];
  if (!first) return null;
  const all = [...ended, ...soon];
  const names = all.map((s) => serviceById(s.serviceId)?.name).filter(Boolean).join(", ");

  return (
    <section aria-label="Renewal due" className={cn("flex flex-col gap-4 rounded-3xl border border-amber-400/30 bg-[linear-gradient(135deg,rgb(251_191_36/0.16),rgb(251_191_36/0.03)_60%)] p-5 sm:flex-row sm:items-center", className)}>
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-300 text-ink-950">
        <RefreshCw className="size-6" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{ended.length ? "A plan has ended — renew to switch it back on" : "Renewal due soon"}</p>
        <p className="mt-0.5 text-sm text-fg-muted">
          {names} {ended.length ? `${all.length === 1 ? "is" : "are"} paused or ending.` : `renew${all.length === 1 ? "s" : ""} on ${fmtDate(first.renewsAt)}.`} Renew now so nothing stops — your settings are kept.
        </p>
      </div>
      <BtnLink className="w-full shrink-0 sm:w-auto" href={all.length === 1 ? renewHref(first) : "/app/billing"}>
        Renew now
      </BtnLink>
    </section>
  );
}
