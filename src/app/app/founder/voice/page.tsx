"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { cloudAuthHeader } from "@/lib/app/cloud";
import { Btn, Card, Input, Notice, PageHeader, Pill } from "@/components/app/ui";

type Num = { id: string; owner_id: string; kind: string; existing_number: string; carrier: string; number: string | null; provider_number_id: string | null; status: string; note: string; test_passed_at: string | null; created_at: string };
type Plan = { id: string; name: string; includedMinutes: number | null; overageInrPerMinute: number | null; hardCapMinutes: number | null; active: boolean };
type Overview = { numbers: Num[]; plans: Plan[]; problemEvents: { event_key: string; type: string; status: string; created_at: string }[]; subscriptions: unknown[]; calls30d: { duration_sec: number; cost_usd: number | null }[] };

async function post(body: Record<string, unknown>) {
  const res = await fetch("/api/voice/admin", { method: "POST", headers: { "content-type": "application/json", ...(await cloudAuthHeader()) }, body: JSON.stringify(body) }).catch(() => null);
  return { status: res?.status ?? 0, data: ((await res?.json().catch(() => null)) ?? {}) as Record<string, unknown> };
}

/** Founder only: number requests (attach, provider setup, test result) and the packages. Every action is checked on the server. */
export default function FounderVoice() {
  const [o, setO] = useState<Overview | null>(null);
  const [state, setState] = useState<"loading" | "denied" | "error" | "ready">("loading");
  const [msg, setMsg] = useState("");
  const [edit, setEdit] = useState<Record<string, { number: string; pid: string }>>({});
  const [plan, setPlan] = useState({ id: "standard", name: "Standard", includedMinutes: "", overageInrPerMinute: "", hardCapMinutes: "", active: false });

  const load = useCallback(async () => {
    const r = await post({ action: "overview" });
    if (r.status === 403) return setState("denied");
    if (!r.data.ok) return setState("error");
    const ov = r.data as unknown as Overview;
    setO(ov);
    const p = ov.plans[0];
    if (p) setPlan({ id: p.id, name: p.name, includedMinutes: String(p.includedMinutes ?? ""), overageInrPerMinute: String(p.overageInrPerMinute ?? ""), hardCapMinutes: String(p.hardCapMinutes ?? ""), active: p.active });
    setState("ready");
  }, []);
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const run = async (body: Record<string, unknown>) => {
    const r = await post(body);
    setMsg(r.data.ok ? "Done." : String(r.data.message ?? r.data.reason ?? "Failed"));
    await load();
  };
  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 pt-6 pb-16">
      <Link href="/app/founder" className="mb-5 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"><ArrowLeft className="size-4" aria-hidden /> Founder Console</Link>
      <PageHeader eyebrow="Founder" title="AI Voice" subtitle="Number requests and monthly packages." />
      {state === "denied" && <Notice tone="amber">This page is only for the ibaxai founder.</Notice>}
      {state === "error" && <Notice tone="amber">Couldn&apos;t load. Has supabase/migrations/0008_voice.sql been run?</Notice>}
      {msg && <Notice tone="blue" className="mb-4">{msg}</Notice>}
      {state === "ready" && o && (
        <div className="space-y-6">
          <Card className="space-y-3 p-5">
            <h2 className="font-semibold">Monthly package</h2>
            <p className="text-sm text-fg-muted">Set these from the real phone and provider costs. A package with no minutes cannot be switched on, and clients cannot start it.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm">Included minutes<Input inputMode="numeric" value={plan.includedMinutes} onChange={(e) => setPlan({ ...plan, includedMinutes: e.target.value })} /></label>
              <label className="text-sm">Extra minute price (₹, optional)<Input inputMode="decimal" value={plan.overageInrPerMinute} onChange={(e) => setPlan({ ...plan, overageInrPerMinute: e.target.value })} /></label>
              <label className="text-sm">Hard cap minutes (optional)<Input inputMode="numeric" value={plan.hardCapMinutes} onChange={(e) => setPlan({ ...plan, hardCapMinutes: e.target.value })} /></label>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={plan.active} onChange={(e) => setPlan({ ...plan, active: e.target.checked })} /> Open for clients</label>
            <Btn onClick={() => run({ action: "save_plan", id: plan.id, name: plan.name, includedMinutes: num(plan.includedMinutes), overageInrPerMinute: num(plan.overageInrPerMinute), hardCapMinutes: num(plan.hardCapMinutes), active: plan.active })}>Save package</Btn>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="font-semibold">Number requests ({o.numbers.length})</h2>
            {o.numbers.length === 0 && <p className="text-sm text-fg-muted">No requests yet.</p>}
            {o.numbers.map((n) => {
              const e = edit[n.id] ?? { number: n.number ?? "", pid: n.provider_number_id ?? "" };
              return (
                <div key={n.id} className="space-y-2 rounded-xl border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2"><Pill tone={n.status === "active" ? "green" : n.status === "failed" ? "red" : "amber"}>{n.status}</Pill><span>{n.kind === "forwarding" ? `Forwarding from ${n.existing_number} (${n.carrier || "carrier ?"})` : "New number"}</span><span className="text-xs text-fg-subtle">client {n.owner_id.slice(0, 8)}</span></div>
                  {n.note && <p className="text-fg-muted">{n.note}</p>}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input placeholder="ibaxai number +91…" value={e.number} onChange={(ev) => setEdit({ ...edit, [n.id]: { ...e, number: ev.target.value } })} />
                    <Input placeholder="Provider's number id" value={e.pid} onChange={(ev) => setEdit({ ...edit, [n.id]: { ...e, pid: ev.target.value } })} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Btn onClick={() => run({ action: "number", id: n.id, op: "attach", number: e.number, providerNumberId: e.pid })}>Save number</Btn>
                    <Btn onClick={() => run({ action: "number", id: n.id, op: "configure" })}>Set up with provider</Btn>
                    <Btn onClick={() => run({ action: "number", id: n.id, op: "test_passed" })}>Real test call passed → Active</Btn>
                    {(["awaiting_customer_info", "awaiting_verification", "configuration_in_progress", "failed"] as const).map((s) => (
                      <Btn key={s} onClick={() => run({ action: "number", id: n.id, op: "set_status", status: s })}>{s.replaceAll("_", " ")}</Btn>
                    ))}
                  </div>
                </div>
              );
            })}
          </Card>

          <Card className="p-5"><h2 className="font-semibold">Events needing a look ({o.problemEvents.length})</h2>
            <ul className="mt-2 text-sm text-fg-muted">{o.problemEvents.map((x) => <li key={x.event_key}>{x.status}: {x.event_key}</li>)}</ul>
          </Card>
        </div>
      )}
    </div>
  );
}
