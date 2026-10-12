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

/** The first sentence on its own, so IBAX starts talking while the rest is still being made. */
function splitForSpeech(text: string) {
  const m = text.trim().match(/^(.{12,180}?[.!?।]+)\s+(\S[\s\S]*)$/);
  return m ? [m[1], m[2]] : [text.trim()];
}

async function naturalAudio(text: string): Promise<Blob | null> {
  try {
    const res = await fetch("/api/speak", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
    if (res.status === 503) naturalVoice = false;
    return res.ok ? await res.blob() : null;
  } catch {
    return null;
  }
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
 * Says `text` in the natural voice. Returns true when it was handled (spoken, or stopped
 * on purpose); false when the natural voice isn't available, so the caller can use the
 * phone's own voice instead.
 */
export async function speakNaturally(text: string, onStart?: () => void, onEnd?: () => void): Promise<boolean> {
  const token = speakToken;
  if (!naturalVoice || !player) return false;
  // Both parts are made at the same time; the first one is short, so it's ready quickly.
  const parts = splitForSpeech(text).map(naturalAudio);
  let played = 0;
  for (const part of parts) {
    const clip = await part;
    if (token !== speakToken) return true;
    if (!clip || !(await play(clip, played ? undefined : onStart))) break;
    if (token !== speakToken) return true;
    played++;
  }
  if (played) onEnd?.();
  return played > 0;
}
