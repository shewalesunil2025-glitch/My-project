"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Reveal } from "@/components/effects/Reveal";

const statement = "WE DON'T ADD MORE TOOLS. WE CONNECT THE ONES THAT MATTER.";

const principles = [
  { title: "Simple by design", body: "If it needs a manual, we haven't finished designing it." },
  { title: "Connected, not stacked", body: "One flow across website, chat, WhatsApp and voice." },
  { title: "Human when it matters", body: "AI handles the repetitive. Your team handles the personal." },
];

export function Philosophy() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = statement.split(" ");

  return (
    <section aria-labelledby="why-title" className="relative py-28 md:py-44">
      <div className="container-x">
        <h2 id="why-title" className="eyebrow mb-8">
          Why Nexa Flow AI
        </h2>
        <p ref={ref} className="display max-w-6xl text-[clamp(2.4rem,6.6vw,6rem)]" aria-label={statement}>
          {words.map((w, i) => (
            <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} highlight={i >= 5}>
              {w}
            </Word>
          ))}
        </p>

        <Reveal>
          <p className="mt-12 max-w-xl text-xl text-fg-muted md:text-2xl">
            Technology should simplify your business, not complicate it.
          </p>
        </Reveal>

        <ul className="mt-20 grid gap-px overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-white/[0.07] md:grid-cols-3">
          {principles.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 0.08} className="bg-ink-950 p-8 md:p-10">
              <span className="font-mono text-[0.65rem] text-fg-subtle">0{i + 1}</span>
              <h3 className="mt-6 text-xl font-medium tracking-tight">{p.title}</h3>
              <p className="mt-2 text-fg-muted">{p.body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Word({
  children,
  progress,
  range,
  highlight,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  highlight: boolean;
}) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  return (
    <motion.span aria-hidden style={{ opacity }} className={highlight ? "text-flow" : "text-fg"}>
      {children}{" "}
    </motion.span>
  );
}
