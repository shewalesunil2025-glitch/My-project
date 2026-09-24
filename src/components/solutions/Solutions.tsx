"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CalendarCheck, CheckCircle2, MessageSquareHeart, Inbox, Star } from "lucide-react";
import { solutions, type SolutionId } from "@/content/solutions";
import { cn } from "@/lib/cn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BookDemoButton } from "@/components/cta/BookDemoButton";
import { WebsitePreview } from "./previews/WebsitePreview";
import { WhatsAppPreview } from "./previews/WhatsAppPreview";
import { VoicePreview } from "./previews/VoicePreview";
import { ChatbotPreview } from "./previews/ChatbotPreview";
import { StepsPreview } from "./previews/StepsPreview";
import { WorkflowPreview } from "./previews/WorkflowPreview";

const previews: Record<SolutionId, () => React.ReactNode> = {
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

export function Solutions() {
  const [activeId, setActiveId] = useState<SolutionId>(solutions[0].id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const active = solutions.find((s) => s.id === activeId) ?? solutions[0];

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const keys: Record<string, number> = {
      ArrowDown: 1,
      ArrowRight: 1,
      ArrowUp: -1,
      ArrowLeft: -1,
    };
    let next = index;
    if (e.key in keys) next = (index + keys[e.key] + solutions.length) % solutions.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = solutions.length - 1;
    else return;
    e.preventDefault();
    setActiveId(solutions[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="solutions" aria-labelledby="solutions-title" className="relative py-28 md:py-40">
      <div className="container-x">
        <SectionHeading
          id="solutions-title"
          eyebrow="Solutions"
          title={
            <>
              Your customers are talking.{" "}
              <span className="text-flow">Your business should be ready.</span>
            </>
          }
          lead="Seven systems. Use one, or connect them all."
        />

        <div className="mt-14 grid gap-6 lg:mt-20 lg:grid-cols-12 lg:gap-10">
          <div
            role="tablist"
            aria-label="Solutions"
            aria-orientation="vertical"
            className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:col-span-4 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0"
          >
            {solutions.map((s, i) => {
              const selected = s.id === activeId;
              return (
                <button
                  key={s.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  role="tab"
                  id={`${baseId}-tab-${s.id}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveId(s.id)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  className={cn(
                    "group relative flex shrink-0 items-center gap-4 rounded-2xl px-4 py-3 text-left transition-colors lg:py-4",
                    selected ? "text-fg" : "text-fg-muted hover:text-fg",
                  )}
                >
                  {selected && (
                    <motion.span
                      layoutId="solution-active"
                      className="glass absolute inset-0 rounded-2xl"
                      transition={{ type: "spring", stiffness: 350, damping: 34 }}
                    />
                  )}
                  <span className="relative font-mono text-[0.65rem] text-fg-subtle">{s.index}</span>
                  <span className="relative text-sm font-medium whitespace-nowrap lg:text-base">{s.title}</span>
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`${baseId}-panel`}
            aria-labelledby={`${baseId}-tab-${active.id}`}
            className="glass relative overflow-hidden rounded-[1.75rem] p-5 md:p-8 lg:col-span-8"
          >
            <div className="absolute -top-40 -right-40 size-96 rounded-full bg-flow/10 blur-3xl" aria-hidden />
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative grid gap-8 md:grid-cols-2 md:gap-10"
              >
                <div className="flex flex-col">
                  <p className="font-mono text-[0.65rem] tracking-[0.2em] text-flow-soft uppercase">{active.title}</p>
                  <h3 className="mt-4 text-3xl leading-[1.05] font-semibold tracking-tight md:text-4xl">{active.headline}</h3>
                  <p className="mt-4 text-fg-muted">{active.summary}</p>
                  <ol className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-fg-muted">
                    {active.steps.map((step, i) => (
                      <li key={step} className="flex items-center gap-2">
                        <span className="rounded-full border border-white/10 px-3 py-1">{step}</span>
                        {i < active.steps.length - 1 && <span className="text-fg-subtle" aria-hidden>→</span>}
                      </li>
                    ))}
                  </ol>
                  <div className="mt-auto pt-8">
                    <BookDemoButton label="See this for my business" interest={active.title} variant="ghost" icon />
                  </div>
                </div>
                <div className="min-h-[22rem] md:min-h-[26rem]" aria-hidden>
                  {previews[active.id]()}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
