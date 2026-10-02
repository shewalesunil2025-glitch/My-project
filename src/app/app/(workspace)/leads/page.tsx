"use client";

import { product } from "@/config/product";
import { useState, type FormEvent } from "react";
import { Plus, Sparkles, X } from "lucide-react";
import { audit, logActivity, notify, nowIso, uid, updateWorkspace } from "@/lib/app/store";
import type { Lead, LeadStatus } from "@/lib/app/types";
import { useWorkspace } from "@/components/app/AppShell";
import { leadStatus } from "@/components/app/status";
import { Btn, Card, EmptyState, Field, Input, Notice, PageHeader, Pill, Segmented, Select, TextArea, relTime } from "@/components/app/ui";

type Tab = "all" | LeadStatus | "returning";

export default function LeadsPage() {
  const ws = useWorkspace();
  const [tab, setTab] = useState<Tab>("all");
  const [adding, setAdding] = useState(false);
  if (!ws) return null;

  const count = (s: LeadStatus) => ws.leads.filter((l) => l.status === s).length;
  const tabs: { value: Tab; label: string }[] = [
    { value: "all", label: `All ${ws.leads.length}` },
    { value: "new", label: `New ${count("new")}` },
    { value: "contacted", label: `Contacted ${count("contacted")}` },
    { value: "follow_up", label: `Follow-up ${count("follow_up")}` },
    { value: "converted", label: `Converted ${count("converted")}` },
    { value: "lost", label: `Lost ${count("lost")}` },
    { value: "returning", label: `Returning ${ws.leads.filter((l) => l.returning).length}` },
  ];
  const list = ws.leads.filter((l) => tab === "all" || (tab === "returning" ? l.returning : l.status === tab));
  const due = ws.leads.filter((l) => l.status === "follow_up").length;

  function setStatus(id: string, status: LeadStatus) {
    updateWorkspace((w) => {
      const l = w.leads.find((x) => x.id === id);
      if (!l) return;
      l.status = status;
      if (status !== "follow_up") l.followUpAt = undefined;
      logActivity(w, { kind: "lead", title: `${l.name} marked ${leadStatus[status].label.toLowerCase()}`, href: "/app/leads" });
    });
  }

  function update(id: string, fn: (l: Lead) => void) {
    updateWorkspace((w) => {
      const l = w.leads.find((x) => x.id === id);
      if (l) fn(l);
    });
  }

  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    if (!g("name")) return;
    updateWorkspace((w) => {
      const lead: Lead = { id: uid(), name: g("name"), phone: g("phone"), email: g("email"), source: g("source") || "Added manually", interest: g("interest"), status: "new", returning: false, createdAt: nowIso(), notes: g("notes") };
      w.leads.unshift(lead);
      logActivity(w, { kind: "lead", title: `New lead — ${lead.name}`, detail: lead.interest, href: "/app/leads" });
      notify(w, { kind: "lead", title: `New lead: ${lead.name}`, detail: lead.interest || lead.source, href: "/app/leads" });
      audit(w, `Added lead ${lead.name}`);
    });
    setAdding(false);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Leads & Customers"
        title="Leads"
        subtitle="Every enquiry from calls, WhatsApp, social media, email and your website."
        action={
          <Btn size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden /> Add lead
          </Btn>
        }
      />
      {due > 0 && (
        <Notice className="mb-5 flex items-center gap-2">
          <Sparkles className="size-4 shrink-0" aria-hidden />
          <span>
            <b className="text-fg">{due} lead{due > 1 ? "s" : ""} need follow-up today.</b> {product.assistantName} can message them for you once Lead Follow-up is active.
          </span>
        </Notice>
      )}

      {adding && (
        <Card className="mb-6">
          <form onSubmit={add} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">New lead</h2>
              <button type="button" onClick={() => setAdding(false)} aria-label="Close" className="text-fg-muted hover:text-fg">
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="l-name" required>
                <Input id="l-name" name="name" required />
              </Field>
              <Field label="Interested in" htmlFor="l-interest">
                <Input id="l-interest" name="interest" />
              </Field>
              <Field label="Phone" htmlFor="l-phone">
                <Input id="l-phone" name="phone" type="tel" />
              </Field>
              <Field label="Email" htmlFor="l-email">
                <Input id="l-email" name="email" type="email" />
              </Field>
              <Field label="Source" htmlFor="l-source">
                <Select id="l-source" name="source">
                  {["Walk-in", "Phone call", "WhatsApp", "Instagram", "Facebook", "Website", "Email", "Referral", "Other"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Notes" htmlFor="l-notes">
              <TextArea id="l-notes" name="notes" className="min-h-16" />
            </Field>
            <Btn type="submit">Save lead</Btn>
          </form>
        </Card>
      )}

      <div className="mb-5">
        <Segmented label="Filter leads" value={tab} onChange={setTab} options={tabs} />
      </div>

      {list.length === 0 ? (
        <EmptyState title="No leads here">New enquiries from every channel land here automatically.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {list.map((l) => (
            <li key={l.id} className="glass rounded-2xl p-4">
              <div className="flex flex-wrap items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/[0.07] font-semibold">{l.name.charAt(0)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {l.name} {l.returning && <Pill tone="blue">Returning</Pill>}
                  </p>
                  <p className="text-sm text-fg-muted">{l.interest || "—"}</p>
                  <p className="mt-1 text-xs text-fg-subtle">
                    {l.source} · {relTime(l.createdAt)} {l.phone && `· ${l.phone}`} {l.email && `· ${l.email}`}
                    {!l.phone && !l.email && <span className="text-amber-200"> · no contact details</span>}
                  </p>
                </div>
                <label className="sr-only" htmlFor={`st-${l.id}`}>
                  Status for {l.name}
                </label>
                <Select id={`st-${l.id}`} value={l.status} onChange={(e) => setStatus(l.id, e.target.value as LeadStatus)} className="w-auto py-1.5 text-xs">
                  {(Object.keys(leadStatus) as LeadStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {leadStatus[s].label}
                    </option>
                  ))}
                </Select>
              </div>
              {!l.phone && !l.email && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
                  <label htmlFor={`ph-${l.id}`} className="sr-only">
                    Add phone for {l.name}
                  </label>
                  <Input
                    id={`ph-${l.id}`}
                    placeholder="Add phone number"
                    type="tel"
                    className="max-w-56 py-1.5 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) update(l.id, (x) => void (x.phone = e.currentTarget.value.trim()));
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
