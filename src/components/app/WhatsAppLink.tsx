"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, ShieldCheck, Smartphone } from "lucide-react";
import { linkErrors, startWhatsAppLink, whatsAppState } from "@/lib/app/whatsappLink";
import { Btn, Notice, Spinner } from "./ui";

type Phase = { step: "number" } | { step: "starting" } | { step: "pairing"; code: string | null; qr: string | null } | { step: "linked" };

const POLL_MS = 3000;
const POLL_FOR_MS = 5 * 60 * 1000;

/**
 * Self-service WhatsApp linking: the owner enters their number, gets a pairing code
 * (WhatsApp → Linked devices → Link with phone number) or a QR code, and we wait until
 * WhatsApp reports the link. `onPreview` is called when the WhatsApp server isn't set up.
 */
export function WhatsAppLink({ onLinked, onPreview, disabled }: { onLinked: (number: string) => void; onPreview: (number: string) => void; disabled?: boolean }) {
  const [number, setNumber] = useState("");
  const [phase, setPhase] = useState<Phase>({ step: "number" });
  const [error, setError] = useState("");
  const done = useRef(false);

  useEffect(() => {
    if (phase.step !== "pairing") return;
    const until = Date.now() + POLL_FOR_MS;
    const timer = setInterval(async () => {
      if (Date.now() > until) {
        clearInterval(timer);
        setError("The code expired. Press “Get a new code” and try again.");
        return;
      }
      if ((await whatsAppState(number)) === "open" && !done.current) {
        done.current = true;
        clearInterval(timer);
        setPhase({ step: "linked" });
        onLinked(number);
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [phase.step, number, onLinked]);

  async function start(e?: FormEvent) {
    e?.preventDefault();
    if (!number.trim()) return;
    setError("");
    setPhase({ step: "starting" });
    const res = await startWhatsAppLink(number);
    if (!res.ok) {
      if (res.reason === "not_configured") return onPreview(number);
      setError(linkErrors[res.reason] ?? linkErrors.server_error);
      return setPhase({ step: "number" });
    }
    if (res.state === "open") {
      done.current = true;
      setPhase({ step: "linked" });
      return onLinked(number);
    }
    setPhase({ step: "pairing", code: res.pairingCode, qr: res.qr });
  }

  if (phase.step === "linked")
    return (
      <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
        <Check className="size-4" aria-hidden /> WhatsApp linked
      </p>
    );

  if (phase.step === "pairing") {
    const code = phase.code ? phase.code.replace(/^(.{4})(.{4})$/, "$1-$2") : null;
    return (
      <div className="space-y-3">
        {code && (
          <div className="rounded-xl border border-flow/30 bg-flow/[0.06] p-3 text-center">
            <p className="text-[0.7rem] text-fg-muted">Your link code</p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-[0.18em] text-fg" aria-live="polite">
              {code}
            </p>
          </div>
        )}
        <ol className="list-decimal space-y-1 pl-5 text-xs leading-snug text-fg-muted">
          <li>On the phone with this WhatsApp, open WhatsApp.</li>
          <li>Tap ⋮ (Android) or Settings (iPhone) → Linked devices → Link a device.</li>
          <li>{code ? "Tap “Link with phone number instead” and type the code above." : "Scan the QR code below."}</li>
        </ol>
        {phase.qr && (
          <details className="text-xs text-fg-muted">
            <summary className="cursor-pointer">{code ? "Or scan a QR code (from a computer)" : "QR code"}</summary>
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the WhatsApp server */}
            <img src={phase.qr} alt="WhatsApp link QR code" className="mx-auto mt-2 size-48 rounded-lg bg-white p-2" />
          </details>
        )}
        <p className="flex items-center gap-2 text-xs text-fg-subtle">
          <Spinner className="size-3" /> Waiting for WhatsApp…
        </p>
        {error && <Notice tone="amber">{error}</Notice>}
        <Btn size="sm" variant="ghost" className="w-full" onClick={() => start()}>
          Get a new code
        </Btn>
      </div>
    );
  }

  return (
    <form onSubmit={start} className="space-y-2">
      <p className="flex items-start gap-1.5 text-xs leading-snug text-fg-muted">
        <Smartphone className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Link the WhatsApp number your customers message. You&apos;ll get a code to enter in WhatsApp → Linked devices. Your chats stay on your phone.
      </p>
      <label className="sr-only" htmlFor="wa-number">
        WhatsApp number
      </label>
      <input
        id="wa-number"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        inputMode="tel"
        autoComplete="tel"
        placeholder="WhatsApp number, e.g. +91 98765 43210"
        className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm placeholder:text-fg-subtle focus:border-flow/50 focus:outline-none"
      />
      {error && <Notice tone="amber">{error}</Notice>}
      <Btn size="sm" type="submit" className="w-full" disabled={!number.trim() || disabled || phase.step === "starting"}>
        {phase.step === "starting" ? (
          <Spinner />
        ) : (
          <>
            <ShieldCheck className="size-3.5" aria-hidden /> Get my link code
          </>
        )}
      </Btn>
    </form>
  );
}
