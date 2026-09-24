"use client";

import { demos } from "@/content/demos";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { BookDemoButton } from "@/components/cta/BookDemoButton";
import { Reveal } from "@/components/effects/Reveal";
import { TiltCard } from "@/components/effects/TiltCard";
import { EventConsole } from "./EventConsole";

export function Demos() {
  return (
    <section id="work" aria-labelledby="work-title" className="relative py-28 md:py-40">
      <div className="container-x">
        <SectionHeading
          id="work-title"
          eyebrow="Work / Demos"
          title={
            <>
              Experience our work. <span className="text-flow">Live systems, not screenshots.</span>
            </>
          }
          lead="Each demo is a working concept of a complete system: the website, the conversations and the automation behind them."
        />

        <div className="mt-16 space-y-8 md:mt-20 md:space-y-10">
          {demos.map((demo, i) => (
            <Reveal key={demo.id} delay={0.05}>
              <TiltCard max={3} className="glass rounded-[1.75rem]">
                <article className="grid gap-8 p-6 md:p-10 lg:grid-cols-2 lg:gap-12" aria-labelledby={`demo-${demo.id}`}>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3 font-mono text-[0.65rem] tracking-[0.2em] text-fg-subtle uppercase">
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <span className="h-px w-8 bg-white/15" aria-hidden />
                      <span>{demo.industry}</span>
                    </div>
                    <h3 id={`demo-${demo.id}`} className="display mt-5 text-[clamp(2.2rem,4.6vw,3.8rem)]">
                      {demo.name}
                    </h3>
                    <p className="mt-4 max-w-md text-fg-muted">{demo.summary}</p>
                    <ul className="mt-6 flex flex-wrap gap-2" aria-label="Systems included">
                      {demo.systems.map((s) => (
                        <li key={s} className="rounded-full border border-white/10 px-3 py-1 text-xs text-fg-muted">
                          {s}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto flex flex-wrap gap-3 pt-10">
                      {demo.href ? (
                        <ButtonLink href={demo.href} target="_blank" rel="noopener noreferrer" icon>
                          Explore a Demo
                        </ButtonLink>
                      ) : (
                        <BookDemoButton label="Explore a Demo" interest={`${demo.name} demo walkthrough`} icon />
                      )}
                      <BookDemoButton label="Build This For My Business" interest={`${demo.industry} system`} variant="ghost" />
                    </div>
                  </div>
                  <div className="min-h-[18rem]">
                    <EventConsole events={demo.events} name={demo.name} />
                  </div>
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
