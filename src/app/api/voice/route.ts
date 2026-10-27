import { json, ownerCall } from "@/lib/server/wa/http";
import { VOICES, numberStatusText } from "@/lib/voice/core";
import { listCalls, listPlans, missingTables, requestNumber, saveAssistant, setPaused, snapshot, startPlan, type Fail } from "@/lib/server/voice/service";

/**
 * The client's AI Voice Assistant. One POST with an `action`:
 * state · save_assistant · request_number · start_plan · pause · calls.
 * Everything is scoped to the signed-in owner; the plan's minutes and the statuses are decided here.
 */
const out = (r: { ok: true } | Fail) => ("ok" in r && r.ok ? json(r) : json({ ok: false, reason: (r as Fail).reason, message: (r as Fail).message }, (r as Fail).status));

export async function POST(request: Request) {
  const c = await ownerCall(request);
  if ("error" in c) return c.error;
  const { db, body: b, user } = c;
  switch (b.action) {
    case "state": {
      try {
        const s = await snapshot(db, user.id);
        const a = s.assistant;
        return json({
          ok: true,
          status: s.status,
          paid: s.paid,
          assistant: a && { name: a.name, language: a.language, voiceGender: a.voice_gender, greeting: a.greeting, style: a.style, neverSay: a.never_say, handoff: a.handoff, transferNumber: a.transfer_number, knowledge: a.knowledge, keepTranscripts: a.keep_transcripts },
          number: s.number && { id: s.number.id, kind: s.number.kind, number: s.number.number, existingNumber: s.number.existing_number, status: s.number.status, statusText: numberStatusText[s.number.status as keyof typeof numberStatusText], note: s.number.note },
          plan: s.sub && { planId: s.sub.plan_id, paused: s.sub.paused, status: s.sub.status },
          minutes: s.minutes,
          cycle: s.cycle && { start: s.cycle.start.toISOString(), end: s.cycle.end.toISOString() },
          plans: await listPlans(db),
          voices: VOICES.map(({ id, language, gender, label, previewVoice }) => ({ id, language, gender, label, previewVoice })),
        });
      } catch (e) {
        return missingTables(e as { message?: string }) ? json({ ok: false, reason: "not_ready" }, 503) : json({ ok: false, reason: "server_error" }, 500);
      }
    }
    case "save_assistant":
      return out(await saveAssistant(db, user.id, b));
    case "request_number":
      return out(await requestNumber(db, user.id, b));
    case "start_plan":
      return out(await startPlan(db, user.id, b.planId));
    case "pause":
      return out(await setPaused(db, user.id, b.paused));
    case "calls":
      return json({ ok: true, calls: await listCalls(db, user.id) });
    default:
      return json({ ok: false, reason: "bad_request" }, 400);
  }
}
