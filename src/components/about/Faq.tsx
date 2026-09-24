import { Plus } from "lucide-react";
import { faqs } from "@/content/faq";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/effects/Reveal";

/** Native <details> accordion — keyboard accessible and works without JavaScript. */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="relative py-28 md:py-36">
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading
            id="faq-title"
            eyebrow="FAQ"
            title={
              <>
                Questions, <span className="text-flow">answered.</span>
              </>
            }
            lead="Anything else? Ask us on the free 30-minute call — we reply within 24 hours."
          />
        </div>
        <ul className="lg:col-span-7 lg:col-start-6">
          {faqs.map((f, i) => (
            <Reveal as="li" key={f.q} delay={i * 0.04} className="border-b border-white/[0.08]">
              <details className="group py-2 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg py-5 text-left text-lg font-medium tracking-tight">
                  {f.q}
                  <Plus
                    className="size-5 shrink-0 text-flow-soft transition-transform duration-300 group-open:rotate-45"
                    aria-hidden
                  />
                </summary>
                <p className="max-w-2xl pb-6 leading-relaxed text-fg-muted">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
