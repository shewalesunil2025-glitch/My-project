"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useScroll, useTransform } from "framer-motion";
import { BellRing, Check, Mic, PlayCircle, Search, Sparkles } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  appAreas,
  appNav,
  journey,
  safeguards,
  sampleActivity,
  shambhu,
} from "@/content/shambhu";
import { BookDemoButton } from "@/components/cta/BookDemoButton";
import { Scramble } from "@/components/effects/Scramble";
import { ScrollWords } from "@/components/effects/ScrollWords";
import { Reveal } from "@/components/effects/Reveal";
import { cn } from "@/lib/cn";
import { ShambhuBot } from "./ShambhuBot";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * IBAX — the AI Business Operating System app (in development).
 * An honest product showcase: the app preview (labelled as a preview, with
 * sample activity), how a business goes live and how data is kept safe.
 */
export function Shambhu() {
  return (
    <section id="ibax-ai" aria-labelledby="shambhu-title" className="relative overflow-hidden py-24 md:py-36">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[40rem] bg-[radial-gradient(45%_55%_at_50%_0%,rgb(125_255_58/0.12),transparent_70%)]"
      />
      <div className="container-x relative">
        <Intro />
        <AppPreview />
        <Journey />
        <Safeguards />
      </div>
    </section>
  );
}

function Intro() {
  return (
    <div className="text-center">
      <Reveal>
        <p className="badge"><Scramble text="IBAX AI" /></p>
      </Reveal>
      <ScrollWords
        id="shambhu-title"
        text="Your AI Business Operating System."
        accentFrom={1}
        className="display mx-auto mt-5 max-w-4xl text-[clamp(2.3rem,5.6vw,4.6rem)]"
      />
      <Reveal delay={0.1}>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-fg md:text-xl">{shambhu.positioning}</p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-fg-muted md:text-base">
          One assistant for your calls, WhatsApp, email and social media — and one app to see everything it does.
        </p>
      </Reveal>
      <Reveal delay={0.18} className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <BookDemoButton label="Join early access" interest={shambhu.interest} icon className="btn-shine" />
        <span
          aria-disabled
          className="inline-flex h-12 items-center gap-2 rounded-full border border-white/10 px-5 text-sm text-fg-muted"
        >
          <PlayCircle className="size-4 text-flow" aria-hidden />
          Watch demo · coming soon
        </span>
      </Reveal>
      <Reveal delay={0.24}>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-flow/25 bg-flow/[0.06] px-3 py-1 font-mono text-[0.65rem] tracking-[0.16em] text-flow uppercase">
          <span className="size-1.5 animate-pulse rounded-full bg-flow" aria-hidden />
          {shambhu.status}
        </p>
      </Reveal>
    </div>
  );
}

/* ───────────────────────────── App preview ───────────────────────────── */

const prompts = [
  "Ask IBAX anything…",
  "Reply to today’s WhatsApp enquiries",
  "Draft a post for this weekend’s offer",
  "Follow up with yesterday’s leads",
];

/** Types each prompt out, holds it, deletes it, then types the next. */
function useTypewriter(active: boolean) {
  const [text, setText] = useState(prompts[0]);
  useEffect(() => {
    if (!active) return;
    let p = 0;
    let i = prompts[0].length;
    let hold = 45;
    let deleting = true;
    const id = setInterval(() => {
      if (hold > 0) {
        hold--;
        return;
      }
      if (deleting) {
        i = Math.max(0, i - 2);
        if (i === 0) {
          deleting = false;
          p = (p + 1) % prompts.length;
        }
      } else {
        i++;
        if (i >= prompts[p].length) {
          deleting = true;
          hold = 45;
        }
      }
      setText(prompts[p].slice(0, i));
    }, 45);
    return () => clearInterval(id);
  }, [active]);
  return text;
}

/** Rotates the sample activity so a new row slides in at the top every few seconds. */
function useActivityFeed(active: boolean, size: number) {
  const [start, setStart] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setStart((s) => (s + sampleActivity.length - 1) % sampleActivity.length), 2600);
    return () => clearInterval(id);
  }, [active]);
  return Array.from({ length: size }, (_, k) => sampleActivity[(start + k) % sampleActivity.length]);
}

function AppPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const typed = useTypewriter(inView && !reduce);
  const feed = useActivityFeed(inView && !reduce, 4);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const tilt = useTransform(scrollYProgress, (v) => (reduce ? 0 : (1 - Math.min(1, v)) * 18));
  const lift = useTransform(scrollYProgress, (v) => (reduce ? 0 : (1 - Math.min(1, v)) * 80));
  const phoneY = useTransform(scrollYProgress, (v) => (reduce ? 0 : (1 - Math.min(1, v)) * 160));

  return (
    <div ref={ref} className="relative mx-auto mt-16 max-w-5xl [perspective:1600px] md:mt-24">
      <p className="mb-4 text-center font-mono text-[0.62rem] tracking-[0.18em] text-fg-subtle uppercase">
        [ Preview · app in development · sample activity ]
      </p>

      {/* Desktop dashboard */}
      <motion.div
        style={{ rotateX: tilt, y: lift }}
        className="beam relative origin-bottom overflow-hidden rounded-[1.5rem] border border-white/10 [background:linear-gradient(180deg,rgb(125_255_58/0.07),transparent_30%),var(--color-ink-900)] shadow-[0_60px_120px_-40px_rgb(125_255_58/0.35)]"
      >
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3">
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="ml-3 font-mono text-[0.62rem] tracking-[0.14em] text-fg-subtle uppercase">
            IBAX · Automation Control Centre
          </span>
        </div>

        <div className="grid md:grid-cols-[13rem_1fr]">
          <nav aria-label="App areas (preview)" className="hidden border-r border-white/[0.07] p-3 md:block">
            <ul className="space-y-0.5 text-sm">
              {appAreas.map((area, i) => (
                <li
                  key={area}
                  className={cn(
                    "rounded-lg px-3 py-2 text-fg-muted",
                    i === 0 && "bg-flow/10 text-flow",
                  )}
                >
                  {area}
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 p-4 md:p-6">
            {/* Ask IBAX */}
            <div className="flex items-center gap-3 rounded-2xl border border-flow/25 bg-ink-950/70 px-4 py-3 shadow-[inset_0_0_30px_-12px_rgb(125_255_58/0.5)]">
              <Search className="size-4 shrink-0 text-flow" aria-hidden />
              <p className="min-w-0 flex-1 truncate text-sm text-fg/90" aria-label="Ask IBAX anything">
                {typed}
                <span aria-hidden className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-flow" />
              </p>
              <span className="grid size-8 place-items-center rounded-full bg-flow text-ink-950">
                <Mic className="size-4" aria-hidden />
              </span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_15rem]">
              <div className="min-w-0">
                <p className="flex items-center justify-between font-mono text-[0.62rem] tracking-[0.16em] text-fg-subtle uppercase">
                  Activity Centre
                  <span className="flex items-center gap-1.5 text-flow">
                    <span className="size-1.5 animate-pulse rounded-full bg-flow" aria-hidden />
                    Live preview
                  </span>
                </p>
                <ul className="relative mt-3 h-[16rem] space-y-2 overflow-hidden [mask-image:linear-gradient(to_bottom,#000_78%,transparent)]" aria-live="off">
                  <AnimatePresence initial={false} mode="popLayout">
                    {feed.map((row) => (
                      <motion.li
                        key={row.text}
                        layout
                        initial={{ opacity: 0, y: -18, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 18 }}
                        transition={{ duration: 0.6, ease }}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-flow/25 bg-flow/10 text-flow">
                          <row.icon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-mono text-[0.6rem] tracking-[0.12em] text-fg-subtle uppercase">
                            {row.channel}
                          </span>
                          <span className="block truncate text-sm">{row.text}</span>
                        </span>
                        <Check className="ml-auto size-4 shrink-0 text-flow" aria-hidden />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>

              <div className="hidden space-y-3 lg:block">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <BellRing className="size-4 text-flow" aria-hidden /> Needs your approval
                  </p>
                  <p className="mt-2 text-sm text-fg-muted">Review reply for a new Google review.</p>
                  <div className="mt-3 flex gap-2">
                    <span className="rounded-full bg-flow px-3 py-1 text-xs font-semibold text-ink-950">Approve</span>
                    <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-fg-muted">Edit</span>
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-sm font-semibold">Services</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-fg-muted">
                    {["WhatsApp", "AI Voice", "Google Reviews"].map((s) => (
                      <li key={s} className="flex items-center justify-between">
                        {s}
                        <span className="h-4 w-7 rounded-full bg-flow/80 p-0.5">
                          <span className="ml-auto block size-3 rounded-full bg-ink-950" />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Phone, rising a little faster than the dashboard */}
      <motion.div
        style={{ y: phoneY }}
        className="relative z-10 mx-auto mt-8 w-[17rem] sm:absolute sm:right-[-1rem] sm:bottom-[-4rem] sm:mt-0 lg:right-[-5rem] lg:bottom-[-6rem]"
      >
        <div className="rounded-[2.2rem] border border-white/15 bg-ink-950 p-2 shadow-[0_40px_80px_-20px_rgb(0_0_0/0.9),0_0_60px_-20px_rgb(125_255_58/0.5)]">
          <div className="overflow-hidden rounded-[1.8rem] border border-white/[0.06] [background:linear-gradient(180deg,rgb(125_255_58/0.1),transparent_40%),var(--color-ink-900)]">
            <div className="flex items-center gap-2.5 px-4 pt-5">
              <ShambhuBot className="size-11 shrink-0 overflow-hidden rounded-full border border-flow/40" />
              <span>
                <span className="block text-sm font-semibold">IBAX</span>
                <span className="flex items-center gap-1 text-[0.65rem] text-flow">
                  <span className="size-1.5 rounded-full bg-flow" aria-hidden /> Your assistant
                </span>
              </span>
            </div>
            <div className="space-y-2 px-4 py-4 text-[0.72rem]">
              <p className="w-fit max-w-[85%] rounded-2xl rounded-tl-sm bg-white/[0.06] px-3 py-2">
                Good morning! 3 things need you today.
              </p>
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-flow px-3 py-2 text-ink-950">
                Show me the leads first
              </p>
              <p className="flex w-fit items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white/[0.06] px-3 py-2">
                <Sparkles className="size-3 text-flow" aria-hidden /> On it…
              </p>
            </div>
            <ul className="grid grid-cols-5 border-t border-white/[0.07] px-1 py-2" aria-label="App navigation (preview)">
              {appNav.map((item, i) => (
                <li
                  key={item.label}
                  className={cn(
                    "flex min-w-0 flex-col items-center gap-1 text-[0.58rem] leading-none tracking-tight",
                    i === 1 ? "text-flow" : "text-fg-subtle",
                  )}
                >
                  <item.icon className="size-4" aria-hidden />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ───────────────────────────── How it works ───────────────────────────── */

function Journey() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.6"] });
  const fill = useTransform(scrollYProgress, (v) => Math.min(1, Math.max(0, v)));

  return (
    <div className="mt-28 md:mt-40">
      <SubHead label="How it works" title="Live in five simple steps." />
      <div className="relative mt-12">
        {/* The line fills as you scroll: down the steps on phones, across them on desktop */}
        <div aria-hidden className="absolute top-2 bottom-2 left-[1.1rem] w-px bg-white/10 md:top-[1.1rem] md:right-[10%] md:bottom-auto md:left-[10%] md:h-px md:w-auto">
          <motion.div
            style={{ scaleY: fill }}
            className="absolute inset-0 origin-top bg-flow shadow-[0_0_12px_rgb(125_255_58/0.8)] md:hidden"
          />
          <motion.div
            style={{ scaleX: fill }}
            className="absolute inset-0 origin-left bg-flow shadow-[0_0_12px_rgb(125_255_58/0.8)] max-md:hidden"
          />
        </div>
        <ol ref={ref} className="grid gap-6 md:grid-cols-5 md:gap-4">
          {journey.map((step, i) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -12% 0px" }}
              transition={{ duration: 0.8, delay: i * 0.08, ease }}
              className="relative pl-12 md:pl-0 md:text-center"
            >
              <span className="absolute top-0 left-0 grid size-9 place-items-center rounded-full border border-flow/40 bg-ink-950 font-mono text-[0.7rem] text-flow shadow-[0_0_20px_-4px_rgb(125_255_58/0.8)] md:relative md:mx-auto">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h4 className="text-base font-semibold md:mt-4">{step.title}</h4>
              <p className="mt-1 text-sm text-fg-muted">{step.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
      <p className="mx-auto mt-10 max-w-xl text-center text-sm text-fg-subtle">
        Going live depends on each platform&apos;s approval (for example WhatsApp Business), so it isn&apos;t instant —
        IBAX shows you the status of every step.
      </p>
    </div>
  );
}

/* ───────────────────────────── Safeguards ───────────────────────────── */

function Safeguards() {
  return (
    <ul className="mt-20 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Security">
      {safeguards.map((s, i) => (
        <Reveal as="li" key={s.title} delay={i * 0.06}>
          <div className="flex h-full items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <s.icon className="mt-0.5 size-5 shrink-0 text-flow" aria-hidden />
            <span>
              <span className="block font-semibold">{s.title}</span>
              <span className="mt-1 block text-sm text-fg-muted">{s.body}</span>
            </span>
          </div>
        </Reveal>
      ))}
    </ul>
  );
}

export function SubHead({ label, title }: { label: string; title: string }) {
  return (
    <Reveal className="text-center">
      <p className="font-mono text-[0.68rem] tracking-[0.18em] text-flow uppercase">[ {label} ]</p>
      <h3 className="display mx-auto mt-4 max-w-3xl text-[clamp(1.8rem,3.8vw,3rem)]">{title}</h3>
    </Reveal>
  );
}
