import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { agentSystemPrompt, agentTools } from "@/lib/app/agentSpec";

/**
 * One turn of IBAX, the in-app assistant. The app keeps the conversation and carries
 * out the actions IBAX asks for (show a payment card, save details, connect an account,
 * activate a service) on the owner's workspace, then sends the results back here.
 *
 * Honest by default: without ANTHROPIC_API_KEY it returns 503 and the app uses its
 * built-in conversation instead.
 */

const MAX_BODY = 400_000;
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
  if (!process.env.ANTHROPIC_API_KEY) {
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
