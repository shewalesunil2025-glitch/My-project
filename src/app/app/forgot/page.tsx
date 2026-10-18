"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Mail, Smartphone } from "lucide-react";
import { cloudEnabled } from "@/lib/app/cloud";
import { AuthFrame } from "@/components/app/AuthFrame";
import { Btn, Field, Input, Notice, Spinner } from "@/components/app/ui";
import { cn } from "@/lib/cn";

type Way = "email" | "phone";

export default function ForgotPasswordPage() {
  const [way, setWay] = useState<Way>("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = String(new FormData(e.currentTarget).get(way) ?? "").trim();
    setBusy(true);
    setError("");
    const res = await fetch("/api/account/forgot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [way]: value }),
    }).catch(() => null);
    const out = (await res?.json().catch(() => null)) as { ok?: boolean; sentTo?: string; message?: string } | null;
    setBusy(false);
    if (!out?.ok) return setError(out?.message ?? "Something went wrong. Please try again.");
    setSent(out.sentTo ?? value);
  }

  return (
    <AuthFrame
      title="Forgot password?"
      subtitle="We'll email you a link to set a new one."
      footer={
        <Link href="/app/login" className="font-semibold text-fg underline underline-offset-2">
          Back to login
        </Link>
      }
    >
      {!cloudEnabled ? (
        <Notice tone="blue">Password reset works once accounts are switched on. In this preview your account lives on this device only.</Notice>
      ) : sent ? (
        <Notice>
          Done! We sent a reset link to <strong className="text-fg">{sent}</strong>. Open it on this phone and choose a new password. Not in your inbox? Check
          Spam or Promotions.
        </Notice>
      ) : (
        <>
          <div role="tablist" aria-label="How to find your account" className="mb-5 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
            {(
              [
                ["email", "Email", Mail],
                ["phone", "Mobile number", Smartphone],
              ] as const
            ).map(([id, label, I]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={way === id}
                onClick={() => (setWay(id), setError(""))}
                className={cn(
                  "inline-flex h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors",
                  way === id ? "bg-flow/15 text-flow" : "text-fg-muted hover:text-fg",
                )}
              >
                <I className="size-4" aria-hidden /> {label}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            {way === "email" ? (
              <Field label="Email on your account" htmlFor="email">
                <Input key="email" id="email" name="email" type="email" autoComplete="email" required />
              </Field>
            ) : (
              <Field label="Mobile number on your account" htmlFor="phone" help="We'll send the link to the email of that account.">
                <Input key="phone" id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" required />
              </Field>
            )}
            {error && <Notice tone="amber">{error}</Notice>}
            <Btn type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? <Spinner /> : "Send reset link"}
            </Btn>
          </form>
        </>
      )}
    </AuthFrame>
  );
}
