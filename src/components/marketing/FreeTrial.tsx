import Link from "next/link";
import { Check, Gift, X } from "lucide-react";
import { Reveal } from "@/components/effects/Reveal";

const included = ["WhatsApp Automation", "Customer Support", "Lead Follow-up", "Email Automation", "Google Review replies", "Website builder (build & preview)"];
const notIncluded = ["Instagram, Facebook & YouTube content", "AI Voice calls", "Digital Marketing & ads", "Publishing your website"];

/** The 3-day free trial, highlighted right after the hero. */
export function FreeTrial() {
  return (
    <section id="free-trial" aria-label="3-day free trial" className="relative py-16 md:py-24">
      <div className="container-x">
        <Reveal>
          <div className="beam relative overflow-hidden rounded-[2rem] border border-flow/50 p-6 shadow-[0_40px_120px_-40px_rgb(125_255_58/0.55)] [background:radial-gradient(70%_120%_at_100%_0%,rgb(125_255_58/0.28),transparent_60%),radial-gradient(60%_100%_at_0%_100%,rgb(56_189_248/0.16),transparent_60%),var(--color-ink-850)] md:p-12">
            <div aria-hidden className="grid-backdrop pointer-events-none absolute inset-0 opacity-30" />
            <div className="relative grid gap-10 md:grid-cols-[1.15fr_1fr] md:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-flow px-3 py-1 text-xs font-bold tracking-wide text-ink-950 uppercase">
                  <Gift className="size-3.5" aria-hidden /> Free trial · No payment needed
                </span>
                <h2 className="display mt-5 text-[2.6rem] leading-[1.02] md:text-6xl">
                  3 days <span className="text-flow">FREE.</span>
                  <br />
                  Try it before you pay.
                </h2>
                <p className="mt-5 max-w-lg text-fg-muted md:text-lg">
                  Switch on every messaging automation free for 3 days — on your own WhatsApp, with your own customers — and build your website. Love it? Continue from just ₹499/month.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="/app/signup"
                    className="inline-flex h-13 items-center gap-2 rounded-full bg-flow px-7 text-base font-semibold text-ink-950 shadow-[0_14px_40px_-12px_rgb(125_255_58/0.9)] transition-transform hover:scale-[1.03]"
                  >
                    <Gift className="size-5" aria-hidden /> Start my free trial
                  </Link>
                  <span className="text-sm text-fg-subtle">Takes 2 minutes · Cancel anytime</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
                <div className="glass rounded-2xl p-5">
                  <p className="text-sm font-semibold text-flow">Free for 3 days</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {included.map((x) => (
                      <li key={x} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-flow" aria-hidden /> {x}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-white/[0.07] p-5">
                  <p className="text-sm font-semibold text-fg-muted">Paid plans only</p>
                  <ul className="mt-3 space-y-2 text-sm text-fg-subtle">
                    {notIncluded.map((x) => (
                      <li key={x} className="flex items-start gap-2">
                        <X className="mt-0.5 size-4 shrink-0" aria-hidden /> {x}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
