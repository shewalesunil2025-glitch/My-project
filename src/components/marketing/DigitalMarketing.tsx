"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Camera, Check, MapPin, Megaphone, MessageCircle, SquarePlay, Target, ThumbsUp } from "lucide-react";
import { digitalMarketing, inclusions, marketingSteps } from "@/content/digitalMarketing";
import { useDemo } from "@/components/cta/DemoProvider";
import { BookDemoButton } from "@/components/cta/BookDemoButton";
import { Scramble } from "@/components/effects/Scramble";
import { ScrollWords } from "@/components/effects/ScrollWords";
import { Reveal } from "@/components/effects/Reveal";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const ease = [0.16, 1, 0.3, 1] as const;

/** Channels circling the megaphone in the hero visual. */
const channels = [
  { icon: Camera, label: "Instagram" },
  { icon: ThumbsUp, label: "Facebook" },
  { icon: SquarePlay, label: "YouTube" },
  { icon: Target, label: "Google Ads" },
  { icon: MessageCircle, label: "WhatsApp" },
  { icon: MapPin, label: "Google Maps" },
];

/**
 * Digital Marketing, the premium package, in its own highlighted section:
 * what it is, the price, everything included and how a month runs.
 * Every card is clickable and opens the contact form for that item.
 */
export function DigitalMarketing() {
  const { openDemo } = useDemo();
  return (
    <section
      id={digitalMarketing.id}
      aria-labelledby="dm-title"
      className="relative mx-2 overflow-hidden rounded-[2rem] border border-flow/25 py-20 md:mx-4 md:rounded-[3rem] md:py-28 [background:radial-gradient(60%_50%_at_80%_0%,rgb(125_255_58/0.16),transparent_70%),radial-gradient(50%_40%_at_0%_100%,rgb(125_255_58/0.1),transparent_70%),var(--color-ink-900)]"
    >
      <div className="container-x relative">
        {/* Intro + price, with the channel orbit */}
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full bg-flow px-3 py-1 font-mono text-[0.65rem] font-semibold tracking-[0.16em] text-ink-950 uppercase">
                <Megaphone className="size-3.5" aria-hidden />
                <Scramble text="Premium · Digital Marketing" />
              </p>
            </Reveal>
            <ScrollWords
              id="dm-title"
              text="Grow your business with Digital Marketing."
              accentFrom={4}
              className="display mt-6 max-w-2xl text-[clamp(2.3rem,5.2vw,4.4rem)]"
            />
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-xl text-lg text-fg-muted">{digitalMarketing.tagline}</p>
            </Reveal>
            <Reveal delay={0.16} className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-5">
              <div>
                <p className="font-mono text-[0.62rem] tracking-[0.16em] text-fg-subtle uppercase">Starting at</p>
                <p className="mt-1 flex items-baseline gap-1">
                  <span className="display text-[3.4rem] leading-none text-flow-soft">{digitalMarketing.price}</span>
                  <span className="text-fg-muted">{digitalMarketing.billing}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <BookDemoButton label="Get Digital Marketing" interest={digitalMarketing.interest} icon className="btn-shine" />
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <ul className="mt-6 space-y-1.5 text-sm text-fg-subtle">
                {digitalMarketing.notes.map((n) => (
                  <li key={n} className="flex items-center gap-2">
                    <Check className="size-3.5 text-flow" aria-hidden /> {n}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <ChannelOrbit />
        </div>

        {/* What's included */}
        <div className="mt-20 md:mt-28">
          <Reveal className="text-center">
            <p className="font-mono text-[0.68rem] tracking-[0.18em] text-flow uppercase">[ What you get ]</p>
            <h3 className="display mx-auto mt-4 max-w-3xl text-[clamp(1.8rem,3.8vw,3rem)]">Everything in one package.</h3>
          </Reveal>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inclusions.map((item, i) => (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, y: 30, rotateX: 25 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                transition={{ duration: 0.8, delay: (i % 3) * 0.07, ease }}
                style={{ transformPerspective: 800 }}
              >
                <button
                  type="button"
                  onClick={() => openDemo(`${digitalMarketing.title} — ${item.title}`)}
                  className="glass group flex h-full w-full items-start gap-4 rounded-2xl p-5 text-left transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-flow/40"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-flow/30 bg-flow/10 text-flow transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                    <item.icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 font-semibold">
                      {item.title}
                      <ArrowUpRight
                        className="size-4 shrink-0 text-fg-subtle transition-[color,transform] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-flow"
                        aria-hidden
                      />
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-fg-muted">{item.body}</span>
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* How a month runs */}
        <MonthSteps />

        <Reveal className="mt-14 flex flex-col items-center gap-4 text-center">
          <p className="text-lg">Ready to grow? Let&apos;s plan your first month.</p>
          <BookDemoButton label="Start with Digital Marketing" interest={digitalMarketing.interest} icon />
        </Reveal>
      </div>
    </section>
  );
}

/** A glowing megaphone with the marketing channels orbiting it; each label stays upright. */
function ChannelOrbit() {
  const reduce = useReducedMotion();
  return (
    <Reveal delay={0.1} className="relative mx-auto aspect-square w-full max-w-[26rem]">
      <div aria-hidden className="absolute inset-[18%] rounded-full bg-[radial-gradient(closest-side,rgb(125_255_58/0.35),transparent)] blur-2xl" />
      <div aria-hidden className="absolute inset-[13%] rounded-full border border-dashed border-flow/25" />
      <div aria-hidden className="absolute inset-[24%] rounded-full border border-flow/15" />
      <div className="absolute inset-[34%] grid place-items-center rounded-full bg-flow text-ink-950 shadow-[0_0_80px_-10px_rgb(125_255_58/0.9)]">
        <Megaphone className="size-[38%]" aria-hidden />
        <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-flow/30 [animation-duration:2.6s]" />
      </div>
      <ul
        aria-label="Channels we run for you"
        className="absolute inset-[13%] animate-spin [animation-duration:36s]"
        style={reduce ? { animation: "none" } : undefined}
      >
        {channels.map((c, i) => {
          const a = (i / channels.length) * Math.PI * 2;
          return (
            <li
              key={c.label}
              className="absolute -translate-1/2"
              style={{ left: `${50 + Math.sin(a) * 50}%`, top: `${50 - Math.cos(a) * 50}%` }}
            >
              <span
                className="flex animate-spin items-center gap-1.5 rounded-full border border-flow/35 bg-ink-850/95 py-1.5 pr-3 pl-1.5 text-[0.7rem] font-medium whitespace-nowrap text-fg shadow-[0_10px_30px_-10px_rgb(125_255_58/0.6)] backdrop-blur [animation-direction:reverse] [animation-duration:36s] md:text-xs"
                style={reduce ? { animation: "none" } : undefined}
              >
                <span className="grid size-6 place-items-center rounded-full bg-flow/15 text-flow">
                  <c.icon className="size-3.5" aria-hidden />
                </span>
                {c.label}
              </span>
            </li>
          );
        })}
      </ul>
    </Reveal>
  );
}

function MonthSteps() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.6"] });
  const fill = useTransform(scrollYProgress, (v) => Math.min(1, Math.max(0, v)));
  return (
    <div className="mt-20 md:mt-28">
      <Reveal className="text-center">
        <p className="font-mono text-[0.68rem] tracking-[0.18em] text-flow uppercase">[ How a month works ]</p>
        <h3 className="display mx-auto mt-4 max-w-3xl text-[clamp(1.8rem,3.8vw,3rem)]">You approve. We do the rest.</h3>
      </Reveal>
      <div className="relative mt-12">
        <div aria-hidden className="absolute top-2 bottom-2 left-[1.35rem] w-px bg-white/10 md:top-[1.35rem] md:right-[10%] md:bottom-auto md:left-[10%] md:h-px md:w-auto">
          <motion.div style={{ scaleY: fill }} className="absolute inset-0 origin-top bg-flow shadow-[0_0_12px_rgb(125_255_58/0.8)] md:hidden" />
          <motion.div style={{ scaleX: fill }} className="absolute inset-0 origin-left bg-flow shadow-[0_0_12px_rgb(125_255_58/0.8)] max-md:hidden" />
        </div>
        <ol ref={ref} className="grid gap-6 md:grid-cols-5 md:gap-4">
          {marketingSteps.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -12% 0px" }}
              transition={{ duration: 0.8, delay: i * 0.08, ease }}
              className="relative pl-16 md:pl-0 md:text-center"
            >
              <span className="absolute top-0 left-0 grid size-11 place-items-center rounded-full border border-flow/40 bg-ink-950 text-flow shadow-[0_0_20px_-4px_rgb(125_255_58/0.8)] md:relative md:mx-auto">
                <s.icon className="size-5" aria-hidden />
              </span>
              <h4 className="text-base font-semibold md:mt-4">{s.title}</h4>
              <p className="mt-1 text-sm text-fg-muted">{s.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}
