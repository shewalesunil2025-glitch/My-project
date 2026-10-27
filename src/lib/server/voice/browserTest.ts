import type { SupabaseClient } from "@supabase/supabase-js";
import { VOICES, buildInstructions, defaultGreeting, type AssistantConfig, type VoiceGender, type VoiceLanguage } from "@/lib/voice/core";

const TEST_RULES = `

# Browser test
This is a practice call in a web browser, not a real phone call. The caller is the business owner trying you out. Begin the call by saying the greeting, then answer as you would to a customer.`;

/**
 * The setup for the owner's practice call in the browser (Gemini Live). It uses the same
 * instructions as the phone assistant; only the voice engine differs, so the sound can differ.
 */
export async function voiceTestPlan(db: SupabaseClient, ownerId: string): Promise<{ instructions: string; voice: string } | null> {
  const { data: a } = await db.from("voice_assistants").select("*").eq("owner_id", ownerId).maybeSingle();
  if (!a) return null;
  const { data: ws } = await db.from("workspaces").select("business:data->business").eq("owner_id", ownerId).maybeSingle();
  const cfg: AssistantConfig = {
    name: String(a.name), language: a.language as VoiceLanguage, voiceGender: a.voice_gender as VoiceGender, greeting: String(a.greeting ?? ""), style: String(a.style ?? ""),
    neverSay: String(a.never_say ?? ""), transferNumber: String(a.transfer_number ?? ""), handoff: String(a.handoff ?? ""), knowledge: (a.knowledge ?? {}) as Record<string, string>,
    businessName: String((ws?.business as { name?: string } | null)?.name ?? "").slice(0, 80), keepTranscripts: false,
  };
  const v = VOICES.find((x) => x.language === cfg.language && x.gender === cfg.voiceGender) ?? VOICES[0];
  return { instructions: `${buildInstructions(cfg)}\n\nGreeting to say first: "${cfg.greeting || defaultGreeting(cfg)}"${TEST_RULES}`, voice: v.previewVoice };
}
