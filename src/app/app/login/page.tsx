"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { product } from "@/config/product";
import { logIn, openSampleWorkspace } from "@/lib/app/store";
import { buildSampleWorkspace } from "@/lib/app/sample";
import { AuthFrame } from "@/components/app/AuthFrame";
import { SocialSignIn } from "@/components/app/SocialSignIn";
import { Btn, Field, Input, Notice, Spinner } from "@/components/app/ui";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const res = await logIn(String(f.get("email") ?? ""), String(f.get("password") ?? ""));
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.push("/app/home");
  }

  return (
    <AuthFrame
      title="Welcome back"
      subtitle={`Log in to ${product.name}.`}
      footer={
        <>
          New here?{" "}
          <Link href="/app/signup" className="font-semibold text-fg underline underline-offset-2">
            Create an account
          </Link>
        </>
      }
    >
      <SocialSignIn />
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        {error && <Notice tone="amber">{error}</Notice>}
        <Btn type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? <Spinner /> : "Log in"}
        </Btn>
      </form>
      <Btn
        variant="subtle"
        size="sm"
        className="mt-4 w-full"
        onClick={() => {
          openSampleWorkspace(buildSampleWorkspace);
          router.push("/app/home");
        }}
      >
        Explore the sample restaurant instead →
      </Btn>
    </AuthFrame>
  );
}
