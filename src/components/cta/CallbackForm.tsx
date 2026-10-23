"use client";

import { useState, type FormEvent } from "react";
import { Check, Loader2, PhoneCall, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/config/site";
import { submitCallback, validateCallback } from "@/lib/leads";

/**
 * "Call me back" inside the IBAX chat (website and app): the visitor leaves their name and mobile
 * number, the owner gets an email and calls them. Our own number is never shown.
 */

const field = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:border-flow/60 focus:outline-none";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "done" } | { kind: "error"; message: string };

export function CallbackForm({
  from,
  defaults,
  onClose,
  className,
}: {
  from: "website" | "app";
  defaults?: { name?: string; phone?: string; email?: string };
  onClose: () => void;
  className?: string;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { req, error } = validateCallback({ ...Object.fromEntries(new FormData(e.currentTarget)), from });
    if (!req) return setStatus({ kind: "error", message: error ?? "Please check the form." });
    setStatus({ kind: "sending" });
    const res = await submitCallback(req);
    setStatus(
      res.ok
        ? { kind: "done" }
        : { kind: "error", message: res.reason === "not_configured" ? `Call-back isn't switched on yet. Please email ${siteConfig.email}.` : res.message },
    );
  }

  return (
    <div className={cn("relative mx-3 mb-2 rounded-2xl border border-flow/30 bg-flow/[0.06] p-3", className)}>
      <button type="button" onClick={onClose} aria-label="Close" className="absolute top-2 right-2 grid size-7 place-items-center rounded-full text-fg-subtle hover:bg-white/[0.06] hover:text-fg">
        <X className="size-4" aria-hidden />
      </button>
      {status.kind === "done" ? (
        <div role="status" className="flex items-start gap-2.5 pr-6">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-flow/15 text-flow">
            <Check className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold">Request received</p>
            <p className="text-xs text-fg-muted">Our team will call you back within 24 hours.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="grid gap-2">
          <p className="flex items-center gap-1.5 pr-6 text-sm font-semibold">
            <PhoneCall className="size-4 text-flow" aria-hidden /> Get a call back
          </p>
          <p className="-mt-1 text-xs text-fg-muted">Leave your number and our team will call you.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input name="name" required autoComplete="name" defaultValue={defaults?.name} placeholder="Your name" aria-label="Your name" className={field} />
            <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" defaultValue={defaults?.phone} placeholder="Mobile number (+91 …)" aria-label="Mobile number" className={field} />
          </div>
          <input name="email" type="email" autoComplete="email" defaultValue={defaults?.email} placeholder="Email (optional)" aria-label="Email (optional)" className={field} />
          <textarea name="message" rows={2} maxLength={1000} placeholder="What do you need help with? (optional)" aria-label="What do you need help with?" className={cn(field, "resize-none")} />
          {status.kind === "error" && <p className="text-xs text-amber-200">{status.message}</p>}
          <button
            type="submit"
            disabled={status.kind === "sending"}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-flow text-sm font-semibold text-ink-950 transition-colors hover:bg-flow-strong disabled:opacity-60"
          >
            {status.kind === "sending" && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {status.kind === "sending" ? "Sending…" : "Call me back"}
          </button>
        </form>
      )}
    </div>
  );
}
