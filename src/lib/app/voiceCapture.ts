"use client";

/**
 * Tap-to-talk for IBAX that works on iPhone: records the mic, stops by itself after the
 * speaker pauses, and turns the audio into text on our server (/api/transcribe, Gemini).
 * Used where the browser's own speech recognition is missing or unreliable (iPhone, iPad,
 * Firefox).
 */

type Ctx = typeof AudioContext;
const AudioCtx = (): Ctx | null =>
  typeof window === "undefined" ? null : ((window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctx }).webkitAudioContext) as Ctx | undefined) ?? null;

export const canRecord = () =>
  typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && Boolean(AudioCtx());

export type Capture = {
  /** Stop now and keep what was said. */
  stop: () => void;
  /** Stop and throw the recording away. */
  cancel: () => void;
  /** The recording, or null when nothing was said / it was cancelled. */
  done: Promise<Blob | null>;
};

const QUIET_AFTER_SPEECH_MS = 1500;
const NO_SPEECH_MS = 7000;
const MAX_MS = 30000;

/** Start recording. Call from a tap (iPhone only allows audio from a user gesture). */
export async function startCapture(onSpeaking?: (level: number) => void): Promise<Capture> {
  const Ctor = AudioCtx()!;
  const ctx = new Ctor(); // created inside the tap, before any await, so iPhone allows it
  void ctx.resume();
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  } catch (error) {
    void ctx.close();
    throw error;
  }
  const mime = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported?.(m));
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const samples = new Float32Array(analyser.fftSize);
  const started = Date.now();
  let heard = false;
  let lastLoud = started;
  let cancelled = false;

  const timer = setInterval(() => {
    analyser.getFloatTimeDomainData(samples);
    let sum = 0;
    for (const v of samples) sum += v * v;
    const level = Math.sqrt(sum / samples.length);
    onSpeaking?.(level);
    const now = Date.now();
    if (level > 0.02) {
      heard = true;
      lastLoud = now;
    }
    if ((heard && now - lastLoud > QUIET_AFTER_SPEECH_MS) || (!heard && now - started > NO_SPEECH_MS) || now - started > MAX_MS) stop();
  }, 100);

  const done = new Promise<Blob | null>((resolve) => {
    rec.onstop = () => {
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
      resolve(cancelled || !heard || !chunks.length ? null : new Blob(chunks, { type: rec.mimeType || mime || "audio/mp4" }));
    };
  });
  function stop() {
    if (rec.state !== "inactive") rec.stop();
  }
  rec.start(250);
  return {
    stop,
    cancel: () => {
      cancelled = true;
      stop();
    },
    done,
  };
}

/** Any recording → 16 kHz mono WAV, base64 (a format Gemini reads everywhere). */
export async function toWavBase64(blob: Blob): Promise<string> {
  const Ctor = AudioCtx()!;
  const ctx = new Ctor();
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    const rate = 16000;
    const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * rate)), rate);
    const src = offline.createBufferSource();
    src.buffer = decoded;
    src.connect(offline.destination);
    src.start();
    const pcm = (await offline.startRendering()).getChannelData(0);

    const view = new DataView(new ArrayBuffer(44 + pcm.length * 2));
    const text = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
    text(0, "RIFF");
    view.setUint32(4, 36 + pcm.length * 2, true);
    text(8, "WAVE");
    text(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    text(36, "data");
    view.setUint32(40, pcm.length * 2, true);
    for (let i = 0; i < pcm.length; i++) view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, pcm[i])) * 0x7fff, true);

    const bytes = new Uint8Array(view.buffer);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  } finally {
    void ctx.close();
  }
}

/** Sends the recording to /api/transcribe; returns the words, "" if nothing was understood. */
export async function transcribe(blob: Blob, lang: string): Promise<{ ok: true; text: string } | { ok: false; reason: string }> {
  try {
    const audio = await toWavBase64(blob);
    const res = await fetch("/api/transcribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ audio, lang }) });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; text?: string; reason?: string } | null;
    if (!res.ok || !data?.ok) return { ok: false, reason: data?.reason ?? "upstream" };
    return { ok: true, text: data.text ?? "" };
  } catch {
    return { ok: false, reason: "decode" };
  }
}
