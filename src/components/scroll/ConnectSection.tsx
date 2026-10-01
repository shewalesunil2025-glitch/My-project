"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { customerFlow, fragmentedTools } from "@/content/flow";
import { BookDemoButton } from "@/components/cta/BookDemoButton";
import { Scramble } from "@/components/effects/Scramble";
import { ScrollWords } from "@/components/effects/ScrollWords";
import { Reveal } from "@/components/effects/Reveal";
import { FingerprintScan } from "./FingerprintScan";

/**
 * The problem and the answer, in the reference's "light pillar" layout, followed by
 * a scanning card of Lumi's fingerprint, and the connected customer journey.
 */
export function ConnectSection() {
  return (
    <section id="problem" aria-labelledby="connect-title" className="relative">
      <PillarStatement />
      <ScanCard />
    </section>
  );
}

function PillarStatement() {
  return (
    <div className="relative flex min-h-svh items-center overflow-hidden py-28">
      <LightPillar />
      <div className="container-x relative grid items-center gap-12 md:grid-cols-12">
        <div className="md:col-span-6">
          <p className="mb-6 font-mono text-[0.68rem] tracking-[0.18em] text-flow uppercase">
            {"// "}
            <Scramble text="The problem" />
            {" //"}
          </p>
          <ScrollWords
            id="connect-title"
            text="Your business shouldn’t need five different tools to talk to one customer."
            className="display text-[clamp(2.1rem,4.4vw,3.8rem)]"
            dim={0.16}
          />
          <Reveal delay={0.2} className="mt-8">
            <ul className="flex flex-wrap gap-2" aria-label="Disconnected tools">
              {fragmentedTools.map((t) => (
                <li key={t} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-fg-muted">
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <div className="md:col-span-4 md:col-start-9">
          <Reveal>
            <p className="font-mono text-[0.68rem] tracking-[0.18em] text-fg-subtle uppercase">[ The answer ]</p>
            <p className="mt-4 text-lg leading-snug text-fg">
              Lumi connects your website, WhatsApp, calls, email, social media and reviews into one AI assistant.
            </p>
            <BookDemoButton size="md" className="mt-7" />
          </Reveal>
        </div>
      </div>
    </div>
  );
}

/** The glowing vertical beam from the reference, flaring where it meets the floor. */
function LightPillar() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 left-[58%] w-0 max-md:left-[80%]">
      <div className="absolute inset-y-0 left-0 w-[14rem] -translate-x-1/2 animate-pillar bg-[radial-gradient(50%_100%_at_50%_50%,rgb(125_255_58/0.35),transparent_70%)] blur-2xl" />
      <div className="absolute inset-y-0 left-0 w-10 -translate-x-1/2 bg-[linear-gradient(to_bottom,rgb(125_255_58/0),rgb(160_255_100/0.8)_45%,rgb(200_255_150/0.95)_80%,rgb(125_255_58/0.3))] blur-md" />
      <div className="absolute inset-y-0 left-0 w-[3px] -translate-x-1/2 bg-[linear-gradient(to_bottom,transparent,#eaffd9_50%,#b6ff8a)]" />
      <div className="absolute bottom-[4%] left-0 h-24 w-[36rem] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(200_255_150/0.9),rgb(125_255_58/0.35)_45%,transparent)] blur-lg" />
    </div>
  );
}

/** Lumi's fingerprint inside scan brackets, then the connected journey. */
function ScanCard() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.86, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [56, 28]);

  return (
    <div className="container-x pb-24 md:pb-32">
      <motion.div
        ref={ref}
        style={{ scale, borderRadius: radius }}
        className="relative overflow-hidden border border-white/10 bg-ink-900"
      >
        {/* Light leaking in from the top and bottom edges */}
        <div aria-hidden className="absolute top-0 left-1/2 h-40 w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(200_255_150/0.7),rgb(125_255_58/0.25)_50%,transparent)] blur-xl" />
        <div aria-hidden className="absolute bottom-0 left-1/2 h-40 w-[60%] -translate-x-1/2 translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(200_255_150/0.7),rgb(125_255_58/0.25)_50%,transparent)] blur-xl" />

        <div className="relative grid min-h-[34rem] items-center gap-8 p-6 md:grid-cols-12 md:p-12">
          <div className="order-2 md:order-1 md:col-span-4">
            <p className="font-mono text-[0.68rem] tracking-[0.18em] text-flow uppercase">
              <Scramble text="Meet Lumi" />
            </p>
            <p className="mt-3 text-2xl leading-tight tracking-tight">
              One AI, awake for every customer — on your site, on WhatsApp, on email, on social media and on the phone.
            </p>
            <p className="mt-6 font-mono text-[0.7rem] tracking-[0.14em] text-fg-subtle uppercase">
              Lumi <span className="text-flow">●</span> Scanning your business
            </p>
            <a
              href="#shambhu"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-flow underline-offset-4 hover:underline"
            >
              What Lumi will do for you →
            </a>
          </div>

          <div className="relative order-1 mx-auto h-[26rem] w-full max-w-[22rem] md:order-2 md:col-span-4 md:h-[30rem]">
            <ScanImage />
            <div aria-hidden className="scanlines pointer-events-none absolute inset-0 rounded-[1.6rem]" />
            <ScanBrackets />
          </div>

          <div className="order-3 md:col-span-4">
            <p className="font-mono text-[0.68rem] tracking-[0.18em] text-fg-subtle uppercase">[ One connected journey ]</p>
            <ol className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
              {customerFlow.map((step, i) => (
                <Reveal as="li" key={step.id} delay={i * 0.05} className="flex items-start gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-flow/25 bg-flow/10 text-flow">
                    <step.icon className="size-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-mono text-[0.62rem] text-fg-subtle">{String(i + 1).padStart(2, "0")}</span>
                    <span className="block text-sm leading-tight">{step.label}</span>
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/** The scanned print: Lumi's fingerprint, held still inside the card. */
function ScanImage() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[1.6rem] border border-flow/20 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9),0_0_60px_-25px_rgb(125_255_58/0.6)]">
      <FingerprintScan className="absolute -inset-[4%] size-[108%]" />
      {/* Edge fade into the card */}
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_55%,rgb(7_13_7/0.85))]" />
    </div>
  );
}

/** Corner brackets that lock onto the fingerprint. */
function ScanBrackets() {
  const corner = "absolute size-12 border-flow md:size-14";
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, scale: 1.25 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-20%" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none absolute top-[12%] left-1/2 h-[74%] w-[78%] -translate-x-1/2 drop-shadow-[0_0_8px_rgb(125_255_58/0.9)]"
    >
      <span className={`${corner} top-0 left-0 rounded-tl-2xl border-t-[3px] border-l-[3px]`} />
      <span className={`${corner} top-0 right-0 rounded-tr-2xl border-t-[3px] border-r-[3px]`} />
      <span className={`${corner} bottom-0 left-0 rounded-bl-2xl border-b-[3px] border-l-[3px]`} />
      <span className={`${corner} right-0 bottom-0 rounded-br-2xl border-r-[3px] border-b-[3px]`} />
    </motion.div>
  );
}
