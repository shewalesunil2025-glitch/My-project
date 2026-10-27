import { secretMatches } from "../wa/rules";
import { VOICES, buildInstructions, defaultGreeting, type AssistantConfig } from "@/lib/voice/core";

/**
 * The phone-call provider behind one interface, so Vapi can be swapped (or faked in tests).
 * Provider keys are read from the server environment only and never leave the server.
 */

export type CallEvent =
  | { kind: "assistant-request"; providerNumberId: string; caller: string; providerCallId: string }
  | { kind: "end-of-call-report"; providerCallId: string; providerNumberId: string; caller: string; startedAt: string | null; endedAt: string | null; durationSec: number; endedReason: string; summary: string; transcript: string; costUsd: number | null }
  | { kind: "other"; type: string; providerCallId: string; status: string }
  | { kind: "invalid" };

export type InlineAssistant = Record<string, unknown>;

export interface VoiceProvider {
  readonly name: string;
  /** Is this request really from the provider? */
  verifyWebhook(headers: Headers): boolean;
  parseEvent(body: unknown): CallEvent;
  /** The assistant to run for one incoming call, built from the client's saved setup. */
  assistantFor(cfg: AssistantConfig): InlineAssistant;
  /** Point a provider phone number at our server. Throws with a short reason when the provider refuses. */
  configureNumber(providerNumberId: string): Promise<void>;
}

const VAPI = "https://api.vapi.ai";
const serverUrl = () => `${(process.env.NEXT_PUBLIC_SITE_URL || "https://www.ibaxai.com").replace(/\/$/, "")}/api/voice/webhook`;
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const str = (v: unknown) => (typeof v === "string" ? v : "");

export const vapi: VoiceProvider = {
  name: "vapi",
  verifyWebhook(headers) {
    // Vapi sends the "Custom Credential" we create there: a bearer token (Authorization) or, in the legacy form, X-Vapi-Secret.
    const given = headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? headers.get("x-vapi-secret");
    return secretMatches(given, process.env.VAPI_WEBHOOK_SECRET);
  },
  parseEvent(body) {
    const m = obj(obj(body).message);
    const type = str(m.type);
    const call = obj(m.call);
    const providerCallId = str(call.id);
    const providerNumberId = str(call.phoneNumberId) || str(obj(call.phoneNumber).id);
    const caller = str(obj(call.customer).number);
    if (!type || !providerCallId) return { kind: "invalid" };
    if (type === "assistant-request") return { kind: "assistant-request", providerNumberId, caller, providerCallId };
    if (type === "end-of-call-report") {
      const startedAt = str(m.startedAt) || str(call.startedAt) || null;
      const endedAt = str(m.endedAt) || str(call.endedAt) || null;
      const ms = startedAt && endedAt ? Date.parse(endedAt) - Date.parse(startedAt) : NaN;
      const art = obj(m.artifact);
      const an = obj(m.analysis);
      return {
        kind: "end-of-call-report",
        providerCallId,
        providerNumberId,
        caller,
        startedAt,
        endedAt,
        durationSec: Number.isFinite(ms) && ms > 0 ? Math.round(ms / 1000) : 0,
        endedReason: str(m.endedReason) || str(call.endedReason),
        summary: str(an.summary) || str(m.summary),
        transcript: str(art.transcript) || str(m.transcript),
        costUsd: typeof m.cost === "number" ? m.cost : typeof call.cost === "number" ? call.cost : null,
      };
    }
    return { kind: "other", type, providerCallId, status: str(m.status) };
  },
  assistantFor(cfg) {
    const v = VOICES.find((x) => x.language === cfg.language && x.gender === cfg.voiceGender) ?? VOICES[0];
    return {
      name: cfg.name.slice(0, 40),
      firstMessage: cfg.greeting || defaultGreeting(cfg),
      model: { provider: "google", model: "gemini-2.5-flash", messages: [{ role: "system", content: buildInstructions(cfg) }] },
      voice: { provider: "azure", voiceId: v.phoneVoice },
      transcriber: { provider: "google", language: "Multilingual" },
      maxDurationSeconds: 600,
      // We never keep call audio.
      artifactPlan: { recordingEnabled: false },
    };
  },
  async configureNumber(providerNumberId) {
    const key = process.env.VAPI_API_KEY;
    if (!key) throw new Error("not_configured");
    const credentialId = process.env.VAPI_WEBHOOK_CREDENTIAL_ID;
    const res = await fetch(`${VAPI}/phone-number/${encodeURIComponent(providerNumberId)}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ server: { url: serverUrl(), ...(credentialId ? { credentialId } : {}) } }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`provider_${res.status}`);
  },
};

/** A provider for tests: nothing leaves the process. */
export function fakeProvider(opts: { secret?: string; failConfigure?: boolean } = {}): VoiceProvider & { configured: string[] } {
  const configured: string[] = [];
  return {
    ...vapi,
    name: "fake",
    configured,
    verifyWebhook: (h) => h.get("authorization") === `Bearer ${opts.secret ?? "test-secret"}`,
    async configureNumber(id) {
      if (opts.failConfigure) throw new Error("provider_500");
      configured.push(id);
    },
  };
}
