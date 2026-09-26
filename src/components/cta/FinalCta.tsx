import { siteConfig } from "@/config/site";
import { Scramble } from "@/components/effects/Scramble";
import { ButtonLink } from "@/components/ui/Button";
import { RevealWords } from "@/components/effects/RevealWords";
import { Reveal } from "@/components/effects/Reveal";
import { BookDemoButton } from "./BookDemoButton";

/** Final call to action with the neural "sunrise" glow rising from the bottom. */
export function FinalCta() {
  return (
    <section id="contact" aria-labelledby="cta-title" className="px-2 md:px-4">
      <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/[0.06] bg-ink-950 pt-24 pb-44 md:rounded-[3rem] md:pt-32 md:pb-64">
        <div aria-hidden className="absolute inset-x-[-20%] bottom-[-55%] -z-10 h-[120%] rounded-[50%] bg-[radial-gradient(closest-side,#fff7f0_0%,#ffd2b3_12%,#ff7a3d_32%,#8b5cf6_48%,rgb(139_92_246/0.35)_66%,transparent_80%)] md:bottom-[-70%]" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[radial-gradient(60%_100%_at_50%_100%,rgb(139_92_246/0.35),transparent)]" />
        <div className="container-x text-center">
          <Reveal>
            <p className="badge"><span aria-hidden className="text-flow-soft/80">10 //</span> <Scramble text="Next step" /></p>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 id="cta-title" className="display mx-auto mt-5 max-w-3xl text-[clamp(2.2rem,5.2vw,4.2rem)]">
            <RevealWords text="Ready to build your next flow?" />
          </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-5 max-w-xl text-fg-muted md:text-lg">
              Let&apos;s turn your website, conversations and daily workflows into one intelligent system.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <BookDemoButton size="lg" variant="light" icon />
              <ButtonLink href={`mailto:${siteConfig.email}`} variant="ghost" size="lg">
                Talk to Nexa Flow AI
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
