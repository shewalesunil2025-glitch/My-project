import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/effects/Reveal";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  className?: string;
  id?: string;
};

export function SectionHeading({ eyebrow, title, lead, align = "left", className, id }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      <Reveal>
        <p className="eyebrow mb-5">{eyebrow}</p>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 id={id} className="display text-metal text-[clamp(2.4rem,6vw,5rem)]">
          {title}
        </h2>
      </Reveal>
      {lead && (
        <Reveal delay={0.16}>
          <p className="mt-6 text-lg leading-relaxed text-fg-muted md:text-xl">{lead}</p>
        </Reveal>
      )}
    </div>
  );
}
