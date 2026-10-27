"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { BadgeCheck, Check, MessageCircle, ShieldCheck, Smartphone } from "lucide-react";
import { connectOfficialWhatsApp, officialAccess, preloadMetaSdk, signupErrors } from "@/lib/app/metaSignup";
import { linkErrors, startWhatsAppLink, whatsAppStatus } from "@/lib/app/whatsappLink";
import { PhoneInput } from "./PhoneInput";
import { Btn, Notice, Spinner } from "./ui";

type Phase = { step: "number" } | { step: "starting" } | { step: "meta" } | { step: "pairing"; code: string | null; qr: string | null } | { step: "linked" };

const POLL_MS = 3000;
const POLL_FOR_MS = 5 * 60 * 1000;

/**
 * Self-service WhatsApp linking: the owner enters their number, gets a pairing code
 * (WhatsApp → Linked devices → Link with phone number) or a QR code, and we wait until
 * WhatsApp reports the link. `onPreview` is called when the WhatsApp server isn't set up.
 * When the Meta app is set up, the official way comes first: Meta's own window, where the owner
 * picks their number and confirms it with an OTP (WhatsApp Cloud API, Embedded Signup).
 */
export function WhatsAppLink({ onLinked, onPreview, disabled }: { onLinked: (number: string) => void; onPreview: (number: string) => void; disabled?: boolean }) {
  const [number, setNumber] = useState("");
  const [phase, setPhase] = useState<Phase>({ step: "number" });
  const [error, setError] = useState("");
  const [keepApp, setKeepApp] = useState(true);
  const done = useRef(false);

  const [meta, setMeta] = useState(false);

  // The server says whether this account gets the official OTP signup; if so, get Meta's SDK ready.
  useEffect(() => {
    let on = true;
    void officialAccess().then((ok) => {
      if (!on || !ok) return;
      setMeta(true);
      preloadMetaSdk();
    });
    return () => {
      on = false;
    };
  }, []);

  useEffect(() => {
    if (phase.step !== "pairing") return;
    const until = Date.now() + POLL_FOR_MS;
    const timer = setInterval(async () => {
      if (Date.now() > until) {
        clearInterval(timer);
        setError("The code expired. Press “Get a new code” and try again.");
        return;
      }
      const now = await whatsAppStatus(number);
      if (done.current) return;
      if (now.state === "open") {
        done.current = true;
        clearInterval(timer);
        setPhase({ step: "linked" });
        onLinked(number);
      } else if (now.pairingCode || now.qr) {
        // Keep the code and QR on screen fresh, so the owner never types an expired one.
        setPhase((p) => (p.step === "pairing" ? { step: "pairing", code: now.pairingCode ?? p.code, qr: now.qr ?? p.qr } : p));
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [phase.step, number, onLinked]);

  async function start(e?: FormEvent) {
    e?.preventDefault();
    if (number.replace(/\D/g, "").length < 8) return;
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

  async function official() {
    setError("");
    setPhase({ step: "meta" });
    const res = await connectOfficialWhatsApp(keepApp, number);
    if (!res.ok) {
      setError(res.message || signupErrors[res.reason] || signupErrors.server_error);
      return setPhase({ step: "number" });
    }
    done.current = true;
    setPhase({ step: "linked" });
    onLinked(res.number);
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
          <details open className="text-xs text-fg-muted">
            <summary className="cursor-pointer">{code ? "Or scan a QR code (from a computer)" : "QR code"}</summary>
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the WhatsApp server */}
            <img src={phase.qr} alt="WhatsApp link QR code" className="mx-auto mt-2 size-48 rounded-lg bg-white p-2" />
          </details>
        )}
        <p className="flex items-center gap-2 text-xs text-fg-subtle">
          <Spinner className="size-3" /> Waiting for WhatsApp… The code and QR refresh on their own, so take your time.
        </p>
        {error && <Notice tone="amber">{error}</Notice>}
        <Btn size="sm" variant="ghost" className="w-full" onClick={() => start()}>
          Get a new code
        </Btn>
      </div>
    );
  }

  const ready = number.replace(/\D/g, "").length >= 8;
  const busy = phase.step === "meta" || phase.step === "starting";
  return (
    <form onSubmit={meta ? (e) => (e.preventDefault(), void official()) : start} className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#3be37a,#13a84f)] text-white shadow-[0_8px_24px_-8px_rgb(37_211_102/0.7)]">
          <MessageCircle className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">Connect your WhatsApp</p>
          <p className="text-xs text-fg-muted">The number your customers message</p>
        </div>
      </div>

      <label className="sr-only" htmlFor="wa-number">
        WhatsApp number
      </label>
      <PhoneInput id="wa-number" value={number} onChange={setNumber} autoComplete="off" required />

      {meta && (
        <label className="flex items-start gap-2 text-xs leading-snug text-fg-muted">
          <input type="checkbox" checked={keepApp} onChange={(e) => setKeepApp(e.target.checked)} className="mt-0.5 accent-[#25d366]" />I use the WhatsApp Business app on this number and want to keep using it
        </label>
      )}

      {error && <Notice tone="amber">{error}</Notice>}

      <Btn type="submit" className="w-full" disabled={!ready || disabled || busy}>
        {busy ? (
          <Spinner />
        ) : meta ? (
          <>
            <ShieldCheck className="size-4" aria-hidden /> Get OTP &amp; connect
          </>
        ) : (
          <>
            <ShieldCheck className="size-4" aria-hidden /> Get my link code
          </>
        )}
      </Btn>

      <p className="flex items-start gap-1.5 text-[0.7rem] leading-snug text-fg-subtle">
        {meta ? (
          <>
            <BadgeCheck className="mt-px size-3.5 shrink-0 text-flow" aria-hidden />
            Official WhatsApp by Meta. A secure Meta window opens: confirm this number with the OTP WhatsApp sends you.
          </>
        ) : (
          <>
            <Smartphone className="mt-px size-3.5 shrink-0" aria-hidden />
            You&apos;ll get a code to type in WhatsApp → Linked devices. Your chats stay on your phone.
          </>
        )}
      </p>
    </form>
  );
}
