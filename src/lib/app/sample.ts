import { annualPrice, serviceById } from "@/content/app/services";
import type { ActivityEvent, Automation, DailyMetric, Workspace } from "./types";
import { uid } from "./store";

/** Seeded random so the sample workspace looks the same on every visit. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const hoursAhead = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();
const daysAgo = (d: number) => hoursAgo(d * 24);
const day = (d: Date) => d.toISOString().slice(0, 10);

function todayAt(hour: number, min = 0) {
  const d = new Date();
  d.setHours(hour, min, 0, 0);
  return d;
}

/** Fills a fresh workspace with the "Sunrise Bistro" sample business. */
export function buildSampleWorkspace(ws: Workspace) {
  const r = rng(42);
  ws.business = {
    category: "Restaurant",
    name: "Sunrise Bistro",
    ownerName: "Alex Morgan",
    phone: "+1 555 0142",
    email: "hello@sunrisebistro.example",
    address: "214 Lake Street",
    city: "Austin",
    country: "United States",
    websiteUrl: "",
    description: "A neighbourhood bistro serving all-day breakfast, wood-fired pizza and fresh pastries. Family friendly, outdoor seating, vegan options.",
    hours: "Mon–Sun, 8 AM – 10 PM",
    services: "All-day breakfast, wood-fired pizza, pastries, coffee, catering for events up to 60 guests, table reservations",
    targetCustomers: "Families, office teams and weekend brunch lovers within 5 miles",
    socialLinks: "instagram.com/sunrisebistro",
  };
  ws.assistant = {
    name: "IBAX",
    language: "English",
    tone: "Warm & friendly",
    personality: "Helpful host",
    welcome: "Hi! I'm IBAX from Sunrise Bistro. Want to book a table, see the menu or ask about catering?",
  };
  ws.team = [
    { id: uid(), name: "Alex Morgan", email: "sample@lumi.app", role: "owner" },
    { id: uid(), name: "Jamie Lee", email: "jamie@sunrisebistro.example", role: "manager" },
  ];

  // Subscriptions + automations
  const plan: [string, Automation["status"], string?][] = [
    ["whatsapp", "active"],
    ["voice", "active"],
    ["youtube", "active"],
    ["instagram", "active"],
    ["reviews", "active"],
    ["facebook", "paused", "Paused by you on " + new Date(daysAgo(3)).toLocaleDateString()],
    ["followup", "attention", "3 leads have no phone or email — add one so IBAX can follow up."],
  ];
  for (const [serviceId, status, note] of plan) {
    const svc = serviceById(serviceId)!;
    const subId = uid();
    const period = serviceId === "whatsapp" ? "annual" : "monthly";
    const price = period === "annual" ? annualPrice(svc.price!) : svc.price!;
    const started = daysAgo(20 + Math.floor(r() * 30));
    ws.subscriptions.push({
      id: subId,
      serviceId,
      period,
      price,
      status: "active",
      startedAt: started,
      renewsAt: new Date(Date.now() + (5 + Math.floor(r() * 25)) * 86400_000).toISOString(),
    });
    ws.invoices.push({ id: uid(), number: `LUMI-${1000 + ws.invoices.length + 1}`, serviceId, period, amount: price, date: started, status: "test" });
    ws.automations.push({
      id: uid(),
      serviceId,
      subscriptionId: subId,
      status,
      config:
        serviceId === "youtube"
          ? { frequency: "Every day", time: "19:00", style: "Product / menu showcase", approval: "Publish automatically", format: "Shorts (vertical, under 60s)" }
          : { tone: "Warm & friendly" },
      setupStep: 99,
      tested: true,
      createdAt: started,
      activatedAt: started,
      lastRunAt: hoursAgo(1 + Math.floor(r() * 6)),
      note,
      logs: [
        { at: started, level: "success", message: "Activated" },
        { at: hoursAgo(5), level: "info", message: "Ran successfully" },
        ...(status === "attention" ? [{ at: hoursAgo(2), level: "warning" as const, message: note! }] : []),
      ],
    });
  }
  const sim = { simulated: true, status: "connected" as const, connectedAt: daysAgo(30) };
  ws.connections = {
    whatsapp: { provider: "whatsapp", account: "+1 555 0142", ...sim },
    phone: { provider: "phone", account: "+1 555 0199 (IBAXAI line)", ...sim },
    youtube: { provider: "youtube", account: "Sunrise Bistro", ...sim },
    instagram: { provider: "instagram", account: "@sunrisebistro", ...sim },
    facebook: { provider: "facebook", account: "Sunrise Bistro Page", ...sim },
    google: { provider: "google", account: "Sunrise Bistro — Austin", ...sim },
  };

  // Calls
  const callers = ["Maria G.", "Unknown caller", "Tom B.", "Priya S.", "Chris W.", "Office — Delta Corp"];
  const outcomes = ["appointment", "answered", "lead", "transferred", "answered", "lead"] as const;
  const summaries = [
    "Booked a table for 4 tomorrow at 7:30 PM, outdoor seating.",
    "Asked about vegan options — shared the menu link on WhatsApp.",
    "Catering enquiry for a 40-person office lunch next Friday. Wants a quote.",
    "Complaint about a delayed delivery — transferred to Jamie.",
    "Asked if you're open on Sunday. Told them 8 AM – 10 PM.",
    "Wants weekly team breakfast delivery. Lead created.",
  ];
  ws.calls = callers.map((caller, i) => ({
    id: uid(),
    at: i < 4 ? todayAt(9 + i * 2, 15).toISOString() : daysAgo(i - 3),
    caller,
    number: `+1 555 01${String(10 + i * 7).padStart(2, "0")}`,
    durationSec: 60 + Math.floor(r() * 240),
    outcome: outcomes[i],
    summary: summaries[i],
  }));

  // Conversations
  ws.conversations = [
    {
      id: uid(),
      channel: "whatsapp",
      contact: "Sofia R.",
      at: hoursAgo(1),
      important: false,
      messages: [
        { from: "customer", text: "Hi! Do you have gluten-free pizza?", at: hoursAgo(1.1) },
        { from: "assistant", text: "Hi Sofia! Yes — any of our pizzas can be made on a gluten-free base for $3 extra. Would you like to book a table?", at: hoursAgo(1.09) },
        { from: "customer", text: "Yes, Saturday 1 PM for 2 please", at: hoursAgo(1.05) },
        { from: "assistant", text: "Done! Table for 2 on Saturday at 1 PM. See you then 🌅", at: hoursAgo(1.04) },
      ],
    },
    {
      id: uid(),
      channel: "whatsapp",
      contact: "Daniel K.",
      at: hoursAgo(3),
      important: true,
      messages: [
        { from: "customer", text: "Can you cater a birthday for 50 people on the 18th?", at: hoursAgo(3.2) },
        { from: "assistant", text: "We'd love to! Catering is available for up to 60 guests. I've passed your request to Alex, who will send a quote today. Any dietary needs?", at: hoursAgo(3.18) },
        { from: "customer", text: "10 vegetarians, 2 vegan", at: hoursAgo(3.1) },
      ],
    },
    {
      id: uid(),
      channel: "instagram",
      contact: "@weekend.brunchclub",
      at: hoursAgo(6),
      important: false,
      messages: [
        { from: "customer", text: "Love your pastries! Do you deliver?", at: hoursAgo(6.1) },
        { from: "assistant", text: "Thank you! 🥐 Yes, we deliver within 5 miles from 8 AM. Order on our WhatsApp: +1 555 0142.", at: hoursAgo(6.05) },
      ],
    },
    {
      id: uid(),
      channel: "email",
      contact: "events@deltacorp.example",
      at: hoursAgo(20),
      important: true,
      messages: [
        { from: "customer", text: "Could you send a quote for weekly breakfast for 25 staff?", at: hoursAgo(20) },
        { from: "assistant", text: "Draft reply ready for your approval: quote for 25 breakfasts every Monday, $14 per person.", at: hoursAgo(19.9) },
      ],
    },
  ];

  // Reviews
  ws.reviews = [
    { id: uid(), at: hoursAgo(4), author: "Emily T.", rating: 5, text: "Best brunch in Austin! The cinnamon rolls are unreal.", suggestedReply: "Thank you so much, Emily! Our bakers will be thrilled — see you at the next brunch 🌅" },
    { id: uid(), at: hoursAgo(26), author: "Mark P.", rating: 3, text: "Food was great but we waited 25 minutes for a table.", suggestedReply: "Thanks for the honest feedback, Mark. Sorry about the wait — you can now book ahead on WhatsApp so your table is ready when you arrive." },
    { id: uid(), at: daysAgo(4), author: "Aisha N.", rating: 5, text: "Lovely staff, great vegan options.", reply: "Thank you Aisha! 💚" },
    { id: uid(), at: daysAgo(9), author: "Ben C.", rating: 4, text: "Solid pizza, cozy place.", reply: "Thanks Ben — come back for the new truffle pizza!" },
  ];

  // Leads
  const leadNames = ["Daniel K.", "Delta Corp", "Tom B.", "Sofia R.", "Grace H.", "Leo M.", "Nina P.", "Owen F."];
  const statuses = ["new", "follow_up", "follow_up", "converted", "contacted", "follow_up", "lost", "new"] as const;
  const interests = ["Birthday catering for 50", "Weekly team breakfast", "Office lunch catering", "Table booking", "Private dinner", "Gift cards", "Wedding brunch", "Weekend brunch booking"];
  const sources = ["WhatsApp", "Email", "Phone call", "WhatsApp", "Instagram", "Website", "Facebook", "Phone call"];
  ws.leads = leadNames.map((name, i) => ({
    id: uid(),
    name,
    phone: i === 5 || i === 7 ? "" : `+1 555 02${String(10 + i).padStart(2, "0")}`,
    email: i === 1 ? "events@deltacorp.example" : "",
    source: sources[i],
    interest: interests[i],
    status: statuses[i],
    returning: i === 3 || i === 4,
    createdAt: i < 2 ? hoursAgo(3 + i * 10) : daysAgo(i),
    followUpAt: statuses[i] === "follow_up" ? todayAt(17).toISOString() : undefined,
    notes: "",
  }));

  // Content
  ws.content = [
    { id: uid(), type: "short", platform: "youtube", title: "60 seconds inside our wood-fired oven 🔥", body: "Script: Open on flames → dough stretch → toppings → 90-second bake → cheese pull. Voice-over: 'Every pizza at Sunrise Bistro…'", status: "scheduled", scheduledAt: todayAt(19).toISOString(), createdAt: hoursAgo(8) },
    { id: uid(), type: "short", platform: "youtube", title: "How we make 300 cinnamon rolls before 8 AM", body: "Behind-the-scenes bakery Short.", status: "published", publishedAt: daysAgo(1), createdAt: daysAgo(1.5), stats: { views: 2840, likes: 211, comments: 18 } },
    { id: uid(), type: "short", platform: "youtube", title: "Our vegan breakfast plate, explained", body: "Menu showcase Short.", status: "published", publishedAt: daysAgo(2), createdAt: daysAgo(2.5), stats: { views: 1630, likes: 122, comments: 9 } },
    { id: uid(), type: "reel", platform: "instagram", title: "Weekend brunch is back ☀️", body: "Weekend brunch is back! Bottomless coffee, fresh pastries and our famous shakshuka. Book on WhatsApp 👉 link in bio", hashtags: "#austinbrunch #austinfood #brunchtime #sunrisebistro", status: "approval", scheduledAt: hoursAhead(20), createdAt: hoursAgo(2) },
    { id: uid(), type: "post", platform: "instagram", title: "Meet our new truffle pizza", body: "Wild mushroom, truffle cream, fior di latte. Available from today 🍕", hashtags: "#pizza #austineats #newmenu", status: "published", publishedAt: daysAgo(3), createdAt: daysAgo(3.2), stats: { views: 4120, likes: 388, comments: 27 } },
    { id: uid(), type: "image", platform: "facebook", title: "Catering for your next office event", body: "Feeding a team of 10–60? Our catering menu starts at $14 per person.", status: "draft", createdAt: hoursAgo(30) },
  ];

  // Metrics — last 60 days
  const metrics: DailyMetric[] = [];
  for (let d = 59; d >= 0; d--) {
    const growth = 1 + (59 - d) / 90;
    const weekend = [0, 6].includes(new Date(Date.now() - d * 86400_000).getDay()) ? 1.35 : 1;
    const k = growth * weekend;
    metrics.push({
      date: day(new Date(Date.now() - d * 86400_000)),
      leads: Math.round((2 + r() * 4) * k),
      calls: Math.round((5 + r() * 6) * k),
      messages: Math.round((14 + r() * 12) * k),
      visitors: Math.round((120 + r() * 80) * k),
      reach: Math.round((900 + r() * 700) * k),
      views: Math.round((600 + r() * 900) * k),
      engagement: Math.round((70 + r() * 60) * k),
      reviews: r() > 0.6 ? 1 + Math.round(r()) : 0,
      conversions: Math.round((1 + r() * 2) * k),
    });
  }
  ws.metrics = metrics;

  // Activity timeline
  const ev = (at: string, kind: ActivityEvent["kind"], title: string, detail?: string, href?: string): ActivityEvent => ({ id: uid(), at, kind, title, detail, href });
  ws.activity = [
    ev(hoursAgo(1), "whatsapp", "Table booked on WhatsApp — Sofia R.", "Saturday 1 PM, 2 guests", "/app/inbox"),
    ev(hoursAgo(2), "automation", "Lead Follow-up needs attention", "3 leads have no contact details", "/app/automations"),
    ev(hoursAgo(3), "lead", "New lead — Daniel K.", "Birthday catering for 50", "/app/leads"),
    ev(hoursAgo(4), "review", "New 5★ Google review from Emily T.", "“Best brunch in Austin!”", "/app/reviews"),
    ev(todayAt(9, 15).toISOString(), "call", "Call answered — Maria G.", "Booked a table for 4 tomorrow 7:30 PM", "/app/calls"),
    ev(hoursAgo(6), "instagram", "Instagram DM answered — @weekend.brunchclub", "Delivery question", "/app/inbox"),
    ev(hoursAgo(8), "youtube", "YouTube Short scheduled for 7:00 PM today", "60 seconds inside our wood-fired oven", "/app/content"),
    ev(hoursAgo(20), "email", "Quote request from Delta Corp — draft reply ready", undefined, "/app/inbox"),
    ev(daysAgo(1), "youtube", "YouTube Short published", "How we make 300 cinnamon rolls before 8 AM", "/app/content"),
    ev(daysAgo(3), "instagram", "Instagram post published", "Meet our new truffle pizza", "/app/content"),
    ev(daysAgo(3), "automation", "Facebook Automation paused by you", undefined, "/app/automations"),
  ].sort((a, b) => b.at.localeCompare(a.at));

  ws.notifications = [
    { id: uid(), at: hoursAgo(2), kind: "automation_failed", title: "Lead Follow-up needs attention", detail: "3 leads have no phone or email.", href: "/app/leads", read: false },
    { id: uid(), at: hoursAgo(3), kind: "lead", title: "New lead: Daniel K.", detail: "Birthday catering for 50 on the 18th.", href: "/app/leads", read: false },
    { id: uid(), at: hoursAgo(4), kind: "review", title: "New 5★ review", detail: "Emily T.: “Best brunch in Austin!”", href: "/app/reviews", read: false },
    { id: uid(), at: hoursAgo(8), kind: "upcoming", title: "YouTube Short at 7:00 PM", detail: "“60 seconds inside our wood-fired oven”", href: "/app/content", read: true },
    { id: uid(), at: daysAgo(1), kind: "published", title: "YouTube Short published", detail: "How we make 300 cinnamon rolls before 8 AM", href: "/app/content", read: true },
  ];

  ws.website = null;
}

/**
 * Daily numbers for a real workspace, counted from its own records (never invented).
 * Website visitors and social reach stay 0 until those integrations report them.
 */
export function deriveMetrics(ws: Workspace, days = 60): DailyMetric[] {
  const out: DailyMetric[] = [];
  const key = (iso: string) => iso.slice(0, 10);
  for (let d = days - 1; d >= 0; d--) {
    const date = day(new Date(Date.now() - d * 86400_000));
    const on = (iso?: string) => !!iso && key(iso) === date;
    const published = ws.content.filter((c) => on(c.publishedAt));
    out.push({
      date,
      leads: ws.leads.filter((l) => on(l.createdAt)).length,
      calls: ws.calls.filter((c) => on(c.at)).length,
      messages: ws.conversations.reduce((s, c) => s + c.messages.filter((m) => on(m.at)).length, 0),
      visitors: 0,
      reach: 0,
      views: published.reduce((s, c) => s + (c.stats?.views ?? 0), 0),
      engagement: published.reduce((s, c) => s + (c.stats ? c.stats.likes + c.stats.comments : 0), 0),
      reviews: ws.reviews.filter((r) => on(r.at)).length,
      conversions: ws.leads.filter((l) => l.status === "converted" && on(l.createdAt)).length,
    });
  }
  return out;
}
