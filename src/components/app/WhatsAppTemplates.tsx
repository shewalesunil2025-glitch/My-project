"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BadgeCheck, FileText, Send } from "lucide-react";
import { createTemplate, listTemplates, officialStatus, officialWhatsAppAvailable, sendTemplate, type WaTemplate } from "@/lib/app/metaSignup";
import { Btn, Field, Input, Notice, Spinner } from "./ui";

/**
 * For a number linked through Meta's official WhatsApp Cloud API: shows it as official and lets
 * the owner create message templates (Meta reviews each one) and send an approved one. Templates
 * are what start a chat, or follow up, after the 24 hours Meta allows for free replies.
 */

const statusTone: Record<string, string> = {
  APPROVED: "text-emerald-300",
  PENDING: "text-amber-200",
  REJECTED: "text-red-300",
};
const area = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm placeholder:text-fg-subtle focus:border-flow/50 focus:outline-none";

export function WhatsAppTemplates() {
  const [official, setOfficial] = useState<{ number: string; name: string } | null>(null);
  const [list, setList] = useState<WaTemplate[] | null>(null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ember" | "amber"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [sendTo, setSendTo] = useState<WaTemplate | null>(null);

  useEffect(() => {
    let live = true;
    // Only numbers linked through Meta have templates; the server says which (and none before setup).
    if (officialWhatsAppAvailable()) void officialStatus().then((links) => live && setOfficial(links[0] ?? null));
    return () => {
      live = false;
    };
  }, []);

  async function refresh() {
    const r = await listTemplates();
    setList(r.ok ? (r.templates ?? []) : []);
    if (!r.ok) setMsg({ tone: "amber", text: r.message || "Couldn't load templates from Meta." });
  }

  useEffect(() => {
    if (!open || list) return;
    let live = true;
    void listTemplates().then((r) => {
      if (!live) return;
      setList(r.ok ? (r.templates ?? []) : []);
      if (!r.ok) setMsg({ tone: "amber", text: r.message || "Couldn't load templates from Meta." });
    });
    return () => {
      live = false;
    };
  }, [open, list]);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const form = e.currentTarget;
    setBusy(true);
    setMsg(null);
    const r = await createTemplate({
      name: String(f.get("name") ?? ""),
      text: String(f.get("text") ?? ""),
      category: String(f.get("category") ?? "UTILITY"),
      language: String(f.get("language") ?? "en"),
      examples: String(f.get("examples") ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    });
    setBusy(false);
    if (!r.ok) return setMsg({ tone: "amber", text: r.message || "Meta didn't accept this template. Check the name and text." });
    form.reset();
    setMsg({ tone: "ember", text: "Template sent to Meta for review. It is usually approved within a few minutes." });
    void refresh();
  }

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sendTo) return;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setMsg(null);
    const r = await sendTemplate({
      name: sendTo.name,
      language: sendTo.language,
      to: String(f.get("to") ?? ""),
      params: String(f.get("params") ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    });
    setBusy(false);
    setMsg(r.ok ? { tone: "ember", text: "Message sent on WhatsApp." } : { tone: "amber", text: r.message || "Meta couldn't send this message." });
    if (r.ok) setSendTo(null);
  }

  if (!official) return null;

  return (
    <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-4">
      <p className="flex items-center gap-1.5 text-xs text-fg-muted">
        <BadgeCheck className="size-3.5 text-flow" aria-hidden /> Official WhatsApp (Meta){official.name ? ` · ${official.name}` : ""}
      </p>
      {!open ? (
        <Btn size="sm" variant="ghost" onClick={() => setOpen(true)}>
          <FileText className="size-3.5" aria-hidden /> Message templates
        </Btn>
      ) : (
        <div className="space-y-4">
          {list === null ? (
            <p className="flex items-center gap-2 text-xs text-fg-subtle">
              <Spinner className="size-3" /> Loading templates…
            </p>
          ) : list.length === 0 ? (
            <p className="text-xs text-fg-subtle">No templates yet. Create your first one below.</p>
          ) : (
            <ul className="space-y-2">
              {list.map((t) => (
                <li key={`${t.name}-${t.language}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{t.name}</p>
                    <span className={`shrink-0 text-[0.65rem] font-semibold tracking-wide uppercase ${statusTone[t.status] ?? "text-fg-muted"}`}>{t.status.toLowerCase()}</span>
                  </div>
                  <p className="mt-1 text-xs text-fg-muted">
                    {t.category.toLowerCase()} · {t.language}
                  </p>
                  <p className="mt-1.5 text-xs whitespace-pre-line text-fg-muted">{t.body}</p>
                  {t.status === "APPROVED" && (
                    <Btn size="sm" variant="ghost" className="mt-2" onClick={() => setSendTo(t)}>
                      <Send className="size-3.5" aria-hidden /> Send
                    </Btn>
                  )}
                </li>
              ))}
            </ul>
          )}

          {sendTo && (
            <form onSubmit={send} className="space-y-2 rounded-xl border border-flow/25 bg-flow/[0.05] p-3">
              <p className="text-xs font-semibold">Send “{sendTo.name}”</p>
              <Field label="To (WhatsApp number with country code)" htmlFor="tpl-to">
                <Input id="tpl-to" name="to" inputMode="tel" placeholder="+91 98765 43210" required />
              </Field>
              {/\{\{1\}\}/.test(sendTo.body) && (
                <Field label="Details for {{1}}, {{2}} … (comma separated)" htmlFor="tpl-params">
                  <Input id="tpl-params" name="params" placeholder="Ravi, 25 October" />
                </Field>
              )}
              <div className="flex gap-2">
                <Btn size="sm" type="submit" disabled={busy}>
                  {busy ? <Spinner /> : "Send now"}
                </Btn>
                <Btn size="sm" variant="ghost" onClick={() => setSendTo(null)}>
                  Cancel
                </Btn>
              </div>
            </form>
          )}

          <form onSubmit={create} className="space-y-2">
            <p className="text-xs font-semibold">New template</p>
            <Field label="Name (small letters and _)" htmlFor="tpl-name">
              <Input id="tpl-name" name="name" placeholder="appointment_reminder" required maxLength={60} />
            </Field>
            <Field label="Message" htmlFor="tpl-text" help="Use {{1}}, {{2}} for details that change, like the customer's name or a date.">
              <textarea id="tpl-text" name="text" rows={3} maxLength={1024} required className={area} placeholder="Hi {{1}}, this is a reminder for your appointment on {{2}}. Reply here if you need to change it." />
            </Field>
            <Field label="Example details (comma separated)" htmlFor="tpl-ex">
              <Input id="tpl-ex" name="examples" placeholder="Ravi, 25 October" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Type" htmlFor="tpl-cat">
                <select id="tpl-cat" name="category" className={area} defaultValue="UTILITY">
                  <option value="UTILITY">Update / reminder</option>
                  <option value="MARKETING">Offer / promotion</option>
                </select>
              </Field>
              <Field label="Language" htmlFor="tpl-lang">
                <select id="tpl-lang" name="language" className={area} defaultValue="en">
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="mr">Marathi</option>
                  <option value="gu">Gujarati</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                  <option value="kn">Kannada</option>
                  <option value="ml">Malayalam</option>
                  <option value="bn">Bengali</option>
                  <option value="pa">Punjabi</option>
                </select>
              </Field>
            </div>
            <Btn size="sm" type="submit" disabled={busy}>
              {busy ? <Spinner /> : "Submit to Meta"}
            </Btn>
          </form>
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        </div>
      )}
    </div>
  );
}
