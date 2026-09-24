import { siteConfig } from "@/config/site";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/effects/Reveal";
import { BookDemoButton } from "./BookDemoButton";

export function FinalCta() {
  return (
    <section id="contact" aria-labelledby="cta-title" className="noise relative isolate overflow-hidden py-32 md:py-52">
      {/* Horizon */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-[70%]">
        <div className="absolute left-1/2 top-full h-[160vw] w-[220vw] -translate-x-1/2 -translate-y-[18%] rounded-[50%] border-t border-flow/40 bg-[radial-gradient(closest-side,rgb(79_125_255/0.22),transparent)] shadow-[0_-40px_120px_-20px_rgb(79_125_255/0.35)] md:w-[160vw]" />
      </div>
      <div className="container-x text-center">
        <Reveal>
          <p className="eyebrow mb-6">Next step</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 id="cta-title" className="display mx-auto max-w-5xl text-[clamp(2.8rem,8.6vw,7.4rem)]">
            <span className="text-metal">READY TO BUILD YOUR </span>
            <span className="text-flow">NEXT FLOW?</span>
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-8 max-w-xl text-lg text-fg-muted md:text-xl">
            Let&apos;s turn your website, conversations and daily workflows into one intelligent system.
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <BookDemoButton size="lg" icon />
            <ButtonLink href={`mailto:${siteConfig.email}`} variant="ghost" size="lg">
              Talk to Nexa Flow AI
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
