"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowUp } from "lucide-react";
import { LumiMark } from "./ui";

/** "Ask <assistant> anything…" — opens the conversation inside the app. */
export function AskBar({ name, examples }: { name: string; examples: string[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const go = (text: string) => text.trim() && router.push(`/app/assistant?q=${encodeURIComponent(text.trim())}`);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    go(q);
  };

  return (
    <div>
      <form onSubmit={onSubmit} className="glass flex items-center gap-2 rounded-full p-1.5 pl-2 focus-within:border-flow/50">
        <LumiMark className="size-9 shrink-0" glow={false} />
        <label htmlFor="ask" className="sr-only">
          Ask {name} anything
        </label>
        <input
          id="ask"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Ask ${name} anything…`}
          className="min-w-0 flex-1 bg-transparent px-1 text-[0.95rem] text-fg placeholder:text-fg-subtle focus:outline-none focus-visible:outline-none"
          autoComplete="off"
        />
        <button type="submit" aria-label="Ask" className="grid size-10 shrink-0 place-items-center rounded-full bg-flow text-white disabled:opacity-40" disabled={!q.trim()}>
          <ArrowUp className="size-4" aria-hidden />
        </button>
      </form>
      <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        {examples.map((s) => (
          <li key={s} className="shrink-0">
            <button type="button" onClick={() => go(s)} className="h-8 rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs text-fg-muted hover:border-white/20 hover:text-fg">
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
