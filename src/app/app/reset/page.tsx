"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { cloudRecoveryReady, cloudSetNewPassword } from "@/lib/app/cloud";
import { AuthFrame } from "@/components/app/AuthFrame";
import { Btn, Field, Input, PasswordInput, Notice, Spinner } from "@/components/app/ui";

/** Where the reset email's link lands: choose a new password. */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "ready" | "expired" | "done">("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void cloudRecoveryReady().then((ok) => setState(ok ? "ready" : "expired"));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const next = String(f.get("password") ?? "");
    if (next !== String(f.get("confirm") ?? "")) return setError("The two passwords don't match.");
    if (next.length < 8) return setError("Use at least 8 characters.");
    setBusy(true);
    setError("");
    const res = await cloudSetNewPassword(next);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setState("done");
    setTimeout(() => router.replace("/app/home"), 1500);
  }

  return (
    <AuthFrame title="Set a new password" subtitle="Choose a password you'll remember.">
      {state === "checking" && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}
      {state === "expired" && (
        <Notice tone="amber">
          This link has expired or was already used.{" "}
          <Link href="/app/forgot" className="font-semibold underline underline-offset-2">
            Send a new link
          </Link>
          .
        </Notice>
      )}
      {state === "done" && <Notice>Password changed. Taking you to your workspace…</Notice>}
      {state === "ready" && (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="New password" htmlFor="password" help="At least 8 characters.">
            <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} required />
          </Field>
          <Field label="Type it again" htmlFor="confirm">
            <PasswordInput id="confirm" name="confirm" autoComplete="new-password" minLength={8} required />
          </Field>
          {error && <Notice tone="amber">{error}</Notice>}
          <Btn type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <Spinner /> : "Save new password"}
          </Btn>
        </form>
      )}
    </AuthFrame>
  );
}
