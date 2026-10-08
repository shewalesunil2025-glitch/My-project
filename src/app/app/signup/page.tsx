"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { product } from "@/config/product";
import { countries } from "@/content/app/countries";
import { cloudEnabled } from "@/lib/app/cloud";
import { signUp } from "@/lib/app/store";
import { AuthFrame } from "@/components/app/AuthFrame";
import { SocialSignIn } from "@/components/app/SocialSignIn";
import { Btn, Field, Input, Notice, Select, Spinner } from "@/components/app/ui";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    if (get("password").length < 8) return setError("Use at least 8 characters for your password.");
    if (get("password") !== get("confirm")) return setError("The two passwords don't match.");
    if (!f.get("terms")) return setError("Please accept the Terms and Privacy Policy.");
    setBusy(true);
    const res = await signUp({ name: get("name"), email: get("email"), phone: get("phone"), country: get("country"), password: get("password") });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    if (res.confirmEmail) return setSentTo(get("email"));
    router.push("/app/setup");
  }

  if (sentTo)
    return (
      <AuthFrame title="Check your email" subtitle={`We sent a confirmation link to ${sentTo}.`}>
        <Notice tone="blue">Open the link in that email to confirm your account. It brings you back here, signed in.</Notice>
        <Link href="/app/login" className="mt-6 block text-center text-sm font-semibold text-fg underline underline-offset-2">
          Already confirmed? Log in
        </Link>
      </AuthFrame>
    );

  return (
    <AuthFrame
      title="Create your account"
      subtitle={`Set up ${product.name} for your business in a few minutes.`}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/app/login" className="font-semibold text-fg underline underline-offset-2">
            Log in
          </Link>
        </>
      }
    >
      <SocialSignIn />
      <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
        <Field label="Full name" htmlFor="name" required>
          <Input id="name" name="name" autoComplete="name" required />
        </Field>
        <Field label="Email" htmlFor="email" required>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Mobile number" htmlFor="phone" required>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+1 555 0100" required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" htmlFor="password" required help="At least 8 characters">
            <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          </Field>
          <Field label="Confirm password" htmlFor="confirm" required>
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
          </Field>
        </div>
        <Field label="Country" htmlFor="country" required>
          <Select id="country" name="country" defaultValue="United States" required>
            {countries.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <label className="flex items-start gap-3 text-sm text-fg-muted">
          <input type="checkbox" name="terms" className="mt-0.5 size-4 accent-[var(--color-flow)]" required />
          <span>I accept the Terms of Service and Privacy Policy.</span>
        </label>
        {error && <Notice tone="amber">{error}</Notice>}
        <Btn type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? <Spinner /> : "Create Account"}
        </Btn>
        {!cloudEnabled && <p className="text-center text-xs text-fg-subtle">Preview mode: your account is stored on this device only.</p>}
      </form>
    </AuthFrame>
  );
}
