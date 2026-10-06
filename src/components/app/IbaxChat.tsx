"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowUp, Check, Lock, Mic, MicOff, PlugZap, ShieldCheck, Trash2, Volume2 } from "lucide-react";
import { product } from "@/config/product";
import { providerInfo, serviceById } from "@/content/app/services";
import { priceLabel } from "@/lib/app/agentActions";
import { clearAgentConversation, connectFromCard, payFromCard, sendToAgent, useAgentBusy } from "@/lib/app/agentClient";
import { detectLang } from "@/lib/app/agentLocal";
import type { AgentCard, ChatMessage, Workspace } from "@/lib/app/types";
import { cn } from "@/lib/cn";
import { Btn, LumiMark, Spinner, fmtTime } from "./ui";

/* ── Voice: speak to IBAX and hear the answer (browser speech, where supported) ── */
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionCtor = new () => Recognition;
function getRecognition(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
const noopSubscribe = () => () => {};

function speechLang(ws: Workspace) {
  const last = ws.chat.filter((m) => m.role === "user").at(-1)?.text ?? "";
  const lang = ws.agentFlow?.lang ?? (last ? detectLang(last) : undefined);
  if (lang === "hi" || lang === "hl") return "hi-IN";
  const pref = ws.assistant?.language.toLowerCase() ?? "";
  if (pref.startsWith("hindi")) return "hi-IN";
  if (pref.startsWith("marathi")) return "mr-IN";
  return "en-IN";
}

function speak(text: string, lang: string) {
  if (!("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ""));
  const tag = /[ऀ-ॿ]/.test(text) ? "hi-IN" : lang;
  const voice = synth.getVoices().find((v) => v.lang.replace("_", "-").toLowerCase() === tag.toLowerCase()) ?? synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(tag.slice(0, 2)));
  if (voice) utter.voice = voice;
  utter.lang = voice?.lang ?? tag;
  utter.pitch = 1.65;
  utter.rate = 1.04;
  synth.speak(utter);
}

/* ── Action cards ── */
function PayCard({ card }: { card: Extract<AgentCard, { type: "pay" }> }) {
  const busy = useAgentBusy();
  const [paying, setPaying] = useState(false);
  const svc = serviceById(card.serviceId);
  if (!svc) return null;
  return (
    <div className="mt-3 rounded-2xl border border-flow/30 bg-ink-950/70 p-3.5">
      <p className="text-xs text-fg-muted">Secure payment</p>
      <p className="mt-0.5 font-semibold">{svc.name}</p>
      <p className="text-sm text-flow-soft">{priceLabel(svc, card.period)}</p>
      {card.done ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
          <Check className="size-4" aria-hidden /> Paid
        </p>
      ) : (
        <>
          <Btn
            size="sm"
            className="mt-3 w-full"
            disabled={paying || busy}
            onClick={() => {
              setPaying(true);
              // Preview mode: simulated payment. Production opens the payment provider's checkout.
              setTimeout(() => void payFromCard(card).finally(() => setPaying(false)), 700);
            }}
          >
            {paying ? <Spinner /> : <Lock className="size-3.5" aria-hidden />}
            {product.previewMode ? "Confirm test payment" : "Pay securely"}
          </Btn>
          {product.previewMode && <p className="mt-2 text-[0.68rem] leading-snug text-amber-200/90">Preview mode — test payment, nothing is charged.</p>}
        </>
      )}
    </div>
  );
}

function ConnectCard({ card }: { card: Extract<AgentCard, { type: "connect" }> }) {
  const busy = useAgentBusy();
  const [account, setAccount] = useState("");
  const info = providerInfo[card.provider];
  const whatsapp = card.provider === "whatsapp";
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (account.trim()) void connectFromCard(card, account);
  };
  return (
    <div className="mt-3 rounded-2xl border border-flow/30 bg-ink-950/70 p-3.5">
      <p className="flex items-center gap-1.5 text-xs text-fg-muted">
        <PlugZap className="size-3.5" aria-hidden /> Connect account
      </p>
      <p className="mt-0.5 font-semibold">{info.name}</p>
      {card.done ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
          <Check className="size-4" aria-hidden /> Connected
        </p>
      ) : (
        <form onSubmit={submit} className="mt-2 space-y-2">
          <p className="text-xs leading-snug text-fg-muted">{info.help}</p>
          <label className="sr-only" htmlFor={`connect-${card.provider}`}>
            {whatsapp ? "WhatsApp Business number" : `${info.name} account`}
          </label>
          <input
            id={`connect-${card.provider}`}
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            inputMode={whatsapp ? "tel" : undefined}
            placeholder={whatsapp ? "WhatsApp Business number, e.g. +91 98765 43210" : "Account name or email"}
            className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm placeholder:text-fg-subtle focus:border-flow/50 focus:outline-none"
            autoComplete="off"
          />
          <Btn size="sm" type="submit" className="w-full" disabled={!account.trim() || busy}>
            <ShieldCheck className="size-3.5" aria-hidden /> Connect {info.name}
          </Btn>
          {product.previewMode && (
            <p className="text-[0.68rem] leading-snug text-amber-200/90">
              Preview mode — in the live app this button opens {whatsapp ? "Meta's" : `${info.name}'s`} own sign-in. {product.name} never sees your password.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

function ActivatedCard({ card }: { card: Extract<AgentCard, { type: "activated" }> }) {
  const svc = serviceById(card.serviceId);
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.07] p-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
        <Check className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{svc?.name} is active</p>
        <Link href={`/app/automations/${card.automationId}`} className="text-xs text-flow-soft underline underline-offset-2">
          Manage it
        </Link>
      </div>
    </div>
  );
}

function Cards({ cards }: { cards: AgentCard[] }) {
  return (
    <>
      {cards.map((c, i) =>
        c.type === "pay" ? <PayCard key={i} card={c} /> : c.type === "connect" ? <ConnectCard key={i} card={c} /> : <ActivatedCard key={i} card={c} />,
      )}
    </>
  );
}

export const agentSuggestions = [
  "Mujhe WhatsApp automation chahiye",
  "What happened today?",
  "Mere business ke liye kaunsi service best hai?",
  "Instagram post ka idea do",
  "How many leads came today?",
  "Activate YouTube automation",
];

/**
 * The IBAX conversation: messages, action cards (pay, connect, activated), typing and
 * the mic. Used on the Assistant page and in the floating IBAX sheet.
 */
export function IbaxChat({ ws, compact, autoFocus }: { ws: Workspace; compact?: boolean; autoFocus?: boolean }) {
  const busy = useAgentBusy();
  const [q, setQ] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const canListen = useSyncExternalStore(noopSubscribe, () => Boolean(getRecognition()), () => false);
  const recRef = useRef<Recognition | null>(null);
  const spokeRef = useRef(false);
  const lastSpoken = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const name = product.assistantName;
  const last = ws.chat.at(-1);

  useEffect(() => {
    if (compact) listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    else endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [ws.chat.length, busy, interim, compact]);

  // Read the answer aloud when the question was spoken.
  useEffect(() => {
    if (!last || last.role !== "assistant" || last.id === lastSpoken.current || !spokeRef.current) return;
    lastSpoken.current = last.id;
    spokeRef.current = false;
    if (last.text) speak(last.text, speechLang(ws));
  }, [last, ws]);

  useEffect(() => () => recRef.current?.abort(), []);

  const send = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setQ("");
    void sendToAgent(t);
  }, []);

  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getRecognition();
    if (!Ctor) return;
    window.speechSynthesis?.cancel();
    // A tap counts as a user gesture: prime speech so the reply can play on iPhone.
    window.speechSynthesis?.speak(new SpeechSynthesisUtterance(""));
    const rec = new Ctor();
    rec.lang = speechLang(ws);
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else live += r[0].transcript;
      }
      setInterim(finalText + live);
    };
    rec.onerror = () => setInterim("");
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
      setInterim("");
      if (finalText.trim()) {
        spokeRef.current = true;
        send(finalText);
      }
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(q);
  };

  const bubble = (m: ChatMessage) => (
    <div key={m.id} className={cn("flex items-start gap-2.5", m.role === "user" && "justify-end")}>
      {m.role === "assistant" && <LumiMark className="size-8 shrink-0" glow={false} />}
      <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed", m.role === "user" ? "rounded-tr-sm bg-flow text-ink-950" : "rounded-tl-sm bg-white/[0.07]")}>
        {m.text && <p className="whitespace-pre-line">{m.text}</p>}
        {m.cards && <Cards cards={m.cards} />}
        {m.links && m.links.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {m.links.map((l) => (
              <Link key={l.href + l.label} href={l.href} className="inline-flex h-8 items-center rounded-full bg-white/10 px-3 text-xs font-semibold text-fg hover:bg-white/15">
                {l.label} →
              </Link>
            ))}
          </div>
        )}
        <div className={cn("mt-1.5 flex items-center gap-2 text-[0.65rem]", m.role === "user" ? "text-ink-950/60" : "text-fg-subtle")}>
          {fmtTime(m.at)}
          {m.role === "assistant" && m.text && (
            <button type="button" onClick={() => speak(m.text, speechLang(ws))} className="inline-flex items-center gap-1 hover:text-fg" aria-label="Read this answer aloud">
              <Volume2 className="size-3" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("flex flex-col", compact ? "h-full min-h-0" : "min-h-[calc(100dvh-15rem)] lg:min-h-[calc(100dvh-11rem)]")}>
      <div ref={listRef} className={cn("flex-1 space-y-4", compact && "no-scrollbar min-h-0 overflow-y-auto px-4 pt-4 pb-2")} aria-live="polite">
        <div className="flex items-start gap-2.5">
          <LumiMark className="size-8 shrink-0" glow={false} />
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/[0.07] px-4 py-3 text-sm leading-relaxed">
            {ws.assistant?.welcome ?? `Hi! I'm ${name}.`}
            <p className="mt-2 text-fg-muted">
              Ask me anything — or just tell me which service you want and I&apos;ll set it up right here: payment, details, account and activation.
            </p>
          </div>
        </div>
        {ws.chat.map(bubble)}
        {interim && (
          <div className="flex justify-end">
            <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-flow/40 px-4 py-3 text-sm italic">{interim}</p>
          </div>
        )}
        {busy && (
          <div className="flex items-center gap-2.5" role="status">
            <LumiMark className="size-8 shrink-0 animate-pulse" glow={false} />
            <span className="text-sm text-fg-muted">{name} is working on it…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className={cn(compact ? "border-t border-white/[0.06] px-3 pt-2 pb-3" : "sticky bottom-20 mt-6 bg-ink-950/90 pt-2 backdrop-blur lg:bottom-4")}>
        {ws.chat.length === 0 && (
          <ul className="no-scrollbar mb-2.5 flex gap-2 overflow-x-auto pb-1">
            {agentSuggestions.map((s) => (
              <li key={s} className="shrink-0">
                <button type="button" onClick={() => send(s)} className="h-8 rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs text-fg-muted hover:text-fg">
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={onSubmit} className="glass flex items-center gap-1.5 rounded-full p-1.5 pl-4">
          <label htmlFor={compact ? "ibax-sheet-input" : "chat-input"} className="sr-only">
            Message {name}
          </label>
          <input
            id={compact ? "ibax-sheet-input" : "chat-input"}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={listening ? "Listening…" : `Message ${name}…`}
            className="min-w-0 flex-1 bg-transparent text-[0.95rem] placeholder:text-fg-subtle focus:outline-none focus-visible:outline-none"
            autoComplete="off"
            autoFocus={autoFocus}
          />
          {ws.chat.length > 0 && !compact && (
            <button type="button" onClick={() => clearAgentConversation(ws)} className="grid size-10 place-items-center rounded-full text-fg-muted hover:bg-white/[0.06] hover:text-fg" aria-label="Clear conversation" title="Clear conversation">
              <Trash2 className="size-4" aria-hidden />
            </button>
          )}
          {canListen && (
            <button
              type="button"
              onClick={toggleMic}
              disabled={busy}
              aria-pressed={listening}
              aria-label={listening ? "Stop listening" : "Speak to IBAX"}
              className={cn("grid size-10 place-items-center rounded-full transition-colors disabled:opacity-40", listening ? "animate-pulse bg-red-500/90 text-white" : "bg-white/[0.08] text-fg hover:bg-white/[0.14]")}
            >
              {listening ? <MicOff className="size-4" aria-hidden /> : <Mic className="size-4" aria-hidden />}
            </button>
          )}
          <button type="submit" aria-label="Send" disabled={!q.trim() || busy} className="grid size-10 place-items-center rounded-full bg-flow text-ink-950 disabled:opacity-40">
            <ArrowUp className="size-4" aria-hidden />
          </button>
        </form>
      </div>
    </div>
  );
}
