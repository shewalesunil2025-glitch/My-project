import Image from "next/image";
import { Quote } from "lucide-react";
import { founder } from "@/config/site";
import { Reveal } from "@/components/effects/Reveal";
import { BookDemoButton } from "@/components/cta/BookDemoButton";

export function Founder() {
  const initials = founder.name
    .split(" ")
    .map((w) => w[0])
    .join("");

  return (
    <section id="about" aria-labelledby="founder-title" className="relative py-28 md:py-40">
      <div className="absolute inset-0 bg-[radial-gradient(40%_50%_at_20%_50%,rgb(255_90_31/0.10),transparent_70%)]" aria-hidden />
      <div className="container-x relative grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <figure className="relative mx-auto max-w-md">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-flow/30 via-transparent to-live/20 blur-2xl" aria-hidden />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-850">
              {founder.photo ? (
                <Image
                  src={founder.photo}
                  alt={founder.photoAlt}
                  fill
                  sizes="(min-width: 1024px) 28rem, 90vw"
                  className="object-cover object-top"
                />
              ) : (
                <div className="grid size-full place-items-center bg-[radial-gradient(circle_at_50%_35%,rgb(255_90_31/0.18),transparent_60%)]">
                  <span className="display text-flow text-[7rem]" aria-hidden>
                    {initials}
                  </span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/90 via-ink-950/50 to-transparent p-5 pt-16">
                <p className="text-lg font-semibold">{founder.name}</p>
                <p className="text-sm text-flow-soft">{founder.role}</p>
              </div>
            </div>
          </figure>
        </Reveal>

        <div className="lg:col-span-7">
          <Reveal>
            <p className="badge mb-5">About · Founder</p>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 id="founder-title" className="display text-metal text-[clamp(2.4rem,5vw,4.2rem)]">
              {founder.name}
            </h2>
            <p className="mt-3 text-sm font-semibold text-flow">{founder.role}</p>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-8 text-xl leading-relaxed text-fg md:text-2xl">{founder.headline}</p>
          </Reveal>
          {founder.bio.map((p, i) => (
            <Reveal key={i} delay={0.16 + i * 0.04}>
              <p className="mt-5 max-w-2xl leading-relaxed text-fg-muted">{p}</p>
            </Reveal>
          ))}
          <Reveal delay={0.24}>
            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Focus areas">
              {founder.focus.map((f) => (
                <li key={f} className="rounded-full border border-white/10 px-3 py-1 text-xs text-fg-muted">
                  {f}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.28}>
            <blockquote className="glass mt-10 flex gap-4 rounded-2xl p-6">
              <Quote className="size-6 shrink-0 text-live" aria-hidden />
              <div>
                <p className="text-xs font-semibold tracking-wide text-fg-subtle uppercase">Vision</p>
                <p className="mt-2 text-xl font-medium tracking-tight">{founder.vision}</p>
              </div>
            </blockquote>
          </Reveal>
          <Reveal delay={0.32}>
            <div className="mt-10">
              <BookDemoButton label="Talk to Sunil" interest="Call with the founder" icon />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
