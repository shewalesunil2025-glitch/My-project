import { Check } from "lucide-react";
import { pillars, promises } from "@/content/pillars";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/effects/Reveal";
import { TiltCard } from "@/components/effects/TiltCard";
import { BookDemoButton } from "@/components/cta/BookDemoButton";

export function Pillars() {
  return (
    <section id="services" aria-labelledby="services-title" className="relative py-28 md:py-40">
      <div className="container-x">
        <SectionHeading
          id="services-title"
          eyebrow="Services"
          title={
            <>
              Build. Automate. Grow. <span className="text-flow">Partner.</span>
            </>
          }
          lead="Four ways to work with us — pick one, or let us run the whole flow."
        />

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 0.06}>
              <TiltCard max={4} className="glass h-full rounded-[1.5rem]">
                <article className="flex h-full flex-col p-6">
                  <span className="grid size-11 place-items-center rounded-2xl bg-flow/15 text-flow-soft">
                    <p.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-6 text-2xl font-semibold tracking-tight">{p.title}</h3>
                  <p className="mt-1 text-sm text-fg-muted">{p.lead}</p>
                  <ul className="mt-6 space-y-2.5 text-sm">
                    {p.items.map((item) => (
                      <li key={item} className="flex gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-flow" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-8">
                    <BookDemoButton label={p.cta} interest={p.interest} variant="ghost" magnetic={false} className="w-full" />
                  </div>
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </ul>

        <ul className="mt-6 grid gap-px overflow-hidden rounded-[1.5rem] border border-white/[0.07] bg-white/[0.07] md:grid-cols-3">
          {promises.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 0.06} className="bg-ink-900 p-6 md:p-7">
              <p className="font-medium">{p.title}</p>
              <p className="mt-1 text-sm text-fg-muted">{p.body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
