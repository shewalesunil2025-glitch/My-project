"use client";

import { Scramble } from "@/components/effects/Scramble";
import { businessCategories } from "@/content/shambhu";
import { RevealWords } from "@/components/effects/RevealWords";
import { Reveal } from "@/components/effects/Reveal";
import { BookDemoButton } from "@/components/cta/BookDemoButton";

/** The businesses IBAX AI is built for, as one light panel of categories. */
export function Industries() {
  return (
    <section
      id="industries"
      aria-labelledby="industries-title"
      className="paper relative z-10 mx-2 mt-4 rounded-[2rem] py-20 md:mx-4 md:rounded-[3rem] md:py-28"
    >
      <div className="container-x">
        <Reveal className="text-center">
          <p className="badge"><Scramble text="Industries" /></p>
          <h2 id="industries-title" className="display mx-auto mt-5 max-w-3xl text-[clamp(2rem,4.6vw,3.6rem)] text-ink">
            <RevealWords text="Built for businesses that talk to customers" />
          </h2>
        </Reveal>

        <ul className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2.5" aria-label="Business categories">
          {businessCategories.map((c, i) => (
            <Reveal as="li" key={c} delay={(i % 6) * 0.04} y={16}>
              <span className="block rounded-full border border-paper-line bg-paper-card px-4 py-2 text-sm text-ink transition-colors duration-300 hover:border-flow/50 hover:text-flow md:text-base">
                {c}
              </span>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.1} className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="text-ink-muted">Don&apos;t see yours? If your customers call, message or book — IBAX AI can help.</p>
          <BookDemoButton label="Talk to us" interest="Other business type" icon className="w-fit" />
        </Reveal>
      </div>
    </section>
  );
}
