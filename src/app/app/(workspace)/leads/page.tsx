"use client";

import { product } from "@/config/product";
import { useEffect, useState, type FormEvent } from "react";
import { MessageCircle, Plus, Sparkles, Star, X } from "lucide-react";
import { cloudEnabled, cloudFollowupAction } from "@/lib/app/cloud";
import { askForReview, askMessages, reviewsOn } from "@/lib/app/reviewRequests";
import { audit, logActivity, notify, nowIso, syncFollowups, syncSiteLeads, uid, updateWorkspace } from "@/lib/app/store";
import type { Lead, LeadStatus } from "@/lib/app/types";
import { useWorkspace } from "@/components/app/AppShell";
import { leadStatus } from "@/components/app/status";
import { Btn, Card, EmptyState, Field, Input, Notice, PageHeader, Pill, Segmented, Select, TextArea, relTime, withinDays } from "@/components/app/ui";

type Tab = "all" | LeadStatus | "returning";

const autoLabel: Record<NonNullable<Lead["auto"]>["state"], string> = {
  waiting: "following up",
  replied: "replied ✓",
  done: "no reply yet, give them a call",
  stopped: "stopped",
  failed: "couldn't reach this number on WhatsApp",
};

export default function LeadsPage() {
  const ws = useWorkspace();
  const [tab, setTab] = useState<Tab>("all");
  const [adding, setAdding] = useState(false);
  const [asking, setAsking] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    void syncSiteLeads().then(syncFollowups);
  }, []);
  if (!ws) return null;

  const followingUp = cloudEnabled && !ws.sample && ws.automations.some((a) => a.serviceId === "followup" && a.status === "active");

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

  // One tap: ask this customer for a Google review on WhatsApp.
  const canAsk = reviewsOn(ws);
  const digits = (p: string) => p.replace(/\D/g, "").slice(-10);
  const askedRecently = (phone: string) => (ws.reviewRequests ?? []).some((r) => r.status === "sent" && digits(r.phone) === digits(phone) && withinDays(r.at, 30));
  async function askReview(id: string, name: string, phone: string) {
    setAsking(id);
    const result = await askForReview(name, phone, "manual");
    setAsking(null);
    setNote(askMessages[result]);
  }

  function setStatus(id: string, status: LeadStatus) {
    updateWorkspace((w) => {
      const l = w.leads.find((x) => x.id === id);
      if (!l) return;
      l.status = status;
      if (status !== "follow_up") l.followUpAt = undefined;
      logActivity(w, { kind: "lead", title: `${l.name} marked ${leadStatus[status].label.toLowerCase()}`, href: "/app/leads" });
    });
    const lead = ws?.leads.find((x) => x.id === id);
    // Converted or lost: Lead Follow-up sends no more reminders.
    if (followingUp && lead?.phone && (status === "converted" || status === "lost")) void cloudFollowupAction("stop", { phone: lead.phone });
    // A new customer: Google Review Management asks them for a review (if the owner turned that on).
    const autoAsk = ws && reviewsOn(ws) && ws.automations.find((a) => a.serviceId === "reviews")?.config.requests !== false;
    if (autoAsk && lead?.phone && status === "converted" && lead.status !== "converted") void askForReview(lead.name, lead.phone, "lead");
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
    const lead: Lead = { id: uid(), name: g("name"), phone: g("phone"), email: g("email"), source: g("source") || "Added manually", interest: g("interest"), status: "new", returning: false, createdAt: nowIso(), notes: g("notes") };
    updateWorkspace((w) => {
      w.leads.unshift(lead);
      logActivity(w, { kind: "lead", title: `New lead — ${lead.name}`, detail: lead.interest, href: "/app/leads" });
      notify(w, { kind: "lead", title: `New lead: ${lead.name}`, detail: lead.interest || lead.source, href: "/app/leads" });
      audit(w, `Added lead ${lead.name}`);
    });
    setAdding(false);
    if (followingUp && lead.phone)
      void cloudFollowupAction("enroll", { phone: lead.phone, name: lead.name, interest: lead.interest, source: lead.source, leadRef: lead.id }).then(() => syncFollowups());
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
            <b className="text-fg">{due} lead{due > 1 ? "s" : ""} need follow-up today.</b>{" "}
            {followingUp ? "They replied or didn't answer the WhatsApp reminders, so give them a call." : `${product.assistantName} can message them for you once Lead Follow-up is active.`}
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      {note && (
        <Notice className="mb-4" tone={note.endsWith("✓") ? "ember" : "amber"}>
          {note}
        </Notice>
      )}

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
                  {l.auto && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-flow-soft">
                      <MessageCircle className="size-3" aria-hidden /> {product.assistantName} WhatsApp: {l.auto.sent} of 3 sent · {autoLabel[l.auto.state]}
                    </p>
                  )}
                </div>
                {canAsk && l.phone && (
                  <Btn
                    size="sm"
                    variant={askedRecently(l.phone) ? "subtle" : "ghost"}
                    disabled={asking === l.id || askedRecently(l.phone)}
                    onClick={() => askReview(l.id, l.name, l.phone!)}
                    aria-label={`Ask ${l.name} for a Google review`}
                  >
                    <Star className="size-3.5" aria-hidden /> {askedRecently(l.phone) ? "Review asked" : "Ask review"}
                  </Btn>
                )}
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
