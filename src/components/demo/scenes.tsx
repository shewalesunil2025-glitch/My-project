import type { ReactNode } from "react";
import { BadgeCheck, Calendar, Check, Gift, Mail, MessageCircle, Phone, Send, ShieldCheck, Sparkles, Star, TrendingUp } from "lucide-react";
import { Icon } from "@/components/app/ui";
import { inTrial, providerInfo, serviceById, TRIAL_DAYS, type ServiceDef } from "@/content/app/services";
import { formatPrice, type Currency } from "@/config/product";
import { cn } from "@/lib/cn";
import { TapFlow, type TapScreen } from "./TapFlow";

/**
 * The scenes of a service's demo video, built from the service catalogue so every service
 * gets one and it stays right when a service changes. Each scene has a caption (shown and
 * spoken) and an animated picture.
 */

export type Scene = { title: string; say: string; picture: ReactNode };

/** Children appear one after another. */
const step = (i: number) => ({ animationDelay: `${0.25 + i * 0.55}s` });
const appear = "opacity-0 animate-[dialog-in_0.6s_var(--ease-out-expo)_forwards]";

function Bubble({ me, i, children }: { me?: boolean; i: number; children: ReactNode }) {
  return (
    <div style={step(i)} className={cn(appear, "max-w-[82%] rounded-2xl px-3 py-2 text-[0.7rem] leading-snug", me ? "ml-auto rounded-br-sm bg-flow text-ink-950" : "rounded-bl-sm bg-white/[0.09]")}>
      {children}
    </div>
  );
}
function Line({ i, children, className }: { i: number; children: ReactNode; className?: string }) {
  return (
    <div style={step(i)} className={cn(appear, "flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2 text-[0.7rem]", className)}>
      {children}
    </div>
  );
}

const chat = (title: string, lines: [boolean, string][]) => (
  <div className="mx-auto flex h-full w-full max-w-sm flex-col justify-end gap-2 overflow-hidden">
    <p className="flex items-center gap-2 text-xs text-fg-muted">
      <MessageCircle className="size-4 text-flow" aria-hidden /> {title}
    </p>
    {lines.map(([me, t], i) => (
      <Bubble key={i} me={me} i={i}>
        {t}
      </Bubble>
    ))}
  </div>
);

const posts = (platform: string, kind: string) => (
  <div className="mx-auto w-full max-w-sm">
    <p className="mb-2 flex items-center gap-2 text-xs text-fg-muted">
      <Calendar className="size-4 text-flow" aria-hidden /> {platform} · this month
    </p>
    <div className="grid grid-cols-4 gap-1.5">
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          style={{ animationDelay: `${0.2 + i * 0.18}s` }}
          className={cn(appear, "grid aspect-square place-items-center rounded-lg text-[0.6rem] font-semibold", i % 4 === 1 ? "bg-flow/35" : "bg-gradient-to-br from-flow/25 to-sky-400/20")}
        >
          {i % 4 === 1 ? kind : ""}
        </div>
      ))}
    </div>
    <Line i={5} className="mt-2">
      <Sparkles className="size-4 shrink-0 text-flow" aria-hidden /> Caption &amp; hashtags written by IBAX
    </Line>
    <Line i={6} className="mt-1.5 bg-flow/15">
      <BadgeCheck className="size-4 shrink-0 text-flow" aria-hidden /> Approve → posted on time
    </Line>
  </div>
);

/** What the service does, as a short animated story. */
const how: Record<string, { say: string; picture: () => ReactNode }> = {
  website: {
    say: "Pick a template and your website fills itself in from your business details: services, prices, timings, map and a WhatsApp button. Change anything you like and publish in one click. Every enquiry from the site lands in your Leads.",
    picture: () => (
      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-ink-900">
        <div className="flex gap-1 border-b border-white/10 px-3 py-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-2 rounded-full bg-white/20" />
          ))}
        </div>
        <div className="space-y-2 p-3">
          <div style={step(0)} className={cn(appear, "h-16 rounded-lg bg-gradient-to-r from-flow/40 to-sky-400/30")} />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} style={step(i)} className={cn(appear, "h-10 rounded-lg bg-white/[0.08]")} />
            ))}
          </div>
          <Line i={4}>Services · Prices · Hours · Map</Line>
          <Line i={5} className="justify-center bg-flow text-ink-950 font-semibold">
            Publish ✓
          </Line>
        </div>
      </div>
    ),
  },
  voice: {
    say: "When a customer calls, your AI assistant picks up, answers questions about your business, takes appointment requests, and hands over to you when needed. You get a summary of every call in the app.",
    picture: () => (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-2">
        <Line i={0} className="bg-flow/15">
          <Phone className="size-4 animate-pulse text-flow" aria-hidden /> Incoming call · +91 98•••••210
        </Line>
        <Bubble i={1}>Hello! Thank you for calling. How can I help?</Bubble>
        <Bubble me i={2}>Are you open on Sunday?</Bubble>
        <Bubble i={3}>Yes, 10 AM to 6 PM. Shall I book a time for you?</Bubble>
        <Line i={4}>
          <BadgeCheck className="size-4 text-flow" aria-hidden /> Call summary saved · Appointment request
        </Line>
      </div>
    ),
  },
  whatsapp: {
    say: "When a customer messages your WhatsApp, IBAX replies in seconds, in their language, using your prices, timings and answers. It saves new leads, and when someone needs you, it stops and alerts you.",
    picture: () =>
      chat("WhatsApp · your own number", [
        [false, "Hi, what are your timings?"],
        [true, "Hello! We're open 10 AM – 9 PM, Monday to Saturday 😊"],
        [false, "Price of a haircut?"],
        [true, "Haircut is ₹200. Shall I book a slot for you?"],
        [false, "Yes, tomorrow 5 PM"],
      ]),
  },
  instagram: {
    say: "IBAX plans your Instagram month: photo posts and reels with captions and hashtags. You approve with one tap, or let it post automatically at the best time. It also helps with comments and DMs.",
    picture: () => posts("Instagram", "Reel"),
  },
  facebook: {
    say: "IBAX keeps your Facebook Page active: it writes and schedules posts, and helps answer page messages and comments, with your approval or automatically.",
    picture: () => posts("Facebook Page", "Video"),
  },
  youtube: {
    say: "IBAX writes your YouTube Shorts: the idea, script, title, description and tags, and schedules them on your channel so you post regularly without the stress.",
    picture: () => (
      <div className="mx-auto flex w-full max-w-sm items-center gap-4">
        <div style={step(0)} className={cn(appear, "grid aspect-[9/16] w-28 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-red-500/40 to-flow/20 text-xs font-semibold")}>
          ▶ Short
        </div>
        <div className="flex-1 space-y-2">
          <Line i={1}>Script ✓</Line>
          <Line i={2}>Title &amp; tags ✓</Line>
          <Line i={3}>Description ✓</Line>
          <Line i={4} className="bg-flow/15">
            Scheduled · Fri 7 PM
          </Line>
        </div>
      </div>
    ),
  },
  "social-pack": {
    say: "The Social Pack runs Instagram, Facebook and YouTube together from one plan, so all three stay active with fresh posts, reels and Shorts every month.",
    picture: () => (
      <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-2">
        {["Instagram", "Facebook", "YouTube"].map((p, i) => (
          <div key={p} style={step(i)} className={cn(appear, "space-y-1.5 rounded-xl bg-white/[0.06] p-2 text-center text-xs")}>
            <p className="font-semibold">{p}</p>
            {[0, 1, 2].map((k) => (
              <div key={k} className="h-6 rounded bg-gradient-to-r from-flow/30 to-sky-400/20" />
            ))}
          </div>
        ))}
      </div>
    ),
  },
  email: {
    say: "IBAX writes your emails: offers, newsletters and follow-ups to your customers, sends them on time, and shows who opened them.",
    picture: () => (
      <div className="mx-auto w-full max-w-sm space-y-2">
        <Line i={0}>
          <Mail className="size-4 text-flow" aria-hidden /> Subject: Diwali offer — 20% off this week
        </Line>
        <div style={step(1)} className={cn(appear, "rounded-xl bg-white/[0.06] p-3 text-xs text-fg-muted")}>
          Hi Priya, this Diwali enjoy 20% off on all services…
        </div>
        <Line i={2}>
          <Send className="size-4 text-flow" aria-hidden /> Sent to 240 customers
        </Line>
        <Line i={3} className="bg-flow/15">
          <TrendingUp className="size-4 text-flow" aria-hidden /> 41% opened
        </Line>
      </div>
    ),
  },
  reviews: {
    say: "After a happy customer visits, IBAX sends them a WhatsApp message from your number with a one-tap Google review link. More real reviews mean more people find you on Google. It never writes fake reviews.",
    picture: () => (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-2">
        <Line i={0}>
          <BadgeCheck className="size-4 text-flow" aria-hidden /> Rahul marked as customer
        </Line>
        <Bubble me i={1}>
          Thank you for visiting, Rahul! Could you rate us on Google? It takes 10 seconds 🙏 g.page/r/…/review
        </Bubble>
        <div style={step(2)} className={cn(appear, "flex items-center gap-1 rounded-xl bg-white/[0.06] px-3 py-2 text-amber-300")}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="size-4 fill-current" aria-hidden />
          ))}
          <span className="ml-2 text-xs text-fg">New Google review</span>
        </div>
      </div>
    ),
  },
  followup: {
    say: "Every new enquiry, from your website or added in the app, gets a WhatsApp thank-you from your number, then a gentle reminder or two. It stops as soon as they reply, and every morning you get a list of who to call.",
    picture: () => (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-2">
        <Line i={0} className="bg-flow/15">
          New enquiry · Neha · &quot;Bridal makeup&quot;
        </Line>
        <Bubble me i={1}>Hi Neha, thanks for your enquiry! We&apos;ll call you shortly 😊</Bubble>
        <Bubble me i={2}>Just checking — would you like to book a trial?</Bubble>
        <Bubble i={3}>Yes please, Saturday?</Bubble>
        <Line i={4}>
          <Check className="size-4 text-flow" aria-hidden /> Replied — reminders stopped
        </Line>
      </div>
    ),
  },
  support: {
    say: "Customers get instant answers to common questions on your website chat and WhatsApp: prices, timings, policies. Complaints are handed straight to you, so nothing is missed.",
    picture: () =>
      chat("Website chat & WhatsApp", [
        [false, "Do you deliver to Kothrud?"],
        [true, "Yes! Free delivery above ₹499 in Kothrud 🚚"],
        [false, "My order came damaged"],
        [true, "Sorry about that! I've alerted the owner — they'll contact you today."],
      ]),
  },
  "digital-marketing": {
    say: "Digital Marketing is the full package: social media, ads, Google profile, SEO, content and a monthly report, managed for you so your business keeps growing.",
    picture: () => (
      <div className="mx-auto w-full max-w-sm">
        <div className="flex h-28 items-end gap-1.5">
          {[30, 42, 38, 55, 50, 68, 80, 74, 92, 100].map((h, i) => (
            <div key={i} style={{ height: `${h}%`, animationDelay: `${0.2 + i * 0.12}s` }} className={cn(appear, "flex-1 rounded-t bg-flow/80")} />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
          {["Ads", "SEO", "Report"].map((t, i) => (
            <Line key={t} i={i + 2} className="justify-center">
              {t}
            </Line>
          ))}
        </div>
      </div>
    ),
  },
};


/* ── Mini app screens for the "do it yourself" walkthrough ── */
const Bar = ({ title }: { title: string }) => (
  <div className="flex items-center gap-2 border-b border-white/[0.07] px-3 py-2.5">
    <span className="grid size-5 place-items-center rounded-md bg-flow text-[0.6rem] font-black text-ink-950">i</span>
    <span className="text-[0.7rem] font-semibold">{title}</span>
  </div>
);
const Tap = ({ x, y, children, ghost }: { x: number; y: number; children: ReactNode; ghost?: boolean }) => (
  <div
    style={{ left: `${x}%`, top: `${y}%` }}
    className={cn(
      "absolute w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full py-2 text-center text-[0.7rem] font-semibold",
      ghost ? "border border-flow/50 text-flow" : "bg-flow text-ink-950 shadow-[0_8px_24px_-8px_rgb(102_211_76/0.9)]",
    )}
  >
    {children}
  </div>
);
const Screen = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="relative h-full bg-ink-950">
    <Bar title={title} />
    {children}
  </div>
);

function manualFlow(svc: ServiceDef, priceText: string, trial: boolean): TapScreen[] {
  const others = ["whatsapp", "website", "instagram", "reviews", "followup", "youtube", "email", "voice"].filter((x) => x !== svc.id).slice(0, 5);
  const cells = [svc.id, ...others];
  const pos = (k: number) => ({ x: k % 2 ? 73 : 27, y: 26 + Math.floor(k / 2) * 23 });
  const screens: TapScreen[] = [
    {
      tap: pos(0),
      screen: (
        <Screen title="Services">
          {cells.map((id, k) => (
            <div
              key={id}
              style={{ left: `${pos(k).x}%`, top: `${pos(k).y}%` }}
              className={cn("absolute grid h-[19%] w-[42%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl p-1 text-center text-[0.6rem] font-semibold", k === 0 ? "bg-flow/20 ring-1 ring-flow/60" : "bg-white/[0.06] text-fg-muted")}
            >
              {serviceById(id)?.name ?? id}
            </div>
          ))}
        </Screen>
      ),
    },
    {
      tap: { x: 50, y: 86 },
      screen: (
        <Screen title={svc.name}>
          <div className="space-y-1.5 p-3">
            <span className="grid size-9 place-items-center rounded-xl bg-flow/15 text-flow">
              <Icon name={svc.icon} className="size-5" />
            </span>
            <p className="text-sm font-semibold">{svc.name}</p>
            <p className="text-[0.7rem] text-flow">{priceText}</p>
            {svc.features.slice(0, 4).map((f) => (
              <p key={f} className="flex items-center gap-1.5 text-[0.6rem] text-fg-muted">
                <Check className="size-3 text-flow" aria-hidden /> {f}
              </p>
            ))}
          </div>
          <Tap x={50} y={86}>{trial ? `Start ${TRIAL_DAYS}-day free trial` : "Buy now"}</Tap>
        </Screen>
      ),
    },
    trial
      ? {
          screen: (
            <Screen title={svc.name}>
              <div className="grid h-[80%] place-items-center p-4 text-center">
                <div>
                  <Gift className="mx-auto size-10 text-flow" aria-hidden />
                  <p className="mt-2 text-sm font-semibold">Free trial started 🎁</p>
                  <p className="text-[0.65rem] text-fg-muted">{TRIAL_DAYS} days free · no payment</p>
                </div>
              </div>
            </Screen>
          ),
        }
      : {
          tap: { x: 50, y: 86 },
          screen: (
            <Screen title="Secure payment">
              <div className="space-y-2 p-3">
                <p className="text-[0.7rem] text-fg-muted">{svc.name}</p>
                <p className="text-lg font-bold">{priceText}</p>
                {["UPI · Google Pay / PhonePe", "Card", "Net banking"].map((m, k) => (
                  <div key={m} className={cn("rounded-lg px-2.5 py-2 text-[0.65rem]", k === 0 ? "bg-flow/15 ring-1 ring-flow/50" : "bg-white/[0.06]")}>
                    {m}
                  </div>
                ))}
                <p className="flex items-center gap-1 text-[0.55rem] text-fg-subtle">
                  <ShieldCheck className="size-3" aria-hidden /> Secured by Razorpay
                </p>
              </div>
              <Tap x={50} y={86}>Pay {priceText.replace(/\/month| one-time/, "")}</Tap>
            </Screen>
          ),
        },
  ];
  if (svc.info.length) {
    screens.push({
      tap: { x: 50, y: 86 },
      screen: (
        <Screen title="Your details">
          <div className="space-y-2 p-3">
            {svc.info.slice(0, 4).map((f, k) => (
              <div key={f.key}>
                <p className="text-[0.55rem] text-fg-muted">{f.label}</p>
                <div className="mt-0.5 overflow-hidden rounded-lg bg-white/[0.07] px-2 py-1.5 text-[0.6rem]">
                  <span className="inline-block animate-[demo-type_1.2s_steps(18)_forwards] overflow-hidden whitespace-nowrap" style={{ animationDelay: `${k * 0.25}s`, width: 0 }}>
                    {(f.placeholder ?? "Filled in from your business").split("\n")[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Tap x={50} y={86}>Save</Tap>
        </Screen>
      ),
    });
  }
  if (svc.connect.length) {
    screens.push({
      tap: { x: 50, y: 62 },
      screen: (
        <Screen title="Connect accounts">
          <div className="space-y-2 p-3 text-center">
            <p className="text-[0.7rem] font-semibold">Connect {list(svc.connect.map((p) => providerInfo[p].name))}</p>
            <p className="text-[0.6rem] text-fg-muted">{providerInfo[svc.connect[0]].help}</p>
          </div>
          <Tap x={50} y={62} ghost>
            Connect {providerInfo[svc.connect[0]].name}
          </Tap>
        </Screen>
      ),
    });
  }
  screens.push(
    {
      tap: { x: 50, y: 86 },
      screen: (
        <Screen title={svc.name}>
          <div className="space-y-2 p-3">
            {["Details saved", svc.connect.length ? "Account connected" : "Nothing to connect", "Test passed"].map((t) => (
              <p key={t} className="flex items-center gap-2 rounded-lg bg-white/[0.06] px-2.5 py-2 text-[0.65rem]">
                <Check className="size-3.5 text-flow" aria-hidden /> {t}
              </p>
            ))}
          </div>
          <Tap x={50} y={86}>Activate</Tap>
        </Screen>
      ),
    },
    {
      screen: (
        <Screen title={svc.name}>
          <div className="grid h-[85%] place-items-center text-center">
            <div>
              <span className="relative mx-auto grid size-16 place-items-center rounded-full bg-flow text-ink-950">
                <span className="absolute inset-0 animate-ping rounded-full bg-flow/40" />
                <Check className="size-8" aria-hidden />
              </span>
              <p className="mt-3 text-sm font-semibold">{svc.name} is ON</p>
              <p className="text-[0.6rem] text-fg-muted">Working for you 24/7</p>
            </div>
          </div>
        </Screen>
      ),
    },
  );
  return screens;
}

const list = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items.at(-1)}` : items[0] ?? "");

export function demoScenes(svc: ServiceDef, priceText: string): Scene[] {
  const scenes: Scene[] = [];
  const trial = inTrial(svc.id);
  scenes.push({
    title: svc.name,
    say: `${svc.name}. ${svc.short} ${svc.description}`,
    picture: null,
  });
  const h = how[svc.id];
  if (h) scenes.push({ title: "How it works", say: h.say, picture: h.picture() });
  scenes.push({
    title: "What you get",
    say: `What you get: ${list(svc.features.map((f) => f.replace(/₹/g, "rupees ")))}.`,
    picture: (
      <ul className="mx-auto w-full max-w-sm space-y-1.5">
        {svc.features.map((f, i) => (
          <li key={f} style={step(i)} className={cn(appear, "flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2 text-[0.7rem]")}>
            <Check className="size-4 shrink-0 text-flow" aria-hidden /> {f}
          </li>
        ))}
      </ul>
    ),
  });
  // Way 1: just tell IBAX.
  const firstDetail = svc.info.find((f) => f.required) ?? svc.info[0];
  const talk: [boolean, string][] = [
    [true, `I want ${svc.name}`],
    [false, trial ? `${svc.name} is ${priceText}. Try it free for ${TRIAL_DAYS} days, or pay now 👇` : `${svc.name} is ${priceText}. Pay securely on the card below 👇`],
    [true, trial ? "Start free trial" : "✓ Paid"],
    ...(firstDetail ? ([[false, `Great! ${firstDetail.label}?`], [true, (firstDetail.placeholder ?? "Sure — here are my details ✍️").split("\n")[0]]] as [boolean, string][]) : []),
    ...(svc.connect.length ? ([[false, `Now connect ${list(svc.connect.map((p) => providerInfo[p].name))} — tap the button 👇`]] as [boolean, string][]) : []),
    [false, `✅ ${svc.name} is ON!`],
  ];
  scenes.push({
    title: "Way 1 · Just say it",
    say: `The easiest way: just talk to IBAX. Open the IBAX chat, type or say "I want ${svc.name}". IBAX tells you the price${trial ? " and offers the free trial" : ""}, shows a secure payment card, asks for the few details it needs${svc.connect.length ? `, helps you connect ${list(svc.connect.map((p) => providerInfo[p].name))}` : ""}, and switches it on for you. You don't need to open any settings. Just say it, IBAX does it.`,
    picture: (
      <div className="mx-auto flex h-full w-full max-w-sm flex-col justify-end gap-1.5 overflow-hidden">
        <p className="flex items-center gap-2 text-xs text-fg-muted">
          <Sparkles className="size-4 text-flow" aria-hidden /> IBAX chat
        </p>
        {talk.map(([me, t], i) => (
          <Bubble key={i} me={me} i={i}>
            {t}
          </Bubble>
        ))}
      </div>
    ),
  });

  // Way 2: do it yourself.
  const manual = [
    `Services → ${svc.name}`,
    trial ? `Tap "Start free trial" or "Buy"` : svc.billing === "one-time" ? "Tap Buy and pay once" : "Pick monthly or yearly and pay",
    svc.info.length ? `Fill in: ${svc.info.map((f) => f.label.toLowerCase().replace(/[?.]+$/, "")).join(", ")}` : "Your business details fill in by themselves",
    svc.connect.length ? `Connect ${list(svc.connect.map((p) => providerInfo[p].name))}` : "Nothing to connect",
    "Tap Activate — it's tested and switched on",
  ];
  scenes.push({
    title: "Way 2 · Do it yourself",
    say: `Prefer to do it yourself? Go to Services and open ${svc.name}. ${manual.slice(1).join(". ")}. Setup time: ${svc.setupTime}.`,
    picture: <TapFlow screens={manualFlow(svc, priceText, trial)} />,
  });
  if (svc.configure.length) {
    scenes.push({
      title: "Your options",
      say: `You stay in control. You can choose: ${list(svc.configure.map((f) => f.label.toLowerCase().replace(/[?.]+$/, "")))}. Change them any time.`,
      picture: (
        <ul className="mx-auto w-full max-w-sm space-y-1.5">
          {svc.configure.map((f, i) => (
            <li key={f.key} style={step(i)} className={cn(appear, "flex items-center justify-between gap-3 rounded-xl bg-white/[0.06] px-3 py-2 text-[0.7rem]")}>
              <span className="min-w-0 truncate">{f.label}</span>
              {f.type === "toggle" ? (
                <span className={cn("h-5 w-9 shrink-0 rounded-full p-0.5", f.default === false ? "bg-white/15" : "bg-flow")}>
                  <span className={cn("block size-4 rounded-full bg-white", f.default !== false && "translate-x-4")} />
                </span>
              ) : (
                <span className="shrink-0 truncate rounded-lg bg-white/10 px-2 py-0.5 text-[0.7rem] text-fg-muted">{String(f.default ?? f.options?.[0] ?? "Your choice")}</span>
              )}
            </li>
          ))}
        </ul>
      ),
    });
  }
  if (svc.approvalNote) scenes.push({ title: "Good to know", say: svc.approvalNote, picture: null });
  scenes.push({
    title: trial ? `Try it free for ${TRIAL_DAYS} days` : "Get started",
    say: `${svc.name} costs ${priceText.replace("₹", "rupees ").replace("$", "dollars ")}.${trial ? ` You can try it free for ${TRIAL_DAYS} days first, no payment needed.` : ""} Tap the button below to get started.`,
    picture: null,
  });
  return scenes;
}

/** "₹699/month", "$49/month", "₹2,999 one-time". */
export function demoPrice(svc: ServiceDef, currency: Currency) {
  const amount = currency === "USD" ? (svc.usd ?? null) : svc.price;
  if (amount === null) return "a custom quote";
  return `${formatPrice(amount, currency)}${svc.billing === "one-time" ? " one-time" : "/month"}`;
}

/** Narration in pieces the voice server accepts (it takes up to 700 characters). */
export function speechParts(text: string, max = 600) {
  const parts: string[] = [];
  let cur = "";
  for (const sentence of text.match(/[^.!?]+[.!?]*\s*/g) ?? [text]) {
    if ((cur + sentence).length > max && cur) {
      parts.push(cur.trim());
      cur = "";
    }
    cur += sentence;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts.map((p) => p.slice(0, max));
}
