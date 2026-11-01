import { geminiImage, geminiReady, geminiSpeak, toSchema } from "@/lib/server/gemini";
import { cloudflareImage, freeImage } from "@/lib/server/freeImage";
import { PLAN_RULES, PLAN_SCHEMA, cleanPlan, type Plan } from "@/lib/studio/core";

/**
 * The AI steps of the daily video: research, the plan (script + captions + SEO), images and
 * the voice. Each one is a plain function so the job runner can retry a single step.
 */

/** The configured model first, then the lighter ones the app already falls back to when Gemini is busy. */
const MODELS = () => [...new Set([process.env.STUDIO_MODEL, process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-flash-lite-latest"].filter(Boolean) as string[])];

type Answer = { text: string; sources: { url: string; title: string }[]; model: string };

/** One Gemini call, trying each model with its own time limit; the error says which model failed and how. */
async function gemini(body: Record<string, unknown>, timeoutMs: number, budgetMs = timeoutMs): Promise<Answer> {
  const tried: string[] = [];
  // The whole call stays inside its budget, so a step always ends before the server's 300 s limit.
  const until = Date.now() + budgetMs;
  for (const model of MODELS()) {
    const left = until - Date.now();
    if (left < 5000) break;
    const send = (b: Record<string, unknown>) =>
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
        body: JSON.stringify(b),
        signal: AbortSignal.timeout(Math.min(timeoutMs, left)),
      });
    try {
      // Thinking makes the newest models slow: keep it minimal (dropped if a model rejects the setting).
      const config = (body.generationConfig ?? {}) as Record<string, unknown>;
      let res = await send({ ...body, generationConfig: { ...config, thinkingConfig: { thinkingLevel: "minimal" } } });
      if (res.status === 400 && /thinking/i.test(await res.clone().text())) res = await send(body);
      if (!res.ok) {
        tried.push(`${model}: ${res.status} ${(await res.text()).slice(0, 120)}`);
        continue;
      }
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] } }[] };
      const c = data.candidates?.[0];
      const text = (c?.content?.parts ?? []).filter((p) => !p.thought && typeof p.text === "string").map((p) => p.text).join("");
      if (!text.trim()) {
        tried.push(`${model}: empty answer`);
        continue;
      }
      const sources = (c?.groundingMetadata?.groundingChunks ?? []).map((g) => ({ url: g.web?.uri ?? "", title: g.web?.title ?? "" })).filter((x) => x.url).slice(0, 8);
      return { text, sources, model };
    } catch (e) {
      tried.push(`${model}: ${e instanceof Error && e.name === "TimeoutError" ? `no answer in ${Math.round(Math.min(timeoutMs, left) / 1000)} s` : e instanceof Error ? e.message : String(e)}`);
    }
  }
  throw new Error(`Gemini didn't answer (${tried.join("; ")})`.slice(0, 480));
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
    const r = await gemini({ contents: [{ role: "user", parts: [{ text: ask }] }], tools: [{ google_search: {} }], generationConfig: { temperature: 0.4, maxOutputTokens: 1200 } }, 50_000, 60_000);
    if (r.text.trim()) return { notes: r.text.slice(0, 6000), sources: r.sources, live: r.sources.length > 0, at: new Date().toISOString() };
  } catch (e) {
    console.error("[studio] search research failed", e instanceof Error ? e.message : e);
  }
  try {
    const r = await gemini({ contents: [{ role: "user", parts: [{ text: `${ask}\nYou cannot search the web: suggest evergreen, useful AI tips and ideas instead of news, and say so.` }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1200 } }, 30_000, 60_000);
    return { notes: r.text.slice(0, 6000), sources: [], live: false, at: new Date().toISOString() };
  } catch (e) {
    // Research is a help, not a must: the plan step can still pick an evergreen AI tip.
    console.error("[studio] research failed", e instanceof Error ? e.message : e);
    return { notes: "", sources: [], live: false, at: new Date().toISOString() };
  }
}

/** The script, scenes, Instagram caption and YouTube SEO, as one checked JSON plan. */
export async function writePlan(notes: string, avoid: string[], live: boolean): Promise<Plan> {
  const prompt = `Research notes (${live ? "from a web search today" : "NOT live news: ideas only, do not present them as news"}):\n${notes || "(none today: choose a useful, evergreen AI tool or automation tip for small businesses)"}\n\nPick the single best topic${avoid.length ? ` (not these, already used today: ${avoid.join("; ")})` : ""} and write the plan.`;
  for (let i = 0; i < 2; i++) {
    const r = await gemini(
      {
        systemInstruction: { parts: [{ text: PLAN_RULES }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 4096, responseMimeType: "application/json", responseSchema: toSchema(PLAN_SCHEMA) },
      },
      60_000,
      110_000,
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
