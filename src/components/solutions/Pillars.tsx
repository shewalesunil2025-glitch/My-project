import { Check } from "lucide-react";
import { Scramble } from "@/components/effects/Scramble";
import { pillars, promises } from "@/content/pillars";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/effects/Reveal";
import { ScrollWords } from "@/components/effects/ScrollWords";
import { BookDemoButton } from "@/components/cta/BookDemoButton";

/** Services, laid out like the reference's pricing cards (no invented prices). */
export function Pillars() {
  return (
    <section id="services" aria-labelledby="services-title" className="relative py-24 md:py-36">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(40%_60%_at_50%_0%,rgb(139_92_246/0.08),transparent_70%)]" />
      <div className="container-x relative">
        <div className="text-center">
          <Reveal>
            <p className="badge"><span aria-hidden className="text-flow-soft/80">07 //</span> <Scramble text="Services" /></p>
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
                  "flex h-full flex-col rounded-[1.5rem] border p-6 transition-[border-color] duration-300",
                  p.featured
                    ? "beam border-flow/40 bg-[linear-gradient(180deg,rgb(139_92_246/0.12),rgb(139_92_246/0.02)_40%),var(--color-ink-850)]"
                    : "glass hover:border-white/15",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide text-fg-muted uppercase">{p.lead}</span>
                  {p.featured && (
                    <span className="rounded-full bg-flow px-2 py-0.5 text-xs font-semibold text-white">Popular</span>
                  )}
                </div>
                <div className="mt-5 flex items-baseline gap-2">
                  <p.icon className="size-6 self-center text-flow" aria-hidden />
                  <h3 className="text-2xl font-semibold tracking-tight xl:text-3xl">{p.title}</h3>
                  <span className="text-sm whitespace-nowrap text-fg-muted">/ {p.terms}</span>
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
                  <BookDemoButton
                    label={p.cta}
                    interest={p.interest}
                    variant={p.featured ? "primary" : "ghost"}
                    magnetic={false}
                    className="w-full"
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
