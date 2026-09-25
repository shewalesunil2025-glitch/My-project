import { ChevronDown } from "lucide-react";
import { faqs } from "@/content/faq";
import { Reveal } from "@/components/effects/Reveal";

/** Native <details> accordion in the reference's rounded dark cards. */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="relative py-24 md:py-32">
      <div className="container-x max-w-4xl">
        <Reveal className="text-center">
          <p className="badge">FAQ</p>
          <h2 id="faq-title" className="display mt-5 text-[clamp(2rem,4.4vw,3.4rem)]">
            Frequently asked questions
          </h2>
          <p className="mx-auto mt-4 max-w-md text-fg-muted">
            Anything else? Ask us on the free 30-minute call — we reply within 24 hours.
          </p>
        </Reveal>
        <ul className="mt-12 space-y-3">
          {faqs.map((f, i) => (
            <Reveal as="li" key={f.q} delay={Math.min(i, 5) * 0.03}>
              <details className="group rounded-2xl border border-white/[0.07] bg-ink-850 transition-colors open:bg-ink-800 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center gap-4 rounded-2xl px-5 py-5 text-left font-semibold md:px-6">
                  <ChevronDown
                    className="size-5 shrink-0 text-fg-muted transition-transform duration-300 group-open:rotate-180 group-open:text-flow"
                    aria-hidden
                  />
                  {f.q}
                </summary>
                <p className="px-5 pb-6 pl-14 leading-relaxed text-fg-muted md:px-6 md:pl-15">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
