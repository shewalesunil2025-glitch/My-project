"use client";

/*
 * IBAX's natural voice: a real-sounding woman's voice made on our server (/api/speak).
 * Shared by IBAX in the app and on the website, so both sound the same. One audio element
 * is "unlocked" during a tap, because iPhone only lets audio play after a tap.
 */

let player: HTMLAudioElement | null = null;
let naturalVoice = true; // turned off for this visit if the server can't make speech
let speakToken = 0;
const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

/** Call inside a tap (send, mic, call), so the spoken answer may play on iPhone. */
export function unlockAudio() {
  if (typeof Audio === "undefined") return;
  player ??= new Audio();
  player.src = SILENCE;
  void player.play().catch(() => {});
}

let endPlayback: (() => void) | null = null;

export function stopNaturalVoice() {
  speakToken++;
  endPlayback?.();
  player?.pause();
}

/**
 * The text in short pieces: the first sentence on its own, so IBAX starts talking quickly,
 * then whole sentences up to ~`max` characters. Short pieces are made fast and never cut off
 * (the voice server stops at 700 characters, and long clips sometimes end early).
 */
export function speechChunks(text: string, max = 260): string[] {
  const sentences = text.trim().match(/[^.!?।\n]+(?:[.!?।]+|\n+|$)\s*/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences.flatMap((x) => (x.length > max ? x.match(new RegExp(`.{1,${max}}(?:\\s|$)`, "g")) ?? [x] : [x]))) {
    if (!chunks.length && !cur) {
      chunks.push(s.trim());
      continue;
    }
    if (cur && (cur + " " + s).length > max) (chunks.push(cur), (cur = ""));
    cur = cur ? `${cur} ${s.trim()}` : s.trim();
  }
  if (cur) chunks.push(cur);
  return chunks.filter(Boolean);
}

async function naturalAudio(text: string): Promise<Blob | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("/api/speak", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
      if (res.ok) return await res.blob();
      if (res.status === 503 && attempt) naturalVoice = false;
      if (res.status === 400) return null;
    } catch {
      /* try once more */
    }
  }
  return null;
}

/** Plays one clip; true when it played to the end. */
function play(blob: Blob, onStart?: () => void) {
  return new Promise<boolean>((resolve) => {
    if (!player) return resolve(false);
    const p = player;
    const url = URL.createObjectURL(blob);
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
    p.src = url;
    p.play().catch(() => finish(false));
  });
}

/**
 * Says `text` in the natural voice, piece by piece (the next piece is made while one plays).
 * Returns what is still left to say: "" when it was all spoken (or stopped on purpose), else
 * the unspoken rest, so the caller can say it with the phone's own voice and nothing is cut.
 */
export async function speakNaturally(text: string, onStart?: () => void, onEnd?: () => void): Promise<string> {
  const token = speakToken;
  if (!naturalVoice || !player) return text;
  const chunks = speechChunks(text);
  const clips: Promise<Blob | null>[] = [];
  const fetchUpTo = (i: number) => {
    for (let k = clips.length; k <= Math.min(i, chunks.length - 1); k++) clips.push(naturalAudio(chunks[k]));
  };
  fetchUpTo(1);
  for (let i = 0; i < chunks.length; i++) {
    fetchUpTo(i + 1);
    const clip = await clips[i];
    if (token !== speakToken) return "";
    if (!clip || !(await play(clip, i ? undefined : onStart))) {
      if (token !== speakToken) return "";
      return chunks.slice(i).join(" ");
    }
    if (token !== speakToken) return "";
  }
  onEnd?.();
  return "";
}
