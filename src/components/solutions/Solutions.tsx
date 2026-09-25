"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, Bell, CalendarCheck, CheckCircle2, Inbox, MessageSquareHeart, Star } from "lucide-react";
import { solutions, type SolutionId } from "@/content/solutions";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/effects/Reveal";
import { ScrollWords } from "@/components/effects/ScrollWords";
import { useDemo } from "@/components/cta/DemoProvider";
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

/** Bento layout, in reading order. */
const layout: Record<SolutionId, string> = {
  websites: "lg:col-span-2",
  whatsapp: "",
  voice: "",
  chatbots: "",
  booking: "",
  reviews: "",
  workflows: "lg:col-span-2",
};

export function Solutions() {
  const { openDemo } = useDemo();

  return (
    <section id="solutions" aria-labelledby="solutions-title" className="relative py-24 md:py-36">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(40%_60%_at_50%_0%,rgb(255_90_31/0.08),transparent_70%)]" />
      <div className="container-x relative">
        <div className="text-center">
          <Reveal>
            <p className="badge">Solutions</p>
          </Reveal>
          <ScrollWords
            id="solutions-title"
            text="Your customers are talking. Your business should be ready."
            accentFrom={4}
            className="display mx-auto mt-5 max-w-3xl text-[clamp(2.1rem,4.8vw,3.8rem)]"
          />
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-fg-muted md:text-lg">Seven systems. Use one, or connect them all.</p>
          </Reveal>
        </div>

        <ul className="mt-14 grid gap-4 md:grid-cols-2 lg:mt-20 lg:grid-cols-3">
          {solutions.map((s, i) => (
            <Reveal as="li" key={s.id} delay={(i % 3) * 0.06} className={cn("min-w-0", layout[s.id])}>
              <article
                id={`solution-${s.id}`}
                aria-labelledby={`solution-${s.id}-title`}
                className="glass group flex h-full scroll-mt-28 flex-col overflow-hidden rounded-[1.5rem] transition-[border-color] duration-300 hover:border-white/15"
              >
                <div className="p-6 pb-4 md:p-7 md:pb-5">
                  <p className="text-xs font-semibold text-flow">{s.index} · {s.title}</p>
                  <h3 id={`solution-${s.id}-title`} className="mt-2 text-xl leading-snug font-semibold tracking-tight">
                    {s.headline}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.summary}</p>
                </div>
                <div className="relative mx-4 mb-4 h-[19rem] overflow-hidden rounded-2xl md:mx-5" aria-hidden>
                  {previews[s.id]()}
                </div>
                <button
                  type="button"
                  onClick={() => openDemo(s.title)}
                  className="mx-6 mt-auto mb-6 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-fg transition-colors hover:text-flow md:mx-7"
                >
                  See this for my business
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                </button>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
