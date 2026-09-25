"use client";

import { ecosystem } from "@/content/flow";
import { DottedGlobe, type GlobeMarker } from "@/components/3d/DottedGlobe";
import { Reveal } from "@/components/effects/Reveal";
import { ScrollWords } from "@/components/effects/ScrollWords";

const markers: GlobeMarker[] = [
  { lat: 22, lng: 74, label: "Website" },
  { lat: 48, lng: 10, label: "WhatsApp" },
  { lat: 38, lng: -98, label: "AI Voice" },
  { lat: -12, lng: 30, label: "Booking" },
  { lat: 2, lng: 112, label: "CRM" },
  { lat: -24, lng: -52, label: "Reviews" },
];
const links: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 3],
  [0, 4],
  [3, 5],
  [2, 5],
];

/** "One system" — the connected flow shown as a glowing dotted globe. */
export function OneSystem() {
  return (
    <section id="ecosystem" aria-labelledby="one-title" className="relative overflow-hidden pt-24 md:pt-36">
      <div className="container-x relative z-10 text-center">
        <Reveal>
          <p className="badge">One system</p>
        </Reveal>
        <ScrollWords
          id="one-title"
          text="One business. One intelligent flow."
          accentFrom={2}
          className="display mx-auto mt-5 max-w-3xl text-[clamp(2.1rem,4.8vw,3.8rem)]"
        />
        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-xl text-fg-muted md:text-lg">
            One AI in the middle runs all six. A new lead on your website becomes a WhatsApp chat, a booking and a
            review — automatically.
          </p>
        </Reveal>
      </div>

      <div className="relative mx-auto -mt-4 h-[26rem] max-w-6xl sm:h-[34rem] md:-mt-10 md:h-[40rem]">
        <DottedGlobe markers={markers} links={links} radiusRatio={0.34} centerY={0.9} className="max-md:hidden" />
        <DottedGlobe markers={markers} links={links} radiusRatio={0.46} centerY={0.85} className="md:hidden" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950 to-transparent" />
      </div>

      <div className="container-x relative z-10 -mt-16 pb-24 md:-mt-24 md:pb-36">
        <ul aria-label="Connected systems" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {ecosystem.map((item, i) => (
            <Reveal as="li" key={item.label} delay={i * 0.05}>
              <div className="glass flex h-full flex-col gap-3 rounded-2xl p-4">
                <span className="grid size-9 place-items-center rounded-xl bg-flow/15 text-flow">
                  <item.icon className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="block text-sm text-fg-muted">{item.benefit}</span>
                </span>
              </div>
            </Reveal>
          ))}
        </ul>
        <Reveal delay={0.2}>
          <p className="mt-6 text-center text-sm text-fg-muted">
            <span className="font-semibold text-fg">Nexa AI</span> connects everything in the middle.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
