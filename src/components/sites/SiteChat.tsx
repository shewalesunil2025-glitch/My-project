"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, Send, X } from "lucide-react";

type Line = { role: "user" | "assistant"; content: string };

/**
 * The chat on every published ibaxai website: customers ask about services, prices, timings
 * and policies, and IBAX answers from the business's own details (/api/site-chat). When a
 * customer needs a person, the owner gets a WhatsApp alert and a lead in the app.
 */
export function SiteChat({ slug, name, accent }: { slug: string; name: string; accent: string }) {
  const [on, setOn] = useState(false);
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const alerted = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/site-chat?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { on?: boolean } | null) => setOn(Boolean(d?.on)))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [lines, busy]);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const history: Line[] = [...lines, { role: "user", content: text }];
    setLines(history);
    setInput("");
    setBusy(true);
    const res = await fetch("/api/site-chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, messages: history, alerted: alerted.current }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { ok?: boolean; reply?: string; alerted?: boolean } | null;
    if (data?.alerted) alerted.current = true;
    setLines((l) => [
      ...l,
      {
        role: "assistant",
        content: data?.ok && data.reply ? data.reply : "Sorry, I couldn't answer just now. Please try again, or leave your number in the enquiry form and we'll call you.",
      },
    ]);
    setBusy(false);
  }

  if (!on) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close chat" : `Chat with ${name}`}
        className="fixed right-4 bottom-[5.25rem] z-50 grid size-14 place-items-center rounded-full text-white shadow-[0_12px_32px_-8px_rgb(0_0_0/0.5)] transition-transform hover:scale-105"
        style={{ background: accent }}
      >
        {open ? <X className="size-6" aria-hidden /> : <MessageCircle className="size-6" aria-hidden />}
      </button>

      {open && (
        <section
          role="dialog"
          aria-label={`Chat with ${name}`}
          className="fixed inset-x-3 bottom-[9.5rem] z-50 flex h-[min(30rem,calc(100dvh-11rem))] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white text-neutral-900 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)] sm:inset-x-auto sm:right-4 sm:w-[23rem]"
        >
          <header className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: accent }}>
            <span className="grid size-9 place-items-center rounded-full bg-white/20">
              <MessageCircle className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{name}</span>
              <span className="block text-xs text-white/85">Usually replies instantly</span>
            </span>
          </header>

          <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto bg-neutral-50 px-3 py-3 text-sm">
            <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 leading-relaxed shadow-sm">
              Hi! 👋 How can we help you? Ask about our services, prices or timings — in any language.
            </p>
            {lines.map((l, i) => (
              <div key={i} className={l.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p
                  className={
                    l.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2.5 leading-relaxed whitespace-pre-line text-white"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 leading-relaxed whitespace-pre-line shadow-sm"
                  }
                  style={l.role === "user" ? { background: accent } : undefined}
                >
                  {l.content}
                </p>
              </div>
            ))}
            {busy && (
              <div className="flex w-fit gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm" role="status" aria-label="Typing">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="size-1.5 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            )}
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-black/[0.06] p-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={800}
              placeholder="Type your question…"
              aria-label="Your question"
              className="h-11 min-w-0 flex-1 rounded-full border border-black/10 bg-white px-4 text-[16px] focus:outline-none focus:ring-2 sm:text-sm"
              style={{ ["--tw-ring-color" as string]: accent }}
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              aria-label="Send"
              className="grid size-11 shrink-0 place-items-center rounded-full text-white disabled:opacity-40"
              style={{ background: accent }}
            >
              <Send className="size-4" aria-hidden />
            </button>
          </form>
          <p className="pb-1.5 text-center text-[0.65rem] text-neutral-400">Powered by ibaxai</p>
        </section>
      )}
    </>
  );
}
