"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AudioLines,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useDemo } from "@/components/cta/DemoProvider";
import {
  agentLanguages,
  type AgentLang,
  type AgentMessage,
  type AgentReply,
} from "@/lib/shambhuAgent";
import { answerLocally } from "@/lib/shambhuLocal";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ShambhuBot } from "./ShambhuBot";
import { AttachMenu, AttachmentChip, SentFile } from "@/components/chat/Attach";
import type { Attachment } from "@/lib/attachments";
import {
  speakNaturally,
  stopNaturalVoice,
  unlockAudio,
} from "@/lib/app/naturalVoice";
import {
  canRecord,
  openAudio,
  startCapture,
  transcribe,
  type Capture,
} from "@/lib/app/voiceCapture";
import {
  startLiveCall,
  type LiveCall,
  type LiveState,
} from "@/lib/app/liveCall";

/* ── Browser speech types (not in the TS DOM lib) ───────────────────────── */
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
};
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionCtor = new () => Recognition;

function getRecognition(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Status = "idle" | "listening" | "thinking" | "speaking";
type ChatLine = AgentMessage & { lang?: AgentLang; file?: { name: string; kind: string; thumb?: string } };

/** The phone's own voice (only when the natural voice isn't available): as in the app. */
const PHONE_PITCH = 1.08;
const PHONE_RATE = 1.08;

const GREETING =
  "Namaste! Main IBAX hoon. English, हिंदी, मराठी — kisi bhi bhasha mein poochhiye, main usi bhasha mein jawab dunga.";

const SUGGESTIONS = [
  "What does it cost?",
  "IBAX kya karta hai?",
  "हे कसं काम करतं?",
];

const PICKER: AgentLang[] = ["en", "hi", "mr"];

const noopSubscribe = () => () => {};
/**
 * iPhone/iPad: the browser's speech recognition starts and stops in a loop (the "tuduk tidik"
 * chimes), above all in the home-screen app. The keyboard's own mic (dictation) works well,
 * so on Apple phones the mic button opens the keyboard instead.
 */
const isAppleMobile = () =>
  typeof navigator !== "undefined" &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
const micErrorTip = (error?: string) =>
  error === "not-allowed" || error === "service-not-allowed"
    ? "Mic ki permission nahi mili. Keyboard ka 🎤 use kariye, ya browser settings mein mic allow kariye."
    : error === "no-speech"
      ? "Kuch sunai nahi diya. Dobara mic dabakar boliye."
      : "Mic abhi kaam nahi kar raha. Likh kar ya keyboard ke 🎤 se boliye.";

function initialLang(): AgentLang {
  if (typeof navigator === "undefined") return "en";
  const code = navigator.language.slice(0, 2) as AgentLang;
  return code in agentLanguages ? code : "en";
}

/** Picks the closest installed voice; Marathi falls back to Hindi (same script). */
function pickVoice(lang: AgentLang): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const tag = agentLanguages[lang].speech.toLowerCase();
  const byPrefix = (p: string) =>
    voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(p));
  return (
    voices.find((v) => v.lang.toLowerCase().replace("_", "-") === tag) ??
    byPrefix(`${lang}-`) ??
    (lang === "mr" ? byPrefix("hi-") : undefined) ??
    (lang === "en" ? (byPrefix("en-in") ?? byPrefix("en-")) : undefined)
  );
}

/**
 * IBAX, the website's voice assistant: a round button in the bottom-right
 * corner that opens a chat. Visitors can type or tap the mic and speak; IBAX
 * works out their language, answers in it and reads the answer aloud in the
 * same natural voice as IBAX in the app (/api/speak). Answers come from
 * /api/shambhu; the call button opens a live voice call (/api/live), as in the app.
 */
export function ShambhuAgent() {
  const { openDemo } = useDemo();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<ChatLine[]>([
    { role: "assistant", content: GREETING, lang: "hi" },
  ]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<Attachment | null>(null);
  const [interim, setInterim] = useState("");
  const [tip, setTip] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [lang, setLang] = useState<AgentLang>(initialLang);
  const [muted, setMuted] = useState(false);
  const canListen = useSyncExternalStore(
    noopSubscribe,
    () => Boolean(getRecognition()) || canRecord(),
    () => false,
  );
  const canCall = useSyncExternalStore(noopSubscribe, canRecord, () => false);
  const captureRef = useRef<Capture | null>(null);
  /** Live voice call (Gemini Live, answers in about a second), as in the app. */
  const liveRef = useRef<LiveCall | null>(null);
  const callAudio = useRef<AudioContext | null>(null);
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const [hint, setHint] = useState(false);
  const desktop = useMediaQuery("(min-width: 768px)");

  const recRef = useRef<Recognition | null>(null);
  /** Set once the AI endpoint is unavailable; IBAX then answers from the site's content (free mode). */
  const localRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const linesRef = useRef(lines);
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);
  const busy = status === "thinking";
  useEffect(() => {
    if (!tip) return;
    const t = setTimeout(() => setTip(""), 9000);
    return () => clearTimeout(t);
  }, [tip]);

  useEffect(() => {
    // Load the voice list early; Chrome fills it asynchronously.
    window.speechSynthesis?.getVoices();
    const show = setTimeout(() => setHint(true), 2500);
    const hide = setTimeout(() => setHint(false), 9000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [lines, interim, status]);

  const endCall = useCallback((message?: string) => {
    liveRef.current?.end();
    liveRef.current = null;
    void callAudio.current?.close();
    callAudio.current = null;
    setLiveState(null);
    setStatus("idle");
    if (message) setTip(message);
  }, []);

  // Closing the panel stops the mic, the call and the voice.
  const close = useCallback(() => {
    recRef.current?.abort();
    captureRef.current?.cancel();
    endCall();
    stopNaturalVoice();
    window.speechSynthesis?.cancel();
    setStatus("idle");
    setInterim("");
    setOpen(false);
  }, [endCall]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const stopSpeaking = useCallback(() => {
    stopNaturalVoice();
    window.speechSynthesis?.cancel();
    setStatus((s) => (s === "speaking" ? "idle" : s));
  }, []);

  /** The phone's own voice: the fallback when the natural voice isn't available. */
  const speakWithPhone = useCallback((text: string, replyLang: AgentLang) => {
    if (!("speechSynthesis" in window)) return setStatus("idle");
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(
      text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ""),
    );
    const voice = pickVoice(replyLang);
    if (voice) utter.voice = voice;
    utter.lang = voice?.lang ?? agentLanguages[replyLang].speech;
    utter.pitch = PHONE_PITCH;
    utter.rate = PHONE_RATE;
    utter.onstart = () => setStatus("speaking");
    utter.onend = utter.onerror = () =>
      setStatus((s) => (s === "speaking" ? "idle" : s));
    synth.speak(utter);
  }, []);

  /** IBAX speaks in the same natural voice as in the app; the phone's voice if that isn't available. */
  const speak = useCallback(
    async (text: string, replyLang: AgentLang) => {
      stopNaturalVoice();
      window.speechSynthesis?.cancel();
      // "speaking" starts only when audio really starts, so a silent failure never locks the chat.
      setStatus("idle");
      if (muted) return;
      const handled = await speakNaturally(
        text,
        () => setStatus("speaking"),
        () => setStatus((s) => (s === "speaking" ? "idle" : s)),
      );
      if (!handled) speakWithPhone(text, replyLang);
    },
    [muted, speakWithPhone],
  );

  const ask = useCallback(
    async (question: string) => {
      const attached = file;
      // A file on its own: ask IBAX what it is about.
      const text = question.trim() || (attached ? "Is file ke baare me batao." : "");
      if (!text || busy) return;
      // A tap counts as a user gesture: unlock audio so the reply may play on iOS.
      if (!muted) {
        unlockAudio();
        if ("speechSynthesis" in window)
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
      }
      const history: ChatLine[] = [
        ...linesRef.current,
        { role: "user", content: text, file: attached ? { name: attached.name, kind: attached.kind, thumb: attached.thumb } : undefined },
      ];
      setLines(history);
      setInput("");
      setFile(null);
      setInterim("");
      setStatus("thinking");
      let data: AgentReply | null = null;
      try {
        if (localRef.current) throw new Error("local");
        const res = await fetch("/api/shambhu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // The greeting is local only; send the real conversation.
          body: JSON.stringify({
            messages: history
              .slice(1)
              .map(({ role, content }) => ({ role, content })),
            // The photo or PDF goes with the latest question only; a text file is sent as text.
            attachment: attached ? { kind: attached.kind, name: attached.name, mime: attached.mime, data: attached.data } : undefined,
          }),
        });
        if (res.status === 503 || res.status === 404) localRef.current = true;
        if (!res.ok) throw new Error(String(res.status));
        data = (await res.json()) as AgentReply;
      } catch {
        // Free mode: answer from the site's own content, right here in the browser.
        await new Promise((resolve) => setTimeout(resolve, 450));
        data = answerLocally(text, lang);
      }
      const reply = data;
      setLines((l) => [
        ...l,
        { role: "assistant", content: reply.reply, lang: reply.lang },
      ]);
      setLang(reply.lang);
      void speak(reply.reply, reply.lang);
    },
    [busy, lang, muted, speak, file],
  );

  /** Record → our server turns it into text → ask. Works on iPhone, where browser recognition doesn't. */
  const recordAndAsk = async () => {
    stopSpeaking();
    setTip("");
    let cap: Capture;
    try {
      cap = await startCapture();
    } catch {
      setTip(micErrorTip("not-allowed"));
      return;
    }
    captureRef.current = cap;
    setStatus("listening");
    setInterim("🎙️ Boliye…");
    const blob = await cap.done;
    captureRef.current = null;
    setStatus((s) => (s === "listening" ? "idle" : s));
    if (!blob) {
      setInterim("");
      setTip(micErrorTip("no-speech"));
      return;
    }
    setInterim("✍️ …");
    const t = await transcribe(blob, lang);
    setInterim("");
    if (!t.ok)
      return setTip(
        "Awaaz samajh nahi aayi. Dobara boliye ya likh kar poochhiye.",
      );
    if (!t.text) return setTip(micErrorTip("no-speech"));
    void ask(t.text);
  };

  const toggleMic = () => {
    if (status === "listening") {
      if (captureRef.current) captureRef.current.stop();
      else recRef.current?.stop();
      return;
    }
    if ((isAppleMobile() || !getRecognition()) && canRecord()) {
      if (!muted) unlockAudio();
      void recordAndAsk();
      return;
    }
    const Ctor = getRecognition();
    if (!Ctor) return;
    stopSpeaking();
    const rec = new Ctor();
    rec.lang = agentLanguages[lang].speech;
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
    rec.onerror = (e) => {
      setInterim("");
      if (e.error !== "aborted") setTip(micErrorTip(e.error));
    };
    rec.onend = () => {
      recRef.current = null;
      setStatus((s) => (s === "listening" ? "idle" : s));
      if (finalText.trim()) void ask(finalText);
      else setInterim("");
    };
    recRef.current = rec;
    setStatus("listening");
    rec.start();
  };

  /** Voice call, like a phone call: IBAX listens, answers out loud and listens again. */
  const startCall = () => {
    recRef.current?.abort();
    captureRef.current?.cancel();
    stopSpeaking();
    setTip("");
    unlockAudio();
    const audio = openAudio();
    callAudio.current = audio;
    setLiveState("connecting");
    const stillOn = () => callAudio.current === audio;
    void startLiveCall(audio, {
      audience: "site",
      context: "",
      onState: (st) => {
        if (!stillOn()) return;
        setLiveState(st);
        setStatus(st === "connecting" ? "idle" : st);
      },
      onOwnerSaid: (text) =>
        setLines((l) => [...l, { role: "user", content: text }]),
      onIbaxSaid: (text) =>
        setLines((l) => [...l, { role: "assistant", content: text, lang }]),
      onAction: async () => ({
        content: "Not available on the website.",
        is_error: true,
      }),
      onDrop: (reason) => {
        if (!stillOn()) return;
        endCall(
          reason === "mic"
            ? micErrorTip("not-allowed")
            : "Call band ho gayi. Dobara call kariye, ya likh kar poochhiye.",
        );
      },
    }).then((live) => {
      if (!stillOn()) return live?.end();
      if (live) liveRef.current = live;
      else
        endCall(
          "Call abhi nahi lag rahi. Mic se boliye ya likh kar poochhiye.",
        );
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void ask(input);
  };

  const replay = (line: ChatLine) => {
    if (status === "speaking") stopSpeaking();
    else {
      unlockAudio();
      void speak(line.content, line.lang ?? lang);
    }
  };

  const statusText =
    status === "listening"
      ? "Listening…"
      : status === "thinking"
        ? "Thinking…"
        : status === "speaking"
          ? "Speaking…"
          : "Online · voice assistant";

  return (
    <>
      {/* Launcher */}
      <div
        className={cn(
          "fixed right-3 bottom-[5rem] z-[60] md:right-6 md:bottom-6",
          open && "max-md:hidden",
        )}
      >
        <AnimatePresence>
          {hint && !open && desktop && (
            <motion.button
              type="button"
              onClick={() => setOpen(true)}
              initial={{ opacity: 0, x: 10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute top-1/2 right-[calc(100%+0.75rem)] -translate-y-1/2 rounded-2xl rounded-br-sm border border-flow/30 bg-ink-900/95 px-3.5 py-2 text-left text-sm whitespace-nowrap shadow-[0_10px_40px_-10px_rgb(125_255_58/0.5)] backdrop-blur"
            >
              <span className="block font-semibold">Ask IBAX</span>
              <span className="block text-xs text-fg-muted">
                Any doubt? Just ask
              </span>
            </motion.button>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={() => (open ? close() : setOpen(true))}
          aria-expanded={open}
          aria-controls="shambhu-agent"
          aria-label={open ? "Close IBAX" : "Ask IBAX, the voice assistant"}
          className="group relative grid size-[3.25rem] place-items-center rounded-full md:size-16"
        >
          {open ? (
            <span className="grid size-full place-items-center rounded-full border border-flow/30 bg-ink-800 shadow-[0_12px_40px_-8px_rgb(125_255_58/0.6)]">
              <X className="size-6 text-fg" aria-hidden />
            </span>
          ) : (
            <ShambhuBot
              mood={status}
              bleed={0.84}
              className="pointer-events-none absolute -top-[28%] -left-[28%] size-[156%] max-w-none transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </button>
      </div>

      {/* Phones: dim the page behind the chat sheet; tapping it closes the chat */}
      <AnimatePresence>
        {open && !desktop && (
          <motion.div
            aria-hidden
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.section
            id="shambhu-agent"
            role="dialog"
            aria-label="IBAX voice assistant"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onAnimationComplete={() =>
              inputRef.current?.focus({ preventScroll: true })
            }
            className="fixed inset-x-0 bottom-0 z-[70] flex h-[85dvh] origin-bottom flex-col overflow-hidden rounded-t-[1.6rem] border border-b-0 border-flow/25 pb-[env(safe-area-inset-bottom)] md:inset-x-auto md:h-[min(34rem,calc(100dvh-9rem))] md:origin-bottom-right md:rounded-[1.6rem] md:border-b md:pb-0 [background:linear-gradient(180deg,rgb(125_255_58/0.1),transparent_30%),var(--color-ink-900)] shadow-[0_40px_100px_-30px_rgb(0_0_0/0.95),0_0_60px_-30px_rgb(125_255_58/0.6)] md:right-6 md:bottom-[6.5rem] md:w-[24rem]"
          >
            {/* Header */}
            <header className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
              <span className="relative size-11 shrink-0">
                <ShambhuBot mood={status} bleed={1} className="size-full" />
                <span
                  className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-ink-900 bg-flow"
                  aria-hidden
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">IBAX</span>
                <span
                  className="flex items-center gap-1.5 text-xs text-flow"
                  aria-live="polite"
                >
                  {(status === "speaking" || status === "listening") && (
                    <Bars />
                  )}
                  {statusText}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setMuted((m) => !m);
                  stopNaturalVoice();
                  window.speechSynthesis?.cancel();
                }}
                aria-label={muted ? "Turn voice on" : "Turn voice off"}
                className="grid size-9 place-items-center rounded-full text-fg-muted hover:bg-white/5 hover:text-fg"
              >
                {muted ? (
                  <VolumeX className="size-4" aria-hidden />
                ) : (
                  <Volume2 className="size-4" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="grid size-9 place-items-center rounded-full text-fg-muted hover:bg-white/5 hover:text-fg"
              >
                <X className="size-4" aria-hidden />
              </button>
            </header>

            {/* Messages */}
            <div
              ref={listRef}
              className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
            >
              {lines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex",
                    line.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      line.role === "user"
                        ? "rounded-br-sm bg-flow text-ink-950"
                        : "rounded-bl-sm border border-white/[0.06] bg-white/[0.05] text-fg",
                    )}
                  >
                    {line.file && <SentFile file={line.file} />}
                    {line.content}
                    {line.role === "assistant" && i > 0 && !muted && (
                      <button
                        type="button"
                        onClick={() => replay(line)}
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
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm border border-flow/40 px-3.5 py-2.5 text-sm text-fg/80 italic">
                    {interim}
                  </div>
                </div>
              )}
              {status === "thinking" && (
                <div
                  className="flex w-fit gap-1 rounded-2xl rounded-bl-sm bg-white/[0.05] px-4 py-3"
                  aria-label="IBAX is thinking"
                >
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="size-1.5 animate-bounce rounded-full bg-flow"
                      style={{ animationDelay: `${d * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
              {lines.length === 1 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void ask(s)}
                      className="rounded-full border border-white/12 px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-flow/50 hover:text-flow"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Speaking language + contact */}
            <div className="flex items-center justify-between gap-2 px-4 pb-2 text-[0.7rem] text-fg-subtle">
              <span
                className="flex items-center gap-1"
                role="group"
                aria-label="Speaking language"
              >
                {PICKER.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    aria-pressed={lang === code}
                    className={cn(
                      "rounded-full px-2 py-0.5 transition-colors",
                      lang === code ? "bg-flow/15 text-flow" : "hover:text-fg",
                    )}
                  >
                    {agentLanguages[code].label}
                  </button>
                ))}
              </span>
              <button
                type="button"
                onClick={() => openDemo("Question from IBAX chat")}
                className="hover:text-flow"
              >
                Talk to a human →
              </button>
            </div>

            {/* Input */}
            {tip && (
              <p
                role="status"
                className="mx-3 mb-1 rounded-xl border border-flow/30 bg-flow/[0.08] px-3 py-2 text-xs leading-snug text-flow-soft"
              >
                {tip}
              </p>
            )}
            {liveState ? (
              <div className="flex items-center gap-2 border-t border-white/[0.07] p-3">
                <div
                  role="status"
                  aria-live="polite"
                  className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-flow/40 bg-flow/[0.07] px-4 text-sm text-flow"
                >
                  <Bars />
                  <span className="truncate">{liveState === "connecting" ? "Connecting…" : "Connected · Speak now"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => endCall()}
                  aria-label="End voice call"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-red-500 text-white hover:bg-red-400"
                >
                  <PhoneOff className="size-5" aria-hidden />
                </button>
              </div>
            ) : (
              <>
              {file && <AttachmentChip file={file} onRemove={() => setFile(null)} />}
              <form
                onSubmit={onSubmit}
                className="flex items-center gap-2 border-t border-white/[0.07] p-3"
              >
                <AttachMenu onFile={(f) => (setFile(f), setTip(""))} onError={(m) => setTip(m)} disabled={busy} />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={800}
                  placeholder={
                    file ? "Ask about this file…" : canListen ? "Type or tap the mic…" : "Type your question…"
                  }
                  aria-label="Your question"
                  className="h-11 min-w-0 flex-1 rounded-full border border-white/10 bg-ink-950/60 px-4 text-[16px] text-fg placeholder:text-fg-subtle focus:border-flow/50 focus:outline-none md:text-sm"
                />
                {canListen && (
                  <button
                    type="button"
                    onClick={toggleMic}
                    disabled={busy}
                    aria-label={
                      status === "listening"
                        ? "Stop listening"
                        : "Speak to IBAX"
                    }
                    className={cn(
                      "relative grid size-11 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-40",
                      status === "listening"
                        ? "bg-flow text-ink-950"
                        : "border border-flow/40 text-flow hover:bg-flow/10",
                    )}
                  >
                    {status === "listening" && (
                      <span
                        aria-hidden
                        className="absolute inset-0 animate-ping rounded-full bg-flow/40"
                      />
                    )}
                    {status === "listening" ? (
                      <MicOff className="relative size-5" aria-hidden />
                    ) : (
                      <Mic className="size-5" aria-hidden />
                    )}
                  </button>
                )}
                {canCall && !input.trim() && !file ? (
                  <button
                    type="button"
                    onClick={startCall}
                    disabled={busy}
                    aria-label="Voice call with IBAX"
                    title="Voice call — baat kariye, jaise phone par"
                    className="btn-3d btn-3d-sm grid size-11 shrink-0 place-items-center rounded-full text-white disabled:opacity-40"
                  >
                    <AudioLines className="size-5" aria-hidden />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={(!input.trim() && !file) || busy}
                    aria-label="Send"
                    className="btn-3d btn-3d-sm grid size-11 shrink-0 place-items-center rounded-full text-white disabled:opacity-40"
                  >
                    <Send className="size-4" aria-hidden />
                  </button>
                )}
              </form>
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

/** Little equaliser bars while IBAX listens or speaks. */
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
