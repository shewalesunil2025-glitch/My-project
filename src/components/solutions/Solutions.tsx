"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import {
  ArrowUpRight,
  Bell,
  Bot,
  CalendarCheck,
  CheckCircle2,
  Globe,
  Inbox,
  MessageCircle,
  MessageSquareHeart,
  PhoneCall,
  Star,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { solutions, type Solution, type SolutionId } from "@/content/solutions";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Reveal } from "@/components/effects/Reveal";
import { Scramble } from "@/components/effects/Scramble";
import { useDemo } from "@/components/cta/DemoProvider";
import { PointCloud } from "@/components/scene/PointCloud";
import { WebsitePreview } from "./previews/WebsitePreview";
import { WhatsAppPreview } from "./previews/WhatsAppPreview";
import { VoicePreview } from "./previews/VoicePreview";
import { ChatbotPreview } from "./previews/ChatbotPreview";
import { StepsPreview } from "./previews/StepsPreview";
import { WorkflowPreview } from "./previews/WorkflowPreview";

const previews: Record<SolutionId, () => ReactNode> = {
  websites: () => <WebsitePreview />,
  whatsapp: () => <WhatsAppPreview />,
  voice: () => <VoicePreview />,
  chatbots: () => <ChatbotPreview />,
  booking: () => (
    <StepsPreview
      title="Booking automation"
      steps={[
        { label: "Inquiry", meta: "Website · 10:02", icon: Inbox },
        { label: "Appointment", meta: "Thu · 4:30 PM", icon: CalendarCheck },
        { label: "Confirmation", meta: "Sent on WhatsApp + email", icon: CheckCircle2 },
        { label: "Reminder", meta: "24h and 2h before", icon: Bell },
      ]}
    />
  ),
  reviews: () => (
    <StepsPreview
      title="Review automation"
      steps={[
        { label: "Service completed", meta: "Marked done in your system", icon: CheckCircle2 },
        { label: "Customer follow-up", meta: "“How was your visit?”", icon: MessageSquareHeart },
        { label: "Google Review request", meta: "Sent to happy customers", icon: Star },
      ]}
    />
  ),
  workflows: () => <WorkflowPreview />,
};

/**
 * Reference "DNA" scene: dust gathers into a slowly turning helix, the heading forms
 * out of it, then the seven solution cards float past in 3D as you scroll — each
 * with its live preview. On small screens the cards simply stack over the helix.
 */
export function Solutions() {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // Function transforms (not range maps) keep these on the main thread, where values
  // outside a range clamp reliably instead of snapping back on the compositor.
  const headOpacity = useTransform(p, (v) => (v < 0.05 ? 0.3 + (v / 0.05) * 0.7 : v < 0.12 ? 1 : Math.max(0, 1 - (v - 0.12) / 0.06)));
  const helixOpacity = useTransform(p, (v) => (v < 0.08 ? 0.35 + (v / 0.08) * 0.65 : v > 0.92 ? 1 - ((v - 0.92) / 0.08) * 0.6 : 1));
  // The ring of cards arrives as the heading leaves. (Perspective lives on each card,
  // so the list adds no stacking context and cards can pass in front of the helix.)
  const ringOpacity = useTransform(p, (v) => Math.min(1, Math.max(0, (v - 0.13) / 0.06)));
  const pinned = !reduce;

  return (
    <section
      ref={ref}
      id="solutions"
      aria-labelledby="solutions-title"
      className="relative"
      style={{ height: pinned ? `${100 + solutions.length * 55}vh` : undefined }}
    >
      <div className={cn(pinned ? "sticky top-0 h-svh overflow-hidden" : "relative py-24")}>
        <motion.div aria-hidden style={{ opacity: helixOpacity }} className="absolute inset-0 z-0">
          <PointCloud shape="helix" size={1.05} interactive={false} />
        </motion.div>

        <motion.div
          style={pinned ? { opacity: headOpacity } : undefined}
          className={cn("container-x text-center", pinned ? "absolute inset-x-0 top-1/2 -translate-y-1/2" : "relative")}
        >
          <p className="font-mono text-[0.68rem] tracking-[0.18em] text-flow uppercase">
            {"// "}
            <Scramble text="Solutions" />
            {" //"}
          </p>
          <h2 id="solutions-title" className="display mx-auto mt-5 max-w-3xl text-[clamp(2.2rem,4.6vw,4rem)]">
            Your customers are talking. <span className="text-fg-subtle">Your business</span>{" "}
            <span className="text-flow">⊙</span> should be ready.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-fg-muted">Seven systems. Use one, or connect them all.</p>
        </motion.div>

        <motion.ul
          style={pinned ? { opacity: ringOpacity } : undefined}
          className={cn(pinned ? "absolute inset-0 z-30" : "container-x relative mt-14 grid gap-5 md:grid-cols-2")}>
          {solutions.map((s, i) =>
            pinned ? (
              <FloatingCard key={s.id} solution={s} index={i} progress={p} spread={desktop ? 30 : 74} />
            ) : (
              <Reveal as="li" key={s.id} delay={(i % 2) * 0.08}>
                <SolutionCard solution={s} number={i + 1} />
              </Reveal>
            ),
          )}
        </motion.ul>
      </div>
    </section>
  );
}

/** Angle between neighbouring cards on the ring around the helix (radians). */
const STEP = 1.05;

/**
 * The cards sit on a ring around the helix and the ring turns smoothly with the
 * scroll, exactly as before. Every card stays crisp — no blur, solid glass — and the
 * one nearest the front is drawn on top, so its text is never covered.
 */
function FloatingCard({
  solution,
  index,
  progress,
  spread,
}: {
  solution: Solution;
  index: number;
  progress: MotionValue<number>;
  /** How far (vw) side cards swing out — wider on phones so they only peek in. */
  spread: number;
}) {
  const n = solutions.length;
  const angle = useTransform(progress, (v) => {
    const t = Math.min(1, Math.max(0, (v - 0.17) / 0.78)) * (n - 1);
    // Clamp so cards far round the ring park out of sight instead of wrapping back to the front.
    return Math.max(-1.6, Math.min(1.6, (index - t) * STEP));
  });
  const x = useTransform(angle, (a) => `calc(-50% + ${Math.sin(a) * spread}vw)`);
  const y = useTransform(angle, (a) => `calc(-46% + ${Math.sin(a) * 6 - (1 - Math.cos(a)) * 5}vh)`);
  const rotateY = useTransform(angle, (a) => `${((-a * 180) / Math.PI) * 0.75}deg`);
  const scale = useTransform(angle, (a) => 0.55 + 0.45 * Math.max(0, Math.cos(a)));
  const opacity = useTransform(angle, (a) => (Math.abs(a) > 1.5 ? 0 : Math.min(1, Math.max(0, (Math.cos(a) + 0.05) / 0.5))));
  const zIndex = useTransform(angle, (a) => 10 + Math.round(Math.cos(a) * 10));

  return (
    <motion.li
      style={{ x, y, rotateY, scale, opacity, zIndex, transformPerspective: 1600 }}
      className="absolute top-1/2 left-1/2 w-[min(28rem,86vw)] [transform-style:preserve-3d]"
    >
      <SolutionCard solution={solution} number={index + 1} />
    </motion.li>
  );
}

const icons: Record<SolutionId, LucideIcon> = {
  websites: Globe,
  whatsapp: MessageCircle,
  voice: PhoneCall,
  chatbots: Bot,
  booking: CalendarCheck,
  reviews: Star,
  workflows: Workflow,
};

/** Reference glass card: icon and [ n.0 ] on top, a big title, short copy, the live preview. */
function SolutionCard({ solution: s, number }: { solution: Solution; number: number }) {
  const { openDemo } = useDemo();
  const Icon = icons[s.id];
  return (
    <article
      id={`solution-${s.id}`}
      aria-labelledby={`solution-${s.id}-title`}
      className="group relative flex flex-col overflow-hidden rounded-[1.4rem] border border-white/15 [background:linear-gradient(160deg,rgb(255_255_255/0.07),rgb(255_255_255/0.015)_45%),rgb(6_14_7/0.96)] shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_30px_80px_-30px_rgb(0_0_0/0.9)] "
    >
      {/* Smoky green light in the corner, like the reference's card imagery */}
      <div aria-hidden className="absolute -top-20 -right-16 size-72 rounded-full bg-[radial-gradient(circle,rgb(125_255_58/0.22),rgb(40_140_30/0.1)_45%,transparent_70%)] blur-2xl" />
      <div className="relative flex items-start justify-between p-6 pb-0">
        <span className="grid size-9 place-items-center rounded-full border border-white/15 text-flow">
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="font-mono text-[0.65rem] text-fg-muted">[ {number}.0 ]</span>
      </div>
      <div className="relative p-6 pt-8">
        <p className="font-mono text-[0.62rem] tracking-[0.14em] text-flow uppercase">{s.title}</p>
        <h3 id={`solution-${s.id}-title`} className="mt-2 text-[1.55rem] leading-[1.1] tracking-tight">
          {s.headline}
        </h3>
        <p className="mt-3 text-[0.8rem] leading-relaxed text-fg-muted">{s.summary}</p>
        <p className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[0.7rem] text-fg-subtle">
          {s.steps.map((step, i) => (
            <span key={step}>
              {step}
              {i < s.steps.length - 1 && <span className="ml-2 text-flow/70">→</span>}
            </span>
          ))}
        </p>
      </div>
      <div className="relative mx-4 mb-4 h-[8.5rem] overflow-hidden rounded-2xl opacity-90" aria-hidden>
        {previews[s.id]()}
      </div>
      <button
        type="button"
        onClick={() => openDemo(s.title)}
        className="relative mx-6 mb-6 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-fg transition-colors hover:text-flow"
      >
        See this for my business
        <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
      </button>
    </article>
  );
}
