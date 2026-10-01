"use client";

import { useState, type FormEvent } from "react";
import { LifeBuoy } from "lucide-react";
import { product } from "@/config/product";
import { helpSuggestions } from "@/lib/app/assistant";
import { audit, notify, nowIso, uid, updateWorkspace } from "@/lib/app/store";
import { useWorkspace } from "@/components/app/AppShell";
import { AskBar } from "@/components/app/AskBar";
import { Btn, Card, Field, Input, Notice, PageHeader, Pill, SectionTitle, Select, TextArea, relTime } from "@/components/app/ui";

const guides = [
  {
    q: "How do I activate a service?",
    steps: ["Open Services and pick the service.", "Choose monthly or annual and complete payment.", "Connect the account it needs (for example YouTube or WhatsApp).", "Check the business information and choose how it should behave.", "Run the test, then press Activate."],
  },
  {
    q: "How do I connect WhatsApp?",
    steps: ["Go to Settings → Connected accounts, or start WhatsApp AI Assistant.", "Press Connect next to WhatsApp Business.", "Sign in with Meta and choose the number customers message.", "Meta reviews new numbers — usually 1–3 days. We notify you when it's approved."],
  },
  {
    q: "Why is my automation paused or needs attention?",
    steps: ["Open Automations — the card tells you why.", "Paused: you (or a cancelled subscription) paused it. Press Resume.", "Needs attention: something is missing, like a disconnected account. Fix it and press Activate.", "Failed: open Logs to see the error, or ask us for help below."],
  },
  {
    q: "How do I approve content before it's published?",
    steps: ["When you set up Instagram, Facebook or YouTube, choose “Ask me before publishing”.", "New content shows as Needs approval in the Content Centre.", "Preview it, edit if you like, then press Approve."],
  },
  {
    q: "How do I cancel or change my plan?",
    steps: ["Open Billing.", "Switch between monthly and annual, upgrade to Digital Marketing, or cancel.", "A cancelled service keeps running until the end of the period you paid for."],
  },
];

export default function HelpPage() {
  const ws = useWorkspace();
  const [sent, setSent] = useState<string | null>(null);
  if (!ws) return null;
  const name = product.name;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const subject = String(f.get("subject")).trim();
    const message = String(f.get("message")).trim();
    if (!subject || !message) return;
    let number = "";
    updateWorkspace((w) => {
      number = `T-${2000 + w.tickets.length + 1}`;
      w.tickets.unshift({ id: uid(), number, subject: `${f.get("topic")}: ${subject}`, message, status: "open", createdAt: nowIso() });
      notify(w, { kind: "message", title: `Support ticket ${number} created`, detail: "A person from our team will reply by email.", href: "/app/help" });
      audit(w, `Opened support ticket ${number}`);
    });
    setSent(number);
    form.reset();
  }

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Help & Support" title={`Ask ${name}`} subtitle="Step-by-step help for anything in the app. If I can't solve it, a person will." />
      <AskBar name={name} examples={helpSuggestions} />

      <section>
        <SectionTitle>Guides</SectionTitle>
        <div className="space-y-2">
          {guides.map((g) => (
            <details key={g.q} className="glass group rounded-2xl p-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
                {g.q}
                <span className="text-fg-subtle transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-fg-muted">
                {g.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </details>
          ))}
        </div>
      </section>

      <section id="ticket" className="scroll-mt-20">
        <SectionTitle>Talk to a person</SectionTitle>
        <Card>
          {sent && (
            <Notice className="mb-4">
              Ticket {sent} created. Our support team will reply to {ws.business?.email || "your email"} — usually within one working day.
            </Notice>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Topic" htmlFor="t-topic">
                <Select id="t-topic" name="topic">
                  {["Setup help", "Account connection", "Billing", "Automation problem", "Content", "Something else"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Subject" htmlFor="t-subject" required>
                <Input id="t-subject" name="subject" required />
              </Field>
            </div>
            <Field label="What's happening?" htmlFor="t-message" required>
              <TextArea id="t-message" name="message" required />
            </Field>
            <Btn type="submit">
              <LifeBuoy className="size-4" aria-hidden /> Create support ticket
            </Btn>
          </form>
        </Card>
      </section>

      {ws.tickets.length > 0 && (
        <section>
          <SectionTitle>Your tickets</SectionTitle>
          <ul className="space-y-2">
            {ws.tickets.map((t) => (
              <li key={t.id} className="glass flex flex-wrap items-center gap-3 rounded-2xl p-4">
                <span className="font-mono text-xs text-fg-subtle">{t.number}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{t.subject}</span>
                <span className="text-xs text-fg-subtle">{relTime(t.createdAt)}</span>
                <Pill tone={t.status === "resolved" ? "green" : t.status === "in_progress" ? "blue" : "amber"}>{t.status === "open" ? "Open" : t.status === "in_progress" ? "In progress" : "Resolved"}</Pill>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
