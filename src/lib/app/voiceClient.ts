"use client";

import { cloudAuthHeader } from "./cloud";

/** The browser side of AI Voice: calls /api/voice with the owner's sign-in. All rules are checked on the server. */

export type VoiceState = {
  ok: boolean;
  reason?: string;
  status: string;
  paid: boolean;
  assistant: null | { name: string; language: "hi" | "en"; voiceGender: "female" | "male"; greeting: string; style: string; neverSay: string; handoff: string; transferNumber: string; knowledge: Record<string, string>; keepTranscripts: boolean };
  number: null | { id: string; kind: "new" | "forwarding"; number: string | null; existingNumber: string; status: string; statusText: string; note: string };
  plan: null | { planId: string; paused: boolean; status: string };
  minutes: null | { usedMinutes: number; includedMinutes: number; leftMinutes: number; overage: boolean; blocked: boolean; warn: boolean };
  cycle: null | { start: string; end: string };
  plans: { id: string; name: string; includedMinutes: number | null }[];
  voices: { id: string; language: "hi" | "en"; gender: "female" | "male"; label: string; previewVoice: string }[];
};
export type VoiceCall = { id: string; caller: string; started_at: string | null; duration_sec: number; outcome: "answered" | "appointment" | "lead" | "transferred" | "missed"; summary: string };

export async function voiceCall<T = { ok: boolean; reason?: string; message?: string }>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/voice", { method: "POST", headers: { "content-type": "application/json", ...(await cloudAuthHeader()) }, body: JSON.stringify(body) }).catch(() => null);
  return ((await res?.json().catch(() => null)) ?? { ok: false, reason: "network" }) as T;
}
export const voiceState = () => voiceCall<VoiceState>({ action: "state" });
export const voiceCalls = () => voiceCall<{ ok: boolean; calls?: VoiceCall[] }>({ action: "calls" });
export const voiceHeaders = cloudAuthHeader;
