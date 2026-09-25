"use client";

import { MapPin } from "lucide-react";
import { industries } from "@/content/industries";
import { Reveal } from "@/components/effects/Reveal";
import { BookDemoButton } from "@/components/cta/BookDemoButton";

/** Pin positions for each card's little dotted "map" (in %). */
const pins: [number, number][] = [
  [22, 38], [64, 30], [44, 62], [78, 58], [30, 26], [58, 46], [18, 64], [70, 22], [40, 40], [84, 44],
];

export function Industries() {
  return (
    <section
      id="industries"
      aria-labelledby="industries-title"
      className="paper relative z-10 mx-2 mt-4 rounded-[2rem] py-20 md:mx-4 md:rounded-[3rem] md:py-28"
    >
      <div className="container-x">
        <Reveal className="text-center">
          <p className="badge">Industries</p>
          <h2 id="industries-title" className="display mx-auto mt-5 max-w-3xl text-[clamp(2rem,4.6vw,3.6rem)] text-ink">
            A flexible solution for businesses that talk to customers
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-muted md:text-lg">The flow we&apos;d build, industry by industry.</p>
        </Reveal>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {industries.map((ind, i) => (
            <Reveal as="li" key={ind.id} delay={(i % 3) * 0.06}>
              <article className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-paper-line bg-paper-card transition-shadow duration-300 hover:shadow-[0_30px_60px_-30px_rgb(0_0_0/0.25)]">
                <div
                  aria-hidden
                  className="relative h-28 bg-[radial-gradient(circle,rgb(17_17_17/0.09)_1px,transparent_1.4px)] [background-size:12px_12px] [mask-image:linear-gradient(to_bottom,#000,transparent)]"
                >
                  <MapPin
                    className="absolute size-6 -translate-1/2 fill-flow/20 text-flow transition-transform duration-500 group-hover:-translate-y-[70%]"
                    style={{ left: `${pins[i % pins.length][0]}%`, top: `${pins[i % pins.length][1]}%` }}
                  />
                  <span
                    className="absolute size-2 -translate-1/2 rounded-full bg-ink/20"
                    style={{ left: `${pins[(i + 3) % pins.length][0]}%`, top: `${pins[(i + 3) % pins.length][1]}%` }}
                  />
                </div>
                <div className="flex flex-1 flex-col p-6 pt-2">
                  <h3 className="text-lg font-semibold tracking-tight text-ink">{ind.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{ind.outcome}</p>
                  <ol className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted" aria-label={`${ind.name} flow`}>
                    {ind.flow.map((step, s) => (
                      <li key={step} className="flex items-center gap-1.5">
                        <span className="rounded-full bg-paper px-2.5 py-1 font-medium text-ink">{step}</span>
                        {s < ind.flow.length - 1 && <span aria-hidden className="text-flow">→</span>}
                      </li>
                    ))}
                  </ol>
                </div>
              </article>
            </Reveal>
          ))}
          <Reveal as="li" delay={0.12} className="sm:col-span-2 lg:col-span-2">
            <div className="flex h-full flex-col justify-between gap-6 rounded-[1.5rem] bg-ink-950 p-7 text-fg md:p-9">
              <div>
                <p className="text-sm font-semibold text-flow">Don&apos;t see your industry?</p>
                <p className="mt-2 max-w-md text-2xl leading-snug font-semibold tracking-tight">
                  If your customers call, message or book — we can build your flow.
                </p>
              </div>
              <BookDemoButton label="Build my flow" interest="Custom industry flow" icon className="w-fit" />
            </div>
          </Reveal>
        </ul>
      </div>
    </section>
  );
}
