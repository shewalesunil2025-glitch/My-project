"use client";

import { useState, type FormEvent } from "react";

/** Enquiry form on a published site. Sends to /api/site-lead; the owner sees it in Leads. */
export function EnquiryForm({ slug, accent, dark, preview }: { slug: string; accent: string; dark?: boolean; preview?: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (preview) return;
    const f = new FormData(e.currentTarget);
    setState("sending");
    const res = await fetch("/api/site-lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, name: f.get("name"), phone: f.get("phone"), message: f.get("message"), website: f.get("website") }),
    }).catch(() => null);
    setState(res?.ok ? "sent" : "error");
  }

  const field = dark
    ? "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2"
    : "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2";

  if (state === "sent")
    return (
      <p className={dark ? "rounded-xl bg-white/5 p-4 text-sm text-white" : "rounded-xl bg-white p-4 text-sm text-neutral-800"}>
        Thank you! We&apos;ve received your message and will get back to you soon.
      </p>
    );

  return (
    <form onSubmit={submit} className="grid gap-3" style={{ ["--tw-ring-color" as string]: accent }}>
      <input name="name" required maxLength={80} placeholder="Your name" className={field} aria-label="Your name" />
      <input name="phone" required maxLength={20} inputMode="tel" placeholder="Phone / WhatsApp number" className={field} aria-label="Phone number" />
      <textarea name="message" rows={3} maxLength={600} placeholder="How can we help?" className={field} aria-label="Message" />
      {/* Spam trap: people don't see or fill this */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <button
        type="submit"
        disabled={state === "sending" || preview}
        className="h-12 rounded-full text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ background: accent }}
      >
        {state === "sending" ? "Sending…" : "Send enquiry"}
      </button>
      {state === "error" && <p className="text-sm text-red-500">Couldn&apos;t send. Please call or WhatsApp us instead.</p>}
      {preview && <p className={dark ? "text-xs text-white/50" : "text-xs text-neutral-400"}>Preview — the form works once your site is published.</p>}
    </form>
  );
}
