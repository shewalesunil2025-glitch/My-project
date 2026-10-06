"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Check, Mic, MicOff, PlugZap, Send, ShieldCheck, Trash2, Volume2, VolumeX, X } from "lucide-react";
import { product } from "@/config/product";
import { providerInfo, serviceById } from "@/content/app/services";
import { priceLabel } from "@/lib/app/agentActions";
import { clearAgentConversation, connectFromCard, payFromCard, sendToAgent, useAgentBusy } from "@/lib/app/agentClient";
import type { AgentCard, Workspace } from "@/lib/app/types";
import { cn } from "@/lib/cn";
import { ShambhuBot } from "@/components/shambhu/ShambhuBot";
import { Btn, Spinner } from "./ui";

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

type Lang = "en" | "hi" | "mr";
const languages: { code: Lang; label: string; speech: string }[] = [
  { code: "en", label: "English", speech: "en-IN" },
  { code: "hi", label: "हिंदी", speech: "hi-IN" },
  { code: "mr", label: "मराठी", speech: "mr-IN" },
];
const speechTag = (lang: Lang) => languages.find((l) => l.code === lang)!.speech;

/** Closest installed voice; Marathi falls back to Hindi (same script). */
function pickVoice(tag: string) {
  const voices = window.speechSynthesis.getVoices();
  const norm = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace("_", "-");
  return voices.find((v) => norm(v) === tag.toLowerCase()) ?? voices.find((v) => norm(v).startsWith(tag.slice(0, 3).toLowerCase())) ?? (tag.startsWith("mr") ? voices.find((v) => norm(v).startsWith("hi-")) : undefined);
}

/** IBAX's voice, the same child's voice as on the website. */
function speak(text: string, lang: Lang, onStart?: () => void, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ""));
  const tag = /[\u0900-\u097F]/.test(text) && lang === "en" ? "hi-IN" : speechTag(lang);
  const voice = pickVoice(tag);
  if (voice) utter.voice = voice;
  utter.lang = voice?.lang ?? tag;
  utter.pitch = 1.65;
  utter.rate = 1.04;
  utter.onstart = () => onStart?.();
  utter.onend = utter.onerror = () => onEnd?.();
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
      <p className="text-xs text-fg-muted">Payment</p>
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
            {paying ? <Spinner /> : "Pay"}
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

export const agentSuggestions = ["Mujhe WhatsApp automation chahiye", "Price kya hai?", "Aaj kya hua?", "Digital Marketing me kya milta hai?"];

type Status = "idle" | "listening" | "thinking" | "speaking";

/** Little equaliser bars while IBAX listens or speaks (as on the website). */
function Bars() {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-[2px] rounded-full bg-flow"
          animate={{ height: ["30%", "100%", "45%", "85%", "30%"] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12 }}
        />
      ))}
    </span>
  );
}

function readMuted() {
  try {
    return localStorage.getItem("ibax-muted") === "1";
  } catch {
    return false;
  }
}

/**
 * The IBAX chat — the same panel as the chatbot on the website (living orb, voice,
 * language picker, mic), plus the action cards that let the owner pay, connect an
 * account and activate a service inside the conversation. Used in the floating sheet
 * and on the Assistant page.
 */
export function IbaxChat({ ws, onClose, className }: { ws: Workspace; onClose?: () => void; className?: string }) {
  const busy = useAgentBusy();
  const [q, setQ] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(readMuted);
  const [lang, setLang] = useState<Lang>(() => (ws.assistant?.language.toLowerCase().startsWith("hindi") ? "hi" : "en"));
  const canListen = useSyncExternalStore(noopSubscribe, () => Boolean(getRecognition()), () => false);
  const recRef = useRef<Recognition | null>(null);
  const lastSpoken = useRef<string | null>(ws.chat.at(-1)?.id ?? null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const name = product.assistantName;
  const last = ws.chat.at(-1);
  const status: Status = listening ? "listening" : busy ? "thinking" : speaking ? "speaking" : "idle";

  useEffect(() => {
    window.speechSynthesis?.getVoices();
    return () => {
      recRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [ws.chat.length, busy, interim]);

  // Every new answer is read aloud unless the voice is off — as on the website.
  useEffect(() => {
    if (!last || last.role !== "assistant" || last.id === lastSpoken.current) return;
    lastSpoken.current = last.id;
    if (!muted && last.text) speak(last.text, lang, () => setSpeaking(true), () => setSpeaking(false));
  }, [last, muted, lang]);

  const send = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t || busy) return;
      // A tap counts as a user gesture: prime speech so the reply can play on iPhone.
      if (!muted && "speechSynthesis" in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
      setQ("");
      void sendToAgent(t);
    },
    [busy, muted],
  );

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    try {
      localStorage.setItem("ibax-muted", next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getRecognition();
    if (!Ctor) return;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    const rec = new Ctor();
    rec.lang = speechTag(lang);
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
      if (finalText.trim()) send(finalText);
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(q);
  };

  const statusText = status === "listening" ? "Listening…" : status === "thinking" ? "Working on it…" : status === "speaking" ? "Speaking…" : "Online · voice assistant";
  const greeting = `Namaste! Main ${name} hoon — aapka AI business assistant. English, हिंदी, मराठी — kisi bhi bhasha mein poochhiye. Koi bhi service chahiye to bas boliye, main yahin payment se activation tak sab kar dunga.`;
  const human = `https://wa.me/${product.supportPhone.replace(/\D/g, "")}`;

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
        <span className="relative size-11 shrink-0">
          <ShambhuBot mood={status} bleed={1} className="size-full" />
          <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-ink-900 bg-flow" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{name}</span>
          <span className="flex items-center gap-1.5 text-xs text-flow" aria-live="polite">
            {(status === "speaking" || status === "listening") && <Bars />}
            {statusText}
          </span>
        </span>
        <button type="button" onClick={toggleMute} aria-label={muted ? "Turn voice on" : "Turn voice off"} className="grid size-9 place-items-center rounded-full text-fg-muted hover:bg-white/5 hover:text-fg">
          {muted ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
        </button>
        {ws.chat.length > 0 && (
          <button type="button" onClick={() => clearAgentConversation(ws)} aria-label="Clear conversation" title="Clear conversation" className="grid size-9 place-items-center rounded-full text-fg-muted hover:bg-white/5 hover:text-fg">
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full text-fg-muted hover:bg-white/5 hover:text-fg">
            <X className="size-4" aria-hidden />
          </button>
        )}
      </header>

      {/* Messages */}
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-white/[0.06] bg-white/[0.05] px-3.5 py-2.5 text-sm leading-relaxed text-fg">{greeting}</div>
        </div>
        {ws.chat.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {agentSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-white/12 px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-flow/50 hover:text-flow"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {ws.chat.map((m) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                m.role === "user" ? "rounded-br-sm bg-flow text-ink-950" : "rounded-bl-sm border border-white/[0.06] bg-white/[0.05] text-fg",
              )}
            >
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
              {m.role === "assistant" && m.text && !muted && (
                <button
                  type="button"
                  onClick={() => speak(m.text, lang, () => setSpeaking(true), () => setSpeaking(false))}
                  aria-label="Play this answer"
                  className="mt-1.5 flex items-center gap-1 text-[0.7rem] text-flow/80 hover:text-flow"
                >
                  <Volume2 className="size-3" aria-hidden /> Listen
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {interim && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-sm border border-flow/40 px-3.5 py-2.5 text-sm text-fg/80 italic">{interim}</div>
          </div>
        )}
        {busy && (
          <div className="flex w-fit gap-1 rounded-2xl rounded-bl-sm bg-white/[0.05] px-4 py-3" role="status" aria-label={`${name} is working on it`}>
            {[0, 1, 2].map((d) => (
              <span key={d} className="size-1.5 animate-bounce rounded-full bg-flow" style={{ animationDelay: `${d * 0.15}s` }} />
            ))}
          </div>
        )}
      </div>

      {/* Speaking language + contact */}
      <div className="flex items-center justify-between gap-2 px-4 pb-2 text-[0.7rem] text-fg-subtle">
        <span className="flex items-center gap-1" role="group" aria-label="Speaking language">
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              aria-pressed={lang === l.code}
              className={cn("rounded-full px-2 py-0.5 transition-colors", lang === l.code ? "bg-flow/15 text-flow" : "hover:text-fg")}
            >
              {l.label}
            </button>
          ))}
        </span>
        <a href={human} target="_blank" rel="noopener noreferrer" className="hover:text-flow">
          Talk to a human →
        </a>
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-white/[0.07] p-3">
        {canListen && (
          <button
            type="button"
            onClick={toggleMic}
            disabled={busy}
            aria-label={listening ? "Stop listening" : `Speak to ${name}`}
            className={cn(
              "relative grid size-11 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-40",
              listening ? "bg-flow text-ink-950" : "border border-flow/40 text-flow hover:bg-flow/10",
            )}
          >
            {listening && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-flow/40" />}
            {listening ? <MicOff className="relative size-5" aria-hidden /> : <Mic className="size-5" aria-hidden />}
          </button>
        )}
        <input
          ref={inputRef}
          id="ibax-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={2000}
          placeholder={canListen ? "Type or tap the mic…" : "Type your question…"}
          aria-label={`Message ${name}`}
          autoComplete="off"
          className="h-11 min-w-0 flex-1 rounded-full border border-white/10 bg-ink-950/60 px-4 text-[16px] text-fg placeholder:text-fg-subtle focus:border-flow/50 focus:outline-none md:text-sm"
        />
        <button type="submit" disabled={!q.trim() || busy} aria-label="Send" className="grid size-11 shrink-0 place-items-center rounded-full bg-flow text-ink-950 transition-opacity disabled:opacity-40">
          <Send className="size-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}
