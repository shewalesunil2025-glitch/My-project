"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { ArrowUpRight, Bot, CalendarCheck, Globe, MessageCircle, PhoneCall, Sparkles, Star } from "lucide-react";
import { demos } from "@/content/demos";
import { cn } from "@/lib/cn";
import { useSequence } from "@/hooks/useSequence";
import { RevealWords } from "@/components/effects/RevealWords";
import { Reveal } from "@/components/effects/Reveal";
import { Appear } from "@/components/solutions/previews/parts";
import { ButtonLink } from "@/components/ui/Button";
import { BookDemoButton } from "@/components/cta/BookDemoButton";

const channels = [
  { icon: Globe, label: "Website", tint: "bg-orange-100 text-orange-600" },
  { icon: MessageCircle, label: "WhatsApp", tint: "bg-emerald-100 text-emerald-700" },
  { icon: PhoneCall, label: "Voice", tint: "bg-sky-100 text-sky-700" },
  { icon: Bot, label: "AI chat", tint: "bg-violet-100 text-violet-700" },
  { icon: CalendarCheck, label: "Booking", tint: "bg-amber-100 text-amber-700" },
  { icon: Star, label: "Reviews", tint: "bg-rose-100 text-rose-700" },
];

/** "Experience it now" — pick a demo system and watch its sample flow run. */
export function Demos() {
  const [activeId, setActiveId] = useState(demos[0].id);
  const demo = demos.find((d) => d.id === activeId) ?? demos[0];

  return (
    <section id="work" aria-labelledby="work-title" className="paper relative z-10 mx-2 rounded-[2rem] py-20 md:mx-4 md:rounded-[3rem] md:py-28">
      <div className="container-x">
        <Reveal className="text-center">
          <p className="badge">Work / Demos</p>
          <h2 id="work-title" className="display mt-5 text-[clamp(2rem,4.6vw,3.6rem)] text-ink">
            <RevealWords text="Experience it now" />
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-muted md:text-lg">
            Live systems, not screenshots. Each demo is a complete concept: the website, the conversations and the
            automation behind them.
          </p>
          <ul className="mt-7 flex flex-wrap justify-center gap-2" aria-label="Channels in every demo">
            {channels.map((c) => (
              <li key={c.label} title={c.label} className={cn("grid size-10 place-items-center rounded-xl", c.tint)}>
                <c.icon className="size-4" aria-hidden />
                <span className="sr-only">{c.label}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="relative mx-auto mt-12 max-w-4xl overflow-hidden rounded-[2rem] border border-paper-line bg-paper-card px-5 pt-12 pb-6 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.25)] md:px-10 md:pt-16 md:pb-10">
            {/* Sky dome */}
            <div aria-hidden className="absolute top-6 left-1/2 h-48 w-80 -translate-x-1/2 rounded-t-full bg-[linear-gradient(180deg,#cfe1f3,rgb(207_225_243/0))] md:h-56 md:w-[26rem]" />
            <div className="relative text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-xl bg-flow text-white shadow-[0_10px_24px_-8px_rgb(255_90_31/0.8)]">
                <Sparkles className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-ink md:text-3xl">Explore a live system</h3>
              <p className="mt-2 text-sm text-ink-muted">Choose a demo to see its automation run.</p>
            </div>

            <div role="radiogroup" aria-label="Choose a demo" className="relative mt-8 grid gap-2 sm:grid-cols-3">
              {demos.map((d) => {
                const selected = d.id === activeId;
                return (
                  <button
                    key={d.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setActiveId(d.id)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow] duration-300",
                      selected
                        ? "border-flow/50 bg-flow/[0.06] shadow-[0_0_0_3px_rgb(255_90_31/0.12)]"
                        : "border-paper-line bg-paper hover:border-ink/15",
                    )}
                  >
                    <span className="block text-xs font-semibold text-flow">{d.industry}</span>
                    <span className="mt-0.5 block font-semibold text-ink">{d.name}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={demo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="relative mt-5"
              >
                <p className="text-sm text-ink-muted">{demo.summary}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Systems included">
                  {demo.systems.map((s) => (
                    <li key={s} className="rounded-full border border-paper-line px-2.5 py-1 text-xs text-ink-muted">
                      {s}
                    </li>
                  ))}
                </ul>
                <LogPanel key={demo.id} demoId={demo.id} />
              </motion.div>
            </AnimatePresence>

            <div className="relative mt-6 flex flex-wrap gap-3">
              {demo.href ? (
                <ButtonLink href={demo.href} target="_blank" rel="noopener noreferrer" icon>
                  Explore a Demo
                </ButtonLink>
              ) : (
                <BookDemoButton label="Explore a Demo" interest={`${demo.name} demo walkthrough`} icon />
              )}
              <BookDemoButton label="Build This For My Business" interest={`${demo.industry} system`} variant="dark" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function LogPanel({ demoId }: { demoId: string }) {
  const demo = demos.find((d) => d.id === demoId)!;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  const step = useSequence(demo.events.length, 850, 3200, inView);

  return (
    <div ref={ref} className="mt-4 rounded-2xl border border-paper-line bg-paper p-4">
      <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
        <span className="flex items-center gap-2">
          <span className="size-1.5 animate-pulse-soft rounded-full bg-flow" aria-hidden />
          {demo.name} · sample flow
        </span>
        <ArrowUpRight className="size-4" aria-hidden />
      </div>
      <ol className="mt-3 min-h-[9.5rem] space-y-2 text-sm">
        {demo.events.map((e, i) => (
          <li key={i}>
            <Appear show={step > i} className="grid grid-cols-[3rem_5.5rem_1fr] gap-2 max-sm:grid-cols-[3rem_1fr]">
              <span className="font-mono text-xs leading-5 text-ink-muted">{e.time}</span>
              <span className="text-xs leading-5 font-semibold text-flow max-sm:hidden">{e.channel}</span>
              <span className="text-ink">{e.text}</span>
            </Appear>
          </li>
        ))}
      </ol>
    </div>
  );
}
