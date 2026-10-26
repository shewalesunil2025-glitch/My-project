import type { ReactNode } from "react";
import { Bot, Check, Gift, Globe, Lock, Mail, MessageCircle, Mic, PhoneCall, SendHorizontal, ShieldCheck, Star, TrendingUp, Users } from "lucide-react";
import { BrandMark, Icon } from "@/components/app/ui";
import { LogoLockup, Wordmark } from "@/components/navigation/Logo";
import { services } from "@/content/app/services";
import { tourParts } from "@/content/tourScript";
import { Bubble, Btn, enter, finger, Phone, PT, typed } from "./Film";

/**
 * One frame of "ibaxai in 2 minutes", the whole app in one video, drawn from the time `t`
 * (seconds) so it can be rendered frame by frame into an MP4 (scripts/tour-video.mjs).
 * 360×640 CSS px. `durations` are the seconds of each part (see tourParts).
 */
const W = 360;
const H = 640;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const BTN_Y = PT + 46 + 360;

function Row({ children, on, style }: { children: ReactNode; on?: boolean; style?: React.CSSProperties }) {
  return (
    <div style={style} className={`rounded-xl px-3 py-2.5 text-[12px] ${on ? "bg-[#66d34c]/20 text-white ring-1 ring-[#66d34c]/60" : "bg-white/[0.06] text-white/80"}`}>
      {children}
    </div>
  );
}

export function TourFilm({ durations, t }: { durations: number[]; t: number }) {
  let k = 0;
  let start = 0;
  for (; k < durations.length - 1; k++) {
    if (t < start + durations[k]) break;
    start += durations[k];
  }
  const part = tourParts[k];
  const lt = t - start;
  const dur = durations[k] || 3;
  let stage: ReactNode = null;
  let tap: ReactNode = null;

  if (part === "intro" || part === "outro") {
    const outro = part === "outro";
    stage = (
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div style={enter(lt, 0, 0.7)} className="mx-auto w-[197px]">
            <LogoLockup className="w-full" markClassName="drop-shadow-[0_0_40px_rgba(102,211,76,.75)]" />
          </div>
          {!outro && (
            <p style={enter(lt, 0.45)} className="mt-3 text-[15px] font-semibold text-white/70">
              in 2 minutes
            </p>
          )}
          <p style={enter(lt, outro ? 0.5 : 0.8)} className="mt-6 text-[34px] leading-[1.05] font-bold tracking-tight text-white">
            Just say it.
          </p>
          <p style={enter(lt, outro ? 0.9 : 1.2)} className="text-[34px] leading-[1.05] font-bold tracking-tight text-[#7dff3a]">
            IBAX does it.
          </p>
          {outro && (
            <div style={enter(lt, 1.5)} className="mx-auto mt-8 w-[220px]">
              <Btn>Create your free account</Btn>
              <p className="mt-3 text-[13px] text-white/60">www.ibaxai.com</p>
            </div>
          )}
        </div>
      </div>
    );
  } else if (part === "what") {
    const icons = services.filter((s) => s.id !== "custom" && s.id !== "social-pack").slice(0, 11);
    stage = (
      <div className="absolute inset-x-6 top-[96px] text-center">
        <p style={enter(lt, 0)} className="text-[12px] tracking-[0.2em] text-[#7dff3a] uppercase">
          One app
        </p>
        <p style={enter(lt, 0.2)} className="mt-1 text-[25px] leading-tight font-bold text-white">
          Your AI Business Operating System
        </p>
        <div className="relative mx-auto mt-8 size-[260px]">
          <div style={enter(lt, 0.4, 0.7)} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_30px_rgba(102,211,76,.8)]">
            <BrandMark className="size-16" />
          </div>
          {icons.map((s, i) => {
            const a = (i / icons.length) * Math.PI * 2 + lt * 0.25;
            const r = 112 * ease((lt - 0.6 - i * 0.12) / 0.6);
            return (
              <span
                key={s.id}
                style={{ left: 130 + Math.cos(a) * r - 20, top: 130 + Math.sin(a) * r - 20, opacity: ease((lt - 0.6 - i * 0.12) / 0.4) }}
                className="absolute grid size-10 place-items-center rounded-2xl bg-[#66d34c]/15 text-[#8be36f] ring-1 ring-[#66d34c]/40"
              >
                <Icon name={s.icon} className="size-5" />
              </span>
            );
          })}
        </div>
        <p style={enter(lt, 2.2)} className="mt-6 text-[13px] text-white/65">
          No technical work. You give the instructions.
        </p>
      </div>
    );
  } else if (part === "signup") {
    const fields: [string, string][] = [
      ["Full name", "Priya Sharma"],
      ["Email", "priya@sunrisebistro.in"],
      ["Mobile number", "+91 98765 43210"],
      ["Country", "India"],
    ];
    const f = finger(lt, dur, { x: 180, y: BTN_Y }, 0.82);
    stage = (
      <Phone title="Create account" tab="">
        <div className="space-y-2.5 p-4">
          {fields.map(([label, val], i) => (
            <div key={label} style={enter(lt, i * 0.12)}>
              <p className="text-[10.5px] text-white/55">{label}</p>
              <div className="mt-1 h-9 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-[11.5px] text-white">{typed(val, lt, 0.4 + i * 0.9, 28)}</div>
            </div>
          ))}
        </div>
        <div className="absolute inset-x-4" style={{ top: 340 }}>
          {f.tapped ? <Btn done>✓ Account created</Btn> : <Btn>Create Account</Btn>}
        </div>
      </Phone>
    );
    tap = f.node;
  } else if (part === "business") {
    const types = ["Restaurant", "Hotel", "Clinic", "Salon", "Clothing Store", "Real Estate", "Gym", "Other"];
    const pos = { x: 28 + 16 + 66, y: PT + 46 + 64 };
    const f = finger(lt, dur, pos, 0.35);
    stage = (
      <Phone title="Your business" tab="">
        <div className="p-4">
          <p style={enter(lt, 0)} className="mb-3 text-[13px] font-semibold text-white">
            What kind of business?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {types.map((c, i) => (
              <Row key={c} on={i === 0 && f.tapped} style={enter(lt, 0.1 + i * 0.06)}>
                {c}
              </Row>
            ))}
          </div>
          {f.tapped && (
            <div style={enter(lt - dur * 0.35, 0.3)} className="mt-4 space-y-2">
              <Row>🕘 Hours: 10 AM – 11 PM</Row>
              <Row>🍽️ Services: dine-in, delivery, catering</Row>
            </div>
          )}
        </div>
      </Phone>
    );
    tap = f.node;
  } else if (part === "ibax") {
    stage = (
      <Phone title="IBAX" tab="IBAX">
        <div className="space-y-2 p-4">
          <div style={enter(lt, 0)} className="mx-auto mb-3 w-fit drop-shadow-[0_0_24px_rgba(102,211,76,.7)]">
            <BrandMark className="size-14" />
          </div>
          <Row style={enter(lt, 0.3)}>Assistant: <b className="text-white">IBAX</b></Row>
          <Row style={enter(lt, 0.5)}>Language: English · हिंदी · मराठी</Row>
          <Row style={enter(lt, 0.7)}>Tone: Warm & friendly</Row>
          <div className="space-y-2 pt-2">
            <Bubble style={enter(lt, 1.4)}>Hi! I&apos;m IBAX from Sunrise Bistro 👋 How can I help?</Bubble>
            <Bubble me style={enter(lt, 2.6)}>Table for 4 tonight?</Bubble>
            <Bubble style={enter(lt, 3.6)}>Sure! 8 PM works. Shall I book it? 😊</Bubble>
          </div>
        </div>
      </Phone>
    );
  } else if (part === "services") {
    const ids = ["whatsapp", "website", "voice", "instagram", "reviews", "followup"];
    const pos = { x: 28 + 14 + 66, y: PT + 46 + 18 + 52 };
    const f = finger(lt, dur, pos, 0.6);
    stage = (
      <Phone title="Services" tab="Services">
        <div className="grid grid-cols-2 gap-3 p-3.5">
          {ids.map((id, i) => {
            const s = services.find((x) => x.id === id);
            return (
              <div key={id} style={enter(lt, 0.1 + i * 0.12)} className={`relative flex h-[108px] flex-col justify-between rounded-2xl p-3 ${i === 0 ? (f.tapped ? "bg-[#66d34c]/30 ring-2 ring-[#66d34c]" : "bg-[#66d34c]/15 ring-1 ring-[#66d34c]/50") : "bg-white/[0.06]"}`}>
                <Icon name={s?.icon ?? "Sparkles"} className="size-5 text-[#8be36f]" />
                {["whatsapp", "reviews", "followup"].includes(id) && (
                  <span className="absolute top-2 right-2 rounded-full bg-[#66d34c] px-1.5 py-0.5 text-[7.5px] font-bold text-[#06100a]">FREE TRIAL</span>
                )}
                <span className="text-[11.5px] leading-tight font-semibold text-white">{s?.name}</span>
              </div>
            );
          })}
        </div>
      </Phone>
    );
    tap = f.node;
  } else if (part === "say") {
    const ask = "I want WhatsApp automation";
    const sent = lt > 0.4 + ask.length / 22 + 0.3;
    const cardTap = finger(lt, dur, { x: 150, y: PT + 46 + 420 - 58 - 32 }, 0.78);
    stage = (
      <Phone title="IBAX" tab="IBAX">
        <div className="absolute inset-x-0 top-0 bottom-[58px] flex flex-col justify-end gap-2 overflow-hidden px-3 pb-3">
          <p className="mb-auto pt-3 text-center text-[10px] tracking-[0.2em] text-white/35 uppercase">Just say it</p>
          {sent && <Bubble me style={enter(lt, 0.4 + ask.length / 22 + 0.3, 0.35)}>{ask}</Bubble>}
          {sent && <Bubble style={enter(lt, 2.3)}>Great choice! Here&apos;s WhatsApp Automation. Try it free 👇</Bubble>}
          {sent && (
            <div style={enter(lt, 2.8)} className="max-w-[90%] space-y-2 rounded-2xl border border-[#66d34c]/30 bg-[#66d34c]/[0.07] p-3">
              <p className="flex items-center gap-2 text-[12px] font-semibold text-white">
                <MessageCircle className="size-4 text-[#8be36f]" aria-hidden /> WhatsApp Automation
              </p>
              {cardTap.tapped ? <Btn done>🎁 Free trial started</Btn> : <Btn>Start free trial</Btn>}
            </div>
          )}
        </div>
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
          <div className="flex h-10 flex-1 items-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-[12px] text-white">
            {sent ? <span className="text-white/35">Type or tap the mic…</span> : typed(ask, lt, 0.4) || <span className="text-white/35">Type or tap the mic…</span>}
          </div>
          <span className="grid size-10 place-items-center rounded-full border border-[#66d34c]/50 text-[#8be36f]">
            <Mic className="size-4" aria-hidden />
          </span>
          <span className="grid size-10 place-items-center rounded-full bg-[#66d34c] text-[#06100a]">
            <SendHorizontal className="size-4" aria-hidden />
          </span>
        </div>
      </Phone>
    );
    tap = sent ? cardTap.node : finger(lt, dur, { x: 300, y: PT + 46 + 420 - 32 }, Math.min(0.9, (0.5 + ask.length / 22) / dur)).node;
  } else if (part === "connect") {
    const f = finger(lt, dur, { x: 180, y: PT + 46 + 250 }, 0.55);
    stage = (
      <Phone title="Connect accounts" tab="Services">
        <div className="p-5 text-center">
          <div style={enter(lt, 0)} className="mx-auto grid size-16 place-items-center rounded-3xl bg-[#66d34c]/15 text-[#8be36f] ring-1 ring-[#66d34c]/40">
            <Lock className="size-7" aria-hidden />
          </div>
          <p style={enter(lt, 0.25)} className="mt-4 text-[15px] font-semibold text-white">
            Connect WhatsApp
          </p>
          <p style={enter(lt, 0.45)} className="mx-auto mt-2 max-w-[230px] text-[11.5px] text-white/60">
            Sign in on the platform&apos;s own secure page. We never see your password.
          </p>
          <p style={enter(lt, 0.7)} className="mt-3 inline-flex items-center gap-1 text-[10.5px] text-white/45">
            <ShieldCheck className="size-3.5" aria-hidden /> Disconnect any time
          </p>
        </div>
        <div className="absolute inset-x-6" style={{ top: 230 }}>
          {f.tapped ? <Btn done>✓ WhatsApp connected</Btn> : <Btn ghost>Connect WhatsApp</Btn>}
        </div>
      </Phone>
    );
    tap = f.node;
  } else if (part === "dashboard") {
    const stats = [
      { label: "Calls", icon: PhoneCall, n: 4 },
      { label: "Messages", icon: MessageCircle, n: 12 },
      { label: "Leads", icon: Users, n: 6 },
      { label: "Reviews", icon: Star, n: 3 },
    ];
    const q = "What happened today?";
    stage = (
      <Phone title="Sunrise Bistro" tab="Home">
        <div className="p-3.5">
          <div style={enter(lt, 0)} className="rounded-2xl bg-[#66d34c]/12 p-3 ring-1 ring-[#66d34c]/30">
            <p className="text-[10.5px] text-white/60">Good evening, Priya 👋</p>
            <p className="text-[15px] font-bold text-white">Today so far</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {stats.map((s, i) => (
              <div key={s.label} style={enter(lt, 0.3 + i * 0.15)} className="rounded-2xl bg-white/[0.06] p-3">
                <s.icon className="size-4 text-[#8be36f]" aria-hidden />
                <p className="mt-2 text-[22px] font-bold text-white tabular-nums">{Math.round(s.n * ease((lt - 0.5 - i * 0.15) / 1.2))}</p>
                <p className="text-[10.5px] text-white/55">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {lt > 2.4 && <Bubble me style={enter(lt, 2.4)}>{q}</Bubble>}
            {lt > 3.4 && <Bubble style={enter(lt, 3.4)}>12 messages answered, 6 new leads, 4 calls and 3 new reviews ⭐</Bubble>}
          </div>
        </div>
      </Phone>
    );
  } else if (part === "analytics") {
    const bars = [32, 44, 38, 56, 61, 72, 88];
    stage = (
      <Phone title="Analytics" tab="Activity">
        <div className="p-4">
          <div style={enter(lt, 0)} className="flex gap-1.5 text-[10px]">
            {["Today", "7 days", "30 days"].map((x, i) => (
              <span key={x} className={`rounded-full px-2.5 py-1 ${i === 1 ? "bg-[#66d34c] font-semibold text-[#06100a]" : "bg-white/[0.07] text-white/70"}`}>
                {x}
              </span>
            ))}
          </div>
          <div style={enter(lt, 0.2)} className="mt-4 grid grid-cols-3 gap-2">
            {[
              { l: "Leads", v: "48", i: Users },
              { l: "Visitors", v: "1.2k", i: Globe },
              { l: "Emails", v: "320", i: Mail },
            ].map((x) => (
              <div key={x.l} className="rounded-xl bg-white/[0.06] p-2.5">
                <x.i className="size-3.5 text-[#8be36f]" aria-hidden />
                <p className="mt-1 text-[15px] font-bold text-white">{x.v}</p>
                <p className="text-[9.5px] text-white/55">{x.l}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex h-[150px] items-end gap-2 rounded-2xl bg-white/[0.04] p-3">
            {bars.map((b, i) => (
              <span key={i} className="flex-1 rounded-t-md bg-[#66d34c]" style={{ height: `${b * ease((lt - 0.5 - i * 0.12) / 0.7)}%`, opacity: 0.55 + i * 0.06 }} />
            ))}
          </div>
          <p style={enter(lt, 1.8)} className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-[#8be36f]">
            <TrendingUp className="size-4" aria-hidden /> Leads up 38% this week
          </p>
        </div>
      </Phone>
    );
  }

  return (
    <div style={{ width: W, height: H }} className="relative overflow-hidden bg-[#030806] font-sans text-white">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 45% at ${50 + 30 * Math.sin(t / 5)}% ${20 + 8 * Math.cos(t / 4)}%, rgba(102,211,76,.28), transparent 70%), radial-gradient(50% 40% at ${20 + 15 * Math.cos(t / 6)}% 95%, rgba(56,189,248,.14), transparent 70%)`,
        }}
      />
      <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% 50%, transparent 55%, rgba(0,0,0,.55))" }} />
      <div className="absolute inset-x-5 top-5 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <BrandMark className="size-7" />
          <Wordmark className="text-[17px]" />
        </span>
        {part !== "intro" && part !== "outro" && (
          <span className="flex items-center gap-1 rounded-full bg-white/[0.08] px-3 py-1 text-[10.5px] font-semibold text-white/80">
            {k}/{tourParts.length - 2}
            {part === "ibax" ? <Bot className="size-3" aria-hidden /> : part === "connect" ? <Lock className="size-3" aria-hidden /> : part === "say" ? <Gift className="size-3" aria-hidden /> : <Check className="size-3" aria-hidden />}
          </span>
        )}
      </div>
      {stage}
      {tap}
      <div className="absolute inset-x-5 bottom-5 flex gap-1">
        {durations.map((d, i) => (
          <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/12">
            <span className="block h-full rounded-full bg-[#66d34c]" style={{ width: `${i < k ? 100 : i === k ? clamp(lt / dur) * 100 : 0}%` }} />
          </span>
        ))}
      </div>
    </div>
  );
}
