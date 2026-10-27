import type { SupabaseClient } from "@supabase/supabase-js";
import {
  VOICES, billableSeconds, cleanPhone, cycleFor, languages, genders, minutesState, numberStatuses, planSellable, voiceFor, voiceStatus,
  type AssistantConfig, type NumberStatus, type Plan, type VoiceGender, type VoiceLanguage,
} from "@/lib/voice/core";
import type { CallEvent, InlineAssistant, VoiceProvider } from "./provider";

/**
 * AI Voice Calling on the server. Every rule is decided here: who owns what, what a package allows,
 * which number statuses can follow which. The browser only says what the client chose.
 */

type Row = Record<string, unknown>;
export type Fail = { ok: false; reason: string; message?: string; status: number };
export type Ok<T = object> = { ok: true } & T;
const fail = (reason: string, message: string, status = 400): Fail => ({ ok: false, reason, message, status });

export const missingTables = (e: { message?: string; code?: string } | null | undefined) =>
  Boolean(e && (e.code === "42P01" || e.code === "PGRST205" || /does not exist|schema cache/i.test(e.message ?? "")));

const clip = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

export const audit = async (db: SupabaseClient, ownerId: string | null, actor: string, action: string, detail: Row = {}) => {
  await db.from("voice_audit").insert({ owner_id: ownerId, actor, action, detail });
};

/* ── plans ── */
const planOf = (r: Row): Plan => ({
  id: String(r.id), name: String(r.name), includedMinutes: (r.included_minutes as number) ?? null,
  overageInrPerMinute: r.overage_inr_per_minute == null ? null : Number(r.overage_inr_per_minute), hardCapMinutes: (r.hard_cap_minutes as number) ?? null, active: Boolean(r.active),
});
export async function listPlans(db: SupabaseClient, all = false): Promise<Plan[]> {
  const { data } = await db.from("voice_plans").select("*").order("id");
  return (data ?? []).map(planOf).filter((p) => all || planSellable(p));
}

/* ── payment: reuse the Razorpay `subscriptions` row for service "voice" ── */
export async function isPaid(db: SupabaseClient, ownerId: string, now = new Date()) {
  const { data } = await db.from("subscriptions").select("status, renews_at").eq("owner_id", ownerId).eq("service_id", "voice").eq("status", "active");
  return (data ?? []).some((s) => !s.renews_at || Date.parse(String(s.renews_at)) > now.getTime());
}

/* ── assistant ── */
export function parseAssistant(b: Record<string, unknown>): Ok<{ value: Omit<AssistantConfig, "businessName"> }> | Fail {
  const language = b.language as VoiceLanguage;
  const voiceGender = b.voiceGender as VoiceGender;
  if (!languages.includes(language)) return fail("bad_language", "Choose Hindi or English.");
  if (!genders.includes(voiceGender)) return fail("bad_voice", "Choose a woman's or a man's voice.");
  const k = (b.knowledge && typeof b.knowledge === "object" ? b.knowledge : {}) as Record<string, unknown>;
  const knowledge: Record<string, string> = {};
  for (const key of ["about", "services", "prices", "hours", "faq", "appointments"]) if (k[key]) knowledge[key] = clip(k[key], 1500);
  const transferNumber = b.transferNumber ? cleanPhone(b.transferNumber) : "";
  if (transferNumber === null) return fail("bad_phone", "That transfer number doesn't look right.");
  return {
    ok: true,
    value: {
      name: clip(b.name, 40) || "IBAX", language, voiceGender, greeting: clip(b.greeting, 300), style: clip(b.style, 80) || "friendly",
      neverSay: clip(b.neverSay, 300), transferNumber, handoff: clip(b.handoff, 300), knowledge, keepTranscripts: b.keepTranscripts === true,
    },
  };
}

export async function saveAssistant(db: SupabaseClient, ownerId: string, body: Record<string, unknown>): Promise<Ok | Fail> {
  const p = parseAssistant(body);
  if (!p.ok) return p;
  const v = p.value;
  const row = {
    owner_id: ownerId, name: v.name, language: v.language, voice_gender: v.voiceGender, voice_id: voiceFor(v.language, v.voiceGender)?.id ?? "",
    greeting: v.greeting, style: v.style, never_say: v.neverSay, transfer_number: v.transferNumber, handoff: v.handoff, knowledge: v.knowledge,
    keep_transcripts: v.keepTranscripts, updated_at: new Date().toISOString(),
  };
  const { data: have } = await db.from("voice_assistants").select("id").eq("owner_id", ownerId).maybeSingle();
  const { error } = have ? await db.from("voice_assistants").update(row).eq("owner_id", ownerId) : await db.from("voice_assistants").insert(row);
  if (error) return missingTables(error) ? fail("not_ready", "Voice isn't switched on yet.", 503) : fail("save_failed", "Couldn't save. Please try again.", 500);
  await audit(db, ownerId, "owner", "assistant.saved", { language: v.language, gender: v.voiceGender });
  return { ok: true };
}

const configOf = (a: Row, businessName: string): AssistantConfig => ({
  name: String(a.name), language: a.language as VoiceLanguage, voiceGender: a.voice_gender as VoiceGender, greeting: String(a.greeting ?? ""), style: String(a.style ?? ""),
  neverSay: String(a.never_say ?? ""), transferNumber: String(a.transfer_number ?? ""), handoff: String(a.handoff ?? ""), knowledge: (a.knowledge ?? {}) as Record<string, string>,
  businessName, keepTranscripts: Boolean(a.keep_transcripts),
});

async function businessName(db: SupabaseClient, ownerId: string) {
  const { data } = await db.from("workspaces").select("business:data->business").eq("owner_id", ownerId).maybeSingle();
  return clip((data?.business as { name?: string } | null)?.name, 80);
}

/* ── numbers ── */
export async function requestNumber(db: SupabaseClient, ownerId: string, body: Record<string, unknown>): Promise<Ok<{ id: string }> | Fail> {
  const kind = body.kind === "forwarding" ? "forwarding" : "new";
  const existing = kind === "forwarding" ? cleanPhone(body.existingNumber) : "";
  if (existing === null) return fail("bad_phone", "That phone number doesn't look right.");
  const { data: open } = await db.from("voice_phone_numbers").select("id, status").eq("owner_id", ownerId);
  if ((open ?? []).some((n) => n.status !== "failed")) return fail("already_requested", "You already have a number request. The team is working on it.", 409);
  const { data, error } = await db.from("voice_phone_numbers").insert({ owner_id: ownerId, kind, existing_number: existing, carrier: clip(body.carrier, 60), status: "requested" }).select("id").single();
  if (error || !data) return fail("save_failed", "Couldn't send the request. Please try again.", 500);
  await audit(db, ownerId, "owner", "number.requested", { kind });
  return { ok: true, id: String(data.id) };
}

/** Start the monthly package after the Razorpay payment is confirmed (the payment itself is verified by /api/pay/verify). */
export async function startPlan(db: SupabaseClient, ownerId: string, planId: unknown, now = new Date()): Promise<Ok | Fail> {
  if (!(await isPaid(db, ownerId, now))) return fail("not_paid", "Please complete the payment first.", 402);
  const { data: have } = await db.from("voice_subscriptions").select("id, status").eq("owner_id", ownerId).maybeSingle();
  if (have) return { ok: true };
  const { data: p } = await db.from("voice_plans").select("*").eq("id", String(planId ?? "standard")).maybeSingle();
  const plan = p ? planOf(p) : null;
  if (!plan || !planSellable(plan)) return fail("plan_not_ready", "The package isn't open yet. The ibaxai team is setting the minutes.", 409);
  const { error } = await db.from("voice_subscriptions").insert({
    owner_id: ownerId, plan_id: plan.id, included_minutes: plan.includedMinutes, overage_inr_per_minute: plan.overageInrPerMinute, hard_cap_minutes: plan.hardCapMinutes, started_at: now.toISOString(),
  });
  if (error) return fail("save_failed", "Couldn't start the package. Please try again.", 500);
  await audit(db, ownerId, "owner", "plan.started", { plan: plan.id });
  return { ok: true };
}

export async function setPaused(db: SupabaseClient, ownerId: string, paused: unknown): Promise<Ok | Fail> {
  const { data } = await db.from("voice_subscriptions").select("id").eq("owner_id", ownerId).maybeSingle();
  if (!data) return fail("no_plan", "There is no active package.", 404);
  await db.from("voice_subscriptions").update({ paused: paused === true, updated_at: new Date().toISOString() }).eq("owner_id", ownerId);
  await audit(db, ownerId, "owner", paused === true ? "assistant.paused" : "assistant.resumed");
  return { ok: true };
}

/* ── usage and entitlement ── */
export async function usageThisMonth(db: SupabaseClient, ownerId: string, anchor: Date, now = new Date()) {
  const c = cycleFor(anchor, now);
  const { data } = await db.from("voice_usage_records").select("billable_sec").eq("owner_id", ownerId).gte("occurred_at", c.start.toISOString());
  const sec = (data ?? []).reduce((a, r) => a + Number(r.billable_sec ?? 0), 0);
  return { cycle: c, usedSec: sec };
}

export type Snapshot = Awaited<ReturnType<typeof snapshot>>;
/** Everything the client page and the call-time check need, for one owner. */
export async function snapshot(db: SupabaseClient, ownerId: string, now = new Date()) {
  const [{ data: a }, { data: nums }, { data: sub }, paid] = await Promise.all([
    db.from("voice_assistants").select("*").eq("owner_id", ownerId).maybeSingle(),
    db.from("voice_phone_numbers").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }),
    db.from("voice_subscriptions").select("*").eq("owner_id", ownerId).maybeSingle(),
    isPaid(db, ownerId, now),
  ]);
  const number = (nums ?? [])[0] as Row | undefined;
  const assistantReady = Boolean(a && (a.name as string) && a.voice_id);
  const status = voiceStatus({
    paid, assistantReady, numberStatus: (number?.status as NumberStatus) ?? null, testPassed: Boolean(number?.test_passed_at),
    suspended: sub?.status === "suspended" || sub?.status === "cancelled", paused: Boolean(sub?.paused),
  });
  let minutes = null as ReturnType<typeof minutesState> | null;
  let cycle = null as { start: Date; end: Date } | null;
  if (sub) {
    const u = await usageThisMonth(db, ownerId, new Date(String(sub.started_at)), now);
    cycle = u.cycle;
    minutes = minutesState(u.usedSec, { includedMinutes: Number(sub.included_minutes), overageInrPerMinute: sub.overage_inr_per_minute == null ? null : Number(sub.overage_inr_per_minute), hardCapMinutes: (sub.hard_cap_minutes as number) ?? null });
  }
  return { assistant: a as Row | null, number, sub: sub as Row | null, paid, status, minutes, cycle };
}

/** Called for every incoming call: may this client's assistant answer right now? */
export async function entitlement(db: SupabaseClient, ownerId: string, now = new Date()): Promise<{ ok: true; assistant: Row } | { ok: false; reason: string }> {
  const s = await snapshot(db, ownerId, now);
  if (!s.paid) return { ok: false, reason: "not_paid" };
  if (!s.assistant) return { ok: false, reason: "no_assistant" };
  if (!s.sub) return { ok: false, reason: "no_plan" };
  if (s.status === "suspended") return { ok: false, reason: "suspended" };
  if (s.sub.paused) return { ok: false, reason: "paused" };
  if (s.status !== "active" && s.status !== "ready_for_testing") return { ok: false, reason: s.status };
  if (s.minutes?.blocked) return { ok: false, reason: "no_minutes" };
  return { ok: true, assistant: s.assistant };
}

export async function listCalls(db: SupabaseClient, ownerId: string, limit = 50) {
  const { data } = await db.from("voice_calls").select("id, caller, started_at, duration_sec, outcome, summary, ended_reason").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}

/* ── incoming provider events ── */
export type WebhookResult = { status: number; body: Row };

const REFUSAL: Record<string, { hi: string; en: string }> = {
  default: { en: "Sorry, this number can't take calls right now. Please try again later.", hi: "क्षमा करें, यह नंबर अभी कॉल नहीं ले सकता। कृपया बाद में कोशिश करें।" },
};

const outcomeOf = (reason: string): "answered" | "transferred" | "missed" => (/forward|transfer/i.test(reason) ? "transferred" : /did-not-answer|no-answer|busy|voicemail/i.test(reason) ? "missed" : "answered");

export async function handleEvent(db: SupabaseClient, provider: VoiceProvider, ev: CallEvent, now = new Date()): Promise<WebhookResult> {
  if (ev.kind === "invalid") return { status: 400, body: { ok: false } };

  const numberOf = async (providerNumberId: string) => {
    if (!providerNumberId) return null;
    const { data } = await db.from("voice_phone_numbers").select("id, owner_id, status").eq("provider", provider.name).eq("provider_number_id", providerNumberId).maybeSingle();
    return data as { id: string; owner_id: string; status: string } | null;
  };

  if (ev.kind === "assistant-request") {
    const n = await numberOf(ev.providerNumberId);
    // Unknown number or one that isn't live yet: refuse politely. Only "ready_for_testing" and "active" numbers answer.
    if (!n || !["ready_for_testing", "active"].includes(n.status)) return { status: 200, body: { error: REFUSAL.default.en } };
    const ent = await entitlement(db, n.owner_id, now);
    if (!ent.ok) return { status: 200, body: { error: REFUSAL.default.en } };
    const cfg = configOf(ent.assistant, await businessName(db, n.owner_id));
    return { status: 200, body: { assistant: provider.assistantFor(cfg) as InlineAssistant } };
  }

  // Everything else is recorded once. A repeat of the same event changes nothing.
  const key = `${provider.name}:${ev.providerCallId}:${ev.kind === "other" ? `${ev.type}:${ev.status}` : ev.kind}`;
  const n = ev.kind === "end-of-call-report" ? await numberOf(ev.providerNumberId) : null;
  const { data: seen } = await db.from("voice_provider_events").select("id, status").eq("event_key", key).maybeSingle();
  if (seen?.status === "processed") return { status: 200, body: { ok: true, duplicate: true } };
  if (!seen) {
    const payload = ev.kind === "end-of-call-report" ? { endedReason: ev.endedReason, durationSec: ev.durationSec } : { type: ev.type, status: ev.status };
    const { error } = await db.from("voice_provider_events").insert({ provider: provider.name, event_key: key, type: ev.kind === "other" ? ev.type : ev.kind, owner_id: n?.owner_id ?? null, payload });
    if (error && !/duplicate|unique/i.test(error.message)) return { status: 500, body: { ok: false } };
  }
  if (ev.kind === "other") {
    await db.from("voice_provider_events").update({ status: "processed" }).eq("event_key", key);
    return { status: 200, body: { ok: true } };
  }

  if (!n) {
    await db.from("voice_provider_events").update({ status: "unmatched" }).eq("event_key", key);
    return { status: 200, body: { ok: true, matched: false } };
  }
  const { data: asst } = await db.from("voice_assistants").select("keep_transcripts").eq("owner_id", n.owner_id).maybeSingle();
  const { data: existing } = await db.from("voice_calls").select("id").eq("provider_call_id", ev.providerCallId).maybeSingle();
  let callId = existing?.id as string | undefined;
  if (!callId) {
    const { data: made, error } = await db.from("voice_calls").insert({
      owner_id: n.owner_id, number_id: n.id, provider_call_id: ev.providerCallId, caller: ev.caller, started_at: ev.startedAt, ended_at: ev.endedAt, duration_sec: ev.durationSec,
      ended_reason: ev.endedReason.slice(0, 120), outcome: outcomeOf(ev.endedReason), summary: ev.summary.slice(0, 1500), transcript: asst?.keep_transcripts ? ev.transcript.slice(0, 20000) : null, cost_usd: ev.costUsd,
    }).select("id").single();
    if (error || !made) {
      await db.from("voice_provider_events").update({ status: "failed" }).eq("event_key", key);
      return { status: 500, body: { ok: false } };
    }
    callId = String(made.id);
  }
  // One usage record per call: a second try is rejected by the unique call id.
  await db.from("voice_usage_records").insert({ owner_id: n.owner_id, call_id: callId, duration_sec: ev.durationSec, billable_sec: billableSeconds(ev.durationSec), occurred_at: ev.endedAt ?? now.toISOString() });
  await db.from("voice_provider_events").update({ status: "processed" }).eq("event_key", key);
  return { status: 200, body: { ok: true } };
}

/* ── admin (founder) ── */
const PEOPLE_STATUSES: NumberStatus[] = ["requested", "awaiting_customer_info", "awaiting_verification", "configuration_in_progress", "failed"];

export async function adminNumberAction(db: SupabaseClient, provider: VoiceProvider, actor: string, body: Record<string, unknown>, now = new Date()): Promise<Ok<{ status: NumberStatus }> | Fail> {
  const { data: n } = await db.from("voice_phone_numbers").select("*").eq("id", String(body.id ?? "")).maybeSingle();
  if (!n) return fail("not_found", "No such number request.", 404);
  const owner = String(n.owner_id);
  const set = async (patch: Row) => {
    await db.from("voice_phone_numbers").update({ ...patch, updated_at: now.toISOString() }).eq("id", n.id);
    await audit(db, owner, actor, `number.${String(body.action)}`, { to: patch.status });
  };
  switch (body.action) {
    case "set_status": {
      const s = body.status as NumberStatus;
      if (!PEOPLE_STATUSES.includes(s)) return fail("bad_status", "Ready for testing and Active can't be set by hand.");
      await set({ status: s, note: clip(body.note, 300) });
      return { ok: true, status: s };
    }
    case "attach": {
      // The ibaxai number and the provider's id for it, after the team created it with the phone company and the provider.
      const number = cleanPhone(body.number);
      const pid = clip(body.providerNumberId, 80);
      if (!number || !pid) return fail("bad_input", "Enter the number and the provider's number id.");
      const { error } = await db.from("voice_phone_numbers").update({ number, provider_number_id: pid, provider: provider.name, updated_at: now.toISOString() }).eq("id", n.id);
      if (error) return fail("duplicate", "That number or provider id is already used.", 409);
      await audit(db, owner, actor, "number.attached", { number });
      return { ok: true, status: n.status as NumberStatus };
    }
    case "configure": {
      if (!n.number || !n.provider_number_id) return fail("not_attached", "Attach the number and the provider id first.", 409);
      if (n.status === "active") return fail("already_active", "This number is already active.", 409);
      try {
        await provider.configureNumber(String(n.provider_number_id));
      } catch (e) {
        const note = `Provider setup failed (${e instanceof Error ? e.message : "error"})`;
        await set({ status: "failed", note });
        return fail("provider_failed", note, 502);
      }
      await set({ status: "ready_for_testing", note: "" });
      return { ok: true, status: "ready_for_testing" };
    }
    case "test_passed": {
      // Only after the provider setup worked, and only by the founder after a real test call.
      if (n.status !== "ready_for_testing") return fail("not_ready", "The number must be ready for testing first.", 409);
      await set({ status: "active", test_passed_at: now.toISOString() });
      return { ok: true, status: "active" };
    }
    default:
      return fail("bad_request", "Unknown action.");
  }
}

export async function adminSavePlan(db: SupabaseClient, actor: string, b: Record<string, unknown>): Promise<Ok | Fail> {
  const id = clip(b.id, 30);
  const int = (v: unknown) => (v == null || v === "" ? null : Number.isInteger(v) && (v as number) > 0 ? (v as number) : NaN);
  const minutes = int(b.includedMinutes);
  const cap = int(b.hardCapMinutes);
  const over = b.overageInrPerMinute == null || b.overageInrPerMinute === "" ? null : Number(b.overageInrPerMinute);
  if (!/^[a-z0-9-]{2,30}$/.test(id) || Number.isNaN(minutes) || Number.isNaN(cap) || (over != null && !(over >= 0 && over < 10000))) return fail("bad_input", "Check the package fields.");
  if (cap != null && minutes != null && cap < minutes) return fail("bad_cap", "The hard cap can't be below the included minutes.");
  const active = b.active === true && minutes != null;
  const row = { id, name: clip(b.name, 40) || id, included_minutes: minutes, overage_inr_per_minute: over, hard_cap_minutes: cap, active, updated_at: new Date().toISOString() };
  const { data: have } = await db.from("voice_plans").select("id").eq("id", id).maybeSingle();
  const { error } = have ? await db.from("voice_plans").update(row).eq("id", id) : await db.from("voice_plans").insert(row);
  if (error) return fail("save_failed", "Couldn't save the package.", 500);
  await audit(db, null, actor, "plan.saved", { id, minutes, cap, active });
  return { ok: true };
}

export async function adminOverview(db: SupabaseClient, now = new Date()) {
  const [{ data: nums }, { data: subs }, { data: calls }, { data: failed }] = await Promise.all([
    db.from("voice_phone_numbers").select("*").order("created_at", { ascending: false }).limit(200),
    db.from("voice_subscriptions").select("owner_id, plan_id, status, paused, started_at, included_minutes"),
    db.from("voice_calls").select("owner_id, duration_sec, cost_usd").gte("created_at", new Date(now.getTime() - 30 * 86_400_000).toISOString()),
    db.from("voice_provider_events").select("event_key, type, status, created_at").in("status", ["failed", "unmatched"]).order("created_at", { ascending: false }).limit(20),
  ]);
  return { numbers: nums ?? [], subscriptions: subs ?? [], calls30d: calls ?? [], problemEvents: failed ?? [], plans: await listPlans(db, true), statuses: numberStatuses, voices: VOICES.length };
}
