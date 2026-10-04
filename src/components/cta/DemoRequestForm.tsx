"use client";

import { useState, type FormEvent } from "react";
import { Check, Loader2, Mail, MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/cn";
import { leadMessage, submitLead, validateLead, whatsappLink, type LeadRequest } from "@/lib/leads";
import { siteConfig } from "@/config/site";

const interests = [
  "IBAX AI — early access",
  "Website",
  "AI Voice Assistant",
  "WhatsApp Automation",
  "Customer Support",
  "Lead Follow-up",
  "Instagram · Facebook · YouTube",
  "Email Automation",
  "Google Review Management",
  "Digital Marketing",
];

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string; lead?: LeadRequest };

const field =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[0.95rem] text-fg placeholder:text-fg-subtle " +
  "transition-colors focus:border-flow/60 focus:bg-white/[0.05] focus:outline-none";

export function DemoRequestForm({ defaultInterest = "", className }: { defaultInterest?: string; className?: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const options = defaultInterest && !interests.includes(defaultInterest) ? [defaultInterest, ...interests] : interests;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const { lead, error } = validateLead(data);
    if (!lead) {
      setStatus({ kind: "error", message: error ?? "Please check the form." });
      return;
    }
    setStatus({ kind: "submitting" });
    const res = await submitLead(lead);
    if (res.ok) setStatus({ kind: "success" });
    else setStatus({ kind: "error", message: res.message, lead });
  }

  if (status.kind === "success") {
    return (
      <div className={cn("rounded-2xl border border-live/25 bg-live/5 p-6", className)} role="status">
        <div className="mb-3 grid size-10 place-items-center rounded-full bg-live/15 text-live">
          <Check className="size-5" aria-hidden />
        </div>
        <p className="text-lg font-medium">Request received.</p>
        <p className="mt-1 text-fg-muted">We&apos;ll reach out within 24 hours to schedule your free call.</p>
        <ContactLinks className="mt-5" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={cn("grid gap-3", className)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-sm text-fg-muted">Name</span>
          <input name="name" required autoComplete="name" className={field} placeholder="Your name" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm text-fg-muted">Work email</span>
          <input name="email" type="email" required autoComplete="email" className={field} placeholder="you@company.com" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm text-fg-muted">
            Phone / WhatsApp <span className="text-fg-subtle">(optional)</span>
          </span>
          <input name="phone" type="tel" autoComplete="tel" className={field} placeholder="+91 …" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm text-fg-muted">Business</span>
          <input name="business" autoComplete="organization" className={field} placeholder="Business name" />
        </label>
      </div>
      <label className="grid gap-1.5">
        <span className="text-sm text-fg-muted">I&apos;m interested in</span>
        <select name="interest" defaultValue={defaultInterest || interests[0]} className={cn(field, "appearance-none")}>
          {options.map((i) => (
            <option key={i} value={i} className="bg-ink-850">
              {i}
            </option>
          ))}
        </select>
      </label>

      <div aria-live="polite" className="min-h-0">
        {status.kind === "error" && (
          <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-sm text-amber-100">
            <p>{status.message}</p>
            {status.lead && (
              <a
                href={whatsappLink(leadMessage(status.lead))}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-2 font-medium text-ink-950"
              >
                <MessageCircle className="size-4" aria-hidden /> Send it on WhatsApp instead
              </a>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={status.kind === "submitting"}
        className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-fg font-medium text-ink-950 transition-colors hover:bg-white disabled:opacity-60"
      >
        {status.kind === "submitting" && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {status.kind === "submitting" ? "Sending…" : "Request my demo"}
      </button>
      <p className="text-center text-xs text-fg-subtle">Free 30-minute call · Proposal within 24 hours · No commitment.</p>
      <ContactLinks className="mt-2 justify-center border-t border-white/[0.07] pt-4" />
    </form>
  );
}

/** Direct ways to reach the owner: email, phone and WhatsApp. */
export function ContactLinks({ className }: { className?: string }) {
  const item = "inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-flow";
  return (
    <div className={cn("flex flex-wrap gap-x-5 gap-y-2", className)}>
      <a href={`mailto:${siteConfig.email}`} className={item}>
        <Mail className="size-4" aria-hidden /> {siteConfig.email}
      </a>
      <a href={`tel:${siteConfig.phone}`} className={item}>
        <Phone className="size-4" aria-hidden /> {siteConfig.phoneDisplay}
      </a>
      <a href={whatsappLink(`Hi ${siteConfig.name}, I'd like to know more.`)} target="_blank" rel="noopener noreferrer" className={item}>
        <MessageCircle className="size-4" aria-hidden /> WhatsApp
      </a>
    </div>
  );
}
