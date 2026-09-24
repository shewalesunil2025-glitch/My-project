"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import type { DemoEvent } from "@/content/demos";
import { useSequence } from "@/hooks/useSequence";
import { Appear } from "@/components/solutions/previews/parts";

/** Streams a demo's scripted events once the console scrolls into view. */
export function EventConsole({ events, name }: { events: DemoEvent[]; name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const step = useSequence(events.length, 900, 3200, inView);

  return (
    <div ref={ref} className="flex h-full flex-col rounded-2xl border border-white/10 bg-ink-950/70 font-mono">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 text-[0.62rem] tracking-[0.18em] text-fg-subtle uppercase">
        <span className="flex items-center gap-2">
          <span className="size-1.5 animate-pulse-soft rounded-full bg-live" aria-hidden />
          {name} · sample log
        </span>
        <span className="hidden sm:inline">Sample flow</span>
      </div>
      <ol className="flex-1 space-y-2.5 p-4 text-[0.72rem] md:text-xs">
        {events.map((e, i) => (
          <li key={i}>
            <Appear show={step > i} className="grid grid-cols-[3rem_1fr] gap-2 sm:grid-cols-[3.2rem_5.2rem_1fr]">
              <span className="text-fg-subtle">{e.time}</span>
              <span className="grid gap-0.5 sm:contents">
                <span className="text-flow-soft">{e.channel}</span>
                <span className="font-sans text-fg-muted">{e.text}</span>
              </span>
            </Appear>
          </li>
        ))}
      </ol>
    </div>
  );
}
