"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CirclePlay } from "lucide-react";
import { product } from "@/config/product";
import { services } from "@/content/app/services";
import { openSampleWorkspace, useSession } from "@/lib/app/store";
import { buildSampleWorkspace } from "@/lib/app/sample";
import { BrandLogo, BtnLink, Btn, Icon } from "@/components/app/ui";

export default function WelcomePage() {
  const { ready, user, workspace } = useSession();
  const router = useRouter();
  const signedIn = ready && user && !workspace?.sample;

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_at_50%_0%,rgb(102_211_76/0.22),transparent_65%)]" />
      <div aria-hidden className="grid-backdrop pointer-events-none absolute inset-0" />

      <header className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/app" className="flex items-center gap-2">
          <BrandLogo tagline />
        </Link>
        <nav className="flex items-center gap-1">
          <BtnLink href="/app/demo" variant="subtle" size="sm">
            Watch Demo
          </BtnLink>
          {signedIn ? (
            <BtnLink href="/app/home" variant="light" size="sm">
              Open workspace
            </BtnLink>
          ) : (
            <BtnLink href="/app/login" variant="ghost" size="sm">
              Login
            </BtnLink>
          )}
        </nav>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pt-14 pb-20 sm:px-6 sm:pt-20">
        <section className="mx-auto max-w-3xl text-center">
          <BrandLogo size="lg" stacked tagline className="mx-auto animate-float" />
          <p className="mx-auto mt-8 text-base font-semibold tracking-tight text-fg sm:text-lg">
            Just say it. <span className="text-flow">ibaxai</span> does it.
          </p>
          <h1 className="display text-metal mt-5 text-[2.6rem] sm:text-6xl">
            Meet {product.name}.
            <br />
            {product.tagline}.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">
            Website, AI assistants, WhatsApp, calls, social media, reviews, content and leads — run from one app. You give the instructions. {product.name} handles the technology.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {signedIn ? (
              <BtnLink href="/app/home" size="lg" className="w-full sm:w-auto">
                Continue to {workspace?.business?.name ?? "your workspace"} <ArrowRight className="size-4" aria-hidden />
              </BtnLink>
            ) : (
              <>
                <BtnLink href="/app/signup" size="lg" className="w-full sm:w-auto">
                  Create Account <ArrowRight className="size-4" aria-hidden />
                </BtnLink>
                <BtnLink href="/app/login" variant="ghost" size="lg" className="w-full sm:w-auto">
                  Login
                </BtnLink>
              </>
            )}
            <BtnLink href="/app/demo" variant="ghost" size="lg" className="w-full sm:w-auto">
              <CirclePlay className="size-4 text-flow" aria-hidden /> Watch Demo
            </BtnLink>
          </div>
          <Btn
            variant="subtle"
            size="sm"
            className="mt-4"
            onClick={() => {
              openSampleWorkspace(buildSampleWorkspace);
              router.push("/app/home");
            }}
          >
            Or explore a sample restaurant →
          </Btn>
        </section>

        <section aria-labelledby="what" className="mt-20">
          <h2 id="what" className="eyebrow text-center">
            Everything your business needs — in one place
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {services
              .filter((s) => s.id !== "custom")
              .map((s) => (
                <li key={s.id} className="glass rounded-2xl p-4">
                  <span className="grid size-9 place-items-center rounded-xl bg-flow/12 text-flow-soft">
                    <Icon name={s.icon} className="size-[1.1rem]" />
                  </span>
                  <p className="mt-3 text-sm font-semibold">{s.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-fg-muted">{s.short}</p>
                </li>
              ))}
          </ul>
        </section>

        <section aria-labelledby="how" className="mt-20">
          <h2 id="how" className="eyebrow text-center">
            How it works
          </h2>
          <ol className="mx-auto mt-6 grid max-w-4xl gap-3 sm:grid-cols-3">
            {[
              ["Tell us about your business", "Answer a few simple questions and name your assistant."],
              ["Pick a service & connect", "Choose what you need, pay, and sign in to the account it uses."],
              [`${product.name} runs it`, "Test it, press Activate, and watch everything from one app."],
            ].map(([t, d], i) => (
              <li key={t} className="glass rounded-2xl p-5">
                <span className="font-mono text-xs text-flow-soft">0{i + 1}</span>
                <p className="mt-2 font-semibold">{t}</p>
                <p className="mt-1 text-sm text-fg-muted">{d}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      {/* Watch Demo stays visible on mobile */}
      <Link
        href="/app/demo"
        className="fixed right-4 bottom-4 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink-950 shadow-xl sm:hidden"
      >
        <CirclePlay className="size-4 text-flow" aria-hidden /> Watch Demo
      </Link>

      <footer className="relative border-t border-white/[0.06] py-8 text-center text-xs text-fg-subtle">
        {product.name} by{" "}
        <Link href="/" className="underline underline-offset-2 hover:text-fg">
          {product.company}
        </Link>
      </footer>
    </div>
  );
}
