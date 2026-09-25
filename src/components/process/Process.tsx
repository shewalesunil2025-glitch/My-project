"use client";

import { PenTool, Rocket, Search, Workflow, type LucideIcon } from "lucide-react";
import { processSteps } from "@/content/process";
import { Reveal } from "@/components/effects/Reveal";
import { ScrollWords } from "@/components/effects/ScrollWords";

const icons: LucideIcon[] = [Search, PenTool, Workflow, Rocket];

/** How it works — four step cards with ember icons, in the reference's product-card style. */
export function Process() {
  return (
    <section id="process" aria-labelledby="process-title" className="relative py-24 md:py-36">
      <div className="container-x">
        <div className="text-center">
          <Reveal>
            <p className="badge">How it works</p>
          </Reveal>
          <ScrollWords
            id="process-title"
            text="Four steps. One flow."
            accentFrom={2}
            className="display mx-auto mt-5 max-w-3xl text-[clamp(2.1rem,4.8vw,3.8rem)]"
          />
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-fg-muted md:text-lg">
              From first conversation to a live system — clear scope, fixed price.
            </p>
          </Reveal>
        </div>

        <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {processSteps.map((step, i) => {
            const Icon = icons[i];
            return (
              <Reveal as="li" key={step.index} delay={i * 0.07}>
                <article className="glass group relative h-full overflow-hidden rounded-[1.5rem] p-6 pt-7 transition-[border-color] duration-300 hover:border-white/15">
                  <div aria-hidden className="absolute -top-16 -left-10 size-40 rounded-full bg-flow/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100 opacity-60" />
                  <span className="relative grid size-11 place-items-center rounded-full bg-flow/15 text-flow shadow-[0_0_30px_-4px_rgb(255_90_31/0.6)]">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <p className="relative mt-8 text-xs font-semibold text-fg-subtle">Step {step.index}</p>
                  <h3 className="relative mt-1 text-xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-fg-muted">{step.body}</p>
                  {i < processSteps.length - 1 && (
                    <span aria-hidden className="absolute top-12 right-4 hidden h-px w-10 bg-gradient-to-r from-flow/60 to-transparent lg:block" />
                  )}
                </article>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
