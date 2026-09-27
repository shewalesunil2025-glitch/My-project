import { siteConfig } from "@/config/site";
import { Scramble } from "@/components/effects/Scramble";
import { ButtonLink } from "@/components/ui/Button";
import { RevealWords } from "@/components/effects/RevealWords";
import { Reveal } from "@/components/effects/Reveal";
import { PointCloud } from "@/components/scene/PointCloud";
import { BookDemoButton } from "./BookDemoButton";

/** Reference "Contact us Today": a particle form morphing over a slow green swirl. */
export function FinalCta() {
  return (
    <section id="contact" aria-labelledby="cta-title" className="relative isolate overflow-hidden py-24 md:py-32">
      <div aria-hidden className="swirl absolute inset-0 -z-10" />
      <div className="container-x text-center">
        <div className="relative mx-auto h-56 w-full max-w-md md:h-72">
          <PointCloud shape="morph" size={0.95} />
        </div>
        <p className="-mt-4 font-mono text-[0.68rem] tracking-[0.18em] text-flow uppercase">
          {"// "}
          <Scramble text="Next step" />
          {" //"}
        </p>
        <h2 id="cta-title" className="display mx-auto mt-4 max-w-3xl text-[clamp(2.4rem,5.6vw,4.6rem)]">
          <RevealWords text="Ready to build your next flow?" />
        </h2>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-5 max-w-md text-sm text-fg-muted md:text-base">
            Let&apos;s turn your website, conversations and daily workflows into one intelligent system.
          </p>
        </Reveal>
        <Reveal delay={0.18}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <BookDemoButton size="lg" />
            <ButtonLink href={`mailto:${siteConfig.email}`} variant="ghost" size="lg">
              Talk to Nexa Flow AI
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
