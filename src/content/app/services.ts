import type { Currency } from "@/config/product";
import type { ProviderId } from "@/lib/app/types";

/**
 * Everything sold in the Automation Store, and what each activation wizard asks.
 * Prices are "starting at" INR (all-inclusive) and match the website's Automation Store
 * (src/content/shambhu.ts). Monthly services can also be paid yearly as 10 months
 * (2 months free); one-time services are paid once.
 */

export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "toggle" | "time" | "phone";
  placeholder?: string;
  options?: string[];
  required?: boolean;
  help?: string;
  /** Pre-fill from the business profile. */
  fromBusiness?: "description" | "hours" | "services" | "phone" | "targetCustomers" | "email";
  default?: string | boolean;
};

export type ServiceDef = {
  id: string;
  name: string;
  short: string;
  group: "assistant" | "social" | "growth" | "web" | "premium" | "custom";
  icon: string; // lucide icon name, mapped in components/app/icons.tsx
  description: string;
  features: string[];
  /** INR — per month, or once when `billing` is "one-time". null = custom quote. */
  price: number | null;
  /** Price in US dollars for customers outside India (charged in rupees at USD_TO_INR). */
  usd?: number;
  billing?: "monthly" | "one-time";
  setupTime: string;
  /** Accounts the customer must authorise before activation. */
  connect: ProviderId[];
  /** Business information the service needs (step "Business information"). */
  info: FieldDef[];
  /** Behaviour / schedule choices (step "Configure"). */
  configure: FieldDef[];
  /** Third-party steps ibaxai can't skip (rule: never promise instant activation). */
  approvalNote?: string;
  includes?: string[];
  /** Everything a package includes, shown as cards (Digital Marketing). */
  package?: { title: string; body: string; icon: string }[];
};

const faq: FieldDef = {
  key: "faqs",
  label: "Frequently asked questions",
  type: "textarea",
  placeholder: "Q: Do you take walk-ins?\nA: Yes, until 6 PM.",
  help: "One question and answer per line pair. IBAX answers customers from this.",
};
const prices: FieldDef = {
  key: "prices",
  label: "Prices",
  type: "textarea",
  placeholder: "Haircut — ₹200\nFacial — ₹800",
};
const approval: FieldDef = {
  key: "approval",
  label: "Publishing",
  type: "select",
  options: ["Ask me before publishing", "Publish automatically"],
  default: "Ask me before publishing",
};
const contentStyle: FieldDef = {
  key: "style",
  label: "Content style",
  type: "select",
  options: ["Behind the scenes", "Product / menu showcase", "Tips & education", "Offers & promotions", "Customer stories", "Mix of everything"],
  default: "Mix of everything",
};
const frequency: FieldDef = {
  key: "frequency",
  label: "How often",
  type: "select",
  options: ["Every day", "3 times a week", "Twice a week", "Once a week"],
  default: "3 times a week",
};
const postTime: FieldDef = { key: "time", label: "Posting time", type: "time", default: "19:00" };
const tone: FieldDef = {
  key: "tone",
  label: "Reply tone",
  type: "select",
  options: ["Warm & friendly", "Professional", "Short & direct", "Fun & playful"],
  default: "Warm & friendly",
};
const handoff: FieldDef = {
  key: "handoff",
  label: "Hand over to a person when",
  type: "select",
  options: ["The customer asks for a person", "IBAX isn't sure of the answer", "Any complaint", "Never — IBAX takes a message"],
  default: "IBAX isn't sure of the answer",
};

export const services: ServiceDef[] = [
  {
    id: "website",
    name: "Website",
    short: "A fast, modern website with IBAX built in.",
    group: "web",
    icon: "Globe",
    description:
      "Build your own website in minutes: pick a template and your business details fill it in — services and prices, hours, location, FAQ, WhatsApp and call buttons and an enquiry form. Change anything, then publish in one click. Every enquiry lands in your Leads.",
    features: ["24 premium 3D templates", "Filled in from your business details", "Services & prices, hours, map, FAQ", "WhatsApp, call & enquiry form", "Enquiries go straight to your Leads", "Publish and update in one click", "Hosting on your ibaxai link included", "Up to 3 changes a month by our team", "Own domain (.com): coming soon · domain cost extra"],
    price: 2999,
    usd: 299,
    billing: "one-time",
    setupTime: "Minutes — build it yourself and publish in one click",
    connect: [],
    info: [],
    configure: [
      { key: "booking", label: "Add booking / enquiry form", type: "toggle", default: true },
      { key: "whatsapp", label: "Add WhatsApp chat button", type: "toggle", default: true },
    ],
    approvalNote: "Your site goes live at ibaxai.com/s/your-name. Using your own domain (like mybusiness.com) is coming soon.",
  },
  {
    id: "voice",
    name: "AI Voice Assistant",
    short: "Answers your calls around the clock.",
    group: "assistant",
    icon: "PhoneCall",
    description:
      "Your assistant picks up every call, answers questions about your business, takes enquiries and appointment requests, and transfers to a person when needed. You get a summary of every call in ibaxai.",
    features: ["Answers incoming calls 24/7", "Business information, prices & hours", "Appointment requests", "Lead capture & follow-up", "Call summaries in ibaxai", "Transfer to a person"],
    price: 1499,
    usd: 79,
    setupTime: "1–2 working days (number setup)",
    connect: ["phone"],
    info: [
      { key: "about", label: "About your business", type: "textarea", fromBusiness: "description", required: true },
      { key: "services", label: "Services / products", type: "textarea", fromBusiness: "services", required: true },
      prices,
      { key: "hours", label: "Working hours", type: "text", fromBusiness: "hours", required: true },
      faq,
      { key: "appointments", label: "Appointment rules", type: "textarea", placeholder: "30-minute slots, Mon–Sat, 10 AM – 7 PM. No bookings on Sundays." },
    ],
    configure: [
      { key: "transferNumber", label: "Transfer calls to", type: "phone", fromBusiness: "phone" },
      handoff,
      { key: "voice", label: "Voice", type: "select", options: ["Female — warm", "Male — calm", "Female — energetic", "Male — friendly"], default: "Female — warm" },
    ],
    approvalNote: "Call forwarding to your ibaxai number has to be switched on with your phone provider — ibaxai shows you exactly how.",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Automation",
    short: "Replies, reminders and follow-ups.",
    group: "assistant",
    icon: "MessageCircle",
    description:
      "Answers customer questions, shares product and service details, captures leads, handles appointment and order enquiries and follows up — all on your own WhatsApp number. When a customer needs you, it pauses and alerts you. Conversations appear inside ibaxai.",
    features: ["Instant answers & FAQs", "Product / service information", "Lead capture", "Appointment & order enquiries", "Follow-ups", "Conversations inside ibaxai", "Fair use: up to 500 AI replies a month (extra 500 for ₹299)"],
    price: 799,
    usd: 49,
    setupTime: "Minutes — link your WhatsApp with a code",
    connect: ["whatsapp"],
    info: [
      { key: "about", label: "About your business", type: "textarea", fromBusiness: "description", required: true },
      { key: "services", label: "Services / products", type: "textarea", fromBusiness: "services", required: true },
      prices,
      { key: "hours", label: "Working hours", type: "text", fromBusiness: "hours" },
      faq,
    ],
    configure: [
      tone,
      handoff,
      { key: "followUp", label: "Follow up with new leads after 24 hours", type: "toggle", default: true },
      { key: "ignore", label: "Numbers IBAX should not reply to (family, friends)", type: "textarea", placeholder: "98765 43210, +1 415 555 0100" },
      { key: "dailyLimit", label: "Most bot replies per customer per day (default 30)", type: "text", placeholder: "30" },
    ],
    approvalNote: "Your WhatsApp is linked like WhatsApp Web (Linked devices). Keep the phone with this number connected to the internet at least once every 14 days, and use it for replies, not bulk promotions.",
  },
  {
    id: "instagram",
    name: "Instagram Automation",
    short: "DMs, comments and post planning.",
    group: "social",
    icon: "Instagram",
    description:
      "ibaxai plans your content, writes captions and hashtags, schedules posts and reels, helps with comments and replies to DMs where Instagram allows it — with your approval or automatically.",
    features: ["12 AI photo posts + 4 AI reels a month", "Captions & hashtags", "Post & reel scheduling", "Comment assistance", "DM replies where supported", "Extra: 2 reels ₹499 · 10 photos ₹299"],
    price: 1999,
    usd: 39,
    setupTime: "Same day",
    connect: ["instagram"],
    info: [{ key: "about", label: "What should your posts show?", type: "textarea", fromBusiness: "services", required: true }],
    configure: [contentStyle, frequency, postTime, approval, { key: "dms", label: "Reply to DMs automatically", type: "toggle", default: true }],
    approvalNote: "Instagram needs a Business or Creator account linked to a Facebook Page.",
  },
  {
    id: "facebook",
    name: "Facebook Automation",
    short: "Page messages, comments and posts.",
    group: "social",
    icon: "Facebook",
    description: "Posts and reels for your Facebook Page, scheduled content, comment help and Messenger replies where supported, with lead handling and analytics.",
    features: ["12 AI photo posts + 4 AI videos a month", "Content scheduling", "Comment assistance", "Messenger replies where supported", "Lead handling & analytics", "Extra: 2 videos ₹499 · 10 photos ₹299"],
    price: 1999,
    usd: 39,
    setupTime: "Same day",
    connect: ["facebook"],
    info: [{ key: "about", label: "What should your posts show?", type: "textarea", fromBusiness: "services", required: true }],
    configure: [contentStyle, frequency, postTime, approval, { key: "messenger", label: "Reply on Messenger automatically", type: "toggle", default: true }],
  },
  {
    id: "youtube",
    name: "YouTube Automation",
    short: "Video planning and comment replies.",
    group: "social",
    icon: "Youtube",
    description:
      "Tell ibaxai “twice a week at 7 PM upload a Short about my restaurant.” ibaxai turns your business into ideas, scripts, AI video, voice, thumbnail, title and description, checks quality, schedules and publishes — and shows views, likes and comments in ibaxai.",
    features: ["8 AI Shorts a month", "AI scripts, video & voice-over", "Thumbnail, title & description", "Quality check before publishing", "Views, likes & comments in ibaxai", "Extra: 2 Shorts ₹499"],
    price: 2999,
    usd: 39,
    setupTime: "Same day — first video within 24 hours",
    connect: ["youtube"],
    info: [
      { key: "about", label: "What should the videos be about?", type: "textarea", fromBusiness: "description", required: true },
      { key: "audience", label: "Who should watch them?", type: "text", fromBusiness: "targetCustomers" },
    ],
    configure: [contentStyle, { ...frequency, default: "Twice a week" }, postTime, { key: "format", label: "Format", type: "select", options: ["Shorts (vertical, under 60s)", "Long videos (3–8 min)", "Both"], default: "Shorts (vertical, under 60s)" }, approval],
  },
  {
    id: "social-pack",
    name: "Social Pack",
    short: "Instagram, Facebook and YouTube together.",
    group: "social",
    icon: "Share2",
    description:
      "All three channels in one plan: ibaxai makes your photos, reels and Shorts once and posts them on Instagram, Facebook and YouTube, writes captions, titles and hashtags, and answers DMs and comments.",
    features: ["Everything in Instagram, Facebook & YouTube", "12 AI photo posts + 4 reels on Instagram & Facebook", "8 AI Shorts on YouTube", "One content plan for all three", "DM & comment replies", "Cheaper than all three separately"],
    includes: ["instagram", "facebook", "youtube"],
    price: 5999,
    usd: 99,
    setupTime: "Same day — first post within 24 hours",
    connect: ["instagram", "facebook", "youtube"],
    info: [{ key: "about", label: "What should your posts and videos show?", type: "textarea", fromBusiness: "services", required: true }],
    configure: [contentStyle, frequency, postTime, approval],
    approvalNote: "Instagram needs a Business or Creator account linked to a Facebook Page.",
  },
  {
    id: "email",
    name: "Email Automation",
    short: "Inbox sorting, drafts and follow-ups.",
    group: "assistant",
    icon: "Mail",
    description: "With your permission ibaxai reads your business inbox, sorts enquiries, drafts replies for you to approve, follows up with leads and customers and sends campaigns you authorise.",
    features: ["Reads only the inbox you authorise", "Sorts enquiries", "Drafts replies", "Customer & lead follow-up", "Notifications", "Email campaigns you approve"],
    price: 499,
    usd: 29,
    setupTime: "Same day",
    connect: ["gmail"],
    info: [{ key: "signature", label: "Email signature", type: "textarea", placeholder: "Team at My Business\n+1 555 0100" }, faq],
    configure: [
      { key: "mode", label: "Replies", type: "select", options: ["Draft replies for me to approve", "Send routine replies automatically"], default: "Draft replies for me to approve" },
      tone,
    ],
    approvalNote: "Google asks you to grant ibaxai permission to your mailbox. You can revoke it anytime in Settings → Connected accounts.",
  },
  {
    id: "reviews",
    name: "Google Review Management",
    short: "Review requests and reply drafts. Never fake reviews.",
    group: "growth",
    icon: "Star",
    description:
      "More real Google reviews, on autopilot: after a visit or a sale, IBAX thanks the customer on your own WhatsApp and asks for a Google review with your review link — one tap from the app, or automatically when you mark a lead as a customer. ibaxai never writes fake reviews or manipulates ratings.",
    features: ["Review requests on your WhatsApp", "Your own Google review link", "One tap from the app", "Auto-ask when a lead becomes a customer", "Each customer asked once a month at most", "Reply to any Google review: paste it, IBAX writes the reply", "Up to 200 review requests a month", "New-review alerts — coming soon"],
    price: 499,
    usd: 29,
    setupTime: "Minutes",
    connect: ["whatsapp"],
    info: [
      {
        key: "reviewLink",
        label: "Your Google review link",
        type: "text",
        placeholder: "https://g.page/r/...",
        required: true,
        help: "For one-tap reviews: Google Business Profile (search your business name on Google while signed in) → Ask for reviews → copy the link. It looks like g.page/r/…/review. A Place ID (ChIJ…) works too.",
      },
    ],
    configure: [
      { key: "requests", label: "Ask automatically when I mark a lead as a customer", type: "toggle", default: true },
      { key: "message", label: "Your own message (optional — use {name} and {link})", type: "textarea", placeholder: "Namaste {name} 🙏 Thank you for visiting! Please review us: {link}" },
    ],
  },
  {
    id: "followup",
    name: "Lead Follow-up",
    short: "Every enquiry followed up on time.",
    group: "growth",
    icon: "UserCheck",
    description:
      "Every new lead from your website or added by you gets a thank-you on your own WhatsApp straight away, then a friendly reminder if they don't reply. It stops as soon as they answer, and every morning ibaxai tells you who to call today.",
    features: ["Instant thank-you on WhatsApp", "Up to 2 polite reminders", "Stops when the lead replies", "Morning “call these today” list", "Status tracking to conversion", "Up to 200 new leads a month"],
    price: 499,
    usd: 39,
    setupTime: "Same day",
    connect: ["whatsapp"],
    info: [{ key: "offer", label: "Any offer for new customers? (optional)", type: "textarea", placeholder: "10% off the first visit" }],
    configure: [{ key: "delay", label: "Send a reminder after", type: "select", options: ["1 hour", "1 day", "2 days"], default: "1 day" }],
  },
  {
    id: "support",
    name: "Customer Support",
    short: "Common questions answered on every channel.",
    group: "assistant",
    icon: "Headset",
    description:
      "ibaxai answers your customers' common questions — timings, prices, location, orders, bookings — on your ibaxai website chat and, when your WhatsApp is linked, on WhatsApp too, and hands anything tricky to you. Instagram, Facebook and email answers are coming next.",
    features: ["Answers on your website chat", "Answers on WhatsApp when it's linked", "Your FAQs, prices and policies", "Hands complaints to you on WhatsApp", "Every conversation visible in ibaxai", "Fair use: up to 500 replies a month"],
    price: 699,
    usd: 49,
    setupTime: "Same day",
    connect: [],
    info: [
      { key: "about", label: "About your business", type: "textarea", fromBusiness: "description", required: true },
      { key: "hours", label: "Working hours", type: "text", fromBusiness: "hours" },
      faq,
      { key: "policies", label: "Policies (returns, cancellations, delivery)", type: "textarea" },
    ],
    configure: [tone, handoff],
  },
  {
    id: "digital-marketing",
    name: "Digital Marketing",
    short: "The premium package: content, social media, campaigns and reporting, run together.",
    group: "premium",
    icon: "Rocket",
    description:
      "Your complete digital marketing team — run by ibaxai, guided by people. Social media, content, a monthly calendar, Meta and Google ads, local SEO and your Google Business Profile, WhatsApp campaigns, lead follow-up and a monthly report, managed together. Ad spend is paid separately, straight to Meta or Google, and nothing is posted without your approval.",
    features: [
      "Social media management — Instagram, Facebook & YouTube",
      "Content creation in your brand voice",
      "Monthly content calendar",
      "Meta & Google ad campaigns",
      "Local SEO & Google Business Profile",
      "Website SEO basics",
      "WhatsApp campaigns to opted-in customers",
      "Lead follow-up by ibaxai",
      "Monthly report",
    ],
    includes: ["instagram", "facebook", "youtube", "followup"],
    package: [
      { title: "Social media management", body: "Instagram, Facebook and YouTube planned, posted and answered.", icon: "Instagram" },
      { title: "Content creation", body: "Posts, reels ideas, captions and hashtags in your brand voice.", icon: "PenTool" },
      { title: "Monthly content calendar", body: "A clear plan for the month, ready for your approval.", icon: "CalendarDays" },
      { title: "Ad campaigns", body: "Meta and Google Ads set up, targeted and managed.", icon: "Target" },
      { title: "Local SEO & Google Business", body: "Your Google Business Profile optimised so nearby customers find you.", icon: "MapPin" },
      { title: "Website SEO basics", body: "Titles, keywords and speed checks so search engines understand you.", icon: "Search" },
      { title: "WhatsApp campaigns", body: "Offers and updates sent to customers who opted in.", icon: "MessageCircle" },
      { title: "Lead follow-up", body: "Every enquiry from your campaigns followed up by IBAX.", icon: "UserCheck" },
      { title: "Monthly report", body: "What went out, what people did and what we'll do next.", icon: "BarChart3" },
    ],
    price: 9999,
    usd: 299,
    setupTime: "Kick-off call within 2 working days",
    connect: ["google", "instagram", "facebook", "youtube"],
    info: [
      { key: "goals", label: "Your main goal for the next 3 months", type: "select", options: ["More customers / bookings", "More online orders", "Better reputation", "Brand awareness", "Launch something new"], default: "More customers / bookings", required: true },
      { key: "area", label: "Area you want customers from", type: "text", placeholder: "Within 10 km of downtown" },
      { key: "competitors", label: "Competitors (optional)", type: "textarea" },
    ],
    configure: [
      { key: "adBudget", label: "Monthly ad budget (paid separately to ad platforms)", type: "select", options: ["No ads for now", "Up to ₹10,000", "₹10,000–₹25,000", "₹25,000–₹75,000", "Above ₹75,000"], default: "No ads for now" },
      approval,
    ],
    approvalNote: "A marketing specialist reviews your plan with you on a kick-off call before campaigns go live.",
  },
  {
    id: "custom",
    name: "Custom Automation",
    short: "Something specific to your business? We build it.",
    group: "custom",
    icon: "Wand2",
    description: "Describe the job you want automated — billing reminders, stock alerts, staff rosters, CRM sync — and our team designs, builds and connects it to ibaxai.",
    features: ["Free consultation", "Built and maintained for you", "Appears in your Automation Control Centre", "Any app with an API"],
    price: null,
    setupTime: "Quote within 2 working days",
    connect: [],
    info: [{ key: "request", label: "What should be automated?", type: "textarea", required: true, placeholder: "Every evening, send me a summary of today’s orders and low-stock items." }],
    configure: [],
  },
];

export const serviceById = (id: string) => services.find((s) => s.id === id);

/**
 * Services that can be bought today. The others show "Coming soon" and take a
 * waitlist instead of payment. Add a service's id here once its automation is
 * built and tested (see docs/ROADMAP.md).
 */
export const liveServices: readonly string[] = ["website", "whatsapp", "followup", "reviews", "support", "custom"];
export const isLive = (id: string) => liveServices.includes(id);

/**
 * The free trial: for TRIAL_DAYS every account can run the messaging automations below and
 * build and preview its website (publishing needs the paid Website). Services that make
 * images and videos, ads and phone calls are not in the trial.
 */
export const TRIAL_DAYS = 15;
export const trialServices: readonly string[] = ["whatsapp", "followup", "support", "email", "reviews"];
export const inTrial = (id: string) => trialServices.includes(id);

/** The price a customer sees: rupees in India, dollars elsewhere. */
export const priceIn = (svc: Pick<ServiceDef, "price" | "usd">, currency: Currency): number | null => (svc.price === null ? null : currency === "USD" ? (svc.usd ?? null) : svc.price);

export const annualPrice = (monthly: number) => monthly * 10;

export const providerInfo: Record<ProviderId, { name: string; help: string }> = {
  youtube: { name: "YouTube", help: "Sign in with the Google account that owns your channel and allow uploads." },
  instagram: { name: "Instagram", help: "Use a Business or Creator account linked to your Facebook Page." },
  facebook: { name: "Facebook Page", help: "Sign in as a Page admin and choose the Page ibaxai should manage." },
  whatsapp: { name: "WhatsApp", help: "Link the number your customers message, with a code from WhatsApp → Linked devices." },
  google: { name: "Google Business Profile", help: "Sign in with the Google account that manages your Business Profile." },
  gmail: { name: "Gmail / Email", help: "Sign in and allow ibaxai to read and draft emails in this mailbox only." },
  phone: { name: "Business phone", help: "ibaxai gives you a number; forward your business calls to it." },
  website: { name: "Website", help: "Add a small ibaxai snippet to your existing site to capture enquiries." },
};

export const businessCategories = [
  "Restaurant",
  "Hotel",
  "Hospital",
  "Clinic",
  "Doctor",
  "Dentist",
  "Salon",
  "Beauty Parlour",
  "Spa",
  "Clothing Store",
  "Sweet Shop",
  "Real Estate",
  "Education",
  "College",
  "Gym",
  "Travel",
  "E-commerce",
  "Professional Services",
  "Other",
];
