import { geminiImage, geminiReady, geminiSpeak, toSchema } from "@/lib/server/gemini";
import { cloudflareImage, freeImage } from "@/lib/server/freeImage";
import { PLAN_RULES, PLAN_SCHEMA, cleanPlan, type Plan } from "@/lib/studio/core";

/**
 * The AI steps of the daily video: research, the plan (script + captions + SEO), images and
 * the voice. Each one is a plain function so the job runner can retry a single step.
 */

const MODEL = () => process.env.STUDIO_MODEL || process.env.GEMINI_MODEL || "gemini-flash-latest";

async function gemini(body: Record<string, unknown>, timeoutMs: number) {
  const send = (b: Record<string, unknown>) =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL())}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
      body: JSON.stringify(b),
      signal: AbortSignal.timeout(timeoutMs),
    });
  // Thinking makes the newest models slow (the first real run timed out): keep it minimal.
  const config = (body.generationConfig ?? {}) as Record<string, unknown>;
  let res = await send({ ...body, generationConfig: { ...config, thinkingConfig: { thinkingLevel: "minimal" } } });
  if (res.status === 400) {
    const detail = await res.clone().text();
    if (/thinking/i.test(detail)) res = await send(body);
  }
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] } }[] };
  const c = data.candidates?.[0];
  const text = (c?.content?.parts ?? []).filter((p) => !p.thought && typeof p.text === "string").map((p) => p.text).join("");
  const sources = (c?.groundingMetadata?.groundingChunks ?? []).map((g) => ({ url: g.web?.uri ?? "", title: g.web?.title ?? "" })).filter((s) => s.url).slice(0, 8);
  return { text, sources };
}

export type Research = { notes: string; sources: { url: string; title: string }[]; live: boolean; at: string };

/**
 * Today's AI news and ideas, from Google Search through Gemini (grounding). If search is not
 * available on this key, the notes come from the model alone and are marked live: false,
 * so the dashboard never calls them "trending" when they are not.
 */
export async function research(avoid: string[]): Promise<Research> {
  if (!geminiReady()) throw new Error("GEMINI_API_KEY is not set");
  const ask = `Find 5 AI topics from the last 7 days that would make a good 30-second Instagram Reel / YouTube Short for Indian small-business owners and AI fans: new AI tools, AI news, AI business ideas, automation tips. For each: one line on what it is, why people care, and the source. Skip: ${avoid.join("; ") || "nothing"}.`;
  try {
    const r = await gemini({ contents: [{ role: "user", parts: [{ text: ask }] }], tools: [{ google_search: {} }], generationConfig: { temperature: 0.4, maxOutputTokens: 1500 } }, 90_000);
    if (r.text.trim()) return { notes: r.text.slice(0, 6000), sources: r.sources, live: r.sources.length > 0, at: new Date().toISOString() };
  } catch (e) {
    console.error("[studio] search research failed", e instanceof Error ? e.message : e);
  }
  const r = await gemini({ contents: [{ role: "user", parts: [{ text: `${ask}\nYou cannot search the web: suggest evergreen, useful AI tips and ideas instead of news, and say so.` }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1500 } }, 60_000);
  return { notes: r.text.slice(0, 6000), sources: [], live: false, at: new Date().toISOString() };
}

/** The script, scenes, Instagram caption and YouTube SEO, as one checked JSON plan. */
export async function writePlan(notes: string, avoid: string[], live: boolean): Promise<Plan> {
  const prompt = `Research notes (${live ? "from a web search today" : "NOT live news: ideas only, do not present them as news"}):\n${notes}\n\nPick the single best topic${avoid.length ? ` (not these, already used today: ${avoid.join("; ")})` : ""} and write the plan.`;
  for (let i = 0; i < 2; i++) {
    const r = await gemini(
      {
        systemInstruction: { parts: [{ text: PLAN_RULES }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 4096, responseMimeType: "application/json", responseSchema: toSchema(PLAN_SCHEMA) },
      },
      120_000,
    );
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(r.text);
    } catch {
      /* try once more */
    }
    const plan = cleanPlan(parsed);
    if (plan) return plan;
  }
  throw new Error("The AI plan was not usable twice in a row");
}

/** One picture: Gemini's image model when billing allows it, else free FLUX (Cloudflare), else Pollinations. */
export async function picture(prompt: string): Promise<{ mime: string; data: Buffer; model: string }> {
  const full = `${prompt}. Vertical 9:16, cinematic lighting, high detail, no text, no watermark, no logos.`;
  for (const make of [() => geminiImage(full), () => cloudflareImage(full), () => freeImage(full)]) {
    try {
      const img = await make();
      if (img?.data) return { mime: img.mime, data: Buffer.from(img.data, "base64"), model: img.model };
    } catch {
      /* next provider */
    }
  }
  throw new Error("No image provider worked");
}

/** The thumbnail background (the worker adds the bold text and resizes it to 1280x720). */
export const thumbnailPrompt = (p: Plan) => `Eye-catching YouTube thumbnail background about "${p.script.topic}", futuristic AI and technology theme, bold colours, one strong central subject, empty space on the left for big text`;

/** One scene's voice (Gemini TTS, WAV). Short pieces keep each call well inside the time limit. */
export async function voice(text: string): Promise<Buffer> {
  const wav = await geminiSpeak(text);
  if (!wav) throw new Error("Gemini TTS gave no audio");
  return wav;
}
