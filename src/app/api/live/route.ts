import { NextResponse } from "next/server";
import { agentSystemPrompt, agentTools } from "@/lib/app/agentSpec";
import { geminiLiveModels, geminiLiveToken, geminiReady, toSchema } from "@/lib/server/gemini";

/**
 * Starts a live voice call with IBAX: a one-time pass plus the call's setup (who IBAX is,
 * what it can do, its voice). The browser then talks to Gemini Live directly, so replies
 * come back in about a second. 503 means "use the normal voice turns instead".
 */

const VOICE_RULES = `

# Live voice call
You are on a live voice call with the owner, like a phone call. Speak naturally and warmly, as a friendly young woman would. Answer straight away in one or two short sentences, in the language the owner speaks. Never read out links, lists or symbols. If the owner interrupts, stop and listen. Payment, connect and activation cards appear on the owner's screen when you use those actions — tell them to tap it there.`;

export async function POST(request: Request) {
  // Only our own pages may start calls.
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  if (!geminiReady()) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  try {
    const model = process.env.GEMINI_LIVE_MODEL || (await geminiLiveModels())[0];
    const token = model ? await geminiLiveToken() : null;
    if (!model || !token) return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 503 });
    return NextResponse.json(
      {
        ok: true,
        token,
        setup: {
          model: `models/${model}`,
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: process.env.GEMINI_TTS_VOICE || "Sulafat" } } },
          },
          systemInstruction: { parts: [{ text: agentSystemPrompt() + VOICE_RULES }] },
          tools: [{ functionDeclarations: agentTools.map((t) => ({ name: t.name, description: t.description, parameters: toSchema(t.input_schema) })) }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("[live] start failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 503 });
  }
}

/** Which live voice models the key can use (names only), to check the setup. */
export async function GET() {
  if (!geminiReady()) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  return NextResponse.json({ ok: true, models: await geminiLiveModels() });
}
