"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Pause, Play } from "lucide-react";
import { product } from "@/config/product";
import { openSampleWorkspace } from "@/lib/app/store";
import { buildSampleWorkspace } from "@/lib/app/sample";
import { BrandLogo, Btn, BtnLink, LumiMark } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const N = product.name;
const A = product.assistantName;

function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl bg-white/[0.06] px-3 py-2 text-[0.72rem]", className)}>{children}</div>;
}
function Bubble({ me, children }: { me?: boolean; children: ReactNode }) {
  return <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-[0.72rem] leading-snug", me ? "ml-auto bg-flow text-ink-950" : "bg-white/[0.08]")}>{children}</div>;
}

const steps: { title: string; text: string; screen: ReactNode }[] = [
  {
    title: `What is ${N}?`,
    text: `${N} is an AI Business Operating System. It runs your website, AI call and WhatsApp assistants, Instagram, Facebook, YouTube, email, Google reviews, digital marketing, analytics and automations — and you control all of it from one app, without touching any technology.`,
    screen: (
      <div className="grid h-full place-items-center text-center">
        <div>
          <BrandLogo stacked tagline size="md" className="mx-auto" />
          <p className="text-[0.7rem] text-fg-muted">{product.positioning}</p>
        </div>
      </div>
    ),
  },
  {
    title: "1. Create your account",
    text: "Sign up with your name, email, mobile number and country. That's it — no technical setup.",
    screen: (
      <div className="space-y-2">
        {["Full name", "Email", "Mobile number", "Password", "Country"].map((f) => (
          <Row key={f} className="text-fg-muted">{f}</Row>
        ))}
        <div className="rounded-full bg-flow py-2 text-center text-[0.72rem] font-semibold text-ink-950">Create Account</div>
      </div>
    ),
  },
  {
    title: "2. Tell us about your business",
    text: "Pick your business type — restaurant, hotel, clinic, salon, store, real estate and more — then add your details, hours and services. No website? We'll build one.",
    screen: (
      <div className="grid grid-cols-2 gap-2">
        {["Restaurant", "Hotel", "Clinic", "Salon", "Clothing Store", "Real Estate", "Gym", "Other"].map((c, i) => (
          <Row key={c} className={i === 0 ? "bg-flow/25 text-fg" : "text-fg-muted"}>{c}</Row>
        ))}
      </div>
    ),
  },
  {
    title: `3. Meet ${A}`,
    text: `${A} becomes your personal AI business assistant. Choose its language, tone and welcome message — it talks to your customers the way you would.`,
    screen: (
      <div className="space-y-2">
        <Row>Assistant: <b>{A}</b></Row>
        <Row>Language: English</Row>
        <Row>Tone: Warm & friendly</Row>
        <Bubble>Hi! I&apos;m {A} from Sunrise Bistro. How can I help?</Bubble>
      </div>
    ),
  },
  {
    title: "4. Choose a service",
    text: "Open the Automation Store. Every service has its features, price and setup time. Buy one, a few, or Digital Marketing for everything.",
    screen: (
      <div className="space-y-2">
        {["WhatsApp AI Assistant · $49/mo", "AI Voice Assistant · $79/mo", "YouTube Automation · $39/mo", "Digital Marketing · $299/mo"].map((s, i) => (
          <Row key={s} className={i === 2 ? "ring-1 ring-flow" : ""}>{s}</Row>
        ))}
      </div>
    ),
  },
  {
    title: "5. Pay",
    text: "Choose monthly or annual (2 months free) and pay through the secure payment page. Your invoice appears in Billing.",
    screen: (
      <div className="space-y-2">
        <Row>YouTube Automation — Monthly</Row>
        <Row className="flex justify-between"><span>Total</span><b>$39.00</b></Row>
        <div className="rounded-full bg-flow py-2 text-center text-[0.72rem] font-semibold text-ink-950">Pay</div>
        <p className="text-center text-[0.65rem] text-emerald-300">✓ Payment confirmed</p>
      </div>
    ),
  },
  {
    title: "6. Connect your account",
    text: `Sign in to YouTube (or WhatsApp, Instagram, Google…) on its own secure page and allow access. ${N} never sees your password and you can disconnect any time.`,
    screen: (
      <div className="space-y-2">
        <Row>Connect YouTube</Row>
        <Row className="text-fg-muted">Allow {N} to upload videos to “Sunrise Bistro”?</Row>
        <Row className="text-emerald-300">✓ Connected</Row>
      </div>
    ),
  },
  {
    title: "7. Test & activate",
    text: `Answer a few questions — content style, time, approval — then ${N} runs a test for you. Approve it and press Activate. Some platforms (like WhatsApp) review new accounts first; ${N} guides you through that too.`,
    screen: (
      <div className="space-y-2">
        <Row>Every day at 7:00 PM</Row>
        <Row>Style: Menu showcase</Row>
        <Row className="text-emerald-300">✓ Test video ready</Row>
        <div className="rounded-full bg-flow py-2 text-center text-[0.72rem] font-semibold text-ink-950">Activate</div>
      </div>
    ),
  },
  {
    title: "8. Your dashboard",
    text: `Everything in one place — calls, WhatsApp, leads, videos, reviews. Just ask ${A}: “What happened today?”, “How many leads came today?”, “Create tomorrow's Instagram post.”`,
    screen: (
      <div className="space-y-2">
        <Bubble me>What happened today?</Bubble>
        <Bubble>4 calls, 2 WhatsApp bookings, 1 new lead and a 5★ review. Your YouTube Short goes live at 7 PM.</Bubble>
        <div className="grid grid-cols-3 gap-1.5">
          {["4 calls", "6 leads", "12 msgs"].map((s) => (
            <Row key={s} className="text-center">{s}</Row>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "9. Content Centre",
    text: "AI videos, reels, shorts, images and captions — preview, edit, approve, schedule or publish them, all inside the app.",
    screen: (
      <div className="space-y-2">
        <Row className="flex justify-between"><span>🎬 Wood-fired oven Short</span><span className="text-sky-300">7 PM</span></Row>
        <Row className="flex justify-between"><span>📸 Weekend brunch reel</span><span className="text-amber-200">Approve?</span></Row>
        <Row className="flex justify-between"><span>🍕 Truffle pizza post</span><span className="text-emerald-300">Live</span></Row>
      </div>
    ),
  },
  {
    title: "10. Analytics",
    text: "Leads, calls, messages, website visitors, reach, video views, reviews and conversions — today, 7 days, 30 days or any range.",
    screen: (
      <div className="flex h-full items-end gap-1.5 px-1 pb-2">
        {[30, 45, 38, 60, 52, 70, 84, 66, 90, 78, 95, 100].map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-flow/80" style={{ height: `${h}%` }} />
        ))}
      </div>
    ),
  },
];

export default function DemoPage() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const router = useRouter();
  const last = i === steps.length - 1;

  useEffect(() => {
    if (!playing || last) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setI((v) => Math.min(v + 1, steps.length - 1)), 6500);
    return () => clearTimeout(t);
  }, [i, playing, last]);

  const step = steps[i];

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

      <main className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 [&>*]:min-w-0 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_auto] lg:py-16">
        <section aria-live="polite">
          <p className="eyebrow">
            Demo · {i + 1} / {steps.length}
          </p>
          <h1 className="display mt-3 text-3xl sm:text-5xl">{step.title}</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">{step.text}</p>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Btn variant="ghost" size="sm" onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0} aria-label="Previous step">
              <ArrowLeft className="size-4" aria-hidden />
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause demo" : "Play demo"}>
              {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
            </Btn>
            {!last ? (
              <Btn size="sm" onClick={() => setI((v) => v + 1)}>
                Next <ArrowRight className="size-4" aria-hidden />
              </Btn>
            ) : (
              <>
                <BtnLink href="/app/signup" size="sm">
                  Create my account
                </BtnLink>
                <Btn
                  variant="light"
                  size="sm"
                  onClick={() => {
                    openSampleWorkspace(buildSampleWorkspace);
                    router.push("/app/home");
                  }}
                >
                  Try the sample restaurant
                </Btn>
              </>
            )}
          </div>

          <ol className="mt-10 flex flex-wrap gap-1.5" aria-label="Demo steps">
            {steps.map((s, idx) => (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => {
                    setI(idx);
                    setPlaying(false);
                  }}
                  aria-current={idx === i ? "step" : undefined}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors",
                    idx === i ? "border-flow/50 bg-flow/15 text-fg" : idx < i ? "border-white/10 text-fg-muted" : "border-white/[0.06] text-fg-subtle",
                  )}
                >
                  {idx < i && <Check className="size-3 text-flow-soft" aria-hidden />}
                  {idx === 0 ? "Intro" : s.title.replace(/^\d+\.\s*/, "")}
                </button>
              </li>
            ))}
          </ol>
        </section>

        {/* Phone frame */}
        <div className="mx-auto w-[17rem] shrink-0 rounded-[2.4rem] border border-white/12 bg-ink-900 p-3 shadow-[0_40px_120px_-40px_rgb(102_211_76/0.5)]">
          <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-white/10" />
          <div className="h-[26rem] overflow-hidden rounded-[1.8rem] bg-ink-950 p-4">
            <div className="mb-3 flex items-center gap-2">
              <LumiMark className="size-6" glow={false} />
              <span className="text-[0.72rem] font-semibold">Sunrise Bistro</span>
            </div>
            <div key={i} className="h-[calc(100%-2.25rem)] animate-[dialog-in_0.5s_var(--ease-out-expo)]">
              {step.screen}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
