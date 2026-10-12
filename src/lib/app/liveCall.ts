"use client";

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
  /** Workspace facts for this call (business, services, numbers). */
  context: string;
  onState: (s: LiveState) => void;
  /** What the owner said, once IBAX's answer is over (the words arrive a little late). */
  onOwnerSaid: (text: string) => void;
  /** What IBAX said, once its turn is over. */
  onIbaxSaid: (text: string) => void;
  /** IBAX asked to do something (show payment, activate…): the result goes back to it. */
  onAction: (name: string, args: Record<string, unknown>) => Promise<{ content: string; is_error?: boolean }>;
  /** The call stopped by itself (lost connection, limit reached). */
  onDrop: (reason: string) => void;
};

const WS_URL = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained";
const IN_RATE = 16000;
const OUT_RATE = 24000;

/* Hands the mic's raw sound to the page in small pieces. */
const WORKLET = `class Tap extends AudioWorkletProcessor{process(i){const c=i[0]&&i[0][0];if(c)this.port.postMessage(c.slice(0));return true}}registerProcessor("ibax-tap",Tap)`;

/** Safari's audio session: one steady mode for the whole call, so the sound doesn't switch routes. */
function setAudioSession(type: "play-and-record" | "auto") {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  try {
    if (session) session.type = type;
  } catch {
    /* not supported */
  }
}

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
export async function startLiveCall(audio: AudioContext, opts: LiveOptions): Promise<LiveCall | null> {
  let start: { ok?: boolean; token?: string; setup?: { systemInstruction: { parts: { text: string }[] } } & Record<string, unknown> } | null;
  try {
    const res = await fetch("/api/live", { method: "POST" });
    start = res.ok ? await res.json() : null;
  } catch {
    start = null;
  }
  if (!start?.ok || !start.token || !start.setup) return null;

  let stream: MediaStream;
  try {
    // The phone's echo canceller and auto-volume also turn IBAX's voice up and down (it
    // sounded near, then far). Not needed here: the mic is held back while IBAX speaks.
    setAudioSession("play-and-record");
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: false } });
  } catch {
    setAudioSession("auto");
    opts.onDrop("mic");
    return { interrupt: () => {}, end: () => {} };
  }

  const setup = { ...start.setup, systemInstruction: { parts: [{ text: `${start.setup.systemInstruction.parts[0].text}\n\n# Workspace now\n${opts.context}` }] } };
  const ws = new WebSocket(`${WS_URL}?access_token=${encodeURIComponent(start.token)}`);
  let ready = false;
  let ended = false;
  let ownerText = "";
  let ibaxText = "";
  let ownerShown = false;
  let skipping = false; // the owner cut IBAX off: drop the rest of that answer
  let nextAt = 0;
  // IBAX's voice goes through a gentle compressor so loud and soft words come out evenly.
  const leveller = audio.createDynamicsCompressor();
  leveller.threshold.value = -26;
  leveller.knee.value = 20;
  leveller.ratio.value = 4;
  leveller.attack.value = 0.005;
  leveller.release.value = 0.3;
  const volume = audio.createGain();
  volume.gain.value = 1.5;
  leveller.connect(volume).connect(audio.destination);
  const playing = new Set<AudioBufferSourceNode>();
  let state: LiveState = "connecting";
  const setState = (s: LiveState) => {
    if (s !== state) opts.onState((state = s));
  };
  opts.onState(state);

  // Mic → Google, in 100 ms pieces. While IBAX talks the mic is held back, so IBAX doesn't
  // hear its own voice from the speaker and stop itself.
  let source: MediaStreamAudioSourceNode | null = null;
  let tap: AudioWorkletNode | null = null;
  let pending: Float32Array[] = [];
  let pendingLength = 0;
  try {
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    await audio.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    source = audio.createMediaStreamSource(stream);
    tap = new AudioWorkletNode(audio, "ibax-tap");
    const mute = audio.createGain();
    mute.gain.value = 0;
    source.connect(tap).connect(mute).connect(audio.destination);
    tap.port.onmessage = (e: MessageEvent<Float32Array>) => {
      if (!ready || ended || state === "speaking") {
        pending = [];
        pendingLength = 0;
        return;
      }
      pending.push(e.data);
      pendingLength += e.data.length;
      if (pendingLength < audio.sampleRate / 10) return;
      const data = toBase64(toPcm16(pending, audio.sampleRate));
      pending = [];
      pendingLength = 0;
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ realtimeInput: { audio: { data, mimeType: `audio/pcm;rate=${IN_RATE}` } } }));
    };
  } catch {
    stream.getTracks().forEach((t) => t.stop());
    setAudioSession("auto");
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
  };

  const flushOwner = () => {
    if (!ownerShown && ownerText.trim()) opts.onOwnerSaid(ownerText.trim());
    ownerShown = true;
  };

  const finishTurn = () => {
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
    nextAt = Math.max(nextAt, audio.currentTime + 0.05);
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
    stopPlayback();
    tap?.port.close();
    source?.disconnect();
    tap?.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    leveller.disconnect();
    volume.disconnect();
    setAudioSession("auto");
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
    if (reason) opts.onDrop(reason);
  };

  ws.onopen = () => ws.send(JSON.stringify({ setup }));
  ws.onerror = () => end("network");
  ws.onclose = (e) => end(ready ? (e.code === 1000 ? "closed" : "network") : `setup:${e.code}:${e.reason}`.slice(0, 120));
  ws.onmessage = async (e: MessageEvent<string | Blob>) => {
    let msg: ServerMessage;
    try {
      msg = JSON.parse(typeof e.data === "string" ? e.data : await e.data.text()) as ServerMessage;
    } catch {
      return;
    }
    if (msg.setupComplete) {
      ready = true;
      setState("listening");
      return;
    }
    if (msg.goAway) return end("limit");
    const sc = msg.serverContent;
    if (sc) {
      if (sc.inputTranscription?.text) ownerText += sc.inputTranscription.text;
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
    for (const call of msg.toolCall?.functionCalls ?? []) {
      flushOwner();
      const r = await opts.onAction(call.name, call.args ?? {}).catch(() => ({ content: "That didn't work.", is_error: true }));
      if (ws.readyState === WebSocket.OPEN)
        ws.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response: r.is_error ? { error: r.content } : { result: r.content } }] } }));
    }
  };

  return {
    interrupt: () => {
      if (state !== "speaking") return;
      skipping = true;
      stopPlayback();
      setState("listening");
    },
    end: () => end(),
  };
}
