"use client";

/*
 * IBAX's natural voice: a real-sounding woman's voice made on our server (/api/speak).
 * Shared by IBAX in the app and on the website, so both sound the same. Two audio elements
 * are "unlocked" during a tap (iPhone only lets audio play after a tap): while one speaks,
 * the next piece is already loaded in the other, so the pieces join without a gap.
 */

const players: HTMLAudioElement[] = [];
let naturalVoice = true; // turned off for this visit if the server can't make speech
let speakToken = 0;
const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

/** How long IBAX may stay silent waiting for a piece of its voice before the phone's voice takes over. */
export const WAIT_FIRST_MS = 7000;
export const WAIT_NEXT_MS = 2500;
/** Pieces made at the same time (more would hit the voice server's rate limit). */
const PARALLEL = 3;

/** Call inside a tap (send, mic, call), so the spoken answer may play on iPhone. */
export function unlockAudio() {
  if (typeof Audio === "undefined") return;
  while (players.length < 2) players.push(new Audio());
  for (const p of players) {
    p.src = SILENCE;
    void p.play().catch(() => {});
  }
}

let endPlayback: (() => void) | null = null;

let phoneToken = 0;

/**
 * Queues the phone's own voice. Android Chrome sometimes drops speech queued right after
 * cancel(), so when something was still speaking it waits a moment first.
 */
export function speakQueue(utterances: SpeechSynthesisUtterance[]) {
  const synth = window.speechSynthesis;
  const wasBusy = synth.speaking || synth.pending;
  synth.cancel();
  const token = ++phoneToken;
  const go = () => token === phoneToken && utterances.forEach((u) => synth.speak(u));
  if (wasBusy) setTimeout(go, 150);
  else go();
}

export function stopNaturalVoice() {
  speakToken++;
  phoneToken++;
  endPlayback?.();
  for (const p of players) p.pause();
}

/**
 * The text in pieces that grow: the first sentence on its own (IBAX starts talking quickly),
 * then pieces of up to ~120, ~200 and `max` characters. Each piece is made while the one before
 * plays, and a short piece before a long one means the long one is ready in time.
 */
export function speechChunks(text: string, max = 260): string[] {
  const sentences = text.trim().match(/[^.!?।\n]+(?:[.!?।]+|\n+|$)\s*/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
  const limit = (i: number) => Math.min(max, [0, 120, 200][i] ?? max);
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences.flatMap((x) => (x.length > max ? x.match(new RegExp(`.{1,${max}}(?:\\s|$)`, "g")) ?? [x] : [x]))) {
    if (!chunks.length && !cur) {
      chunks.push(s.trim());
      continue;
    }
    if (cur && (cur + " " + s).length > limit(chunks.length)) (chunks.push(cur), (cur = ""));
    cur = cur ? `${cur} ${s.trim()}` : s.trim();
  }
  if (cur) chunks.push(cur);
  return chunks.filter(Boolean);
}

async function naturalAudio(text: string, signal: AbortSignal): Promise<Blob | null> {
  for (let attempt = 0; attempt < 2 && !signal.aborted; attempt++) {
    // Each try gives up after 15 s, or as soon as the answer is stopped.
    const ctl = new AbortController();
    const quit = () => ctl.abort();
    const timer = setTimeout(quit, 15_000);
    signal.addEventListener("abort", quit);
    try {
      const res = await fetch("/api/speak", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }), signal: ctl.signal });
      if (res.ok) return await res.blob();
      if (res.status === 503 && attempt) naturalVoice = false;
      if (res.status === 400) return null;
    } catch {
      /* try once more */
    } finally {
      clearTimeout(timer);
      signal.removeEventListener("abort", quit);
    }
  }
  return null;
}

/** The clip, or null when it isn't ready within `ms` (or failed). */
function within<T>(p: Promise<T | null>, ms: number) {
  return Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]);
}

/** Loads a clip into a player ahead of time, so it starts the moment it's needed. */
function load(p: HTMLAudioElement, blob: Blob) {
  const url = URL.createObjectURL(blob);
  p.src = url;
  p.load();
  return url;
}

/** Plays a loaded player; true when it played to the end. */
function play(p: HTMLAudioElement, url: string, onStart?: () => void) {
  return new Promise<boolean>((resolve) => {
    const finish = (ok: boolean) => {
      if (endPlayback !== stop) return;
      endPlayback = null;
      p.onplaying = p.onended = p.onerror = null;
      URL.revokeObjectURL(url);
      resolve(ok);
    };
    const stop = () => finish(false);
    endPlayback = stop;
    p.onplaying = () => onStart?.();
    p.onended = () => finish(true);
    p.onerror = () => finish(false);
    p.play().catch(() => finish(false));
  });
}

/**
 * Says `text` in the natural voice, piece by piece (the next pieces are made while one plays).
 * Returns what is still left to say: "" when it was all spoken (or stopped on purpose), else
 * the unspoken rest — when a piece fails or is late — so the caller says it with the phone's
 * own voice straight away: IBAX never goes quiet in the middle of an answer.
 */
export async function speakNaturally(text: string, onStart?: () => void, onEnd?: () => void): Promise<string> {
  const token = speakToken;
  if (!naturalVoice || !players.length) return text;
  const chunks = speechChunks(text);
  const abort = new AbortController();
  const clips: Promise<Blob | null>[] = [];
  const fetchUpTo = (i: number) => {
    for (let k = clips.length; k <= Math.min(i, chunks.length - 1); k++) clips.push(naturalAudio(chunks[k], abort.signal));
  };
  const rest = (i: number) => {
    abort.abort();
    return token === speakToken ? chunks.slice(i).join(" ") : "";
  };
  fetchUpTo(PARALLEL - 1);
  let next = await within(clips[0], WAIT_FIRST_MS);
  if (token !== speakToken) return rest(chunks.length);
  if (!next) return rest(0);
  let url = load(players[0], next);
  for (let i = 0; i < chunks.length; i++) {
    const playing = play(players[i % players.length], url, i ? undefined : onStart);
    fetchUpTo(i + PARALLEL);
    // The next piece goes into the other player as soon as it's made, while this one speaks.
    let nextUrl = "";
    const ready =
      i + 1 < chunks.length
        ? clips[i + 1].then((b) => {
            if (b && token === speakToken && !abort.signal.aborted) nextUrl = load(players[(i + 1) % players.length], b);
            return b;
          })
        : null;
    const ok = await playing;
    if (token !== speakToken) return rest(chunks.length);
    if (!ok) return rest(i);
    if (!ready) break;
    next = await within(ready, WAIT_NEXT_MS);
    if (token !== speakToken) return rest(chunks.length);
    if (!next || !nextUrl) return rest(i + 1);
    url = nextUrl;
  }
  onEnd?.();
  return "";
}
