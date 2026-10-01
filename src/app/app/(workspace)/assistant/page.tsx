"use client";

import { product } from "@/config/product";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, Trash2 } from "lucide-react";
import { helpSuggestions, suggestions } from "@/lib/app/assistant";
import { updateWorkspace } from "@/lib/app/store";
import { useWorkspace } from "@/components/app/AppShell";
import { useAsk } from "@/components/app/useAsk";
import { Btn, LumiMark, fmtTime } from "@/components/app/ui";
import { cn } from "@/lib/cn";

function Chat() {
  const ws = useWorkspace();
  const { ask, thinking } = useAsk(ws);
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState("");
  const sentFromUrl = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initial = params.get("q");
    if (initial && ws && !sentFromUrl.current) {
      sentFromUrl.current = true;
      router.replace("/app/assistant");
      void ask(initial);
    }
  }, [params, ws, ask, router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [ws?.chat.length, thinking]);

  if (!ws?.assistant) return null;
  const name = product.name;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = q;
    setQ("");
    void ask(text);
  };

  return (
    <div className="flex min-h-[calc(100dvh-11rem)] flex-col lg:min-h-[calc(100dvh-7rem)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LumiMark className="size-11" />
          <div>
            <h1 className="text-lg font-semibold">Ask {name}</h1>
            <p className="text-xs text-fg-muted">
              Your AI business assistant · {ws.assistant.language} · {ws.assistant.tone}
            </p>
          </div>
        </div>
        {ws.chat.length > 0 && (
          <Btn variant="subtle" size="sm" onClick={() => updateWorkspace((w) => void (w.chat = []))} aria-label="Clear conversation">
            <Trash2 className="size-4" aria-hidden /> Clear
          </Btn>
        )}
      </div>

      <div className="flex-1 space-y-4" aria-live="polite">
        <div className="flex items-start gap-2.5">
          <LumiMark className="size-8 shrink-0" glow={false} />
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/[0.07] px-4 py-3 text-sm leading-relaxed">
            {ws.assistant.welcome}
            <p className="mt-2 text-fg-muted">Ask me about today&apos;s calls, messages, leads, videos and reviews — or tell me what to create.</p>
          </div>
        </div>

        {ws.chat.map((m) => (
          <div key={m.id} className={cn("flex items-start gap-2.5", m.role === "user" && "justify-end")}>
            {m.role === "assistant" && <LumiMark className="size-8 shrink-0" glow={false} />}
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line",
                m.role === "user" ? "rounded-tr-sm bg-flow text-ink-950" : "rounded-tl-sm bg-white/[0.07]",
              )}
            >
              {m.text}
              {m.links && m.links.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.links.map((l) => (
                    <Link key={l.href + l.label} href={l.href} className="inline-flex h-8 items-center rounded-full bg-white/10 px-3 text-xs font-semibold text-fg hover:bg-white/15">
                      {l.label} →
                    </Link>
                  ))}
                </div>
              )}
              <p className={cn("mt-1.5 text-[0.65rem]", m.role === "user" ? "text-white/70" : "text-fg-subtle")}>{fmtTime(m.at)}</p>
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex items-center gap-2.5" role="status">
            <LumiMark className="size-8 shrink-0 animate-pulse" glow={false} />
            <span className="text-sm text-fg-muted">{name} is thinking…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-20 mt-6 bg-ink-950/90 pt-2 backdrop-blur lg:bottom-4">
        {ws.chat.length === 0 && (
          <ul className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
            {[...suggestions, ...helpSuggestions].map((s) => (
              <li key={s} className="shrink-0">
                <button type="button" onClick={() => void ask(s)} className="h-8 rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs text-fg-muted hover:text-fg">
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={onSubmit} className="glass flex items-center gap-2 rounded-full p-1.5 pl-4">
          <label htmlFor="chat-input" className="sr-only">
            Message {name}
          </label>
          <input
            id="chat-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Message ${name}…`}
            className="min-w-0 flex-1 bg-transparent text-[0.95rem] placeholder:text-fg-subtle focus:outline-none focus-visible:outline-none"
            autoComplete="off"
          />
          <button type="submit" aria-label="Send" disabled={!q.trim() || thinking} className="grid size-10 place-items-center rounded-full bg-flow text-ink-950 disabled:opacity-40">
            <ArrowUp className="size-4" aria-hidden />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense>
      <Chat />
    </Suspense>
  );
}
