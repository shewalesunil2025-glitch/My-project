"use client";

import { ArrowRight, X } from "lucide-react";
import { solutions, type SolutionId } from "@/content/solutions";
import { solutionAnchor } from "@/lib/solutionLinks";

/** Compact explainer for one solution, shown next to the hero panel that opened it. */
export function SolutionInfo({ id, onClose, headingId }: { id: SolutionId; onClose: () => void; headingId: string }) {
  const s = solutions.find((x) => x.id === id);
  if (!s) return null;
  return (
    <div className="relative rounded-2xl border border-flow/30 bg-ink-850/95 p-5 text-left shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9),0_0_40px_-12px_rgb(255_90_31/0.45)] backdrop-blur-xl">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 grid size-8 place-items-center rounded-full text-fg-muted transition-colors hover:bg-white/5 hover:text-fg"
      >
        <X className="size-4" aria-hidden />
      </button>
      <p className="text-xs font-semibold text-flow">{s.title}</p>
      <h3 id={headingId} className="mt-2 pr-6 text-lg leading-snug font-semibold tracking-tight">
        {s.headline}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.summary}</p>
      <ol className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-fg-muted">
        {s.steps.map((step, i) => (
          <li key={step} className="flex items-center gap-1.5">
            <span className="rounded-full border border-white/10 px-2 py-0.5">{step}</span>
            {i < s.steps.length - 1 && <span className="text-fg-subtle" aria-hidden>→</span>}
          </li>
        ))}
      </ol>
      <a
        href={solutionAnchor(id)}
        onClick={onClose}
        className="link-underline mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-flow-soft"
      >
        See the live demo <ArrowRight className="size-3.5" aria-hidden />
      </a>
    </div>
  );
}
