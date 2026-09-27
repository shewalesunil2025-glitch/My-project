"use client";

import { motion } from "framer-motion";
import { HeartHandshake, Link2, Sparkles, type LucideIcon } from "lucide-react";
import { Scramble } from "@/components/effects/Scramble";
import { Reveal } from "@/components/effects/Reveal";
import { ScrollWords } from "@/components/effects/ScrollWords";

const principles: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "Simple by design", body: "If it needs a manual, we haven't finished designing it.", icon: Sparkles },
  { title: "Connected, not stacked", body: "One flow across website, chat, WhatsApp and voice.", icon: Link2 },
  { title: "Human when it matters", body: "AI handles the repetitive. Your team handles the personal.", icon: HeartHandshake },
];

/** "We are…" in the reference's green bento: two hero tiles over three principle tiles. */
export function Philosophy() {
  return (
    <section aria-labelledby="why-title" className="relative py-24 md:py-36">
      <div className="container-x">
        <p className="text-center font-mono text-[0.68rem] tracking-[0.18em] text-flow uppercase">
          {"// "}
          <Scramble text="Why Nexa Flow AI" />
          {" //"}
        </p>
        <ScrollWords
          id="why-title"
          text="We don't add more tools. We connect the ones that matter."
          accentFrom={5}
          className="display mx-auto mt-6 max-w-4xl text-center text-[clamp(2rem,4.6vw,3.8rem)]"
        />
        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-lg text-center text-sm text-fg-muted md:text-base">
            Technology should simplify your business, not complicate it.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-3 md:grid-cols-12">
          {/* Green light-ray tile */}
          <Reveal className="md:col-span-7">
            <div className="relative h-72 overflow-hidden rounded-[1.5rem] border border-flow/30 bg-[linear-gradient(135deg,#1f6b16,#0d3a0b_55%,#062006)] p-7 md:h-80">
              <div aria-hidden className="absolute inset-0 bg-[linear-gradient(115deg,transparent_46%,rgb(210_255_170/0.55)_49.6%,transparent_52%),linear-gradient(65deg,transparent_46%,rgb(210_255_170/0.35)_49.7%,transparent_52%)]" />
              <motion.div
                aria-hidden
                className="absolute top-[40%] left-[55%] size-3 rounded-full bg-white shadow-[0_0_30px_12px_rgb(200_255_150/0.9)]"
                animate={{ scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <p className="relative mt-auto font-mono text-[0.65rem] tracking-[0.14em] text-flow-soft uppercase">
                Nexa Flow AI
              </p>
              <p className="absolute bottom-7 left-7 max-w-xs text-2xl leading-tight tracking-tight">
                We connect the flow — website, conversations and workflows as one system.
              </p>
            </div>
          </Reveal>
          {/* Dark tile with a glowing slab */}
          <Reveal delay={0.08} className="md:col-span-5">
            <div className="relative h-72 overflow-hidden rounded-[1.5rem] border border-white/10 bg-ink-900 p-7 md:h-80">
              <p className="relative max-w-[15rem] text-lg leading-snug">
                Our focus is on staying ahead of the curve with AI that actually ships.
              </p>
              <motion.div
                aria-hidden
                className="absolute right-[-8%] bottom-[-6%] h-40 w-[80%] rounded-[1.6rem] border border-white/10 bg-[linear-gradient(160deg,#1c2b1d,#050a05)] shadow-[0_-20px_60px_-20px_rgb(125_255_58/0.6),inset_0_1px_0_rgb(255_255_255/0.08)] [transform:perspective(700px)_rotateX(52deg)_rotateZ(-14deg)]"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </Reveal>

          {principles.map((p, i) => (
            <Reveal key={p.title} delay={0.1 + i * 0.06} className="md:col-span-4">
              <div className="glass relative h-full overflow-hidden rounded-[1.5rem] p-7">
                {i === 1 && (
                  <div aria-hidden className="absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(200_255_150/0.55),rgb(125_255_58/0.15)_55%,transparent)] blur-md" />
                )}
                <div className="relative grid h-28 place-items-center">
                  <motion.span
                    className="grid size-16 place-items-center rounded-2xl border border-flow/40 bg-flow/10 text-flow shadow-[0_0_40px_-6px_rgb(125_255_58/0.7)]"
                    animate={{ y: [0, -6, 0], rotate: [0, i % 2 ? 4 : -4, 0] }}
                    transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <p.icon className="size-7" aria-hidden />
                  </motion.span>
                </div>
                <p className="relative mt-4 font-mono text-[0.62rem] text-fg-subtle">[ 0{i + 1} ]</p>
                <h3 className="relative mt-1 text-lg tracking-tight">{p.title}</h3>
                <p className="relative mt-1.5 text-sm leading-relaxed text-fg-muted">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
