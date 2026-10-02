import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { product } from "@/config/product";

/**
 * Answers questions the in-app assistant can't answer from workspace data alone.
 * Honest by default: without ANTHROPIC_API_KEY it returns 503 and the app falls back
 * to its built-in answers.
 */

type Body = {
  question?: unknown;
  context?: unknown;
  history?: unknown;
};

const MAX = 4000;

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim().slice(0, MAX) : "";
  const context = typeof body.context === "string" ? body.context.slice(0, MAX * 2) : "";
  if (!question) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });

  const history: Anthropic.Beta.BetaMessageParam[] = Array.isArray(body.history)
    ? body.history
        .filter(
          (m): m is { role: "user" | "assistant"; text: string } =>
            !!m && typeof m === "object" && (m.role === "user" || m.role === "assistant") && typeof m.text === "string",
        )
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.text.slice(0, MAX) }))
    : [];
  // The API expects the conversation to start with a user turn.
  while (history.length && history[0].role !== "user") history.shift();

  const system = [
    `You are ${product.assistantName}, the AI business assistant inside ${product.name}, an app that runs a small business's website, AI call and WhatsApp assistants, social media, reviews, content and leads.`,
    "You speak to the business owner, who is not technical. Be warm, short and concrete. Use plain words, no jargon (never mention n8n, APIs, webhooks or backend tools).",
    "Answer from the workspace data below. Never invent numbers, customers, reviews or results that are not in the data — say what you don't know instead.",
    "Never write fake reviews or suggest manipulating ratings.",
    "When something needs a feature the owner hasn't activated, say which service in the app does it.",
    "Reply in the language the owner writes in.",
    "",
    "Workspace data:",
    context,
  ].join("\n");

  try {
    const client = new Anthropic();
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system,
      messages: [...history, { role: "user", content: question }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ ok: true, text: "I can't help with that one. Ask me about your business, customers or content." });
    }
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return NextResponse.json({ ok: true, text: text || "Sorry, I didn't get that. Could you say it another way?" });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ ok: false, reason: "busy" }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`[assistant] API error ${error.status}`, error.message);
    } else {
      console.error("[assistant] request failed", error);
    }
    return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
  }
}
