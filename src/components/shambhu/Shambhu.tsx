"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useInView, useScroll, useTransform } from "framer-motion";
import { ArrowRight, BellRing, Bot, Check, Mic, PlayCircle, Search, Sparkles } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  appAreas,
  appNav,
  capabilities,
  journey,
  safeguards,
  sampleActivity,
  shambhu,
  store,
} from "@/content/shambhu";
import { heroCharacterConfig } from "@/config/site";
import { BookDemoButton } from "@/components/cta/BookDemoButton";
import { Scramble } from "@/components/effects/Scramble";
import { ScrollWords } from "@/components/effects/ScrollWords";
import { Reveal } from "@/components/effects/Reveal";
import { cn } from "@/lib/cn";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Shambhu — the AI Business Operating System app (in development).
 * An honest product showcase: what the assistant is being built to do, how a
 * business gets set up, the Automation Store and how data is kept safe. The app
 * preview is labelled as a preview and its activity as sample activity.
 */
export function Shambhu() {
  return (
    <section id="shambhu" aria-labelledby="shambhu-title" className="relative overflow-hidden py-24 md:py-36">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[40rem] bg-[radial-gradient(45%_55%_at_50%_0%,rgb(125_255_58/0.12),transparent_70%)]"
      />
      <div className="container-x relative">
        <Intro />
        <AppPreview />
        <Capabilities />
        <Journey />
        <Store />
        <Safeguards />
      </div>
    </section>
  );
}

function Intro() {
  return (
    <div className="text-center">
      <Reveal>
        <p className="badge"><Scramble text="Shambhu AI" /></p>
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
          Shambhu — the face you just saw scanning — is the app we are building: one assistant that answers your calls,
          WhatsApp, email and social media, follows up every lead and shows you everything it does.
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
  "Ask Shambhu anything…",
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
            Shambhu · Automation Control Centre
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
            {/* Ask Shambhu */}
            <div className="flex items-center gap-3 rounded-2xl border border-flow/25 bg-ink-950/70 px-4 py-3 shadow-[inset_0_0_30px_-12px_rgb(125_255_58/0.5)]">
              <Search className="size-4 shrink-0 text-flow" aria-hidden />
              <p className="min-w-0 flex-1 truncate text-sm text-fg/90" aria-label="Ask Shambhu anything">
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
        className="relative z-10 mx-auto -mt-16 w-[15.5rem] sm:absolute sm:right-[-1rem] sm:bottom-[-4rem] sm:mt-0 lg:right-[-5rem] lg:bottom-[-6rem]"
      >
        <div className="rounded-[2.2rem] border border-white/15 bg-ink-950 p-2 shadow-[0_40px_80px_-20px_rgb(0_0_0/0.9),0_0_60px_-20px_rgb(125_255_58/0.5)]">
          <div className="overflow-hidden rounded-[1.8rem] border border-white/[0.06] [background:linear-gradient(180deg,rgb(125_255_58/0.1),transparent_40%),var(--color-ink-900)]">
            <div className="flex items-center gap-2.5 px-4 pt-5">
              <span className="relative size-10 overflow-hidden rounded-full border border-flow/40 bg-ink-800">
                <Image
                  src={heroCharacterConfig.src}
                  alt=""
                  width={80}
                  height={100}
                  className="absolute -top-0.5 left-1/2 w-[140%] max-w-none -translate-x-1/2"
                />
              </span>
              <span>
                <span className="block text-sm font-semibold">Shambhu</span>
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
                  className={cn("flex flex-col items-center gap-1 text-[0.55rem]", i === 1 ? "text-flow" : "text-fg-subtle")}
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

/* ───────────────────────────── Capabilities ───────────────────────────── */

function Capabilities() {
  return (
    <div className="mt-28 md:mt-40">
      <SubHead label="What Shambhu does" title="One assistant. Every channel your customers use." />
      <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {capabilities.map((c, i) => (
          <motion.li
            key={c.title}
            initial={{ opacity: 0, y: 40, rotateX: 30 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            transition={{ duration: 0.9, delay: (i % 5) * 0.07, ease }}
            style={{ transformPerspective: 800 }}
          >
            <article className="glass group flex h-full flex-col gap-3 rounded-2xl p-4 md:p-5">
              <span className="grid size-10 place-items-center rounded-xl border border-flow/25 bg-flow/10 text-flow transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                <c.icon className="size-4" aria-hidden />
              </span>
              <h4 className="text-sm font-semibold md:text-base">{c.title}</h4>
              <p className="text-xs leading-relaxed text-fg-muted md:text-sm">{c.body}</p>
              <span className="mt-auto font-mono text-[0.6rem] text-fg-subtle">[ {String(i + 1).padStart(2, "0")} ]</span>
            </article>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────────────────────── Journey ───────────────────────────── */

function Journey() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.75", "end 0.55"] });
  const fill = useTransform(scrollYProgress, (v) => Math.min(1, Math.max(0, v)));

  return (
    <div className="mt-28 md:mt-40">
      <SubHead label="How it works" title="From sign-up to a working assistant — in ten steps." />
      <div className="relative mx-auto mt-12 max-w-3xl">
        {/* The line fills as you scroll through the steps */}
        <div aria-hidden className="absolute top-2 bottom-2 left-[1.1rem] w-px bg-white/10 md:left-1/2">
          <motion.div
            style={{ scaleY: fill }}
            className="absolute inset-0 origin-top bg-gradient-to-b from-flow-soft via-flow to-flow-strong shadow-[0_0_12px_rgb(125_255_58/0.8)]"
          />
        </div>
        <ol ref={ref} className="space-y-6 md:space-y-4">
          {journey.map((step, i) => {
            const right = i % 2 === 1;
            return (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, x: right ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "0px 0px -15% 0px" }}
                transition={{ duration: 0.8, ease }}
                className={cn(
                  "relative pl-12 md:w-1/2 md:pl-0",
                  right ? "md:ml-auto md:pl-10" : "md:pr-10 md:text-right",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0 grid size-9 place-items-center rounded-full border border-flow/40 bg-ink-950 font-mono text-[0.7rem] text-flow shadow-[0_0_20px_-4px_rgb(125_255_58/0.8)]",
                    right ? "md:-left-[1.125rem]" : "md:right-[-1.125rem] md:left-auto",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h4 className="text-base font-semibold md:text-lg">{step.title}</h4>
                <p className="mt-1 text-sm text-fg-muted">{step.body}</p>
              </motion.li>
            );
          })}
        </ol>
      </div>
      <Reveal>
        <p className="mx-auto mt-10 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-center text-sm leading-relaxed text-fg-muted">
          <span className="font-semibold text-fg">Honest note:</span> activation is not instant. It depends on you
          authorising each account, on platform approval (for example WhatsApp Business) and on the business details you
          share. Shambhu shows you the status of every step.
        </p>
      </Reveal>
    </div>
  );
}

/* ───────────────────────────── Automation Store ───────────────────────────── */

function Store() {
  const regular = store.filter((s) => !s.premium);
  const premium = store.find((s) => s.premium);
  return (
    <div id="store" className="mt-28 scroll-mt-24 md:mt-40">
      <SubHead label="Automation Store" title="Buy only what you need. Add more any time." />
      <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {regular.map((s, i) => (
          <Reveal as="li" key={s.title} delay={(i % 4) * 0.05}>
            <article className="glass group flex h-full flex-col rounded-2xl p-4 md:p-5">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl border border-flow/25 bg-flow/10 text-flow transition-transform duration-500 group-hover:scale-110">
                  <s.icon className="size-4" aria-hidden />
                </span>
                <span className="font-mono text-[0.58rem] tracking-[0.12em] text-fg-subtle uppercase max-sm:hidden">
                  Individual
                </span>
              </div>
              <h4 className="mt-4 text-sm font-semibold md:text-base">{s.title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-fg-muted md:text-sm">{s.body}</p>
              <p className="mt-auto flex items-center justify-between gap-2 pt-4 font-mono text-[0.6rem] tracking-[0.08em] whitespace-nowrap text-fg-subtle uppercase sm:tracking-[0.14em]">
                Pricing at launch
                <ArrowRight className="size-3.5 text-flow transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </p>
            </article>
          </Reveal>
        ))}
      </ul>

      {premium && (
        <Reveal delay={0.1} className="mt-4">
          <article className="beam relative grid items-center gap-6 overflow-hidden rounded-[1.5rem] border border-flow/40 p-6 [background:linear-gradient(120deg,rgb(125_255_58/0.14),rgb(125_255_58/0.02)_55%),var(--color-ink-850)] md:grid-cols-[1fr_auto] md:p-9">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-flow text-ink-950">
                <premium.icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="flex items-center gap-2">
                  <span className="text-xl font-semibold tracking-tight md:text-2xl">{premium.title}</span>
                  <span className="rounded-full bg-flow px-2 py-0.5 text-xs font-semibold text-ink-950">Premium</span>
                </p>
                <p className="mt-2 max-w-xl text-sm text-fg-muted md:text-base">{premium.body}</p>
              </div>
            </div>
            <BookDemoButton label="Ask about this package" interest="Digital Marketing — premium package" icon className="w-fit" />
          </article>
        </Reveal>
      )}
      <p className="mt-5 text-center text-sm text-fg-muted">
        Store prices will be announced at launch. Need it built today?{" "}
        <a href="#services" className="text-flow underline-offset-4 hover:underline">
          See our agency services
        </a>
        .
      </p>
    </div>
  );
}

/* ───────────────────────────── Safeguards ───────────────────────────── */

function Safeguards() {
  return (
    <div className="mt-28 md:mt-40">
      <SubHead label="Security" title="Built so you stay in control." />
      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
      <Reveal delay={0.1} className="mt-12 flex flex-col items-center gap-4 text-center">
        <p className="flex items-center gap-2 text-lg">
          <Bot className="size-5 text-flow" aria-hidden />
          Be one of the first businesses on Shambhu.
        </p>
        <BookDemoButton label="Join early access" interest={shambhu.interest} icon />
      </Reveal>
    </div>
  );
}

function SubHead({ label, title }: { label: string; title: string }) {
  return (
    <Reveal className="text-center">
      <p className="font-mono text-[0.68rem] tracking-[0.18em] text-flow uppercase">[ {label} ]</p>
      <h3 className="display mx-auto mt-4 max-w-3xl text-[clamp(1.8rem,3.8vw,3rem)]">{title}</h3>
    </Reveal>
  );
}
