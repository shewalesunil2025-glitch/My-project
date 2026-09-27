"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  ArrowUpRight,
  CalendarCheck,
  Globe,
  Lock,
  MessageCircle,
  PhoneCall,
  Star,
  UserPlus,
  Workflow,
  Bot,
  type LucideIcon,
} from "lucide-react";
import { industries } from "@/content/industries";
import { Reveal } from "@/components/effects/Reveal";
import { ScrollWords } from "@/components/effects/ScrollWords";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Reference "We are ⟿ …" section: a scroll-lit statement with a pulse glyph, then a
 * five-tile green bento — isometric glass blocks, a floating slab that turns into a
 * spinning ring, orbs pouring through a funnel, a watching eye with a lock, and a
 * ring that morphs into a cylinder. All copy is Nexa Flow AI's own.
 */
export function Philosophy() {
  const sectors = industries
    .slice(0, 5)
    .map((i) => i.name.toLowerCase())
    .join(", ");

  return (
    <section aria-labelledby="why-title" className="relative py-24 md:py-36">
      <div className="container-x">
        <ScrollWords
          id="why-title"
          text="We are * an AI automation agency"
          glyph={<PulseGlyph />}
          className="display mx-auto max-w-4xl text-center text-[clamp(2.3rem,5.4vw,4.6rem)]"
          dim={0.22}
        />
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl text-center text-[0.8rem] leading-relaxed text-fg-muted md:text-sm">
            At Nexa Flow AI, our work spans {sectors} and more. We don&apos;t add more tools — we connect the ones
            that matter, because technology should simplify your business, not complicate it.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-6xl gap-3 md:grid-cols-12">
          <Tile index="1.0" className="md:col-span-6" tone="green" delay={0}>
            <GlassBlocks />
            <TileCopy eyebrow="AI automation solutions" title="We connect the flow — website, conversations and workflows as one system." />
          </Tile>

          <Tile index="2.0" className="md:col-span-6" tone="dark" delay={0.08}>
            <TileCopy
              top
              eyebrow="Simple by design"
              title="If it needs a manual, we haven't finished designing it."
            />
            <GlowDot />
            <SlabOrRing />
          </Tile>

          <Tile index="3.0" className="md:col-span-3 md:row-span-1" tone="green-soft" delay={0.12} tall>
            <Funnel />
            <div className="absolute inset-x-6 bottom-6 text-center">
              <p className="font-mono text-[0.6rem] tracking-[0.16em] text-flow-soft/80 uppercase">Connected, not stacked</p>
              <p className="mt-2 text-[0.8rem] leading-relaxed text-fg-muted">
                One flow across website, chat, WhatsApp and voice. Every lead, message and booking drops into the same
                system — nothing slips through.
              </p>
            </div>
          </Tile>

          <Tile index="4.0" className="md:col-span-5" tone="none" delay={0.16} tall>
            <div className="absolute top-6 left-1/2 flex -translate-x-1/2 flex-col items-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.7rem] text-fg">
                <ArrowUpRight className="size-3 text-flow" aria-hidden />
                Free 30-minute AI call
              </span>
              <LightCone />
            </div>
            <p className="absolute top-[42%] left-6 font-mono text-[0.6rem] tracking-[0.16em] text-fg-subtle uppercase">
              How we can help
            </p>
            <WatchfulEye />
            <p className="absolute bottom-6 left-6 max-w-[16rem] text-xl leading-tight tracking-tight">
              We&apos;re here to handle the repetitive — so your team handles the personal.
            </p>
          </Tile>

          <Tile index="5.0" className="md:col-span-4" tone="none" delay={0.2} tall>
            <div className="absolute inset-x-6 top-6 text-center">
              <p className="font-mono text-[0.6rem] tracking-[0.16em] text-fg-subtle uppercase">Customized solutions</p>
              <p className="mt-3 text-[0.8rem] leading-relaxed text-fg-muted">
                Every business is different. We design each flow around how you already work — start with one system or
                connect all seven.
              </p>
            </div>
            <RingMorph />
          </Tile>
        </div>
      </div>
    </section>
  );
}

/* ── Tile shell ─────────────────────────────────────────────────────────── */

function Tile({
  index,
  children,
  className,
  tone,
  delay,
  tall,
}: {
  index: string;
  children: ReactNode;
  className?: string;
  tone: "green" | "green-soft" | "dark" | "none";
  delay: number;
  tall?: boolean;
}) {
  const reduce = useReducedMotion();
  const bg = {
    green: "border-flow/30 bg-[linear-gradient(140deg,#2a8a1b,#135c10_45%,#0a300a)]",
    "green-soft": "border-flow/25 bg-[linear-gradient(180deg,#1d6e17,#0b3a0c_55%,#061a07)]",
    dark: "border-white/10 bg-[radial-gradient(90%_70%_at_70%_100%,rgb(60_200_40/0.45),transparent_60%),linear-gradient(180deg,#0a130b,#071008)]",
    none: "border-white/[0.05] bg-white/[0.015]",
  }[tone];
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.96, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 1.1, delay, ease }}
      className={`relative overflow-hidden rounded-[1.5rem] border ${bg} ${tall ? "h-[27rem]" : "h-72 md:h-[20rem]"} ${className ?? ""}`}
    >
      <span className="absolute top-5 right-6 z-10 font-mono text-[0.62rem] text-fg-muted">[ {index} ]</span>
      {children}
    </motion.div>
  );
}

function TileCopy({ eyebrow, title, top }: { eyebrow: string; title: string; top?: boolean }) {
  return (
    <div className={`absolute left-6 z-10 max-w-[19rem] ${top ? "top-6" : "bottom-6"}`}>
      <p className="font-mono text-[0.6rem] tracking-[0.16em] text-flow-soft/80 uppercase">{eyebrow}</p>
      <p className="mt-2 text-xl leading-tight tracking-tight md:text-[1.4rem]">{title}</p>
    </div>
  );
}

/* ── Glyph between the heading words ────────────────────────────────────── */

function PulseGlyph() {
  return (
    <svg viewBox="0 0 48 24" className="mx-1 inline-block h-[0.55em] w-[1.1em] align-middle" aria-hidden>
      <motion.path
        d="M2 12 H14 L18 4 L24 20 L30 8 L33 12 H46"
        fill="none"
        stroke="#7dff3a"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="2 5"
        animate={{ strokeDashoffset: [0, -28] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        style={{ filter: "drop-shadow(0 0 4px #7dff3a)" }}
      />
    </svg>
  );
}

/* ── [1.0] Isometric glass blocks on a light-ray plate ──────────────────── */

const blocks: { icon: LucideIcon; x: string; y: string; s: number; d: number }[] = [
  { icon: Globe, x: "18%", y: "30%", s: 1, d: 0 },
  { icon: MessageCircle, x: "44%", y: "18%", s: 0.8, d: 0.6 },
  { icon: PhoneCall, x: "66%", y: "36%", s: 1.1, d: 1.2 },
  { icon: CalendarCheck, x: "34%", y: "52%", s: 0.9, d: 1.8 },
  { icon: Star, x: "80%", y: "12%", s: 0.7, d: 2.4 },
];

function GlassBlocks() {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className="absolute inset-0">
      {/* crossing light rays */}
      <div className="absolute inset-0 bg-[linear-gradient(152deg,transparent_47%,rgb(220_255_190/0.75)_49.7%,transparent_52%),linear-gradient(28deg,transparent_55%,rgb(220_255_190/0.5)_57.5%,transparent_60%),linear-gradient(98deg,transparent_62%,rgb(220_255_190/0.3)_63.5%,transparent_65%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_60%_40%,rgb(160_255_110/0.25),transparent_70%)]" />
      {blocks.map((b, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: b.x, top: b.y }}
          animate={reduce ? undefined : { y: [0, -10, 0] }}
          transition={{ duration: 5 + i * 0.6, delay: b.d, repeat: Infinity, ease: "easeInOut" }}
        >
          <div
            className="grid size-16 place-items-center rounded-2xl border border-white/30 bg-[linear-gradient(135deg,rgb(200_255_160/0.55),rgb(60_190_40/0.35))] text-[#0b3a0c] backdrop-blur-sm"
            style={{
              scale: b.s,
              transform: "rotateX(55deg) rotateZ(45deg)",
              boxShadow:
                "1px 1px 0 #3fae22, 2px 2px 0 #36a01d, 3px 3px 0 #2f9119, 4px 4px 0 #288215, 5px 5px 0 #217311, 6px 6px 0 #1b640e, 14px 18px 30px rgb(0 0 0 / 0.35), 0 0 30px rgb(160 255 110 / 0.35)",
            }}
          >
            <b.icon className="size-6" style={{ transform: "rotateZ(-45deg)" }} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── [2.0] A light that drifts over the words, and a slab ⇄ spinning ring ── */

function GlowDot() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.span
      aria-hidden
      className="absolute z-20 size-4 rounded-full bg-[#d8ffbe] shadow-[0_0_22px_8px_rgb(125_255_58/0.8)] mix-blend-screen"
      animate={{ left: ["20%", "46%", "34%", "20%"], top: ["16%", "22%", "30%", "16%"] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function useCycle(count: number, ms: number) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((v) => (v + 1) % count), ms);
    return () => clearInterval(t);
  }, [count, ms, reduce]);
  return i;
}

function SlabOrRing() {
  const i = useCycle(2, 4200);
  return (
    <div aria-hidden className="absolute inset-x-0 bottom-0 h-[58%] [perspective:900px]">
      <AnimatePresence mode="wait">
        {i === 0 ? (
          <motion.div
            key="slab"
            initial={{ opacity: 0, y: 30, rotateX: 70 }}
            animate={{ opacity: 1, y: 0, rotateX: 58 }}
            exit={{ opacity: 0, y: 20, rotateX: 75 }}
            transition={{ duration: 0.9, ease }}
            className="absolute bottom-[-8%] left-1/2 h-44 w-[62%] -translate-x-1/2 rounded-[1.8rem] border border-white/15 bg-[linear-gradient(170deg,#1f2e20,#050a05_60%)] shadow-[0_-10px_50px_-10px_rgb(125_255_58/0.7),inset_0_2px_0_rgb(255_255_255/0.12)]"
          >
            <div className="absolute inset-3 rounded-[1.3rem] border border-white/[0.06] bg-[linear-gradient(180deg,rgb(255_255_255/0.05),transparent)]" />
          </motion.div>
        ) : (
          <motion.div
            key="ring"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.9, ease }}
            className="absolute bottom-[8%] left-1/2 -translate-x-1/2"
          >
            <motion.div
              className="relative size-24 [transform-style:preserve-3d]"
              animate={{ rotateY: 360, rotateX: -14 }}
              transition={{ rotateY: { duration: 6, repeat: Infinity, ease: "linear" }, rotateX: { duration: 0 } }}
            >
              {Array.from({ length: 8 }).map((_, k) => (
                <span
                  key={k}
                  className="absolute top-1/2 left-1/2 -mt-7 -ml-[1.125rem] h-14 w-9 rounded-md border border-white/20 bg-[linear-gradient(180deg,#9dff6a,#2f9a25)] shadow-[0_0_20px_rgb(125_255_58/0.6)]"
                  style={{ transform: `rotateY(${k * 45}deg) translateZ(70px)` }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── [3.0] Orbs pouring through a glass funnel ─────────────────────────── */

const orbIcons: LucideIcon[] = [Globe, MessageCircle, PhoneCall, UserPlus, CalendarCheck, Star, Bot, Workflow];

function Funnel() {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className="absolute inset-x-0 top-0 h-[64%]">
      <svg viewBox="0 0 200 260" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <path d="M40 0 C70 90 88 130 88 160 C88 200 60 230 50 260" fill="none" stroke="rgb(210 255 180 / 0.35)" strokeWidth="1.2" />
        <path d="M160 0 C130 90 112 130 112 160 C112 200 140 230 150 260" fill="none" stroke="rgb(210 255 180 / 0.35)" strokeWidth="1.2" />
      </svg>
      {orbIcons.map((Icon, i) =>
        reduce ? null : (
          <motion.span
            key={i}
            className="absolute left-1/2 grid size-9 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#eaffd9,#7dff3a_45%,#2c8a17)] text-[#0b3a0c] shadow-[0_0_18px_rgb(125_255_58/0.8)]"
            initial={{ top: "-15%", x: "-50%", opacity: 0 }}
            animate={{
              top: ["-15%", "30%", "58%", "100%"],
              x: [`${-50 + ((i % 3) - 1) * 70}%`, `${-50 + ((i % 2 ? 1 : -1) * 40)}%`, "-50%", "-50%"],
              opacity: [0, 1, 1, 0],
              scale: [1, 1, 0.8, 0.6],
            }}
            transition={{ duration: 4.8, delay: i * 0.6, repeat: Infinity, ease: "easeIn" }}
          >
            <Icon className="size-4" />
          </motion.span>
        ),
      )}
    </div>
  );
}

/* ── [4.0] Light cone, and an eye that follows the cursor beside a lock ─── */

function LightCone() {
  return (
    <div aria-hidden className="relative mt-1 h-16 w-40">
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(200_255_150/0.95),rgb(125_255_58/0.35)_40%,transparent_75%)] [clip-path:polygon(38%_0,62%_0,100%_100%,0_100%)]"
        animate={{ opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function WatchfulEye() {
  const ref = useRef<SVGSVGElement>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });
  useEffect(() => {
    let raf = 0;
    const lookAt = (clientX: number, clientY: number) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const dx = clientX - (r.left + r.width / 2);
        const dy = clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 300);
        setLook({ x: (dx / d) * 9 * k, y: (dy / d) * 5 * k });
      });
    };
    const onMove = (e: PointerEvent) => lookAt(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) lookAt(t.clientX, t.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      cancelAnimationFrame(raf);
    };
  }, []);

  const floaters: { icon: LucideIcon; x: string; y: string }[] = [
    { icon: MessageCircle, x: "18%", y: "54%" },
    { icon: Star, x: "74%", y: "50%" },
    { icon: PhoneCall, x: "22%", y: "68%" },
    { icon: CalendarCheck, x: "70%", y: "66%" },
  ];

  return (
    <div aria-hidden className="absolute inset-x-0 top-[46%] h-[34%]">
      <svg ref={ref} viewBox="0 0 120 60" className="absolute top-0 left-1/2 w-40 -translate-x-1/2 drop-shadow-[0_0_14px_rgb(125_255_58/0.7)]">
        <path d="M6 30 C30 4 90 4 114 30 C90 56 30 56 6 30 Z" fill="rgb(20 70 16 / 0.6)" stroke="#7dff3a" strokeWidth="3.5" />
        <motion.g animate={{ x: look.x, y: look.y }} transition={{ type: "spring", stiffness: 120, damping: 14 }}>
          <circle cx="60" cy="30" r="14" fill="#1f8f2f" stroke="#7dff3a" strokeWidth="3" />
          <circle cx="60" cy="30" r="6" fill="#d8ffbe" />
        </motion.g>
      </svg>
      <motion.span
        className="absolute top-[52%] left-[40%] grid size-12 place-items-center rounded-full border-2 border-flow bg-[#0b3a0c] text-flow shadow-[0_0_24px_rgb(125_255_58/0.7)]"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Lock className="size-5" />
      </motion.span>
      {floaters.map((f, i) => (
        <motion.span
          key={i}
          className="absolute grid size-7 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#eaffd9,#7dff3a_50%,#2c8a17)] text-[#0b3a0c] shadow-[0_0_14px_rgb(125_255_58/0.7)]"
          style={{ left: f.x, top: f.y }}
          animate={{ y: [0, -8, 0], rotate: [0, i % 2 ? 12 : -12, 0] }}
          transition={{ duration: 3 + i * 0.7, repeat: Infinity, ease: "easeInOut" }}
        >
          <f.icon className="size-3.5" />
        </motion.span>
      ))}
    </div>
  );
}

/* ── [5.0] Ring with two orbiting spheres ⇄ glowing cylinder ─────────── */

function RingMorph() {
  const i = useCycle(2, 4600);
  return (
    <div aria-hidden className="absolute inset-x-0 bottom-4 h-[55%]">
      <AnimatePresence mode="wait">
        {i === 0 ? (
          <motion.div
            key="ring"
            initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 20 }}
            transition={{ duration: 0.9, ease }}
            className="absolute inset-0 grid place-items-center"
          >
            <div className="relative size-40">
              <div className="absolute inset-0 rounded-full border-[10px] border-[#2f9a25] shadow-[0_0_30px_rgb(125_255_58/0.5),inset_0_0_20px_rgb(0_0_0/0.5)] [transform:rotateX(62deg)_rotateY(-18deg)]" />
              {[0, 50].map((start) => (
                <span
                  key={start}
                  className="orbit absolute size-9 rounded-full bg-[radial-gradient(circle_at_35%_30%,#eaffd9,#7dff3a_45%,#2c8a17)] shadow-[0_0_24px_rgb(125_255_58/0.8)]"
                  style={{ ["--start" as string]: `${start}%` }}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cylinder"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.9, ease }}
            className="absolute inset-0 grid place-items-center"
          >
            <div className="relative h-36 w-28">
              <div className="absolute inset-x-0 top-4 bottom-4 bg-[linear-gradient(90deg,#0f4a10,#5fe01f_45%,#1c6b1d)] shadow-[0_0_30px_rgb(125_255_58/0.45)]" />
              <div className="absolute inset-x-0 top-0 h-8 rounded-[50%] border border-white/20 bg-[radial-gradient(circle_at_50%_40%,#b6ff8a,#3cb81c)]" />
              <div className="absolute inset-x-0 bottom-0 h-8 rounded-[50%] bg-[#1c6b1d]" />
              <motion.span
                className="absolute -right-4 bottom-2 size-8 rounded-full bg-[radial-gradient(circle_at_35%_30%,#eaffd9,#7dff3a_45%,#2c8a17)] shadow-[0_0_20px_rgb(125_255_58/0.8)]"
                animate={{ y: [0, -80, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
