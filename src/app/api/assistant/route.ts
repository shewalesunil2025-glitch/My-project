import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { agentSystemPrompt, agentTools } from "@/lib/app/agentSpec";
import { geminiReady, geminiTurn } from "@/lib/server/gemini";

/**
 * One turn of IBAX, the in-app assistant. The app keeps the conversation and carries
 * out the actions IBAX asks for (show a payment card, save details, connect an account,
 * activate a service) on the owner's workspace, then sends the results back here.
 *
 * Runs on Claude when ANTHROPIC_API_KEY is set, otherwise on Gemini's free tier when
 * GEMINI_API_KEY is set. Without either it returns 503 and the app uses its built-in
 * conversation instead.
 */

export const maxDuration = 60;

// A photo or PDF can ride along (Vercel accepts request bodies up to 4.5 MB).
const MAX_BODY = 4_400_000;
const MAX_MESSAGES = 120;
const system = agentSystemPrompt();

function validMessages(value: unknown): value is Anthropic.Beta.BetaMessageParam[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= MAX_MESSAGES &&
    value.every((m) => !!m && typeof m === "object" && (m.role === "user" || m.role === "assistant") && (typeof m.content === "string" || Array.isArray(m.content))) &&
    value[0].role === "user"
  );
}

export async function POST(request: Request) {
  const useClaude = Boolean(process.env.ANTHROPIC_API_KEY);
  if (!useClaude && !geminiReady()) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ ok: false, reason: "too_large" }, { status: 413 });
  let messages: unknown;
  try {
    messages = (JSON.parse(raw) as { messages?: unknown }).messages;
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }
  if (!validMessages(messages)) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });

  if (!useClaude) {
    try {
      const turn = await geminiTurn(system, agentTools, messages);
      return NextResponse.json(
        { ok: true, refused: turn.stop_reason === "refusal", content: turn.content, stop_reason: turn.stop_reason },
        // How long Gemini took and which model answered (browser dev tools → Network → Timing).
        { headers: { "server-timing": `gemini;dur=${turn.ms ?? 0};desc="${turn.model ?? ""}"` } },
      );
    } catch (error) {
      const status = (error as { status?: number }).status;
      console.error("[assistant] gemini failed", error instanceof Error ? error.message : error);
      if (status === 429) return NextResponse.json({ ok: false, reason: "busy" }, { status: 429 });
      // Gemini's own error text (never includes the key) makes setup problems easy to spot.
      const detail = error instanceof Error ? error.message.slice(0, 300) : "";
      return NextResponse.json({ ok: false, reason: "upstream", detail }, { status: 502 });
    }
  }

  try {
    const client = new Anthropic();
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      cache_control: { type: "ephemeral" },
      system,
      tools: agentTools,
      messages,
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ ok: true, refused: true, content: [], stop_reason: "refusal" });
    }
    return NextResponse.json({ ok: true, content: response.content, stop_reason: response.stop_reason });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ ok: false, reason: "busy" }, { status: 429 });
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error("[assistant] bad request", error.message);
      return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`[assistant] API error ${error.status}`, error.message);
    } else {
      console.error("[assistant] request failed", error);
    }
    return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
  }
}
