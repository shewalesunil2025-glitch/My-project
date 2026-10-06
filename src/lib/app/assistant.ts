import { formatPrice, product } from "@/config/product";
import { serviceById, services } from "@/content/app/services";
import type { ChatMessage, ContentItem, Workspace } from "./types";
import { logActivity, nowIso, uid } from "./store";

export type Reply = {
  text: string;
  links?: ChatMessage["links"];
  /** Optional change to apply to the workspace (e.g. a new draft post). */
  apply?: (ws: Workspace) => void;
  /** False when no intent matched — the AI model (if configured) gets the question. */
  matched: boolean;
};

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
const isTomorrow = (iso: string) => new Date(iso).toDateString() === new Date(Date.now() + 86400_000).toDateString();
const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

export const suggestions = [
  "What happened today?",
  "How many leads came today?",
  "What messages came on WhatsApp?",
  "Show today's calls.",
  "Show today's YouTube video.",
  "What reviews did we receive?",
  "Create tomorrow's Instagram post.",
  "Which leads need follow-up?",
];

export const helpSuggestions = [
  "How do I activate YouTube?",
  "How do I connect WhatsApp?",
  "Why is my automation paused?",
  "Show me today's activity.",
  "I need help.",
];

function activeService(ws: Workspace, id: string) {
  return ws.automations.some((a) => a.serviceId === id && a.status !== "setup");
}

function notActive(ws: Workspace, id: string, what: string): Reply {
  const svc = serviceById(id)!;
  return {
    matched: true,
    text: `${what} will show up here once ${svc.name} is active. It takes a few minutes to set up — you choose the plan, connect your account and I configure the rest.`,
    links: [{ label: `Get ${svc.name}`, href: `/app/services/${id}` }],
  };
}

/** Answers from the workspace's own data. Never invents numbers. */
export function localAnswer(ws: Workspace, raw: string): Reply {
  const q = raw.toLowerCase().trim();
  const biz = ws.business?.name ?? "your business";

  // Help & how-to
  const howTo = q.match(/(?:activate|set ?up|start|turn on|buy|get)\s+(?:the\s+)?([a-z ]+?)(?:\?|$| automation| assistant)/);
  if (has(q, "how do i", "how to", "how can i") && howTo) {
    const svc = findService(howTo[1]);
    if (svc) {
      const steps = [
        `Open Services → ${svc.name}.`,
        "Choose monthly or annual and complete payment.",
        ...(svc.connect.length ? [`Connect ${svc.connect.map(providerName).join(" and ")} — you sign in with that platform, I never see your password.`] : []),
        "Check the business information I pre-filled and add anything missing.",
        "Pick how it should behave (tone, schedule, approval).",
        "Run the test, approve it and press Activate.",
      ];
      return {
        matched: true,
        text: `Here's how to activate ${svc.name}:\n\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}${svc.approvalNote ? `\n\nGood to know: ${svc.approvalNote}` : ""}`,
        links: [{ label: `Open ${svc.name}`, href: `/app/services/${svc.id}` }],
      };
    }
  }
  if (has(q, "connect") && has(q, "whatsapp", "instagram", "youtube", "facebook", "google", "gmail", "email")) {
    const p = (["whatsapp", "instagram", "youtube", "facebook", "google", "gmail", "email"] as const).find((w) => q.includes(w))!;
    return {
      matched: true,
      text: `To connect ${cap(p)}:\n\n1. Go to Settings → Connected accounts (or start the service that needs it).\n2. Press Connect next to ${cap(p)}.\n3. Sign in on ${cap(p)}'s own page and allow access.\n4. You're sent back to ${"IBAX AI"} and the account shows as Connected.\n\nYou can disconnect at any time, and I only use the permissions you grant.`,
      links: [{ label: "Connected accounts", href: "/app/settings#accounts" }],
    };
  }
  if (has(q, "paused", "not working", "failed", "stopped", "attention")) {
    const off = ws.automations.filter((a) => ["paused", "failed", "attention"].includes(a.status));
    if (!off.length) return { matched: true, text: "All your automations are running normally right now.", links: [{ label: "Automation Control Centre", href: "/app/automations" }] };
    return {
      matched: true,
      text: off
        .map((a) => `• ${serviceById(a.serviceId)?.name}: ${a.status === "paused" ? "paused" : a.status === "failed" ? "failed" : "needs attention"}${a.note ? ` — ${a.note}` : ""}`)
        .join("\n") + "\n\nOpen the Control Centre to resume or fix them.",
      links: [{ label: "Automation Control Centre", href: "/app/automations" }],
    };
  }
  if (has(q, "i need help", "support", "talk to a human", "human", "ticket")) {
    return {
      matched: true,
      text: "I'm here. Tell me what's wrong in a sentence and I'll walk you through it. If I can't fix it, I'll open a support ticket and a person from our team will reply.",
      links: [{ label: "Create support ticket", href: "/app/help#ticket" }],
    };
  }

  // Create content
  if (has(q, "create", "write", "make", "draft", "plan") && has(q, "post", "reel", "short", "video", "caption", "content")) {
    const platform: ContentItem["platform"] = has(q, "youtube", "short", "video") ? "youtube" : has(q, "facebook") ? "facebook" : "instagram";
    const when = has(q, "tomorrow") ? new Date(Date.now() + 86400_000) : new Date(Date.now() + 3 * 3600_000);
    when.setHours(has(q, "tomorrow") ? 19 : when.getHours(), 0, 0, 0);
    const idea = contentIdea(ws, platform);
    const item: ContentItem = {
      id: uid(),
      type: platform === "youtube" ? "short" : has(q, "reel") ? "reel" : "post",
      platform,
      title: idea.title,
      body: idea.body,
      hashtags: idea.hashtags,
      status: "approval",
      scheduledAt: when.toISOString(),
      createdAt: nowIso(),
    };
    return {
      matched: true,
      text: `Draft ready for ${cap(platform)} — scheduled for ${when.toLocaleString([], { weekday: "long", hour: "numeric", minute: "2-digit" })}, waiting for your approval:\n\n“${item.title}”\n${item.body}${item.hashtags ? `\n${item.hashtags}` : ""}`,
      links: [{ label: "Review in Content Centre", href: "/app/content" }],
      apply: (w) => {
        w.content.unshift(item);
        logActivity(w, { kind: platform, title: `${cap(platform)} draft created by your assistant`, detail: item.title, href: "/app/content" });
      },
    };
  }

  // Data questions
  if (has(q, "what happened", "today's activity", "todays activity", "summary", "summarise", "summarize", "how was today", "show me today")) {
    const today = ws.activity.filter((e) => isToday(e.at));
    if (!today.length) {
      return {
        matched: true,
        text: ws.automations.length
          ? `Nothing new at ${biz} yet today. I'll post every call, message, lead and upload here as it happens.`
          : `It's quiet because no automations are active yet. Start one from Services and today's activity will appear here.`,
        links: [{ label: "Activity Centre", href: "/app/activity" }],
      };
    }
    const count = (k: string) => today.filter((e) => e.kind === k).length;
    const lines = [
      ["call", "call"],
      ["whatsapp", "WhatsApp conversation"],
      ["lead", "new lead"],
      ["review", "review"],
      ["youtube", "YouTube update"],
      ["instagram", "Instagram update"],
      ["email", "email"],
    ]
      .map(([k, w]) => (count(k) ? plural(count(k), w) : ""))
      .filter(Boolean);
    return {
      matched: true,
      text: `Today at ${biz}: ${lines.join(", ") || plural(today.length, "event")}.\n\nLatest:\n${today
        .slice(0, 5)
        .map((e) => `• ${time(e.at)} — ${e.title}`)
        .join("\n")}`,
      links: [{ label: "Open Activity Centre", href: "/app/activity" }],
    };
  }
  if (has(q, "lead") && has(q, "follow")) {
    const due = ws.leads.filter((l) => l.status === "follow_up" || l.status === "new");
    if (!due.length) return { matched: true, text: "No leads need follow-up right now. 🎉", links: [{ label: "Leads", href: "/app/leads" }] };
    return {
      matched: true,
      text: `${plural(due.length, "lead")} need follow-up:\n${due.map((l) => `• ${l.name} — ${l.interest} (${l.source})${!l.phone && !l.email ? " — no contact details yet" : ""}`).join("\n")}`,
      links: [{ label: "Open Leads", href: "/app/leads" }],
    };
  }
  if (has(q, "lead")) {
    const today = ws.leads.filter((l) => isToday(l.createdAt));
    return {
      matched: true,
      text: `${today.length ? `${plural(today.length, "new lead")} today` : "No new leads yet today"}${today.length ? `:\n${today.map((l) => `• ${l.name} — ${l.interest} (via ${l.source})`).join("\n")}` : "."}\n\nIn total you have ${plural(ws.leads.length, "lead")}, ${ws.leads.filter((l) => l.status === "converted").length} converted.`,
      links: [{ label: "Open Leads", href: "/app/leads" }],
    };
  }
  if (has(q, "whatsapp", "message", "dm", "inbox", "instagram message", "email")) {
    const channel = has(q, "whatsapp") ? "whatsapp" : has(q, "instagram") ? "instagram" : has(q, "email") ? "email" : null;
    if (channel === "whatsapp" && !activeService(ws, "whatsapp")) return notActive(ws, "whatsapp", "WhatsApp messages");
    const list = ws.conversations.filter((c) => !channel || c.channel === channel).filter((c) => Date.now() - +new Date(c.at) < 86400_000);
    if (!list.length) return { matched: true, text: `No ${channel ? cap(channel) + " " : ""}messages in the last 24 hours.`, links: [{ label: "Open Inbox", href: "/app/inbox" }] };
    return {
      matched: true,
      text: `${plural(list.length, "conversation")} in the last 24 hours:\n${list
        .map((c) => `• ${c.contact} (${cap(c.channel)}, ${time(c.at)}): “${c.messages[0].text}”${c.important ? " — needs you" : ""}`)
        .join("\n")}`,
      links: [{ label: "Open Inbox", href: "/app/inbox" }],
    };
  }
  if (has(q, "call")) {
    if (!activeService(ws, "voice") && !ws.calls.length) return notActive(ws, "voice", "Calls");
    const today = ws.calls.filter((c) => isToday(c.at));
    if (!today.length) return { matched: true, text: "No calls yet today.", links: [{ label: "All calls", href: "/app/calls" }] };
    return {
      matched: true,
      text: `${plural(today.length, "call")} today:\n${today.map((c) => `• ${time(c.at)} — ${c.caller}: ${c.summary}`).join("\n")}`,
      links: [{ label: "Open Calls", href: "/app/calls" }],
    };
  }
  if (has(q, "youtube", "video", "short")) {
    if (!activeService(ws, "youtube")) return notActive(ws, "youtube", "Your YouTube videos");
    const yt = ws.content.filter((c) => c.platform === "youtube");
    const todays = yt.filter((c) => (c.scheduledAt && isToday(c.scheduledAt)) || (c.publishedAt && isToday(c.publishedAt)));
    const tomorrow = yt.filter((c) => c.scheduledAt && isTomorrow(c.scheduledAt));
    const last = yt.filter((c) => c.status === "published").sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))[0];
    const parts = [];
    if (todays.length) parts.push(`Today: “${todays[0].title}” — ${todays[0].status === "published" ? "published" : `scheduled for ${time(todays[0].scheduledAt!)}`}.`);
    else parts.push("Nothing is scheduled for YouTube today.");
    if (tomorrow.length) parts.push(`Tomorrow: “${tomorrow[0].title}”.`);
    if (last?.stats) parts.push(`Last published: “${last.title}” — ${last.stats.views.toLocaleString()} views, ${last.stats.likes} likes, ${last.stats.comments} comments.`);
    return { matched: true, text: parts.join("\n"), links: [{ label: "Open Content Centre", href: "/app/content" }] };
  }
  if (has(q, "review", "rating")) {
    if (!ws.reviews.length) return activeService(ws, "reviews") ? { matched: true, text: "No reviews yet. I'll tell you the moment one arrives." } : notActive(ws, "reviews", "Your Google reviews");
    const recent = ws.reviews.filter((r) => Date.now() - +new Date(r.at) < 7 * 86400_000);
    const avg = ws.reviews.reduce((s, r) => s + r.rating, 0) / ws.reviews.length;
    const pending = ws.reviews.filter((r) => !r.reply);
    return {
      matched: true,
      text: `${plural(recent.length, "review")} this week, average rating ${avg.toFixed(1)}★.\n${recent.map((r) => `• ${r.author} — ${r.rating}★ “${r.text}”`).join("\n")}${pending.length ? `\n\n${plural(pending.length, "review")} waiting for a reply — I've drafted suggestions.` : ""}`,
      links: [{ label: "Open Reviews", href: "/app/reviews" }],
    };
  }
  if (has(q, "analytics", "how are we doing", "performance", "this week", "stats")) {
    const last7 = ws.metrics.slice(-7);
    if (!last7.length) return { matched: true, text: "Analytics fill in once your first service is active.", links: [{ label: "Analytics", href: "/app/analytics" }] };
    const sum = (k: keyof (typeof last7)[number]) => last7.reduce((s, m) => s + (m[k] as number), 0);
    return {
      matched: true,
      text: `Last 7 days: ${sum("leads")} leads, ${sum("calls")} calls, ${sum("messages")} messages, ${sum("visitors").toLocaleString()} website visitors, ${sum("views").toLocaleString()} video views and ${sum("conversions")} conversions.`,
      links: [{ label: "Open Analytics", href: "/app/analytics" }],
    };
  }
  if (has(q, "service", "what can you do", "what do you do", "help me grow", "price", "cost", "plan", "kitna", "kitne", "kimat", "keemat", "rate", "कीमत", "प्राइस", "सर्विस")) {
    const priced = services.filter((s) => s.price !== null);
    return {
      matched: true,
      text: `I can run these for ${biz} (starting prices):\n${priced.map((s) => `• ${s.name} — ${formatPrice(s.price!)}${s.billing === "one-time" ? " one-time" : "/mo"} · ${s.short}`).join("\n")}\n\nEach one can be bought on its own, or take Digital Marketing for everything together. Just tell me which one and I'll set it up here.`,
      links: [{ label: "Browse services", href: "/app/services" }],
    };
  }
  if (has(q, "hello", "hi ", "hey") || q === "hi") {
    return { matched: true, text: ws.assistant?.welcome || `Hi! Ask me about today's calls, messages, leads, videos or reviews — or tell me what to create.` };
  }

  return {
    matched: false,
    text: `I can answer questions about today's activity, leads, calls, messages, videos, reviews and analytics, create posts, and walk you through setting anything up. Try “What happened today?” or “Create tomorrow's Instagram post.”`,
  };
}

function cap(s: string) {
  return s === "youtube" ? "YouTube" : s === "whatsapp" ? "WhatsApp" : s.charAt(0).toUpperCase() + s.slice(1);
}

function providerName(p: string) {
  return { youtube: "YouTube", instagram: "Instagram", facebook: "Facebook", whatsapp: "WhatsApp Business", google: "Google Business Profile", gmail: "your email", phone: "your business phone", website: "your website" }[p] ?? p;
}

function findService(text: string) {
  const t = text.trim();
  return services.find((s) => s.id === t || s.name.toLowerCase().includes(t) || t.includes(s.id));
}

/** Template-based content idea from the business profile (used without an AI key). */
export function contentIdea(ws: Workspace, platform: ContentItem["platform"]) {
  const b = ws.business;
  const name = b?.name ?? "our business";
  const first = (b?.services ?? "our best work").split(",")[0].trim();
  const city = b?.city ? ` in ${b.city}` : "";
  const tag = (s: string) => "#" + s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const ideas = [
    { title: `Why people${city} love our ${first.toLowerCase()}`, body: `A quick look at what makes ${first.toLowerCase()} at ${name} special — made fresh, made with care. Come see for yourself!` },
    { title: `Behind the scenes at ${name}`, body: `Ever wondered what happens before we open? Here's a peek at the team getting everything ready for you.` },
    { title: `This week's special at ${name}`, body: `Something new this week — ask us about it when you visit, or message us to reserve yours.` },
  ];
  const pick = ideas[new Date().getDate() % ideas.length];
  return {
    ...pick,
    body: platform === "youtube" ? `Script (45s): Hook — “${pick.title}”. Show the work up close, add one customer reaction, end with: “Visit ${name}${city} today.”` : pick.body,
    hashtags: platform === "youtube" ? undefined : [tag(name), tag(first), b?.city ? tag(b.city) : "", tag(b?.category ?? "local")].filter((t) => t.length > 1).join(" "),
  };
}

/** Short text summary of the workspace given to the AI model as context. */
export function workspaceContext(ws: Workspace) {
  const b = ws.business;
  const today = ws.activity.filter((e) => isToday(e.at));
  return [
    b ? `Business: ${b.name} (${b.category}) in ${b.city}, ${b.country}. ${b.description} Hours: ${b.hours}. Offers: ${b.services}.` : "Business profile not completed yet.",
    `Assistant name: ${product.assistantName}; tone: ${ws.assistant?.tone ?? "Warm & friendly"}; language: ${ws.assistant?.language ?? "English"}.`,
    `Active services: ${ws.automations.map((a) => `${serviceById(a.serviceId)?.name} (${a.status})`).join(", ") || "none"}.`,
    `Today's activity: ${today.map((e) => `${time(e.at)} ${e.title}`).join("; ") || "none"}.`,
    `Leads: ${ws.leads.length} total, ${ws.leads.filter((l) => l.status === "follow_up").length} need follow-up.`,
    `Reviews: ${ws.reviews.length}${ws.reviews.length ? `, average ${(ws.reviews.reduce((s, r) => s + r.rating, 0) / ws.reviews.length).toFixed(1)}` : ""}.`,
    `Content: ${ws.content.filter((c) => c.status === "scheduled").length} scheduled, ${ws.content.filter((c) => c.status === "approval").length} awaiting approval.`,
  ].join("\n");
}
