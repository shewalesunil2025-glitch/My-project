"use client";

import { Scramble } from "@/components/effects/Scramble";
import { motion } from "framer-motion";
import { customerFlow, fragmentedTools } from "@/content/flow";
import { RevealWords } from "@/components/effects/RevealWords";
import { Reveal } from "@/components/effects/Reveal";

/**
 * First "paper" section: the problem (too many disconnected tools) and the
 * answer (one connected customer journey).
 */
export function ConnectSection() {
  return (
    <section
      id="problem"
      aria-labelledby="connect-title"
      className="paper relative z-10 mx-2 mt-20 rounded-[2rem] py-20 md:mx-4 md:mt-28 md:rounded-[3rem] md:py-28"
    >
      <div className="container-x">
        <Reveal className="text-center">
          <p className="badge"><span aria-hidden className="text-flow-soft/80">01 //</span> <Scramble text="The problem" /></p>
          <h2 id="connect-title" className="display mx-auto mt-5 max-w-4xl text-[clamp(2rem,4.6vw,3.6rem)] text-ink">
            <RevealWords text="Your business shouldn’t need five different tools to talk to one customer." />
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:mt-16 lg:grid-cols-12">
          {/* Neural visual card */}
          <Reveal className="lg:col-span-5">
            <div className="relative h-full min-h-[22rem] overflow-hidden rounded-[1.75rem] bg-ink-950 p-7 text-fg md:min-h-[28rem]">
              <div aria-hidden className="absolute -top-24 -left-20 h-[30rem] w-[14rem] rotate-[28deg] bg-[linear-gradient(180deg,rgb(34_211_238/0.9),rgb(139_92_246/0.35)_45%,transparent)] blur-2xl" />
              <div aria-hidden className="absolute top-10 right-16 h-40 w-px bg-gradient-to-b from-flow-soft to-transparent" />
              <div className="relative flex h-full flex-col justify-end">
                <ul className="mb-8 flex flex-wrap gap-2" aria-label="Disconnected tools">
                  {fragmentedTools.map((t, i) => (
                    <motion.li
                      key={t}
                      initial={{ opacity: 0, y: 10, rotate: i % 2 ? 4 : -4 }}
                      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                      viewport={{ once: true, margin: "-10%" }}
                      transition={{ duration: 0.7, delay: 0.1 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                      className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium backdrop-blur"
                    >
                      {t}
                    </motion.li>
                  ))}
                </ul>
                <p className="text-sm font-medium text-fg-muted">The answer</p>
                <p className="display mt-1 text-[clamp(2rem,3.4vw,2.8rem)]">
                  We connect <span className="text-flow">the flow.</span>
                </p>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-5 lg:col-span-7">
            <Reveal delay={0.08}>
              <div className="rounded-[1.75rem] border border-paper-line bg-paper-card p-7 md:p-10">
                <p className="text-xl leading-snug font-semibold tracking-tight md:text-2xl">
                  Nexa Flow AI connects your website, WhatsApp, calls, bookings, follow-ups and reviews into one
                  intelligent system.
                </p>
                <p className="mt-4 max-w-xl text-ink-muted">
                  We don&apos;t just build a website. We build the system around the website — so every customer moves
                  from first visit to five-star review without anyone chasing them.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.14}>
              <div className="rounded-[1.75rem] border border-paper-line bg-paper-card p-6 md:p-8">
                <p className="text-sm font-semibold text-ink-muted">One connected journey</p>
                <ol className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
                  {customerFlow.map((step, i) => (
                    <li key={step.id} className="flex items-start gap-2.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-flow/10 text-flow">
                        <step.icon className="size-4" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-[0.7rem] font-semibold text-ink-muted">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="block text-sm leading-tight font-semibold">{step.label}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
