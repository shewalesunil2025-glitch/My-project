import { Check } from "lucide-react";
import { Scramble } from "@/components/effects/Scramble";
import { pillars, promises } from "@/content/pillars";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/effects/Reveal";
import { ScrollWords } from "@/components/effects/ScrollWords";
import { BookDemoButton } from "@/components/cta/BookDemoButton";

/**
 * Services as pricing cards. Each shows a "Starting at" price (USD) — the final
 * figure depends on scope — placed after the service list, just above the CTA.
 */
export function Pillars() {
  return (
    <section id="services" aria-labelledby="services-title" className="relative py-24 md:py-36">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(40%_60%_at_50%_0%,rgb(125_255_58/0.08),transparent_70%)]" />
      <div className="container-x relative">
        <div className="text-center">
          <Reveal>
            <p className="badge"><Scramble text="Services" /></p>
          </Reveal>
          <ScrollWords
            id="services-title"
            text="Build. Automate. Grow. Partner."
            accentFrom={3}
            className="display mx-auto mt-5 max-w-3xl text-[clamp(2.1rem,4.8vw,3.8rem)]"
          />
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-fg-muted md:text-lg">
              Four ways to work with us — pick one, or let us run the whole flow.
            </p>
          </Reveal>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 0.06}>
              <article
                className={cn(
                  "group flex h-full flex-col rounded-[1.5rem] border p-6 transition-[border-color] duration-300",
                  p.featured
                    ? "beam border-flow/40 [background:linear-gradient(180deg,rgb(125_255_58/0.12),rgb(125_255_58/0.02)_40%),var(--color-ink-850)]"
                    : "glass hover:border-white/15",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide text-fg-muted uppercase">{p.lead}</span>
                  {p.featured && (
                    <span className="rounded-full bg-flow px-2 py-0.5 text-xs font-semibold text-ink-950">Popular</span>
                  )}
                </div>
                <div className="mt-5 flex items-baseline gap-2">
                  <p.icon className="size-6 self-center text-flow" aria-hidden />
                  <h3 className="text-2xl font-semibold tracking-tight xl:text-3xl">{p.title}</h3>
                </div>
                <div className="my-6 h-px bg-white/[0.08]" />
                <ul className="space-y-3 text-sm">
                  {p.items.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-white/20">
                        <Check className="size-2.5 text-flow" aria-hidden />
                      </span>
                      <span className="text-fg/90">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-8">
                  <div className="border-t border-white/[0.08] pt-6">
                    {/* Fixed height so "Starting at" lines up across all four cards */}
                    <div className="flex h-5 items-center justify-between gap-3">
                      <span className="font-mono text-[0.65rem] tracking-[0.16em] text-fg-subtle uppercase">Starting at</span>
                      {p.billing === "monthly" && (
                        <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[0.6rem] tracking-[0.12em] text-fg-muted uppercase">
                          Monthly
                        </span>
                      )}
                    </div>
                    <p className="mt-2 flex items-baseline gap-1">
                      <span className="display origin-left text-[2.4rem] leading-none text-fg transition-[color,transform] duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.03] group-hover:text-flow-soft">
                        {p.price}
                      </span>
                      {p.billing === "monthly" && <span className="text-base text-fg-muted">/mo</span>}
                      <span className="sr-only">{p.billing === "monthly" ? " per month" : " per project"}</span>
                    </p>
                  </div>
                  <BookDemoButton
                    label={p.cta}
                    interest={p.interest}
                    variant={p.featured ? "primary" : "ghost"}
                    magnetic={false}
                    className="mt-6 w-full"
                  />
                </div>
              </article>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.1}>
          <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-fg-muted">
            {promises.map((p) => (
              <li key={p.title} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-flow" aria-hidden />
                <span>
                  <span className="font-semibold text-fg">{p.title}</span> — {p.body}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
