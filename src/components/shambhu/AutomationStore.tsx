"use client";

import { store } from "@/content/shambhu";
import { digitalMarketing } from "@/content/digitalMarketing";
import { BookDemoButton } from "@/components/cta/BookDemoButton";
import { Reveal } from "@/components/effects/Reveal";
import { useDemo } from "@/components/cta/DemoProvider";
import { cn } from "@/lib/cn";
import { CountryChip, SeePrice, useCurrency } from "@/components/cta/Money";
import { SubHead } from "./Shambhu";

/**
 * Automation Store: every IBAX service can be bought on its own, each with a
 * "Starting at" price, shown once the visitor picks their country (₹ India, $ elsewhere).
 * Digital Marketing is the premium package.
 */
/** Yearly price for a monthly "₹699": 10 months, so 2 months free. */
const yearly = (monthly: string) => {
  const n = Number(monthly.replace(/\D/g, "")) * 10;
  return monthly.startsWith("$") ? `$${n.toLocaleString("en-US")}` : `₹${n.toLocaleString("en-IN")}`;
};

export function AutomationStore() {
  const { openDemo } = useDemo();
  const currency = useCurrency();
  const p = (x: { price: string; usd: string }) => (currency === "USD" ? x.usd : x.price);
  const regular = store.filter((s) => !s.premium && !s.bundle);
  const bundles = store.filter((s) => s.bundle);
  const premium = store.find((s) => s.premium);

  return (
    <section id="store" aria-label="Automation Store" className="relative py-24 md:py-32">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(40%_60%_at_50%_0%,rgb(125_255_58/0.08),transparent_70%)]" />
      <div className="container-x relative">
        <SubHead label="Automation Store" title="Pick only what you need." />
        <Reveal delay={0.1}>
          <p className="mx-auto mt-4 max-w-md text-center text-fg-muted">Every service works on its own. Add more any time.</p>
          <div className="mt-4 flex justify-center">
            <CountryChip />
          </div>
          <p className="mx-auto mt-5 w-fit rounded-full border border-flow/40 bg-flow/10 px-4 py-1.5 text-center text-sm font-medium text-flow-soft">
            🎁 Messaging automations are <strong className="text-flow">FREE for 3 days</strong> —{" "}
            <a href="/app/signup" className="underline underline-offset-4">
              start your trial
            </a>
          </p>
        </Reveal>

        <ul className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {regular.map((s, i) => (
            <Reveal as="li" key={s.title} delay={(i % 5) * 0.05}>
              <button
                type="button"
                onClick={() => openDemo(s.title)}
                className="glass group relative flex h-full w-full flex-col rounded-2xl p-4 text-left transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-flow/40 md:p-5"
              >
                {s.trial && (
                  <span className="absolute top-3 right-3 rounded-full bg-flow px-2 py-0.5 text-[0.62rem] font-bold tracking-wide text-ink-950 uppercase shadow-[0_6px_18px_-6px_rgb(125_255_58/0.9)]">
                    3 days free
                  </span>
                )}
                <span className="grid size-10 place-items-center rounded-xl border border-flow/25 bg-flow/10 text-flow transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                  <s.icon className="size-4" aria-hidden />
                </span>
                <span className="mt-4 block text-sm font-semibold md:text-base">{s.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-fg-muted md:text-sm">{s.body}</span>
                <span className="mt-auto block pt-5">
                  <span className="block font-mono text-[0.58rem] tracking-[0.14em] text-fg-subtle uppercase">Starting at</span>
                  {currency ? (
                    <>
                      <span className="mt-1 flex flex-wrap items-baseline gap-x-1">
                        <span className="display text-[1.9rem] leading-none text-fg transition-colors duration-300 group-hover:text-flow-soft">
                          {p(s)}
                        </span>
                        <span className="text-xs whitespace-nowrap text-fg-muted">{s.billing === "monthly" ? "/mo" : "one-time"}</span>
                      </span>
                      {s.billing === "monthly" && <span className="mt-1 block text-[0.7rem] text-flow-soft">or {yearly(p(s))}/year · 2 months free</span>}
                    </>
                  ) : (
                    <span className="mt-1 block text-xs text-fg-muted">Choose your country above</span>
                  )}
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-flow">
                    Get started <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </span>
              </button>
            </Reveal>
          ))}
        </ul>

        {bundles.map((b) => (
          <Reveal key={b.title} delay={0.05} className="mt-4">
            <button
              type="button"
              onClick={() => openDemo(b.title)}
              className="glass group grid w-full items-center gap-4 rounded-2xl p-5 text-left transition-[border-color] duration-300 hover:border-flow/40 md:grid-cols-[auto_1fr_auto] md:p-6"
            >
              <span className="grid size-12 place-items-center rounded-2xl border border-flow/30 bg-flow/10 text-flow">
                <b.icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold">{b.title}</span>
                  <span className="rounded-full border border-flow/40 px-2 py-0.5 text-[0.65rem] font-semibold text-flow uppercase">Best value</span>
                </span>
                <span className="mt-1 block max-w-2xl text-sm text-fg-muted">{b.body}</span>
              </span>
              {currency ? (
                <span className="md:text-right">
                  <span className="display text-[2rem] leading-none">{p(b)}</span>
                  <span className="text-sm text-fg-muted">/mo</span>
                  <span className="mt-1 block text-xs text-flow-soft">or {yearly(p(b))}/year · 2 months free</span>
                </span>
              ) : (
                <span className="text-xs text-fg-muted md:text-right">Choose your country above to see the price</span>
              )}
            </button>
          </Reveal>
        ))}

        {premium && (
          <Reveal delay={0.1} className="mt-4">
            <article
              className={cn(
                "beam relative grid items-center gap-6 overflow-hidden rounded-[1.5rem] border border-flow/40 p-6 md:grid-cols-[1fr_auto_auto] md:p-8",
                "[background:linear-gradient(120deg,rgb(125_255_58/0.14),rgb(125_255_58/0.02)_55%),var(--color-ink-850)]",
              )}
            >
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-flow text-ink-950">
                  <premium.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="text-xl font-semibold tracking-tight md:text-2xl">{premium.title}</span>
                    <span className="rounded-full bg-flow px-2 py-0.5 text-xs font-semibold text-ink-950">Premium</span>
                  </p>
                  <p className="mt-2 max-w-xl text-sm text-fg-muted md:text-base">{premium.body}</p>
                </div>
              </div>
              {currency ? (
                <p className="md:text-right">
                  <span className="block font-mono text-[0.58rem] tracking-[0.14em] text-fg-subtle uppercase">Starting at</span>
                  <span className="display text-[2.4rem] leading-none">{p(premium)}</span>
                  <span className="text-sm text-fg-muted">/mo</span>
                  <span className="mt-1 block text-xs text-flow-soft">or {yearly(p(premium))}/year · 2 months free</span>
                </p>
              ) : (
                <p className="md:text-right">
                  <SeePrice />
                </p>
              )}
              <div className="flex flex-col items-start gap-2">
                <BookDemoButton label="Get started" interest={premium.title} icon className="w-fit" />
                <a href={digitalMarketing.href} className="text-sm text-flow underline-offset-4 hover:underline">
                  See what&apos;s included →
                </a>
              </div>
            </article>
          </Reveal>
        )}

        <p className="mt-6 text-center text-sm text-fg-subtle">{currency === "USD" ? "Prices in US dollars for customers outside India; payment is taken in Indian rupees at the same value." : currency === "INR" ? "Prices in Indian rupees, all-inclusive." : "Choose your country to see prices in your currency."} Pay yearly and get 2 months free. Services marked “3 days free” can be tried at no cost.</p>
      </div>
    </section>
  );
}
