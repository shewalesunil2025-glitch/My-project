"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CircleCheck, FlaskConical, Pause, Pencil, Play, Send } from "lucide-react";
import { product } from "@/config/product";
import { providerInfo, serviceById, type FieldDef, type ServiceDef } from "@/content/app/services";
import { contentIdea } from "@/lib/app/assistant";
import { activate, missingConnections, runTest, setAutomationStatus } from "@/lib/app/automation";
import { audit, nowIso, updateWorkspace } from "@/lib/app/store";
import type { Automation, Business, Workspace } from "@/lib/app/types";
import { useWorkspace } from "@/components/app/AppShell";
import { ConnectAccount } from "@/components/app/ConnectAccount";
import { automationStatus } from "@/components/app/status";
import { Btn, BtnLink, Card, EmptyState, Field, Icon, Input, LumiMark, Notice, Pill, Select, TextArea, Toggle, fmtDateTime } from "@/components/app/ui";
import { cn } from "@/lib/cn";

type StepId = "connect" | "info" | "configure" | "test" | "activate";
const stepLabels: Record<StepId, string> = {
  connect: "Connect account",
  info: "Business information",
  configure: "Configure",
  test: "Test",
  activate: "Approve & activate",
};

function stepsFor(svc: ServiceDef): StepId[] {
  return [...(svc.connect.length ? (["connect"] as const) : []), "info", ...(svc.configure.length ? (["configure"] as const) : []), "test", "activate"];
}

function initialValues(fields: FieldDef[], config: Automation["config"], business: Business | null) {
  const v: Record<string, string | boolean> = {};
  for (const f of fields) {
    v[f.key] = config[f.key] ?? (f.fromBusiness && business ? business[f.fromBusiness] : undefined) ?? f.default ?? (f.type === "toggle" ? false : f.type === "select" ? f.options![0] : "");
  }
  return v;
}

function FieldInput({ f, value, onChange }: { f: FieldDef; value: string | boolean; onChange: (v: string | boolean) => void }) {
  const id = `f-${f.key}`;
  if (f.type === "toggle") return <Toggle id={id} label={f.label} checked={!!value} onChange={onChange} />;
  return (
    <Field label={f.label} htmlFor={id} help={f.help} required={f.required}>
      {f.type === "textarea" ? (
        <TextArea id={id} value={String(value)} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : f.type === "select" ? (
        <Select id={id} value={String(value)} onChange={(e) => onChange(e.target.value)}>
          {f.options!.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Select>
      ) : (
        <Input id={id} type={f.type === "time" ? "time" : f.type === "phone" ? "tel" : "text"} value={String(value)} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}

/** Answer a test question the way the live assistant would, from the setup answers. */
function testAnswer(ws: Workspace, config: Automation["config"], question: string) {
  const q = question.toLowerCase();
  const b = ws.business!;
  const str = (k: string) => (typeof config[k] === "string" ? (config[k] as string) : "");
  if (/(hour|open|close|timing|when)/.test(q)) return `We're open ${str("hours") || b.hours || "— let me check our hours and get back to you"}.`;
  if (/(price|cost|how much|rate|charge|fee)/.test(q)) return str("prices") ? `Here are our prices:\n${str("prices")}` : "Let me check the exact price for you — can I take your number so the team can reply?";
  if (/(book|appointment|reserve|slot|table)/.test(q)) return `I can help you book! ${str("appointments") || "What day and time works for you?"}`;
  if (/(where|address|location|located)/.test(q)) return `You'll find us at ${b.address ? `${b.address}, ` : ""}${b.city}.`;
  const faqs = str("faqs").split(/\n(?=Q:)/i);
  for (const pair of faqs) {
    const [qq, aa] = pair.split(/\nA:/i);
    if (aa && qq.toLowerCase().split(/\W+/).filter((w) => w.length > 3).some((w) => q.includes(w))) return aa.trim();
  }
  return `${str("about") || b.description} Is there anything specific I can help you with?`;
}

function Wizard({ ws, a, svc, editing }: { ws: Workspace; a: Automation; svc: ServiceDef; editing: boolean }) {
  const router = useRouter();
  const all = stepsFor(svc);
  const steps = editing ? all.filter((s) => s === "info" || s === "configure") : all;
  const [i, setI] = useState(editing ? 0 : Math.min(a.setupStep, steps.length - 1));
  const [values, setValues] = useState(() => initialValues([...svc.info, ...svc.configure], a.config, ws.business));
  const [error, setError] = useState("");
  const [testQ, setTestQ] = useState("");
  const [testLog, setTestLog] = useState<{ q: string; a: string }[]>([]);
  const step = steps[i];
  const missing = missingConnections(ws, svc);
  const assistantName = ws.assistant?.name ?? product.name;

  function save(nextStep: number) {
    updateWorkspace((w) => {
      const x = w.automations.find((y) => y.id === a.id);
      if (!x) return;
      x.config = { ...x.config, ...values };
      if (!editing) x.setupStep = Math.max(x.setupStep, nextStep);
    });
  }

  function next() {
    setError("");
    if (step === "connect" && missing.length) return setError(`Connect ${missing.map((p) => providerInfo[p].name).join(" and ")} to continue.`);
    if (step === "info" || step === "configure") {
      const fields = step === "info" ? svc.info : svc.configure;
      const empty = fields.find((f) => f.required && !String(values[f.key] ?? "").trim());
      if (empty) return setError(`Please fill in “${empty.label}”.`);
    }
    if (step === "test" && !a.tested) return setError("Run the test first so you can see how it behaves.");
    if (editing && i === steps.length - 1) {
      save(0);
      updateWorkspace((w) => {
        const x = w.automations.find((y) => y.id === a.id);
        x?.logs.unshift({ at: nowIso(), level: "info", message: "Settings updated" });
        audit(w, `Updated ${svc.name} settings`);
      });
      router.replace(`/app/automations/${a.id}`);
      return;
    }
    save(i + 1);
    setI(i + 1);
  }

  function sendTest(e: FormEvent) {
    e.preventDefault();
    if (!testQ.trim()) return;
    setTestLog((l) => [...l, { q: testQ, a: testAnswer(ws, values, testQ) }]);
    setTestQ("");
    save(i);
    runTest(a.id);
  }

  const chatTest = ["whatsapp", "voice", "email"].includes(svc.id);
  const contentTest = ["youtube", "instagram", "facebook", "social", "digital-marketing"].includes(svc.id);

  return (
    <div className="mx-auto max-w-2xl">
      {!editing && (
        <ol className="mb-8 flex gap-1.5" aria-label="Setup steps">
          {steps.map((s, idx) => (
            <li key={s} className="flex-1">
              <span className={cn("block h-1 rounded-full", idx <= i ? "bg-flow" : "bg-white/10")} />
              <span className={cn("mt-2 hidden text-[0.7rem] sm:block", idx === i ? "text-fg" : "text-fg-subtle")}>{stepLabels[s]}</span>
            </li>
          ))}
        </ol>
      )}

      <h2 className="display text-2xl">{editing ? `Edit ${svc.name}` : stepLabels[step]}</h2>

      <div className="mt-5 space-y-4">
        {step === "connect" && (
          <>
            <p className="text-sm text-fg-muted">
              {svc.name} works through your own account. You sign in with the platform and choose what {assistantName} may do — you can disconnect at any time.
            </p>
            {svc.connect.map((p) => (
              <ConnectAccount key={p} ws={ws} provider={p} />
            ))}
          </>
        )}

        {step === "info" && (
          <>
            {!editing && <p className="text-sm text-fg-muted">I&apos;ve filled in what I already know about {ws.business?.name}. Check it and add anything missing.</p>}
            {svc.info.map((f) => (
              <FieldInput key={f.key} f={f} value={values[f.key]} onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))} />
            ))}
          </>
        )}

        {step === "configure" && (
          <>
            {svc.configure.map((f) => (
              <FieldInput key={f.key} f={f} value={values[f.key]} onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))} />
            ))}
          </>
        )}

        {step === "test" && (
          <>
            {chatTest && (
              <Card>
                <p className="mb-4 text-sm text-fg-muted">Ask a question the way a customer would. {assistantName} answers from what you just set up.</p>
                <div className="space-y-3">
                  {testLog.map((t, k) => (
                    <div key={k} className="space-y-2">
                      <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-flow px-3.5 py-2 text-sm text-white">{t.q}</p>
                      <div className="flex items-start gap-2">
                        <LumiMark className="size-7 shrink-0" glow={false} />
                        <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/[0.07] px-3.5 py-2 text-sm whitespace-pre-line">{t.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={sendTest} className="mt-4 flex gap-2">
                  <label htmlFor="test-q" className="sr-only">
                    Test question
                  </label>
                  <Input id="test-q" value={testQ} onChange={(e) => setTestQ(e.target.value)} placeholder="What time do you open on Sunday?" />
                  <Btn type="submit" aria-label="Send test question" disabled={!testQ.trim()}>
                    <Send className="size-4" aria-hidden />
                  </Btn>
                </form>
              </Card>
            )}
            {contentTest && (
              <Card>
                <p className="mb-3 text-sm text-fg-muted">Here&apos;s a sample of what {assistantName} will create:</p>
                {(() => {
                  const idea = contentIdea(ws, svc.id === "youtube" ? "youtube" : svc.id === "facebook" ? "facebook" : "instagram");
                  return (
                    <div className="rounded-xl border border-white/10 bg-ink-900 p-4">
                      <p className="font-semibold">{idea.title}</p>
                      <p className="mt-2 text-sm whitespace-pre-line text-fg-muted">{idea.body}</p>
                      {idea.hashtags && <p className="mt-2 text-xs text-sky-300">{idea.hashtags}</p>}
                      <p className="mt-3 text-xs text-fg-subtle">
                        {String(values.frequency ?? "")} {values.time ? `at ${values.time}` : ""} · {String(values.approval ?? "")}
                      </p>
                    </div>
                  );
                })()}
                <Btn className="mt-4" variant={a.tested ? "ghost" : "primary"} onClick={() => (save(i), runTest(a.id))}>
                  {a.tested ? <Check className="size-4" aria-hidden /> : <FlaskConical className="size-4" aria-hidden />} {a.tested ? "Looks good" : "Approve this sample"}
                </Btn>
              </Card>
            )}
            {svc.id === "reviews" && (
              <Card>
                <p className="mb-3 text-sm text-fg-muted">Example — how a suggested reply looks (this review is an example, not a real one):</p>
                <div className="rounded-xl border border-white/10 bg-ink-900 p-4 text-sm">
                  <p className="text-amber-200">★★★★☆</p>
                  <p className="mt-1">“Great service, a little busy on Saturday.”</p>
                  <p className="mt-3 text-xs text-fg-subtle">Suggested reply</p>
                  <p className="mt-1 text-fg-muted">Thank you for visiting {ws.business?.name}! Saturdays are popular — booking ahead helps us have everything ready for you. Hope to see you again soon.</p>
                </div>
                <Btn className="mt-4" variant={a.tested ? "ghost" : "primary"} onClick={() => (save(i), runTest(a.id))}>
                  {a.tested ? <Check className="size-4" aria-hidden /> : <FlaskConical className="size-4" aria-hidden />} {a.tested ? "Looks good" : "Approve this style"}
                </Btn>
              </Card>
            )}
            {!chatTest && !contentTest && svc.id !== "reviews" && (
              <Card>
                <p className="text-sm text-fg-muted">{assistantName} checks that everything needed is in place:</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {[...svc.info, ...svc.configure].map((f) => (
                    <li key={f.key} className="flex gap-2">
                      <CircleCheck className={cn("mt-0.5 size-4 shrink-0", String(values[f.key] ?? "") ? "text-emerald-300" : "text-fg-subtle")} aria-hidden />
                      <span>
                        {f.label}: <span className="text-fg-muted">{typeof values[f.key] === "boolean" ? (values[f.key] ? "Yes" : "No") : String(values[f.key] || "—")}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <Btn className="mt-4" variant={a.tested ? "ghost" : "primary"} onClick={() => (save(i), runTest(a.id))}>
                  {a.tested ? <Check className="size-4" aria-hidden /> : <FlaskConical className="size-4" aria-hidden />} {a.tested ? "Check passed" : "Run check"}
                </Btn>
              </Card>
            )}
            {a.tested && <p className="text-sm text-emerald-300">✓ Test passed</p>}
          </>
        )}

        {step === "activate" && (
          <>
            <Card>
              <p className="text-sm font-semibold">Ready to go</p>
              <ul className="mt-3 space-y-2 text-sm text-fg-muted">
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 text-emerald-300" aria-hidden /> Payment confirmed
                </li>
                {svc.connect.map((p) => (
                  <li key={p} className="flex gap-2">
                    <Check className={cn("mt-0.5 size-4", ws.connections[p] ? "text-emerald-300" : "text-fg-subtle")} aria-hidden /> {providerInfo[p].name} {ws.connections[p] ? "connected" : "not connected"}
                  </li>
                ))}
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 text-emerald-300" aria-hidden /> Business information added
                </li>
                <li className="flex gap-2">
                  <Check className={cn("mt-0.5 size-4", a.tested ? "text-emerald-300" : "text-fg-subtle")} aria-hidden /> Test {a.tested ? "passed" : "not run"}
                </li>
              </ul>
            </Card>
            {svc.approvalNote && <Notice tone="blue">{svc.approvalNote}</Notice>}
            {product.previewMode && <Notice tone="amber">Preview mode: activation is simulated on this device. Connected to the backend, this step starts the real automation.</Notice>}
          </>
        )}
      </div>

      {error && (
        <Notice tone="amber" className="mt-5">
          {error}
        </Notice>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Btn variant="ghost" onClick={() => (i === 0 ? router.push(editing ? `/app/automations/${a.id}` : "/app/automations") : setI(i - 1))}>
          <ArrowLeft className="size-4" aria-hidden /> {i === 0 ? (editing ? "Cancel" : "Later") : "Back"}
        </Btn>
        {step === "activate" ? (
          <Btn
            size="lg"
            onClick={() => {
              activate(a.id);
              router.replace(`/app/automations/${a.id}?activated=1`);
            }}
          >
            <Play className="size-4" aria-hidden /> Activate
          </Btn>
        ) : (
          <Btn onClick={next}>
            {editing && i === steps.length - 1 ? "Save changes" : "Continue"} <ArrowRight className="size-4" aria-hidden />
          </Btn>
        )}
      </div>
    </div>
  );
}

function Detail({ ws, a, svc }: { ws: Workspace; a: Automation; svc: ServiceDef }) {
  const params = useSearchParams();
  const st = automationStatus[a.status];
  const fields = [...svc.info, ...svc.configure];
  return (
    <div className="space-y-6">
      {params.get("activated") && (
        <Notice className="flex items-center gap-2">
          <CircleCheck className="size-4" aria-hidden /> {svc.name} is active. {a.note ?? `${ws.assistant?.name} is on it.`}
        </Notice>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={st.tone}>{st.label}</Pill>
        {a.lastRunAt && <span className="text-xs text-fg-subtle">Last run {fmtDateTime(a.lastRunAt)}</span>}
      </div>
      {a.note && !params.get("activated") && <Notice tone={a.status === "attention" || a.status === "failed" ? "amber" : "blue"}>{a.note}</Notice>}

      <div className="flex flex-wrap gap-2">
        {a.status === "active" || a.status === "scheduled" ? (
          <Btn variant="ghost" onClick={() => setAutomationStatus(a.id, "paused", "Paused")}>
            <Pause className="size-4" aria-hidden /> Pause
          </Btn>
        ) : (
          <Btn
            onClick={() => {
              if (missingConnections(ws, svc).length) return;
              setAutomationStatus(a.id, "active", a.status === "paused" ? "Resumed" : "Activated");
            }}
            disabled={missingConnections(ws, svc).length > 0}
          >
            <Play className="size-4" aria-hidden /> {a.status === "paused" ? "Resume" : "Activate"}
          </Btn>
        )}
        <BtnLink href={`/app/automations/${a.id}?edit=1`} variant="ghost">
          <Pencil className="size-4" aria-hidden /> Edit & schedule
        </BtnLink>
        <Btn variant="ghost" onClick={() => runTest(a.id)}>
          <FlaskConical className="size-4" aria-hidden /> Test
        </Btn>
      </div>

      {missingConnections(ws, svc).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Reconnect to continue</p>
          {missingConnections(ws, svc).map((p) => (
            <ConnectAccount key={p} ws={ws} provider={p} />
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Settings</h2>
          <dl className="space-y-2.5 text-sm">
            {fields.map((f) => (
              <div key={f.key}>
                <dt className="text-xs text-fg-subtle">{f.label}</dt>
                <dd className="whitespace-pre-line text-fg-muted">{typeof a.config[f.key] === "boolean" ? (a.config[f.key] ? "Yes" : "No") : String(a.config[f.key] || "—")}</dd>
              </div>
            ))}
            {svc.connect.map((p) => (
              <div key={p}>
                <dt className="text-xs text-fg-subtle">{providerInfo[p].name}</dt>
                <dd className="text-fg-muted">{ws.connections[p]?.account ?? "Not connected"}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Logs</h2>
          <ul className="space-y-2.5">
            {a.logs.slice(0, 20).map((l, k) => (
              <li key={k} className="flex gap-3 text-sm">
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    l.level === "success" ? "bg-emerald-400" : l.level === "warning" ? "bg-amber-400" : l.level === "error" ? "bg-red-400" : "bg-sky-400",
                  )}
                  aria-hidden
                />
                <span className="flex-1">{l.message}</span>
                <span className="shrink-0 text-xs text-fg-subtle">{fmtDateTime(l.at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function AutomationPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const ws = useWorkspace();
  if (!ws) return null;
  const a = ws.automations.find((x) => x.id === id);
  const svc = a && serviceById(a.serviceId);
  if (!a || !svc) return <EmptyState title="Automation not found" action={<BtnLink href="/app/automations">All automations</BtnLink>} />;
  const editing = params.get("edit") === "1" && a.status !== "setup";

  return (
    <div>
      <Link href="/app/automations" className="mb-5 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> Automation Control Centre
      </Link>
      <div className="mb-6 flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-flow/12 text-flow-soft">
          <Icon name={svc.icon} className="size-6" />
        </span>
        <div>
          <h1 className="display text-2xl">{svc.name}</h1>
          {a.status === "setup" && <p className="text-sm text-fg-muted">{params.get("paid") ? "Payment confirmed. Let's activate your service." : "Let's finish setting this up."}</p>}
        </div>
      </div>
      {a.status === "setup" || editing ? <Wizard ws={ws} a={a} svc={svc} editing={editing} /> : <Detail ws={ws} a={a} svc={svc} />}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <AutomationPage />
    </Suspense>
  );
}
