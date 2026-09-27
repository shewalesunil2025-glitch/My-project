"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowUpRight, Bell, CalendarCheck, CheckCircle2, Inbox, MessageSquareHeart, Star } from "lucide-react";
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
  const headOpacity = useTransform(p, [0, 0.05, 0.14, 0.2], [0.3, 1, 1, 0]);
  const headBlur = useTransform(p, [0, 0.05], ["blur(12px)", "blur(0px)"]);
  const helixOpacity = useTransform(p, [0, 0.08, 0.92, 1], [0.35, 1, 1, 0.4]);
  const pinned = desktop && !reduce;

  return (
    <section
      ref={ref}
      id="solutions"
      aria-labelledby="solutions-title"
      className="relative"
      style={{ height: pinned ? `${100 + solutions.length * 55}vh` : undefined }}
    >
      <div className={cn(pinned ? "sticky top-0 h-svh overflow-hidden" : "relative py-24")}>
        <motion.div aria-hidden style={{ opacity: helixOpacity }} className="absolute inset-0">
          <PointCloud shape="helix" size={1.05} interactive={false} />
        </motion.div>

        <motion.div
          style={pinned ? { opacity: headOpacity, filter: headBlur } : undefined}
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

        <ul className={cn(pinned ? "absolute inset-0 [perspective:1400px]" : "container-x relative mt-14 grid gap-5 md:grid-cols-2")}>
          {solutions.map((s, i) =>
            pinned ? (
              <FloatingCard key={s.id} solution={s} index={i} progress={p} />
            ) : (
              <Reveal as="li" key={s.id} delay={(i % 2) * 0.08}>
                <SolutionCard solution={s} />
              </Reveal>
            ),
          )}
        </ul>
      </div>
    </section>
  );
}

/** One card's flight past the helix: in from below and far away, out above. */
function FloatingCard({ solution, index, progress }: { solution: Solution; index: number; progress: MotionValue<number> }) {
  // Each card owns a window of the scroll; windows overlap so two or three cards are
  // in flight at once. Every offset stays inside 0…1 (scroll-linked animations
  // can run on the compositor, which rejects offsets outside that range).
  const n = solutions.length;
  const len = 0.3;
  const step = (0.98 - 0.16 - len) / (n - 1);
  const start = 0.16 + index * step;
  const end = start + len;
  const side = index % 2 ? 1 : -1;
  const y = useTransform(progress, [start, end], ["70vh", "-80vh"]);
  const x = useTransform(progress, [start, end], [`${side * 20}vw`, `${side * 26}vw`]);
  const rotateY = useTransform(progress, [start, end], [side * -24, side * -8]);
  const rotateZ = useTransform(progress, [start, end], [side * 4, side * -2]);
  const scale = useTransform(progress, [start, (start + end) / 2, end], [0.78, 1, 0.9]);
  const opacity = useTransform(progress, [start, start + 0.03, end - 0.04, end], [0, 1, 1, 0]);

  return (
    <motion.li
      style={{ y, x, rotateY, rotateZ, scale, opacity }}
      className="absolute top-1/2 left-1/2 w-[27rem] -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]"
    >
      <SolutionCard solution={solution} />
    </motion.li>
  );
}

function SolutionCard({ solution: s }: { solution: Solution }) {
  const { openDemo } = useDemo();
  return (
    <article
      id={`solution-${s.id}`}
      aria-labelledby={`solution-${s.id}-title`}
      className="glass group flex flex-col overflow-hidden rounded-[1.5rem] bg-ink-900/60 backdrop-blur-xl"
    >
      <div className="p-6 pb-4">
        <p className="font-mono text-[0.65rem] tracking-[0.14em] text-flow uppercase">
          {s.index} · {s.title}
        </p>
        <h3 id={`solution-${s.id}-title`} className="mt-2 text-xl leading-snug tracking-tight">
          {s.headline}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.summary}</p>
      </div>
      <div className="relative mx-4 mb-4 h-[13rem] overflow-hidden rounded-2xl" aria-hidden>
        {previews[s.id]()}
      </div>
      <button
        type="button"
        onClick={() => openDemo(s.title)}
        className="mx-6 mb-6 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-fg transition-colors hover:text-flow"
      >
        See this for my business
        <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
      </button>
    </article>
  );
}
