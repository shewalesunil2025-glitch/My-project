import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
  AGENT_LIMITS,
  agentLangCodes,
  buildAgentSystemPrompt,
  type AgentLang,
  type AgentMessage,
  type AgentReply,
} from "@/lib/shambhuAgent";

/**
 * Lumi, the website voice assistant. The browser sends the conversation as
 * text (speech is recognised and spoken in the browser); Claude answers in the
 * visitor's language and says which language that is, so the right voice reads it.
 * Needs ANTHROPIC_API_KEY. Nothing is stored.
 */

const SYSTEM_PROMPT = buildAgentSystemPrompt();

const REPLY_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string", description: "The spoken answer, in the visitor's language." },
    lang: { type: "string", enum: agentLangCodes, description: "Language code of the reply." },
  },
  required: ["reply", "lang"],
  additionalProperties: false,
};

/** Small per-instance rate limit: 20 questions a minute per visitor IP. */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

function validate(body: unknown): AgentMessage[] | null {
  if (!body || typeof body !== "object") return null;
  const raw = (body as { messages?: unknown }).messages;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const messages = raw.slice(-AGENT_LIMITS.messages).flatMap((m): AgentMessage[] => {
    if (!m || typeof m !== "object") return [];
    const { role, content } = m as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return [];
    const text = content.trim().slice(0, AGENT_LIMITS.chars);
    return text ? [{ role, content: text }] : [];
  });
  // The conversation must start and end with the visitor.
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return null;
  return messages;
}

let client: Anthropic | null = null;

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const messages = validate(body);
  if (!messages) return NextResponse.json({ error: "invalid" }, { status: 400 });

  client ??= new Anthropic();

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 1024,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      // Short spoken answers: low effort keeps replies quick.
      output_config: { effort: "low", format: { type: "json_schema", schema: REPLY_SCHEMA } },
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages,
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "refused" }, { status: 422 });
    }

    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const parsed = JSON.parse(text) as { reply?: unknown; lang?: unknown };
    if (typeof parsed.reply !== "string" || !parsed.reply.trim()) throw new Error("Empty reply");
    const lang = (agentLangCodes as string[]).includes(String(parsed.lang)) ? (parsed.lang as AgentLang) : "en";
    const reply: AgentReply = { reply: parsed.reply.trim(), lang };
    return NextResponse.json(reply);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "busy" }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("Lumi API error", err.status, err.message);
    } else {
      console.error("Lumi error", err);
    }
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
