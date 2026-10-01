"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ecosystem } from "@/content/flow";
import { DottedGlobe, type GlobeMarker } from "@/components/3d/DottedGlobe";
import { Scramble } from "@/components/effects/Scramble";
import { ScrollWords } from "@/components/effects/ScrollWords";
import { cn } from "@/lib/cn";
import { useFinePointer } from "@/hooks/useMediaQuery";

const markers: GlobeMarker[] = [
  { lat: 22, lng: 74, label: "Website" },
  { lat: 48, lng: 10, label: "WhatsApp" },
  { lat: 38, lng: -98, label: "AI Voice" },
  { lat: -12, lng: 30, label: "Marketing" },
  { lat: 2, lng: 112, label: "Email" },
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

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * "One system" in the reference's global-network style: a lime dotted globe rises
 * out of the dark as you scroll in, arcs draw themselves between the six systems,
 * and hovering a system's card lights up its marker on the globe.
 */
export function OneSystem() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const fine = useFinePointer();
  const inView = useInView(ref, { margin: "-20% 0px" });

  // Phones have no hover: tour the six systems on the globe one by one instead.
  useEffect(() => {
    if (fine || reduce || !inView) return;
    const id = setInterval(() => setActive((cur) => (cur === null ? 0 : (cur + 1) % markers.length)), 2600);
    return () => clearInterval(id);
  }, [fine, reduce, inView]);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const globeY = useTransform(scrollYProgress, (v) => `${reduce ? 0 : (1 - Math.min(1, v)) * 30}%`);
  const globeScale = useTransform(scrollYProgress, (v) => (reduce ? 1 : 0.8 + Math.min(1, v) * 0.2));
  const glow = useTransform(scrollYProgress, (v) => Math.min(1, Math.max(0, (v - 0.3) / 0.6)));

  return (
    <section ref={ref} id="ecosystem" aria-labelledby="one-title" className="relative overflow-hidden pt-24 md:pt-36">
      <div className="container-x relative z-10 text-center">
        <p className="font-mono text-[0.68rem] tracking-[0.18em] text-flow uppercase">
          {"// "}
          <Scramble text="One system" />
          {" //"}
        </p>
        <ScrollWords
          id="one-title"
          text="One business. One intelligent flow."
          accentFrom={2}
          className="display mx-auto mt-5 max-w-3xl text-[clamp(2.2rem,5vw,4rem)]"
        />
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.1, ease }}
          className="mx-auto mt-5 max-w-xl text-sm text-fg-muted md:text-base"
        >
          Shambhu sits in the middle and runs all six — your website, WhatsApp, calls, digital marketing, email
          and reviews.
        </motion.p>
      </div>

      {/* The globe rises from below and its glow swells as it settles */}
      <div className="relative mx-auto -mt-4 h-[26rem] max-w-6xl sm:h-[34rem] md:-mt-10 md:h-[40rem]">
        <motion.div
          aria-hidden
          style={{ opacity: glow }}
          className="absolute bottom-0 left-1/2 h-[70%] w-[80%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(125_255_58/0.22),transparent)] blur-2xl"
        />
        <motion.div style={{ y: globeY, scale: globeScale }} className="absolute inset-0 origin-bottom">
          <DottedGlobe markers={markers} links={links} radiusRatio={0.34} centerY={0.9} active={active} className="max-md:hidden" />
          <DottedGlobe markers={markers} links={links} radiusRatio={0.46} centerY={0.85} active={active} className="md:hidden" />
        </motion.div>
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950 to-transparent" />
      </div>

      <div className="container-x relative z-10 -mt-16 pb-24 md:-mt-24 md:pb-36">
        <ul aria-label="Connected systems" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {ecosystem.map((item, i) => (
            <motion.li
              key={item.label}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, rotateX: 35 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={{ duration: 0.9, delay: i * 0.08, ease }}
              style={{ transformPerspective: 800 }}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive((cur) => (cur === i ? null : cur))}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              tabIndex={0}
              className="rounded-2xl outline-none"
            >
              <div
                className={cn(
                  "glass flex h-full flex-col gap-3 rounded-2xl p-4",
                  active === i && "border-flow/50 shadow-[0_0_40px_-10px_rgb(125_255_58/0.6)]",
                )}
              >
                <motion.span
                  className="grid size-10 place-items-center rounded-xl border border-flow/25 bg-flow/10 text-flow"
                  animate={active === i ? { scale: 1.12, rotate: -6 } : { scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                >
                  <item.icon className="size-4" aria-hidden />
                </motion.span>
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="block text-sm text-fg-muted">{item.benefit}</span>
                </span>
                <span className="mt-auto font-mono text-[0.6rem] text-fg-subtle">[ 0{i + 1} ]</span>
              </div>
            </motion.li>
          ))}
        </ul>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="mt-6 text-center text-sm text-fg-muted"
        >
          <span className="font-semibold text-fg">Shambhu</span> connects everything in the middle —{" "}
          {fine ? "hover a system to find it on the globe." : "watch each system light up on the globe."}
        </motion.p>
      </div>
    </section>
  );
}
