"use client";

import { useRouter } from "next/navigation";
import { Gift, Timer } from "lucide-react";
import { TRIAL_DAYS, isLive, trialServices } from "@/content/app/services";
import { beginTrial, timeLeft, trialServiceNames, trialState } from "@/lib/app/trial";
import { businessReady } from "@/lib/app/store";
import type { Workspace } from "@/lib/app/types";
import { Btn, BtnLink } from "./ui";
import { cn } from "@/lib/cn";

/** The free trial, front and centre: start it, see the time left, or pay once it's over. */
export function TrialBanner({ ws, className, compact }: { ws: Workspace; className?: string; compact?: boolean }) {
  const router = useRouter();
  const t = trialState(ws);
  const onTrial = ws.automations.filter((a) => a.trialEndsAt);
  const names = trialServiceNames(trialServices.filter(isLive));

  // After the trial, only owners who actually tried something need the reminder.
  if (t.phase === "over" && onTrial.length === 0) return null;

  return (
    <section
      aria-label="Free trial"
      className={cn(
        "relative overflow-hidden rounded-3xl border",
        compact ? "p-4" : "p-5 sm:p-7",
        t.phase === "over" ? "border-amber-400/30 bg-[linear-gradient(135deg,rgb(251_191_36/0.16),rgb(251_191_36/0.03)_60%)]" : "border-flow/40 bg-[linear-gradient(135deg,rgb(37_211_102/0.26),rgb(56_189_248/0.10)_55%,rgb(37_211_102/0.04))]",
        className,
      )}
    >
      <div aria-hidden className="absolute -top-24 -right-16 size-72 rounded-full bg-flow/25 blur-3xl" />
      <div className={cn("relative flex", compact ? "flex-wrap items-center gap-3" : "flex-col gap-5 sm:flex-row sm:items-center")}>
        <span
          className={cn(
            "grid shrink-0 place-items-center bg-flow text-ink-950 shadow-[0_12px_40px_-10px_rgb(37_211_102/0.9)]",
            compact ? "size-11 rounded-xl" : "size-14 rounded-2xl",
          )}
        >
          {t.phase === "on" ? <Timer className={compact ? "size-5" : "size-7"} aria-hidden /> : <Gift className={compact ? "size-5" : "size-7"} aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          {t.phase === "unused" && (
            <>
              <p className="font-mono text-[0.65rem] tracking-[0.2em] text-flow uppercase">Free · No payment needed</p>
              <h2 className={cn("display mt-1", compact ? "text-xl" : "text-2xl sm:text-3xl")}>{TRIAL_DAYS}-day FREE trial</h2>
              <p className={cn("mt-1.5 text-sm leading-relaxed text-fg-muted", compact && "hidden")}>
                Try {names.join(", ")} and every messaging automation free for {TRIAL_DAYS} days — and build and preview your website. Pay only if you love it.
              </p>
            </>
          )}
          {t.phase === "on" && (
            <>
              <p className="font-mono text-[0.65rem] tracking-[0.2em] text-flow uppercase">Free trial on · {timeLeft(t.msLeft)}</p>
              <h2 className={cn("display mt-1", compact ? "text-xl" : "text-2xl sm:text-3xl")}>Your free trial is running</h2>
              <p className={cn("mt-1.5 text-sm leading-relaxed text-fg-muted", compact && "hidden")}>
                {onTrial.length ? "Your trial services stop when it ends. Pay any time to keep them running without a break." : `Switch on ${names.join(" or ")} now — free until the trial ends.`}
              </p>
            </>
          )}
          {t.phase === "over" && (
            <>
              <p className="font-mono text-[0.65rem] tracking-[0.2em] text-amber-300 uppercase">Free trial ended</p>
              <h2 className={cn("display mt-1", compact ? "text-xl" : "text-2xl sm:text-3xl")}>Keep your automations running</h2>
              <p className={cn("mt-1.5 text-sm leading-relaxed text-fg-muted", compact && "hidden")}>Your trial services are paused. Pay for a service and it switches back on with all its settings.</p>
            </>
          )}
        </div>
        <div className={cn("shrink-0", compact && "w-full")}>
          {t.phase === "unused" ? (
            <Btn
              size={compact ? "md" : "lg"}
              className="w-full sm:w-auto"
              onClick={() => {
                if (!businessReady(ws)) return router.push(`/app/setup?next=${encodeURIComponent("/app/services")}`);
                if (beginTrial()) router.push("/app/services");
              }}
            >
              <Gift className="size-4" aria-hidden /> Start free trial
            </Btn>
          ) : t.phase === "on" && onTrial.length === 0 ? (
            <BtnLink size={compact ? "md" : "lg"} className="w-full sm:w-auto" href="/app/services/whatsapp">
              Try WhatsApp free
            </BtnLink>
          ) : (
            <BtnLink size={compact ? "md" : "lg"} className="w-full sm:w-auto" href={onTrial.length === 1 ? `/app/services/${onTrial[0].serviceId}` : "/app/billing"}>
              Pay & keep it running
            </BtnLink>
          )}
        </div>
      </div>
    </section>
  );
}
