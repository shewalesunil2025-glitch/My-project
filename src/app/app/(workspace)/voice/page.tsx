"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, PhoneCall, PhoneForwarded, Square } from "lucide-react";
import { startLiveCall, type LiveCall, type LiveState } from "@/lib/app/liveCall";
import { openAudio } from "@/lib/app/voiceCapture";
import { voiceCall, voiceHeaders, voiceState, type VoiceState } from "@/lib/app/voiceClient";
import { Btn, BtnLink, Card, Field, Input, Notice, PageHeader, Pill, Segmented, Select, Spinner, TextArea, Toggle, type PillTone } from "@/components/app/ui";

const STATUS: Record<string, { label: string; tone: PillTone; help: string }> = {
  not_started: { label: "Not set up", tone: "gray", help: "Set up your assistant below." },
  setup_needed: { label: "Setup needed", tone: "amber", help: "Finish the assistant details below." },
  awaiting_payment: { label: "Waiting for payment", tone: "amber", help: "Pay for the monthly package to continue." },
  awaiting_number: { label: "Waiting for your phone number", tone: "amber", help: "The ibaxai team is setting up your number." },
  ready_for_testing: { label: "Ready for a test call", tone: "blue", help: "The team will make a test call to your number. Calls already reach your assistant, but it is not marked Active until that test passes." },
  active: { label: "Active", tone: "green", help: "Your assistant answers incoming calls." },
  paused: { label: "Paused", tone: "gray", help: "Calls are not being answered." },
  suspended: { label: "Suspended", tone: "red", help: "Contact the ibaxai team." },
  failed: { label: "Setup failed", tone: "red", help: "The team is looking into it." },
};
const KNOW: [string, string][] = [["about", "About your business"], ["services", "Services"], ["prices", "Prices"], ["hours", "Opening hours"], ["faq", "Common questions and answers"], ["appointments", "How appointments work"]];

export default function VoicePage() {
  const [s, setS] = useState<VoiceState | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "IBAX", language: "hi" as "hi" | "en", voiceGender: "female" as "female" | "male", greeting: "", style: "friendly", neverSay: "", handoff: "", keepTranscripts: false, knowledge: {} as Record<string, string> });
  const [kind, setKind] = useState<"new" | "forwarding">("new");
  const [existing, setExisting] = useState("");
  const [carrier, setCarrier] = useState("");
  const [test, setTest] = useState<"off" | "connecting" | "on">("off");
  const [live, setLive] = useState<LiveState | null>(null);
  const [dropped, setDropped] = useState("");
  const call = useRef<LiveCall | null>(null);

  const load = useCallback(async () => {
    const r = await voiceState();
    if (!r.ok) return setErr(r.reason === "not_ready" ? "AI Voice isn't switched on yet. The ibaxai team will enable it soon." : "Couldn't load. Please sign in again or try in a minute.");
    // A paid client without a package row yet: start it (the server checks the payment).
    if (r.paid && !r.plan && r.plans.length) {
      await voiceCall({ action: "start_plan", planId: r.plans[0].id });
      return setS(await voiceState());
    }
    setS(r);
    if (r.assistant) setForm((f) => ({ ...f, ...r.assistant!, knowledge: r.assistant!.knowledge ?? {} }));
  }, []);
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);
  useEffect(() => () => call.current?.end(), []);

  const act = async (body: Record<string, unknown>, done: string) => {
    setBusy(true); setErr(""); setMsg("");
    const r = await voiceCall(body);
    setBusy(false);
    if (!r.ok) return setErr(r.message ?? "Something went wrong. Please try again.");
    setMsg(done);
    await load();
  };

  async function toggleTest() {
    if (test !== "off") { call.current?.end(); call.current = null; setLive(null); return setTest("off"); }
    setErr(""); setDropped(""); setTest("connecting");
    const audio = openAudio(); // made inside the tap so the browser lets it play
    const c = await startLiveCall(audio, {
      audience: "voice-test", headers: await voiceHeaders(), context: "",
      onState: (st) => { setLive(st); setTest(st === "connecting" ? "connecting" : "on"); },
      onOwnerSaid: () => {}, onIbaxSaid: () => {},
      onAction: async () => ({ content: "Not available in a test call.", is_error: true }),
      onDrop: (reason) => { setTest("off"); setLive(null); setDropped(reason); call.current = null; },
    });
    if (!c) { setTest("off"); return setErr("The browser test isn't available right now. Save your assistant first, then try again."); }
    call.current = c;
  }

  if (!s) return <div>{err ? <Notice tone="amber">{err}</Notice> : <Spinner />}</div>;
  const st = STATUS[s.status] ?? STATUS.not_started;
  const voices = s.voices.filter((v) => v.language === form.language);
  const m = s.minutes;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="AI Voice Assistant" title="Phone assistant" subtitle="Answers your incoming calls in Hindi or English, using only what you tell it." />
      {err && <Notice tone="amber">{err}</Notice>}
      {msg && <Notice tone="blue">{msg}</Notice>}

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3"><Pill tone={st.tone}>{st.label}</Pill>{s.number?.number && <span className="text-sm">Your number: <b>{s.number.number}</b></span>}</div>
        <p className="mt-2 text-sm text-ink-soft">{st.help}</p>
        {m && (
          <p className="mt-3 text-sm">Minutes this month: <b>{m.usedMinutes}</b> of {m.includedMinutes}{m.blocked ? " — the package is used up, calls are paused until it renews" : m.warn ? " — you have used most of it" : ""}.</p>
        )}
        {s.plan && <div className="mt-3"><Toggle id="paused" checked={!s.plan.paused} onChange={(on) => act({ action: "pause", paused: !on }, on ? "Assistant resumed." : "Assistant paused.")} label="Assistant answers calls" /></div>}
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">1. Your assistant</h2>
        <Field label="Assistant name"><Input value={form.name} maxLength={40} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Language">
          <Segmented label="Language" value={form.language} onChange={(language) => setForm({ ...form, language })} options={[{ value: "hi", label: "Hindi" }, { value: "en", label: "English" }]} />
        </Field>
        <Field label="Voice" help="The phone voice. The browser test below uses a different voice engine, so it can sound a little different.">
          <Segmented label="Voice" value={form.voiceGender} onChange={(voiceGender) => setForm({ ...form, voiceGender })} options={[{ value: "female", label: "Woman" }, { value: "male", label: "Man" }]} />
          <p className="mt-1 text-xs text-ink-soft">{voices.find((v) => v.gender === form.voiceGender)?.label}</p>
        </Field>
        <Field label="First sentence (optional)" help="Leave empty for a standard greeting. The assistant always says it is an AI assistant if asked."><Input value={form.greeting} maxLength={300} onChange={(e) => setForm({ ...form, greeting: e.target.value })} /></Field>
        <Field label="Style"><Select value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })}><option value="friendly">Friendly</option><option value="professional">Professional</option><option value="short and direct">Short and direct</option></Select></Field>
        {KNOW.map(([k, label]) => (
          <Field key={k} label={label}><TextArea rows={2} maxLength={1500} value={form.knowledge[k] ?? ""} onChange={(e) => setForm({ ...form, knowledge: { ...form.knowledge, [k]: e.target.value } })} /></Field>
        ))}
        <Field label="Never say or discuss (optional)"><Input value={form.neverSay} maxLength={300} onChange={(e) => setForm({ ...form, neverSay: e.target.value })} /></Field>
        <Field label="Hand over to your team when… (optional)" help="The assistant takes the caller's name and number and says your team will call back. It cannot transfer calls yet."><Input value={form.handoff} maxLength={300} onChange={(e) => setForm({ ...form, handoff: e.target.value })} /></Field>
        <Toggle id="tr" checked={form.keepTranscripts} onChange={(keepTranscripts) => setForm({ ...form, keepTranscripts })} label="Keep written call transcripts (call audio is never kept)" />
        <Btn disabled={busy} onClick={() => act({ action: "save_assistant", ...form }, "Saved.")}>Save assistant</Btn>
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="font-semibold">2. Try it in your browser</h2>
        <Notice tone="blue">This is a practice chat in your browser, not a phone call. It shows how your assistant talks and what it knows. It is not a test of your phone number.</Notice>
        <Btn disabled={!s.assistant || busy} onClick={toggleTest}>
          {test === "off" ? <><Mic className="mr-2 inline size-4" aria-hidden />Start browser test</> : <><Square className="mr-2 inline size-4" aria-hidden />{test === "connecting" ? "Connecting… (tap to cancel)" : "Stop"}</>}
        </Btn>
        {!s.assistant && <p className="text-sm text-ink-soft">Save your assistant first.</p>}
        {test === "on" && <p className="text-sm">{live === "speaking" ? "The assistant is speaking…" : "Connected — listening. The assistant greets first; if you hear nothing, say “Hello”."}</p>}
        {dropped && <Notice tone="amber">The practice call stopped ({dropped === "mic" ? "the microphone is blocked — allow it in the browser" : dropped === "limit" ? "time limit reached" : dropped}). Try again.</Notice>}
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="font-semibold">3. Your phone number</h2>
        {s.number ? (
          <>
            <p className="text-sm"><b>{s.number.statusText}</b>{s.number.note ? ` — ${s.number.note}` : ""}</p>
            {s.number.kind === "forwarding" && <Forwarding number={s.number.number} />}
          </>
        ) : (
          <>
            <p className="text-sm text-ink-soft">The ibaxai team sets up the number with the phone company. This usually takes 1–2 working days and needs some details from you.</p>
            <Segmented label="Number" value={kind} onChange={setKind} options={[{ value: "new", label: "Get a new number" }, { value: "forwarding", label: "Forward my existing number" }]} />
            {kind === "forwarding" && (
              <>
                <Field label="Your current business number"><Input inputMode="tel" value={existing} onChange={(e) => setExisting(e.target.value)} placeholder="+91 …" /></Field>
                <Field label="Phone company (optional)"><Input value={carrier} maxLength={60} onChange={(e) => setCarrier(e.target.value)} /></Field>
              </>
            )}
            <Btn disabled={busy} onClick={() => act({ action: "request_number", kind, existingNumber: existing, carrier }, "Request sent. The ibaxai team will contact you.")}>Request my number</Btn>
          </>
        )}
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="font-semibold">4. Monthly package</h2>
        {s.paid ? (
          <p className="text-sm">{s.plan ? "Your package is active." : s.plans.length ? "Starting your package…" : "Payment received. The ibaxai team is still setting the package minutes — your package starts as soon as they are set."}</p>
        ) : (
          <><p className="text-sm text-ink-soft">Pay the monthly package to switch your assistant on.</p><BtnLink href="/app/services/voice/checkout"><PhoneCall className="mr-2 inline size-4" aria-hidden />Pay for the package</BtnLink></>
        )}
      </Card>
    </div>
  );
}

function Forwarding({ number }: { number: string | null }) {
  return (
    <div className="rounded-xl border p-3 text-sm">
      <p className="mb-1 flex items-center gap-2 font-medium"><PhoneForwarded className="size-4" aria-hidden />Forward your calls to {number ?? "your ibaxai number (shown here once it is ready)"}</p>
      <p>On most phones you dial: <b>**21*{number ?? "ibaxai number"}#</b> and press call (all calls), or <b>**67*…#</b> (when busy) and <b>**61*…#</b> (when unanswered). To stop forwarding dial <b>##21#</b>.</p>
      <p className="mt-1 text-ink-soft">Some phone companies use different codes. If it doesn&apos;t work, ask them to &quot;set call forwarding&quot; to this number. Forward only after the status above is Active.</p>
    </div>
  );
}
