"use client";

import { Reveal } from "@/components/effects/Reveal";
import { ScrollWords } from "@/components/effects/ScrollWords";

const principles = [
  { title: "Simple by design", body: "If it needs a manual, we haven't finished designing it." },
  { title: "Connected, not stacked", body: "One flow across website, chat, WhatsApp and voice." },
  { title: "Human when it matters", body: "AI handles the repetitive. Your team handles the personal." },
];

export function Philosophy() {
  return (
    <section aria-labelledby="why-title" className="relative py-24 md:py-36">
      <div className="container-x">
        <Reveal className="text-center">
          <p className="badge">Why Nexa Flow AI</p>
        </Reveal>
        <ScrollWords
          id="why-title"
          text="We don't add more tools. We connect the ones that matter."
          accentFrom={5}
          className="display mx-auto mt-6 max-w-5xl text-center text-[clamp(2.2rem,5.6vw,4.6rem)]"
        />
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl text-center text-fg-muted md:text-lg">
            Technology should simplify your business, not complicate it.
          </p>
        </Reveal>
        <ul className="mt-14 grid gap-4 md:grid-cols-3">
          {principles.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 0.06}>
              <div className="glass h-full rounded-2xl p-6 md:p-7">
                <span className="text-xs font-semibold text-flow">0{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
