import type Anthropic from "@anthropic-ai/sdk";

/**
 * Runs one IBAX turn on Google Gemini (free tier) when no Claude key is set.
 * The app speaks Claude's message format, so this translates the conversation and the
 * tools to Gemini's format and the answer back again: text blocks, plus tool_use blocks
 * the app carries out exactly as it does for Claude.
 * Env: GEMINI_API_KEY (Google AI Studio), optional GEMINI_MODEL.
 */

type Block = Record<string, unknown> & { type: string };
type Part = Record<string, unknown>;
type GeminiContent = { role: "user" | "model"; parts: Part[] };

export const geminiReady = () => Boolean(process.env.GEMINI_API_KEY);

/** Claude's JSON-schema tool inputs → Gemini's schema subset. */
export function toSchema(s: unknown): unknown {
  if (!s || typeof s !== "object") return s;
  const src = s as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (typeof src.type === "string") out.type = src.type.toUpperCase();
  if (typeof src.description === "string") out.description = src.description;
  if (Array.isArray(src.enum)) out.enum = src.enum;
  if (Array.isArray(src.required)) out.required = src.required;
  if (src.items) out.items = toSchema(src.items);
  if (src.properties && typeof src.properties === "object") {
    out.properties = Object.fromEntries(Object.entries(src.properties as Record<string, unknown>).map(([k, v]) => [k, toSchema(v)]));
  }
  return out;
}

const blocksOf = (content: Anthropic.Beta.BetaMessageParam["content"]): Block[] =>
  typeof content === "string" ? [{ type: "text", text: content }] : (content as unknown as Block[]);

function toContents(messages: Anthropic.Beta.BetaMessageParam[]): GeminiContent[] {
  const toolNames = new Map<string, string>();
  const out: GeminiContent[] = [];
  for (const m of messages) {
    const parts: Part[] = [];
    for (const b of blocksOf(m.content)) {
      const signature = typeof b.gemini_signature === "string" ? { thoughtSignature: b.gemini_signature } : {};
      if (b.type === "text" && typeof b.text === "string" && b.text.trim()) parts.push({ text: b.text, ...signature });
      else if (b.type === "tool_use") {
        toolNames.set(String(b.id), String(b.name));
        parts.push({ functionCall: { name: b.name, args: b.input ?? {} }, ...signature });
      } else if (b.type === "tool_result") {
        const content = typeof b.content === "string" ? b.content : JSON.stringify(b.content ?? "");
        parts.push({ functionResponse: { name: toolNames.get(String(b.tool_use_id)) ?? "tool", response: { result: content, is_error: b.is_error === true } } });
      }
    }
    if (!parts.length) continue;
    const role = m.role === "assistant" ? "model" : "user";
    const last = out[out.length - 1];
    if (last && last.role === role) last.parts.push(...parts);
    else out.push({ role, parts });
  }
  return out;
}

function withoutSignatures(contents: GeminiContent[]): GeminiContent[] {
  return contents.map((c) => ({
    ...c,
    parts: c.parts.map(({ thoughtSignature, ...p }) => (p.functionCall && thoughtSignature ? { ...p, thoughtSignature: "skip_thought_signature_validator" } : p)),
  }));
}

export type GeminiTurn = { content: Block[]; stop_reason: "tool_use" | "end_turn" | "refusal"; model?: string; ms?: number };

// Free-tier models are often "experiencing high demand" (503): retry, then try lighter models.
const FALLBACK_MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest"];
const BUDGET_MS = 52_000;

export async function geminiTurn(system: string, tools: Anthropic.Beta.BetaTool[], messages: Anthropic.Beta.BetaMessageParam[]): Promise<GeminiTurn> {
  const primary = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const attempts = [primary, primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
  const contents = toContents(messages);
  const started = Date.now();
  let res: Response | null = null;
  let model = primary;
  let thinking = process.env.GEMINI_THINKING || "minimal";
  let lastError: Error & { status?: number } = new Error("Gemini unavailable");

  for (const [i, next] of attempts.entries()) {
    model = next;
    const left = BUDGET_MS - (Date.now() - started);
    if (left < 4_000) break;
    // Another model can't check this one's thought signatures; tell it to skip the check.
    const body = model === primary ? contents : withoutSignatures(contents);
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: body,
          tools: [{ functionDeclarations: tools.map((t) => ({ name: t.name, description: t.description, parameters: toSchema(t.input_schema) })) }],
          // Chat replies need almost no "thinking": "low" still took 15–20 s a turn.
          generationConfig: { temperature: 0.6, maxOutputTokens: 2048, thinkingConfig: { thinkingLevel: thinking } },
        }),
        signal: AbortSignal.timeout(Math.min(left, i === attempts.length - 1 ? left : 25_000)),
      });
    } catch (error) {
      lastError = error instanceof Error ? error : lastError; // timeout or network: try the next one
      res = null;
      continue;
    }
    if (res.ok) break;
    const detail = (await res.text()).slice(0, 300);
    lastError = Object.assign(new Error(`Gemini ${res.status} (${model}): ${detail}`), { status: res.status });
    // A model that doesn't know the "minimal" level: ask again with "low".
    if (res.status === 400 && /thinking/i.test(detail)) thinking = "low";
    res = null;
    if (i === 0) await new Promise((r) => setTimeout(r, 1_200));
  }
  if (!res) throw lastError;

  const data = (await res.json()) as { candidates?: { content?: { parts?: Part[] }; finishReason?: string }[]; promptFeedback?: { blockReason?: string } };
  const candidate = data.candidates?.[0];
  const served = { model, ms: Date.now() - started };
  if (data.promptFeedback?.blockReason || candidate?.finishReason === "SAFETY") return { content: [], stop_reason: "refusal", ...served };

  const content: Block[] = [];
  let calls = 0;
  for (const p of candidate?.content?.parts ?? []) {
    if (p.thought === true) continue;
    const signature = typeof p.thoughtSignature === "string" ? { gemini_signature: p.thoughtSignature } : {};
    const call = p.functionCall as { name?: string; args?: Record<string, unknown> } | undefined;
    if (call?.name) {
      calls++;
      content.push({ type: "tool_use", id: `toolu_g${Date.now().toString(36)}${calls}`, name: call.name, input: call.args ?? {}, ...signature });
    } else if (typeof p.text === "string" && p.text.trim()) content.push({ type: "text", text: p.text, ...signature });
  }
  return { content, stop_reason: calls ? "tool_use" : "end_turn", ...served };
}

const LANG_HINT: Record<string, string> = {
  en: "English (or Hinglish in Roman letters)",
  hi: "Hindi, written in Devanagari",
  mr: "Marathi, written in Devanagari",
};

/** Speech → text for the in-app mic (iPhone's browser speech recognition is unreliable). */
export async function geminiTranscribe(wavBase64: string, lang: string): Promise<string> {
  const primary = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const prompt = `Transcribe this voice message from a business owner talking to their assistant. Most likely language: ${LANG_HINT[lang] ?? LANG_HINT.en}; if they clearly speak another language, use that. Write Hindi and Marathi in Devanagari and English or Hinglish in Roman letters. Return only the exact words spoken, nothing else. If there are no clear spoken words (only silence, noise, beeps or music), return an empty string — never guess.`;
  let lastError: Error & { status?: number } = new Error("Gemini unavailable");
  // Transcribing is a simple job: the lite model is quickest; the bigger ones are the fallback.
  const models = [...new Set(["gemini-flash-lite-latest", primary, "gemini-flash-latest"])];
  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: "audio/wav", data: wavBase64 } }, { text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 600, thinkingConfig: { thinkingLevel: "low" } },
        }),
        signal: AbortSignal.timeout(18_000),
      });
      if (!res.ok) {
        lastError = Object.assign(new Error(`Gemini ${res.status} (${model}): ${(await res.text()).slice(0, 200)}`), { status: res.status });
        continue;
      }
      const data = (await res.json()) as { candidates?: { content?: { parts?: Part[] } }[] };
      const text = (data.candidates?.[0]?.content?.parts ?? [])
        .filter((p) => p.thought !== true && typeof p.text === "string")
        .map((p) => p.text as string)
        .join("")
        .trim();
      return text.replace(/^["“]|["”]$/g, "").trim();
    } catch (error) {
      lastError = error instanceof Error ? error : lastError;
    }
  }
  throw lastError;
}

/* ── Natural voice (Gemini text-to-speech) ── */

let ttsModels: string[] | null = null;

/** Text-to-speech models this key can use, best first (found once, then remembered). */
export async function geminiTtsModels(): Promise<string[]> {
  if (ttsModels) return ttsModels;
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", {
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY! },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
  const names = (data.models ?? [])
    .filter((m) => /tts/i.test(m.name) && (m.supportedGenerationMethods ?? []).includes("generateContent"))
    .map((m) => m.name.replace(/^models\//, ""));
  // Flash before Pro (quicker), newest version first.
  const score = (n: string) => (/flash/.test(n) ? 0 : 10) + (/lite/.test(n) ? 1 : 0) - (parseFloat(n.match(/(\d+(?:\.\d+)?)/)?.[1] ?? "0") || 0) / 100;
  ttsModels = names.sort((a, b) => score(a) - score(b));
  return ttsModels;
}

/** 16-bit PCM from Gemini → a playable WAV file. */
function pcmToWav(pcm: Buffer, rate: number) {
  // A sudden start or stop of sound clicks in the speaker: fade the first and last 15 ms.
  const samples = Math.floor(pcm.length / 2);
  const fade = Math.min(Math.floor(rate * 0.015), Math.floor(samples / 2));
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    pcm.writeInt16LE(Math.round(pcm.readInt16LE(i * 2) * k), i * 2);
    const j = (samples - 1 - i) * 2;
    pcm.writeInt16LE(Math.round(pcm.readInt16LE(j) * k), j);
  }
  const head = Buffer.alloc(44);
  head.write("RIFF", 0);
  head.writeUInt32LE(36 + pcm.length, 4);
  head.write("WAVE", 8);
  head.write("fmt ", 12);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(1, 22);
  head.writeUInt32LE(rate, 24);
  head.writeUInt32LE(rate * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write("data", 36);
  head.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([head, pcm]);
}

/**
 * IBAX's spoken reply in a warm, natural woman's voice. Returns WAV, or null if TTS isn't available.
 * Only the reply goes to the model: a style instruction in front of it sometimes gets read out loud.
 */
export async function geminiSpeak(text: string): Promise<Buffer | null> {
  const voice = process.env.GEMINI_TTS_VOICE || "Sulafat";
  const models = process.env.GEMINI_TTS_MODEL ? [process.env.GEMINI_TTS_MODEL] : await geminiTtsModels();
  for (const model of models.slice(0, 3)) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text }] }],
          generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
        }),
        signal: AbortSignal.timeout(25_000),
      });
      if (!res.ok) {
        console.error(`[speak] ${model} ${res.status}`, (await res.text()).slice(0, 200));
        continue;
      }
      const data = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[] };
      const audio = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
      if (!audio?.data) continue;
      const rate = Number(audio.mimeType?.match(/rate=(\d+)/)?.[1] ?? 24000);
      return pcmToWav(Buffer.from(audio.data, "base64"), rate);
    } catch (error) {
      console.error(`[speak] ${model} failed`, error instanceof Error ? error.message : error);
    }
  }
  return null;
}

/* ── Live voice calls (Gemini Live: hears and speaks in real time) ── */

let liveModels: string[] | null = null;

/** Models this key can use for live voice, best first: native-audio Flash models, newest first. */
export async function geminiLiveModels(): Promise<string[]> {
  if (liveModels) return liveModels;
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", {
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY! },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
  const names = (data.models ?? []).filter((m) => (m.supportedGenerationMethods ?? []).includes("bidiGenerateContent")).map((m) => m.name.replace(/^models\//, ""));
  const score = (n: string) =>
    (/native-audio/.test(n) ? 0 : 20) + (/flash/.test(n) ? 0 : 10) + (/lite/.test(n) ? 1 : 0) - (parseFloat(n.match(/(\d+(?:\.\d+)?)/)?.[1] ?? "0") || 0) / 100;
  liveModels = names.sort((a, b) => score(a) - score(b));
  return liveModels;
}

/**
 * A one-time pass for the browser to open one live call straight with Google, without
 * ever seeing our API key. It must be used within a minute and stops working after 30.
 */
export async function geminiLiveToken(): Promise<string | null> {
  const now = Date.now();
  const res = await fetch("https://generativelanguage.googleapis.com/v1alpha/auth_tokens", {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({ uses: 1, expireTime: new Date(now + 30 * 60_000).toISOString(), newSessionExpireTime: new Date(now + 60_000).toISOString() }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    console.error("[live] token", res.status, (await res.text()).slice(0, 200));
    return null;
  }
  const data = (await res.json()) as { name?: string };
  return data.name ?? null;
}
