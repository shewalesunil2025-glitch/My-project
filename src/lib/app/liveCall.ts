"use client";

import { bargeDetector } from "./bargeIn";

/**
 * Live voice call with IBAX (Gemini Live): the owner's voice streams straight to Google and
 * IBAX's voice streams back, so it answers in about a second — like a phone call. Our server
 * only hands out a one-time pass and the call's setup (/api/live).
 */

export type LiveState = "connecting" | "listening" | "speaking";

export type LiveCall = {
  /** Cut IBAX off and listen to the owner now. */
  interrupt: () => void;
  end: () => void;
};

export type LiveOptions = {
  /** "site": a visitor on the website instead of an owner in the app. */
  audience?: "app" | "site" | "voice-test";
  /** Sign-in header, for calls that need the owner's own data (voice-test). */
  headers?: Record<string, string>;
  /** Workspace facts for this call (business, services, numbers). */
  context: string;
  onState: (s: LiveState) => void;
  /** What the owner said, once IBAX's answer is over (the words arrive a little late). */
  onOwnerSaid: (text: string) => void;
  /** What IBAX said, once its turn is over. */
  onIbaxSaid: (text: string) => void;
  /** IBAX asked to do something (show payment, activate…): the result goes back to it. */
  onAction: (name: string, args: Record<string, unknown>) => Promise<{ content: string; is_error?: boolean }>;
  /** How loud the mic is right now (0 to 1), a few times a second, to show that the voice is being picked up. */
  onLevel?: (level: number) => void;
  /** Counters for the practice call: audio pieces sent, messages received, and the words Google says it heard. */
  onStats?: (s: { sent: number; received: number; heard: string; peak: number }) => void;
  /** The call stopped by itself (lost connection, limit reached). */
  onDrop: (reason: string) => void;
};

const WS_URL = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained";
const IN_RATE = 16000;
const OUT_RATE = 24000;

/* Hands the mic's raw sound to the page in small pieces. */
const WORKLET = `class Tap extends AudioWorkletProcessor{process(i){const c=i[0]&&i[0][0];if(c)this.port.postMessage(c.slice(0));return true}}registerProcessor("ibax-tap",Tap)`;

function toBase64(bytes: Uint8Array) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** Mic sound at the device's rate → 16 kHz 16-bit PCM. */
function toPcm16(chunks: Float32Array[], rate: number) {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const ratio = rate / IN_RATE;
  const out = new Int16Array(Math.floor(total / ratio));
  let ci = 0;
  let offset = 0;
  for (let i = 0; i < out.length; i++) {
    let idx = Math.floor(i * ratio) - offset;
    while (ci < chunks.length && idx >= chunks[ci].length) {
      offset += chunks[ci].length;
      idx -= chunks[ci].length;
      ci++;
    }
    const v = ci < chunks.length ? chunks[ci][idx] : 0;
    out[i] = Math.max(-1, Math.min(1, v)) * 0x7fff;
  }
  return new Uint8Array(out.buffer);
}

type ServerMessage = {
  setupComplete?: object;
  serverContent?: {
    modelTurn?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] };
    inputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
    interrupted?: boolean;
    turnComplete?: boolean;
  };
  toolCall?: { functionCalls?: { id?: string; name: string; args?: Record<string, unknown> }[] };
  goAway?: object;
};

/**
 * Starts the call. `audio` must have been made inside the owner's tap (iPhone rule).
 * Returns null when live calls aren't available, so the app can use normal voice turns.
 */
type LiveStart = { ok?: boolean; token?: string; setup?: { systemInstruction: { parts: { text: string }[] } } & Record<string, unknown> } | null;

const fetchStart = (audience: string, headers: Record<string, string> = {}): Promise<LiveStart> =>
  fetch("/api/live", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify({ audience }) })
    .then((r) => (r.ok ? (r.json() as Promise<LiveStart>) : null))
    .catch(() => null);

/* The call's pass, fetched when the chat opens so a call starts at once (a pass works for 5 minutes, once). */
const passes: Record<string, { at: number; start: Promise<LiveStart> }> = {};
export function prefetchLive(audience: "app" | "site" = "app") {
  const have = passes[audience];
  if (have && Date.now() - have.at < 4 * 60_000) return;
  passes[audience] = { at: Date.now(), start: fetchStart(audience) };
}
function takeStart(audience: string) {
  const have = passes[audience];
  delete passes[audience];
  return have && Date.now() - have.at < 4 * 60_000 ? have.start : fetchStart(audience);
}

export async function startLiveCall(audio: AudioContext, opts: LiveOptions): Promise<LiveCall | null> {
  // Android may pause the sound engine when the mic opens or another sound plays: wake it again.
  const wake = () => audio.state !== "running" && audio.state !== "closed" && void audio.resume().catch(() => {});
  audio.addEventListener("statechange", wake);
  // The pass and the microphone at the same time.
  const audience = opts.audience ?? "app";
  const micAsk = navigator.mediaDevices
    // The phone's echo canceller and auto-volume also turn IBAX's voice up and down (it
    // sounded near, then far), so they stay off; IBAX's own voice is told apart below.
    // On a laptop the built-in mic is quiet without auto-volume (the phone problem below doesn't apply), so it stays on there.
    .getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) } })
    .catch(() => null);
  let start = audience === "voice-test" ? await fetchStart(audience, opts.headers) : await takeStart(audience);
  // A pass that was fetched earlier may have expired: get a fresh one.
  if (!start?.ok) start = await fetchStart(audience, opts.headers);
  if (!start?.ok || !start.token || !start.setup) {
    void micAsk.then((s) => s?.getTracks().forEach((t) => t.stop()));
    return null;
  }

  const stream = await micAsk;
  if (!stream) {
    opts.onDrop("mic");
    return { interrupt: () => {}, end: () => {} };
  }

  const base = start.setup.systemInstruction.parts[0].text;
  const setup = { ...start.setup, systemInstruction: { parts: [{ text: opts.context ? `${base}\n\n# Workspace now\n${opts.context}` : base }] } };
  const ws = new WebSocket(`${WS_URL}?access_token=${encodeURIComponent(start.token)}`);
  let ready = false;
  let ended = false;
  // What the owner says while the call is still connecting is kept and sent once it's ready.
  let early: Float32Array[] = [];
  let earlyLength = 0;
  let ownerText = "";
  let ibaxText = "";
  const stats = { sent: 0, received: 0, heard: "", peak: 0 };
  let ownerShown = false;
  let skipping = false; // the owner cut IBAX off: drop the rest of that answer
  let nextAt = 0;
  // A small cushion of IBAX's voice before it starts playing, so a slow moment on the phone's
  // network doesn't cut its words; it grows a little whenever the voice ran out mid-answer.
  let cushion = 0.2;
  let midAnswer = false;
  // IBAX's voice goes through a gentle compressor so loud and soft words come out evenly.
  const leveller = audio.createDynamicsCompressor();
  leveller.threshold.value = -26;
  leveller.knee.value = 20;
  leveller.ratio.value = 4;
  leveller.attack.value = 0.005;
  leveller.release.value = 0.3;
  // Then louder, with a limiter so the loudest words don't crackle.
  const volume = audio.createGain();
  volume.gain.value = 2.6;
  const limiter = audio.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.1;
  leveller.connect(volume).connect(limiter).connect(audio.destination);
  // What IBAX is saying right now, to tell its voice (from the speaker) apart from the owner's.
  const outTap = audio.createAnalyser();
  outTap.fftSize = 512;
  limiter.connect(outTap);
  const outBuf = new Float32Array(outTap.fftSize);
  const playing = new Set<AudioBufferSourceNode>();
  let state: LiveState = "connecting";
  const setState = (s: LiveState) => {
    if (s !== state) opts.onState((state = s));
  };
  opts.onState(state);

  // Mic → Google, in 100 ms pieces. While IBAX talks, the mic is held back so IBAX doesn't
  // hear its own voice from the speaker; but when the owner starts talking over it, IBAX
  // stops at once and listens (barge-in), like a person on a phone call.
  let source: MediaStreamAudioSourceNode | null = null;
  let tap: AudioWorkletNode | null = null;
  let pending: Float32Array[] = [];
  let pendingLength = 0;
  const barge = bargeDetector();
  let preRoll: Float32Array[] = []; // the last half second, so the owner's first words aren't lost
  let preRollLength = 0;
  const rms = (a: Float32Array) => {
    let sum = 0;
    for (const v of a) sum += v * v;
    return Math.sqrt(sum / a.length);
  };
  /** True when the owner (not IBAX's echo) is talking while IBAX speaks. */
  const ownerTalking = (chunk: Float32Array) => {
    outTap.getFloatTimeDomainData(outBuf);
    return barge.hear(rms(chunk), rms(outBuf), chunk.length / audio.sampleRate);
  };
  try {
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    await audio.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    source = audio.createMediaStreamSource(stream);
    tap = new AudioWorkletNode(audio, "ibax-tap");
    const mute = audio.createGain();
    mute.gain.value = 0;
    source.connect(tap).connect(mute).connect(audio.destination);
    let lastLevel = 0;
    tap.port.onmessage = (e: MessageEvent<Float32Array>) => {
      if (ended) return;
      stats.peak = Math.max(stats.peak, rms(e.data));
      if (Date.now() - lastLevel > 150) {
        lastLevel = Date.now();
        opts.onLevel?.(Math.min(1, rms(e.data) * 8));
        opts.onStats?.({ ...stats });
      }
      if (!ready) {
        early.push(e.data);
        earlyLength += e.data.length;
        while (earlyLength > audio.sampleRate * 8) earlyLength -= early.shift()!.length;
        return;
      }
      if (state === "speaking") {
        preRoll.push(e.data);
        preRollLength += e.data.length;
        while (preRollLength > audio.sampleRate * 0.6) preRollLength -= preRoll.shift()!.length;
        if (!ownerTalking(e.data)) return;
        // The owner started talking: IBAX stops and listens, starting from their first words.
        bargeIn();
        pending = preRoll;
        pendingLength = preRollLength;
      } else {
        pending.push(e.data);
        pendingLength += e.data.length;
      }
      preRoll = [];
      preRollLength = 0;
      if (pendingLength < audio.sampleRate / 10) return;
      const data = toBase64(toPcm16(pending, audio.sampleRate));
      pending = [];
      pendingLength = 0;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ realtimeInput: { audio: { data, mimeType: `audio/pcm;rate=${IN_RATE}` } } }));
        stats.sent++;
      }
    };
  } catch {
    stream.getTracks().forEach((t) => t.stop());
    ws.close();
    return null;
  }

  const stopPlayback = () => {
    for (const s of playing) {
      s.onended = null;
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    playing.clear();
    nextAt = 0;
    midAnswer = false;
  };

  const bargeIn = () => {
    skipping = true; // drop the rest of the answer IBAX was giving
    barge.reset();
    stopPlayback();
    setState("listening");
  };

  const flushOwner = () => {
    if (!ownerShown && ownerText.trim()) opts.onOwnerSaid(ownerText.trim());
    ownerShown = true;
  };

  const finishTurn = () => {
    midAnswer = false;
    flushOwner();
    if (ibaxText.trim()) opts.onIbaxSaid(ibaxText.trim());
    ownerText = "";
    ibaxText = "";
    ownerShown = false;
    skipping = false;
  };

  /** IBAX's voice: 24 kHz PCM pieces, played back to back without gaps. */
  const play = (b64: string) => {
    const bin = atob(b64);
    const samples = new Int16Array(bin.length >> 1);
    for (let i = 0; i < samples.length; i++) samples[i] = (bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8)) << 16 >> 16;
    if (!samples.length) return;
    const buffer = audio.createBuffer(1, samples.length, OUT_RATE);
    const ch = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) ch[i] = samples[i] / 0x8000;
    const src = audio.createBufferSource();
    src.buffer = buffer;
    src.connect(leveller);
    if (midAnswer && nextAt < audio.currentTime) cushion = Math.min(0.6, cushion + 0.1); // ran out mid-answer
    midAnswer = true;
    if (nextAt < audio.currentTime) nextAt = audio.currentTime + (playing.size ? 0.05 : cushion);
    src.start(nextAt);
    nextAt += buffer.duration;
    playing.add(src);
    setState("speaking");
    src.onended = () => {
      playing.delete(src);
      // A short pause after IBAX stops, so the tail of its voice isn't heard as the owner.
      if (!playing.size) setTimeout(() => !playing.size && !ended && setState("listening"), 250);
    };
  };

  const end = (reason?: string) => {
    if (ended) return;
    ended = true;
    audio.removeEventListener("statechange", wake);
    stopPlayback();
    tap?.port.close();
    source?.disconnect();
    tap?.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    leveller.disconnect();
    volume.disconnect();
    limiter.disconnect();
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
    if (reason) opts.onDrop(reason);
  };

  ws.onopen = () => ws.send(JSON.stringify({ setup }));
  ws.onerror = () => end("network");
  ws.onclose = (e) => end(ready ? (e.code === 1000 ? "closed" : "network") : `setup:${e.code}:${e.reason}`.slice(0, 120));
  // Messages are handled strictly one after another, so IBAX's voice is never played out of order.
  let queue = Promise.resolve();
  ws.onmessage = (e: MessageEvent<string | Blob>) => {
    queue = queue.then(() => handle(e)).catch(() => {});
  };
  const handle = async (e: MessageEvent<string | Blob>) => {
    let msg: ServerMessage;
    try {
      msg = JSON.parse(typeof e.data === "string" ? e.data : await e.data.text()) as ServerMessage;
    } catch {
      return;
    }
    if (msg.setupComplete) {
      ready = true;
      setState("listening");
      // The model waits for the caller to speak first. In the voice-assistant practice call it should greet, like a phone assistant does.
      if (audience === "voice-test") ws.send(JSON.stringify({ realtimeInput: { text: "The call has just connected. Say your greeting now." } }));
      // Send what the owner already said while connecting, in one-second pieces.
      const second = audio.sampleRate;
      while (early.length) {
        const piece: Float32Array[] = [];
        let n = 0;
        while (early.length && n < second) n += (piece.push(early.shift()!), piece[piece.length - 1].length);
        ws.send(JSON.stringify({ realtimeInput: { audio: { data: toBase64(toPcm16(piece, audio.sampleRate)), mimeType: `audio/pcm;rate=${IN_RATE}` } } }));
      }
      earlyLength = 0;
      return;
    }
    if (msg.goAway) return end("limit");
    const sc = msg.serverContent;
    stats.received++;
    if (sc) {
      if (sc.inputTranscription?.text) {
        ownerText += sc.inputTranscription.text;
        stats.heard = ownerText.slice(-80);
      }
      if (sc.interrupted) {
        stopPlayback();
        skipping = false;
        setState("listening");
      }
      if (!skipping) {
        for (const p of sc.modelTurn?.parts ?? []) {
          if (p.inlineData?.data) play(p.inlineData.data);
        }
        if (sc.outputTranscription?.text) ibaxText += sc.outputTranscription.text;
      }
      if (sc.turnComplete) finishTurn();
    }
    const calls = msg.toolCall?.functionCalls ?? [];
    if (calls.length) flushOwner();
    // Actions run on the side (one may wait for a payment), so the call's sound keeps flowing.
    void (async () => {
      for (const call of calls) {
        const r = await opts.onAction(call.name, call.args ?? {}).catch(() => ({ content: "That didn't work.", is_error: true }));
        if (ws.readyState === WebSocket.OPEN)
          ws.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response: r.is_error ? { error: r.content } : { result: r.content } }] } }));
      }
    })();
  };

  return {
    interrupt: () => {
      if (state === "speaking") bargeIn();
    },
    end: () => end(),
  };
}
