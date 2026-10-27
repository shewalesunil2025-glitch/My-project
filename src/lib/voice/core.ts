/**
 * AI Voice Calling — the rules that need no database: choices, the monthly minutes window,
 * the status a client sees, and the assistant's instructions. Used by the server and the app.
 */

export const languages = ["hi", "en"] as const;
export type VoiceLanguage = (typeof languages)[number];
export const genders = ["female", "male"] as const;
export type VoiceGender = (typeof genders)[number];

export const numberStatuses = ["requested", "awaiting_customer_info", "awaiting_verification", "configuration_in_progress", "ready_for_testing", "active", "failed"] as const;
export type NumberStatus = (typeof numberStatuses)[number];

export const numberStatusText: Record<NumberStatus, string> = {
  requested: "Requested — the ibaxai team will start soon",
  awaiting_customer_info: "We need some details from you",
  awaiting_verification: "Waiting for the phone company's verification",
  configuration_in_progress: "Being set up",
  ready_for_testing: "Ready for a test call",
  active: "Active",
  failed: "Setup failed — the team is looking into it",
};

/**
 * Voices the phone provider can speak with (Azure neural voices, as named by Microsoft).
 * The phone voice and the browser test voice (Gemini) are different engines, so the browser
 * test is only a guide to wording and behaviour, never to the exact sound.
 */
export type VoiceOption = { id: string; language: VoiceLanguage; gender: VoiceGender; label: string; phoneVoice: string; previewVoice: string };
export const VOICES: VoiceOption[] = [
  { id: "hi-f", language: "hi", gender: "female", label: "Hindi · woman", phoneVoice: "hi-IN-SwaraNeural", previewVoice: "Sulafat" },
  { id: "hi-m", language: "hi", gender: "male", label: "Hindi · man", phoneVoice: "hi-IN-MadhurNeural", previewVoice: "Charon" },
  { id: "en-f", language: "en", gender: "female", label: "English (India) · woman", phoneVoice: "en-IN-NeerjaNeural", previewVoice: "Sulafat" },
  { id: "en-m", language: "en", gender: "male", label: "English (India) · man", phoneVoice: "en-IN-PrabhatNeural", previewVoice: "Charon" },
];
export const voiceFor = (language: string, gender: string) => VOICES.find((v) => v.language === language && v.gender === gender);

export type Plan = { id: string; name: string; includedMinutes: number | null; overageInrPerMinute: number | null; hardCapMinutes: number | null; active: boolean };
/** A plan can be sold only when the owner has set its minutes and switched it on. */
export const planSellable = (p: Pick<Plan, "includedMinutes" | "active"> | null | undefined) => Boolean(p && p.active && p.includedMinutes && p.includedMinutes > 0);

/** Seconds are billed in whole minutes, rounded up (a 61-second call uses 2 minutes). */
export const billableSeconds = (durationSec: number) => (durationSec > 0 ? Math.ceil(durationSec / 60) * 60 : 0);

/** The monthly window that contains `now`, counted from the day the plan started. */
export function cycleFor(anchor: Date, now: Date): { start: Date; end: Date } {
  const shift = (n: number) => {
    const d = new Date(anchor);
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + n);
    // 31 Jan + 1 month is 28/29 Feb, never 3 March
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last));
    return d;
  };
  let n = Math.max(0, (now.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + now.getUTCMonth() - anchor.getUTCMonth());
  while (n > 0 && shift(n) > now) n--;
  while (shift(n + 1) <= now) n++;
  return { start: shift(n), end: shift(n + 1) };
}

export type MinutesState = { usedMinutes: number; includedMinutes: number; leftMinutes: number; overage: boolean; blocked: boolean; warn: boolean };
/** Where the month stands. Over the package, calls go on only if an overage price and a hard cap are set. */
export function minutesState(usedSec: number, p: { includedMinutes: number; overageInrPerMinute: number | null; hardCapMinutes: number | null }): MinutesState {
  const usedMinutes = Math.ceil(usedSec / 60);
  const over = usedMinutes >= p.includedMinutes;
  const canOver = p.overageInrPerMinute != null && p.hardCapMinutes != null && p.hardCapMinutes > p.includedMinutes;
  const blocked = over && (!canOver || usedMinutes >= (p.hardCapMinutes ?? 0));
  return { usedMinutes, includedMinutes: p.includedMinutes, leftMinutes: Math.max(0, p.includedMinutes - usedMinutes), overage: over && !blocked, blocked, warn: !over && usedMinutes >= p.includedMinutes * 0.8 };
}

export type StatusInput = {
  paid: boolean; // an active, unexpired "voice" subscription
  assistantReady: boolean;
  numberStatus: NumberStatus | null;
  testPassed: boolean;
  suspended: boolean;
  paused: boolean;
};
export type VoiceStatus = "not_started" | "setup_needed" | "awaiting_payment" | "awaiting_number" | "ready_for_testing" | "active" | "paused" | "suspended" | "failed";

/** What the client sees. "active" only when paid, configured, the number is live AND a real test call passed. */
export function voiceStatus(i: StatusInput): VoiceStatus {
  if (i.suspended) return "suspended";
  if (i.numberStatus === "failed") return "failed";
  if (!i.assistantReady) return i.paid || i.numberStatus ? "setup_needed" : "not_started";
  if (!i.paid) return "awaiting_payment";
  if (!i.numberStatus || (i.numberStatus !== "active" && i.numberStatus !== "ready_for_testing")) return "awaiting_number";
  if (i.numberStatus === "ready_for_testing" || !i.testPassed) return "ready_for_testing";
  return i.paused ? "paused" : "active";
}

export type AssistantConfig = {
  name: string;
  language: VoiceLanguage;
  voiceGender: VoiceGender;
  greeting: string;
  style: string;
  neverSay: string;
  transferNumber: string;
  handoff: string;
  knowledge: Record<string, string>;
  businessName: string;
  keepTranscripts: boolean;
};

const clip = (s: unknown, n: number) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const LABELS: Record<string, string> = { about: "About the business", services: "Services", prices: "Prices", hours: "Opening hours", faq: "Frequently asked questions", appointments: "How appointments work" };

export const defaultGreeting = (a: Pick<AssistantConfig, "language" | "name" | "businessName">) =>
  a.language === "hi"
    ? `नमस्ते, ${a.businessName || "हमारे"} में आपका स्वागत है। मैं ${a.name}, यहाँ की AI असिस्टेंट हूँ। बताइए, मैं आपकी कैसे मदद कर सकती हूँ?`
    : `Hello, thank you for calling ${a.businessName || "us"}. I'm ${a.name}, an AI assistant. How can I help you today?`;

/** The assistant's instructions: only facts the owner typed; says it is an AI; never invents. */
export function buildInstructions(a: AssistantConfig): string {
  const lang = a.language === "hi" ? "Hindi (Devanagari script is fine; Hinglish words are OK). If the caller speaks English, switch to English." : "English (Indian). If the caller speaks Hindi, switch to Hindi.";
  const facts = Object.entries(LABELS)
    .map(([k, label]) => (a.knowledge[k] ? `${label}: ${clip(a.knowledge[k], 1500)}` : ""))
    .filter(Boolean)
    .join("\n");
  return [
    `You are ${clip(a.name, 40) || "IBAX"}, the phone assistant of ${clip(a.businessName, 80) || "this business"}. You answer incoming calls.`,
    `Speak ${lang} Style: ${clip(a.style, 80) || "friendly"}. Keep every answer to one or two short sentences, like a real phone call.`,
    "You are an AI assistant. Say so if asked. Never pretend to be a human.",
    "Use ONLY the business facts below. If you do not know something, say you will pass the question to the team and take the caller's name and number. Never invent prices, offers, timings or promises.",
    a.neverSay ? `Never say or discuss: ${clip(a.neverSay, 300)}.` : "",
    a.handoff ? `Hand over to a person when: ${clip(a.handoff, 300)}.` : "",
    "If the caller wants a person, take their name and number and say the team will call back. You cannot transfer calls.",
    "Do not give medical, legal or financial advice. Do not read out symbols or links.",
    facts ? `\nBusiness facts:\n${facts}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Keep the digits and a leading +; null if it can't be a phone number. */
export function cleanPhone(v: unknown): string | null {
  const s = String(v ?? "").trim();
  const d = s.replace(/[^\d]/g, "");
  if (d.length < 8 || d.length > 15) return null;
  return `+${d}`;
}
