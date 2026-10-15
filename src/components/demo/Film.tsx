import type { CSSProperties, ReactNode } from "react";
import { Activity, Bell, Check, Ellipsis, Gift, House, LayoutGrid, Mic, SendHorizontal, ShieldCheck, Sparkles } from "lucide-react";
import { inTrial, providerInfo, serviceById, TRIAL_DAYS, type ServiceDef } from "@/content/app/services";
import { demoParts, type DemoMode } from "@/content/demoScripts";
import { BrandMark, Icon } from "@/components/app/ui";
import { Wordmark } from "@/components/navigation/Logo";

/**
 * One frame of a service's demo video, drawn from the time `t` (seconds), so the video can be
 * rendered frame by frame into an MP4 (scripts/demo-videos.mjs). 360×640 CSS px, rendered at 2×.
 * `durations` are the seconds of each part (see demoParts); a part of 0 seconds is skipped.
 */

const W = 360;
const H = 640;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const lerp = (a: number, b: number, x: number) => a + (b - a) * x;

/** Fades and lifts in `delay` seconds into a part. */
function enter(lt: number, delay = 0, len = 0.5): CSSProperties {
  const x = ease((lt - delay) / len);
  return { opacity: x, transform: `translateY(${(1 - x) * 14}px) scale(${0.97 + 0.03 * x})` };
}

/** A finger that glides to `to` and taps it. Returns the finger and whether the tap happened. */
function finger(lt: number, dur: number, to: { x: number; y: number }, at = 0.55) {
  const from = { x: 300, y: 610 };
  const tapAt = dur * at;
  const move = ease((lt - (tapAt - 0.9)) / 0.8);
  const x = lerp(from.x, to.x, move);
  const y = lerp(from.y, to.y, move);
  const press = lt > tapAt && lt < tapAt + 0.25;
  const ripple = clamp((lt - tapAt) / 0.6);
  const node = (
    <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", zIndex: 30, opacity: ease(lt / 0.4) }}>
      {lt > tapAt && ripple < 1 && (
        <span style={{ position: "absolute", left: "50%", top: "50%", width: 70, height: 70, marginLeft: -35, marginTop: -35, borderRadius: 999, border: "2px solid #66d34c", opacity: 1 - ripple, transform: `scale(${0.4 + ripple * 1.2})` }} />
      )}
      <span
        style={{ display: "block", width: 30, height: 30, borderRadius: 999, border: "2px solid rgba(255,255,255,.95)", background: press ? "rgba(102,211,76,.8)" : "rgba(255,255,255,.3)", boxShadow: "0 8px 24px rgba(0,0,0,.6)", transform: `scale(${press ? 0.78 : 1})` }}
      />
    </div>
  );
  return { node, tapped: lt > tapAt + 0.15 };
}

/** Where the phone sits in the 360×640 frame. */
const PT = 70;
const navItems = [
  { label: "Home", icon: House },
  { label: "IBAX", icon: null },
  { label: "Services", icon: LayoutGrid },
  { label: "Activity", icon: Activity },
  { label: "More", icon: Ellipsis },
];

/** The ibaxai app as it looks on a phone: header, page and the bottom menu. */
function Phone({ title, tab, children }: { title: string; tab: "IBAX" | "Services"; children: ReactNode }) {
  return (
    <div style={{ position: "absolute", left: 28, top: PT, width: 304, height: 46 + 420 + 54 }} className="overflow-hidden rounded-[30px] border border-white/12 bg-[#050c07] shadow-[0_30px_80px_-20px_rgba(0,0,0,.9),0_0_60px_-25px_rgba(102,211,76,.7)]">
      <div className="flex h-[46px] items-center gap-2 border-b border-white/[0.06] bg-[#07110a] px-4">
        <BrandMark className="size-6" />
        <span className="flex-1 truncate text-[13px] font-semibold text-white">{title}</span>
        <Bell className="size-4 text-white/60" aria-hidden />
      </div>
      <div className="relative [background:radial-gradient(80%_50%_at_100%_0%,rgba(102,211,76,.10),transparent_70%)]" style={{ height: 420 }}>
        {children}
      </div>
      <div className="mx-2 flex h-[46px] items-center justify-around rounded-2xl border border-white/[0.07] bg-[#0a150d]">
        {navItems.map((n) => {
          const on = n.label === tab;
          return (
            <span key={n.label} className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[8.5px] ${on ? "bg-[#66d34c]/12 text-white ring-1 ring-[#66d34c]/40" : "text-white/45"}`}>
              {n.icon ? <n.icon className="size-3.5" aria-hidden /> : <BrandMark className="size-3.5" />}
              {n.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Bubble({ me, style, children }: { me?: boolean; style?: CSSProperties; children: ReactNode }) {
  return (
    <div
      style={style}
      className={me ? "ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-[#66d34c] px-3 py-2 text-[12px] leading-snug text-[#06100a]" : "max-w-[86%] rounded-2xl rounded-bl-md bg-white/[0.09] px-3 py-2 text-[12px] leading-snug text-white"}
    >
      {children}
    </div>
  );
}

const Btn = ({ children, ghost, done }: { children: ReactNode; ghost?: boolean; done?: boolean }) => (
  <div
    className={
      done
        ? "rounded-full bg-white/10 py-2.5 text-center text-[12px] font-semibold text-[#8be36f]"
        : ghost
          ? "rounded-full border border-[#66d34c]/60 py-2.5 text-center text-[12px] font-semibold text-[#8be36f]"
          : "rounded-full bg-[#66d34c] py-2.5 text-center text-[12px] font-semibold text-[#06100a] shadow-[0_10px_30px_-10px_rgba(102,211,76,.9)]"
    }
  >
    {children}
  </div>
);

/** Typewriter: the first part of `text` at time lt. */
const typed = (text: string, lt: number, start = 0.2, cps = 22) => text.slice(0, Math.max(0, Math.floor((lt - start) * cps)));

export type FilmProps = { svc: ServiceDef; mode: DemoMode; durations: number[]; t: number };

export function Film({ svc, mode, durations, t }: FilmProps) {
  const parts = demoParts(mode);
  // Which part is on, and how far into it.
  let k = 0;
  let start = 0;
  for (; k < durations.length - 1; k++) {
    if (t < start + durations[k]) break;
    start += durations[k];
  }
  while (k < durations.length - 1 && durations[k] === 0) k++;
  const part = parts[k];
  const lt = t - start;
  const dur = durations[k] || 3;
  const trial = inTrial(svc.id);
  const acc = svc.connect.map((p) => providerInfo[p].name);
  const has = (name: string) => durations[parts.indexOf(name as never)] > 0;

  let stage: ReactNode = null;
  let tap: ReactNode = null;

  if (part === "intro") {
    stage = (
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div style={enter(lt, 0, 0.7)} className="mx-auto w-fit drop-shadow-[0_0_40px_rgba(102,211,76,.75)]">
            <BrandMark className="size-24" />
          </div>
          <div style={enter(lt, 0.25)} className="mt-4 flex justify-center">
            <Wordmark className="text-[30px]" />
          </div>
          <p style={enter(lt, 0.45)} className="mt-7 text-[34px] leading-[1.05] font-bold tracking-tight text-white">
            Just say it.
          </p>
          <p style={enter(lt, 0.9)} className="text-[34px] leading-[1.05] font-bold tracking-tight text-[#7dff3a]">
            IBAX does it.
          </p>
          <p style={enter(lt, 1.4)} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-4 py-2 text-[13px] text-white/80">
            <Icon name={svc.icon} className="size-4 text-[#8be36f]" /> {svc.name}
          </p>
        </div>
      </div>
    );
  } else if (part === "about") {
    stage = (
      <div className="absolute inset-x-6 top-[120px] text-center">
        <div style={enter(lt, 0)} className="mx-auto grid size-20 place-items-center rounded-3xl bg-[#66d34c]/15 text-[#8be36f] ring-1 ring-[#66d34c]/40 shadow-[0_0_60px_-15px_rgba(102,211,76,.8)]">
          <Icon name={svc.icon} className="size-10" />
        </div>
        <p style={enter(lt, 0.3)} className="mt-5 text-[26px] leading-tight font-bold text-white">
          {svc.name}
        </p>
        <p style={enter(lt, 0.6)} className="mx-auto mt-2 max-w-[290px] text-[13px] text-white/65">
          {svc.short}
        </p>
        <div className="mt-6 space-y-2 text-left">
          {svc.features.slice(0, 5).map((f, i) => (
            <p key={f} style={enter(lt, 1 + i * 0.45)} className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] px-3.5 py-2.5 text-[12.5px] text-white">
              <Check className="size-4 shrink-0 text-[#7dff3a]" aria-hidden /> {f}
            </p>
          ))}
        </div>
      </div>
    );
  } else if (mode === "talk" && part !== "done") {
    // One chat that grows part by part: ask → price → details → connect.
    const order = ["ask", "price", "details", "connect"];
    const now = order.indexOf(part);
    const local = (p: string) => (p === part ? lt : order.indexOf(p) < now ? 99 : -1);
    const msgs: ReactNode[] = [];
    const ask = local("ask");
    const askText = `I want ${svc.name}`;
    if (ask >= 0) {
      const done = ask > 0.4 + askText.length / 22 + 0.3;
      if (!done) {
        // Typing in the input box first.
      } else msgs.push(<Bubble key="a" me style={enter(ask, 0.4 + askText.length / 22 + 0.3, 0.35)}>{askText}</Bubble>);
    }
    const price = local("price");
    let priceTap: ReturnType<typeof finger> | null = null;
    if (price >= 0) {
      const pd = part === "price" ? dur : 99;
      priceTap = part === "price" ? finger(price, pd, { x: 180, y: 0 }) : null;
      const paid = price > pd * 0.55 + 0.15;
      msgs.push(
        <Bubble key="p1" style={enter(price, 0.2)}>
          {trial ? `Here's ${svc.name}. Try it free for ${TRIAL_DAYS} days 👇` : `Here's ${svc.name}. Pay securely below 👇`}
        </Bubble>,
        <div key="p2" style={enter(price, 0.7)} className="max-w-[90%] space-y-2 rounded-2xl border border-[#66d34c]/30 bg-[#66d34c]/[0.07] p-3">
          <p className="flex items-center gap-2 text-[12px] font-semibold text-white">
            <Icon name={svc.icon} className="size-4 text-[#8be36f]" /> {svc.name}
          </p>
          <p className="text-[11px] text-white/60">{svc.billing === "one-time" ? "One-time payment" : trial ? `${TRIAL_DAYS} days free · then monthly` : "Monthly plan · UPI or card"}</p>
          <div data-tap-target>{paid ? <Btn done>{trial ? "✓ Free trial started" : "✓ Paid"}</Btn> : <Btn>{trial ? "Start free trial" : "Pay securely"}</Btn>}</div>
        </div>,
      );
    }
    const det = local("details");
    if (det >= 0) {
      const answer = (svc.info.find((f) => f.required) ?? svc.info[0])?.placeholder?.split("\n")[0] ?? "We're a family salon in Pune, open 10 AM to 9 PM.";
      msgs.push(
        <Bubble key="d1" style={enter(det, 0.2)}>
          Great! Tell me a little about your business.
        </Bubble>,
        <Bubble key="d2" me style={enter(det, 1.4)}>
          {answer}
        </Bubble>,
        <Bubble key="d3" style={enter(det, 2.6)}>
          Saved ✓
        </Bubble>,
      );
    }
    const con = local("connect");
    let conTap: ReturnType<typeof finger> | null = null;
    if (con >= 0 && acc.length) {
      const cd = part === "connect" ? dur : 99;
      conTap = part === "connect" ? finger(con, cd, { x: 180, y: 0 }) : null;
      const linked = con > cd * 0.55 + 0.15;
      msgs.push(
        <Bubble key="c1" style={enter(con, 0.2)}>
          Now connect {acc.join(" & ")} 👇
        </Bubble>,
        <div key="c2" style={enter(con, 0.6)} className="max-w-[90%] rounded-2xl border border-white/10 bg-white/[0.05] p-3" data-tap-target>
          {linked ? <Btn done>✓ {acc[0]} connected</Btn> : <Btn ghost>Connect {acc[0]}</Btn>}
        </div>,
      );
    }
    const typing = ask >= 0 && part === "ask" ? typed(askText, lt, 0.4) : "";
    const active = priceTap ?? conTap;
    stage = (
      <Phone title="IBAX" tab="IBAX">
        <div className="absolute inset-x-0 top-0 bottom-[58px] flex flex-col justify-end gap-2 overflow-hidden px-3 pb-3">
          <p className="mb-auto pt-3 text-center text-[10px] tracking-[0.2em] text-white/35 uppercase">
            <Sparkles className="mr-1 inline size-3" aria-hidden /> Just say it
          </p>
          {msgs}
        </div>
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
          <div className="flex h-10 flex-1 items-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-[12px] text-white">
            {typing || <span className="text-white/35">Type or tap the mic…</span>}
            {typing && typing.length < askText.length && <span className="ml-0.5 inline-block h-4 w-px bg-white" />}
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
    // The button being tapped sits at the bottom of the chat, just above the input.
    if (active) tap = finger(lt, dur, { x: 150, y: PT + 46 + 420 - 58 - 32 }).node;
    if (part === "ask") tap = finger(lt, dur, { x: 300, y: PT + 46 + 420 - 32 }, Math.min(0.9, (0.5 + askText.length / 22) / dur)).node;
  } else if (part === "done" || (part === "activate" && lt > dur * 0.6)) {
    const lt2 = part === "done" ? lt : lt - dur * 0.6;
    stage = (
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div style={enter(lt2, 0, 0.6)} className="relative mx-auto grid size-28 place-items-center rounded-full bg-[#66d34c] text-[#06100a] shadow-[0_0_100px_-10px_rgba(102,211,76,1)]">
            <span className="absolute inset-0 rounded-full border-2 border-[#66d34c]" style={{ transform: `scale(${1 + (lt2 % 1.4) * 0.5})`, opacity: 1 - (lt2 % 1.4) / 1.4 }} />
            <Check className="size-14" strokeWidth={3} aria-hidden />
          </div>
          <p style={enter(lt2, 0.4)} className="mt-7 text-[26px] font-bold text-white">
            {svc.name}
          </p>
          <p style={enter(lt2, 0.7)} className="text-[20px] font-semibold text-[#7dff3a]">
            is ON ✓
          </p>
          {part === "done" && (
            <p style={enter(lt2, 1.3)} className="mt-6 text-[15px] text-white/75">
              Just say it. IBAX does it.
            </p>
          )}
        </div>
      </div>
    );
  } else if (part === "manual") {
    const steps = ["Services", trial ? "Start free trial" : "Buy & pay", "Your details", ...(has("connect") ? ["Connect"] : []), "Activate"];
    stage = (
      <div className="absolute inset-x-8 top-[150px]">
        <p style={enter(lt, 0)} className="text-[12px] tracking-[0.2em] text-[#7dff3a] uppercase">
          Manually
        </p>
        <p style={enter(lt, 0.25)} className="mt-1 text-[30px] leading-tight font-bold text-white">
          Do it yourself
        </p>
        <ol className="mt-6 space-y-2.5">
          {steps.map((s, i) => (
            <li key={s} style={enter(lt, 0.6 + i * 0.35)} className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-3.5 py-2.5 text-[13px] text-white">
              <span className="grid size-6 place-items-center rounded-full bg-[#66d34c] text-[11px] font-bold text-[#06100a]">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>
    );
  } else if (part === "services") {
    const others = ["whatsapp", "website", "instagram", "reviews", "followup", "youtube", "email"].filter((x) => x !== svc.id).slice(0, 5);
    const cells = [svc.id, ...others];
    const pos = (i: number) => ({ x: 28 + 14 + (i % 2) * 144 + 66, y: PT + 46 + 18 + Math.floor(i / 2) * 120 + 52 });
    const f = finger(lt, dur, pos(0));
    stage = (
      <Phone title="Services" tab="Services">
        <div className="grid grid-cols-2 gap-3 p-3.5">
          {cells.map((id, i) => {
            const s = serviceById(id);
            return (
              <div key={id} style={enter(lt, 0.1 + i * 0.12)} className={`flex h-[108px] flex-col justify-between rounded-2xl p-3 ${i === 0 ? (f.tapped ? "bg-[#66d34c]/30 ring-2 ring-[#66d34c]" : "bg-[#66d34c]/15 ring-1 ring-[#66d34c]/50") : "bg-white/[0.06]"}`}>
                <Icon name={s?.icon ?? "Sparkles"} className="size-5 text-[#8be36f]" />
                <span className="text-[11.5px] leading-tight font-semibold text-white">{s?.name}</span>
              </div>
            );
          })}
        </div>
      </Phone>
    );
    tap = f.node;
  } else if (part === "buy") {
    // Service page → tap Buy / Start trial → (pay sheet → tap Pay) or "trial started".
    const half = trial ? dur : dur * 0.5;
    const f1 = finger(lt, half, { x: 180, y: PT + 46 + 360 });
    const sheet = !trial && lt > half;
    const f2 = sheet ? finger(lt - half, dur - half, { x: 180, y: PT + 46 + 360 }) : null;
    stage = (
      <Phone title={svc.name} tab="Services">
        <div className="space-y-2 p-4">
          <span style={enter(lt, 0)} className="grid size-12 place-items-center rounded-2xl bg-[#66d34c]/15 text-[#8be36f]">
            <Icon name={svc.icon} className="size-6" />
          </span>
          <p style={enter(lt, 0.15)} className="text-[17px] font-bold text-white">
            {svc.name}
          </p>
          <p style={enter(lt, 0.3)} className="text-[11.5px] text-white/60">
            {svc.short}
          </p>
          {svc.features.slice(0, 4).map((x, i) => (
            <p key={x} style={enter(lt, 0.45 + i * 0.12)} className="flex items-center gap-2 text-[11.5px] text-white/80">
              <Check className="size-3.5 text-[#7dff3a]" aria-hidden /> {x}
            </p>
          ))}
        </div>
        <div className="absolute inset-x-4" style={{ top: 360 - 20 }}>
          {f1.tapped && trial ? <Btn done>🎁 Free trial started</Btn> : <Btn>{trial ? `Start ${TRIAL_DAYS}-day free trial` : "Buy now"}</Btn>}
        </div>
        {sheet && (
          <div style={{ transform: `translateY(${(1 - ease((lt - half) / 0.5)) * 100}%)` }} className="absolute inset-x-0 bottom-0 h-[300px] rounded-t-3xl border-t border-white/10 bg-[#0c1a10] p-4">
            <p className="text-[11px] text-white/60">Secure payment</p>
            <p className="text-[15px] font-bold text-white">{svc.name}</p>
            {["UPI · Google Pay / PhonePe", "Card", "Net banking"].map((m, i) => (
              <p key={m} className={`mt-2 rounded-xl px-3 py-2 text-[11.5px] text-white ${i === 0 ? "bg-[#66d34c]/15 ring-1 ring-[#66d34c]/50" : "bg-white/[0.06]"}`}>
                {m}
              </p>
            ))}
            <p className="mt-2 flex items-center gap-1 text-[10px] text-white/45">
              <ShieldCheck className="size-3" aria-hidden /> Secured by Razorpay
            </p>
            <div className="absolute inset-x-4 bottom-[22px]">{f2?.tapped ? <Btn done>✓ Paid</Btn> : <Btn>Pay</Btn>}</div>
          </div>
        )}
      </Phone>
    );
    tap = sheet ? f2!.node : f1.node;
    if (trial && f1.tapped) {
      stage = (
        <>
          {stage}
          <div style={{ ...enter(lt - dur * 0.55, 0.2), position: "absolute", left: 60, top: 260, width: 240 }} className="rounded-2xl bg-[#0c1a10] p-4 text-center shadow-[0_20px_60px_rgba(0,0,0,.7)] ring-1 ring-[#66d34c]/40">
            <Gift className="mx-auto size-8 text-[#7dff3a]" aria-hidden />
            <p className="mt-1 text-[13px] font-semibold text-white">Free trial started</p>
            <p className="text-[11px] text-white/60">{TRIAL_DAYS} days free · no payment</p>
          </div>
        </>
      );
    }
  } else if (part === "details") {
    const fields = svc.info.length ? svc.info.slice(0, 4) : [{ key: "about", label: "About your business", placeholder: "Filled in from your profile" }];
    const f = finger(lt, dur, { x: 180, y: PT + 46 + 360 }, 0.75);
    stage = (
      <Phone title="Your details" tab="Services">
        <div className="space-y-3 p-4">
          {fields.map((x, i) => {
            const text = (x.placeholder ?? "Filled in from your business").split("\n")[0];
            return (
              <div key={x.key} style={enter(lt, i * 0.15)}>
                <p className="text-[10.5px] text-white/55">{x.label}</p>
                <div className="mt-1 min-h-9 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-[11.5px] text-white">{typed(text, lt, 0.4 + i * 0.7, 30)}</div>
              </div>
            );
          })}
        </div>
        <div className="absolute inset-x-4" style={{ top: 360 - 20 }}>
          {f.tapped ? <Btn done>✓ Saved</Btn> : <Btn>Save</Btn>}
        </div>
      </Phone>
    );
    tap = f.node;
  } else if (part === "connect") {
    const f = finger(lt, dur, { x: 180, y: PT + 46 + 230 });
    stage = (
      <Phone title="Connect accounts" tab="Services">
        <div className="p-5 text-center">
          <p style={enter(lt, 0)} className="text-[15px] font-semibold text-white">
            Connect {acc.join(" & ")}
          </p>
          <p style={enter(lt, 0.25)} className="mt-2 text-[11.5px] text-white/60">
            {svc.connect[0] ? providerInfo[svc.connect[0]].help : ""}
          </p>
        </div>
        <div className="absolute inset-x-6" style={{ top: 230 - 20 }}>
          {f.tapped ? <Btn done>✓ Connected</Btn> : <Btn ghost>Connect {acc[0]}</Btn>}
        </div>
      </Phone>
    );
    tap = f.node;
  } else if (part === "activate") {
    const f = finger(lt, dur * 0.6, { x: 180, y: PT + 46 + 360 });
    stage = (
      <Phone title={svc.name} tab="Services">
        <div className="space-y-2.5 p-4">
          {["Details saved", acc.length ? `${acc[0]} connected` : "Ready to go", "Test passed"].map((x, i) => (
            <p key={x} style={enter(lt, i * 0.3)} className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] px-3 py-2.5 text-[12px] text-white">
              <Check className="size-4 text-[#7dff3a]" aria-hidden /> {x}
            </p>
          ))}
        </div>
        <div className="absolute inset-x-4" style={{ top: 360 - 20 }}>
          <Btn>Activate</Btn>
        </div>
      </Phone>
    );
    tap = f.node;
  }

  const label = mode === "talk" ? "Way 1 · Just say it" : "Way 2 · Manually";
  return (
    <div style={{ width: W, height: H }} className="relative overflow-hidden bg-[#030806] font-sans text-white">
      {/* Moving light in the background */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 45% at ${50 + 30 * Math.sin(t / 5)}% ${20 + 8 * Math.cos(t / 4)}%, rgba(102,211,76,.28), transparent 70%), radial-gradient(50% 40% at ${20 + 15 * Math.cos(t / 6)}% 95%, rgba(56,189,248,.14), transparent 70%)`,
        }}
      />
      {/* Soft vignette for depth */}
      <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% 50%, transparent 55%, rgba(0,0,0,.55))" }} />

      {/* Top bar */}
      <div className="absolute inset-x-5 top-5 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <BrandMark className="size-7" />
          <Wordmark className="text-[17px]" />
        </span>
        {part !== "intro" && <span className="rounded-full bg-white/[0.08] px-3 py-1 text-[10.5px] font-semibold text-white/80">{label}</span>}
      </div>

      {stage}
      {tap}

      {/* Progress through the parts */}
      <div className="absolute inset-x-5 bottom-5 flex gap-1">
        {durations.map((d, i) =>
          d > 0 ? (
            <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/12">
              <span className="block h-full rounded-full bg-[#66d34c]" style={{ width: `${i < k ? 100 : i === k ? clamp(lt / dur) * 100 : 0}%` }} />
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}
