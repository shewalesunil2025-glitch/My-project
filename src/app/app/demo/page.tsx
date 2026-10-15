import Link from "next/link";
import { Play, Sparkles } from "lucide-react";
import { product } from "@/config/product";
import { inTrial, isLive, services } from "@/content/app/services";
import { BrandLogo, BtnLink, Icon } from "@/components/app/ui";

export const metadata = { title: `Demo videos — ${product.name}`, description: `Watch how every ${product.name} service works, and how to switch it on by just talking to IBAX.` };

const demos = services.filter((s) => s.id !== "custom");

/** Demo videos: the quick tour of the app and one video for every service. */
export default function DemoLibraryPage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/app" className="flex items-center gap-2">
          <BrandLogo tagline />
        </Link>
        <BtnLink href="/app/signup" size="sm">
          Create Account
        </BtnLink>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <p className="eyebrow mt-6">Demo videos</p>
        <h1 className="display mt-2 text-3xl sm:text-5xl">See how it works.</h1>
        <p className="mt-3 max-w-2xl text-fg-muted">
          One short video for every service: what it does, and how to switch it on — by just talking to {product.assistantName}, or yourself, step by step.
        </p>

        <Link
          href="/app/demo/tour"
          className="glass mt-8 flex items-center gap-4 rounded-3xl p-5 [background:radial-gradient(70%_120%_at_100%_0%,rgb(102_211_76/0.22),transparent_60%),var(--color-ink-850)] sm:p-7"
        >
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-flow text-ink-950 shadow-[0_12px_40px_-10px_rgb(102_211_76/0.9)]">
            <Play className="size-7 fill-current" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-semibold">{product.name} in 2 minutes</span>
            <span className="block text-sm text-fg-muted">The whole app: sign up, meet {product.assistantName}, services, website, analytics.</span>
          </span>
        </Link>

        <h2 className="mt-10 text-lg font-semibold">Service demos</h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map((s) => (
            <li key={s.id}>
              <Link href={`/app/demo/${s.id}`} className="glass flex h-full gap-3.5 rounded-2xl p-4">
                <span className="relative grid size-12 shrink-0 place-items-center rounded-xl bg-flow/12 text-flow-soft">
                  <Icon name={s.icon} className="size-6" />
                  <span className="absolute -right-1.5 -bottom-1.5 grid size-6 place-items-center rounded-full bg-flow text-ink-950">
                    <Play className="size-3 fill-current" aria-hidden />
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{s.name} demo</span>
                  <span className="mt-0.5 block text-xs text-fg-muted">{s.short}</span>
                  <span className="mt-2 flex flex-wrap gap-1.5 text-[0.65rem]">
                    {inTrial(s.id) && isLive(s.id) && <span className="rounded-full bg-flow/15 px-2 py-0.5 font-semibold text-flow">Free trial</span>}
                    {!isLive(s.id) && <span className="rounded-full bg-white/10 px-2 py-0.5 text-fg-muted">Coming soon</span>}
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-fg-muted">
                      <Sparkles className="size-3" aria-hidden /> Talk-to-activate shown
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
