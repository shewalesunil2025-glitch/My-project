import type { ProviderId } from "@/lib/app/types";

/**
 * Everything sold in the Automation Store, and what each activation wizard asks.
 * Prices are "starting at" USD and match the website's Automation Store
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
  /** USD — per month, or once when `billing` is "one-time". null = custom quote. */
  price: number | null;
  billing?: "monthly" | "one-time";
  setupTime: string;
  /** Accounts the customer must authorise before activation. */
  connect: ProviderId[];
  /** Business information the service needs (step "Business information"). */
  info: FieldDef[];
  /** Behaviour / schedule choices (step "Configure"). */
  configure: FieldDef[];
  /** Third-party steps IBAX AI can't skip (rule: never promise instant activation). */
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
  placeholder: "Haircut — $25\nFacial — $40",
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
      "IBAX AI builds your website from the details you already gave — pages, menu or services, gallery, reviews, map, WhatsApp button and enquiry form — with SEO basics in place. Already have a site? Connect it instead.",
    features: ["Home, About, Services/Menu, Gallery, Reviews, Contact", "WhatsApp button & enquiry form", "Google Maps & SEO basics", "IBAX AI built in — every enquiry answered", "Edit text and photos from IBAX AI"],
    price: 299,
    billing: "one-time",
    setupTime: "3–5 working days after you submit your details",
    connect: [],
    info: [
      { key: "domain", label: "Domain you want (or already own)", type: "text", placeholder: "mybusiness.com" },
      { key: "brand", label: "Brand colours & style", type: "text", placeholder: "Warm orange, modern, simple" },
    ],
    configure: [
      { key: "booking", label: "Add booking / enquiry form", type: "toggle", default: true },
      { key: "whatsapp", label: "Add WhatsApp chat button", type: "toggle", default: true },
    ],
    approvalNote: "Domains take up to 48 hours to point to your new site after purchase.",
  },
  {
    id: "voice",
    name: "AI Voice Assistant",
    short: "Answers your calls around the clock.",
    group: "assistant",
    icon: "PhoneCall",
    description:
      "Your assistant picks up every call, answers questions about your business, takes enquiries and appointment requests, and transfers to a person when needed. You get a summary of every call in IBAX AI.",
    features: ["Answers incoming calls 24/7", "Business information, prices & hours", "Appointment requests", "Lead capture & follow-up", "Call summaries in IBAX AI", "Transfer to a person"],
    price: 79,
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
    approvalNote: "Call forwarding to your IBAX AI number has to be switched on with your phone provider — IBAX AI shows you exactly how.",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Automation",
    short: "Replies, reminders and follow-ups.",
    group: "assistant",
    icon: "MessageCircle",
    description:
      "Answers customer questions, shares product and service details, captures leads, handles appointment and order enquiries and follows up — all on your WhatsApp Business number. Conversations appear inside IBAX AI.",
    features: ["Instant answers & FAQs", "Product / service information", "Lead capture", "Appointment & order enquiries", "Follow-ups", "Conversations inside IBAX AI"],
    price: 49,
    setupTime: "Same day after WhatsApp approval",
    connect: ["whatsapp"],
    info: [
      { key: "about", label: "About your business", type: "textarea", fromBusiness: "description", required: true },
      { key: "services", label: "Services / products", type: "textarea", fromBusiness: "services", required: true },
      prices,
      { key: "hours", label: "Working hours", type: "text", fromBusiness: "hours" },
      faq,
    ],
    configure: [tone, handoff, { key: "followUp", label: "Follow up with new leads after 24 hours", type: "toggle", default: true }],
    approvalNote: "Meta reviews every WhatsApp Business API number. This usually takes 1–3 days; IBAX AI guides you through it.",
  },
  {
    id: "instagram",
    name: "Instagram Automation",
    short: "DMs, comments and post planning.",
    group: "social",
    icon: "Instagram",
    description:
      "IBAX AI plans your content, writes captions and hashtags, schedules posts and reels, helps with comments and replies to DMs where Instagram allows it — with your approval or automatically.",
    features: ["Content ideas & captions", "Hashtag suggestions", "Post & reel scheduling", "Comment assistance", "DM replies where supported", "Lead capture & analytics"],
    price: 39,
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
    features: ["Page posts & reels", "Content scheduling", "Comment assistance", "Messenger replies where supported", "Lead handling", "Analytics"],
    price: 39,
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
      "Tell IBAX AI “every day at 7 PM upload one Short about my restaurant.” IBAX AI turns your business into ideas, scripts, AI video, voice, thumbnail, title and description, checks quality, schedules and publishes — and shows views, likes and comments in IBAX AI.",
    features: ["AI content ideas & scripts", "AI video & voice-over", "Thumbnail, title & description", "Quality check before publishing", "Scheduled publishing", "Views, likes & comments in IBAX AI"],
    price: 39,
    setupTime: "Same day — first video within 24 hours",
    connect: ["youtube"],
    info: [
      { key: "about", label: "What should the videos be about?", type: "textarea", fromBusiness: "description", required: true },
      { key: "audience", label: "Who should watch them?", type: "text", fromBusiness: "targetCustomers" },
    ],
    configure: [contentStyle, { ...frequency, default: "Every day" }, postTime, { key: "format", label: "Format", type: "select", options: ["Shorts (vertical, under 60s)", "Long videos (3–8 min)", "Both"], default: "Shorts (vertical, under 60s)" }, approval],
  },
  {
    id: "email",
    name: "Email Automation",
    short: "Inbox sorting, drafts and follow-ups.",
    group: "assistant",
    icon: "Mail",
    description: "With your permission IBAX AI reads your business inbox, sorts enquiries, drafts replies for you to approve, follows up with leads and customers and sends campaigns you authorise.",
    features: ["Reads only the inbox you authorise", "Sorts enquiries", "Drafts replies", "Customer & lead follow-up", "Notifications", "Email campaigns you approve"],
    price: 29,
    setupTime: "Same day",
    connect: ["gmail"],
    info: [{ key: "signature", label: "Email signature", type: "textarea", placeholder: "Team at My Business\n+1 555 0100" }, faq],
    configure: [
      { key: "mode", label: "Replies", type: "select", options: ["Draft replies for me to approve", "Send routine replies automatically"], default: "Draft replies for me to approve" },
      tone,
    ],
    approvalNote: "Google asks you to grant IBAX AI permission to your mailbox. You can revoke it anytime in Settings → Connected accounts.",
  },
  {
    id: "reviews",
    name: "Google Review Management",
    short: "Review requests and reply drafts. Never fake reviews.",
    group: "growth",
    icon: "Star",
    description: "Monitors your Google reviews, alerts you to new ones, suggests replies, runs review-request campaigns to real customers and tracks your rating. IBAX AI never writes fake reviews or manipulates ratings.",
    features: ["New-review alerts", "Suggested replies", "Review requests to real customers", "Rating analytics", "Google Business Profile help"],
    price: 29,
    setupTime: "Same day",
    connect: ["google"],
    info: [{ key: "reviewLink", label: "Your Google review link (if you have it)", type: "text", placeholder: "https://g.page/r/..." }],
    configure: [
      { key: "replies", label: "Replies", type: "select", options: ["Suggest replies, I approve", "Auto-reply to 4–5 star reviews only"], default: "Suggest replies, I approve" },
      { key: "requests", label: "Ask customers for a review after a visit", type: "toggle", default: true },
    ],
  },
  {
    id: "followup",
    name: "Lead Follow-up",
    short: "Every enquiry followed up on time.",
    group: "growth",
    icon: "UserCheck",
    description: "Every new lead from calls, WhatsApp, social media or your website gets a timely, personal follow-up. IBAX AI tells you who needs a call today.",
    features: ["Leads from every channel in one list", "Automatic follow-up sequence", "Daily follow-up list", "Status tracking to conversion"],
    price: 39,
    setupTime: "Same day",
    connect: [],
    info: [{ key: "offer", label: "What do you offer new customers?", type: "textarea", placeholder: "10% off the first visit" }],
    configure: [
      { key: "channel", label: "Follow up on", type: "select", options: ["WhatsApp", "Email", "SMS", "WhatsApp, then email"], default: "WhatsApp, then email" },
      { key: "delay", label: "First follow-up after", type: "select", options: ["1 hour", "1 day", "2 days"], default: "1 day" },
    ],
  },
  {
    id: "support",
    name: "Customer Support",
    short: "Common questions answered on every channel.",
    group: "assistant",
    icon: "Headset",
    description:
      "IBAX AI answers your customers' common questions — timings, prices, location, orders, bookings — on your website chat, WhatsApp, Instagram, Facebook and email, and hands anything tricky to you.",
    features: ["Answers on every connected channel", "Your FAQs, prices and policies", "Order and booking status questions", "Hands complaints to a person", "Every conversation visible in IBAX AI"],
    price: 49,
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
      "Your complete digital marketing team — run by IBAX AI, guided by people. Social media, content, a monthly calendar, Meta and Google ads, local SEO and your Google Business Profile, WhatsApp campaigns, lead follow-up and a monthly report, managed together. Ad spend is paid separately, straight to Meta or Google, and nothing is posted without your approval.",
    features: [
      "Social media management — Instagram, Facebook & YouTube",
      "Content creation in your brand voice",
      "Monthly content calendar",
      "Meta & Google ad campaigns",
      "Local SEO & Google Business Profile",
      "Website SEO basics",
      "WhatsApp campaigns to opted-in customers",
      "Lead follow-up by IBAX AI",
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
    price: 299,
    setupTime: "Kick-off call within 2 working days",
    connect: ["google", "instagram", "facebook", "youtube"],
    info: [
      { key: "goals", label: "Your main goal for the next 3 months", type: "select", options: ["More customers / bookings", "More online orders", "Better reputation", "Brand awareness", "Launch something new"], default: "More customers / bookings", required: true },
      { key: "area", label: "Area you want customers from", type: "text", placeholder: "Within 10 km of downtown" },
      { key: "competitors", label: "Competitors (optional)", type: "textarea" },
    ],
    configure: [
      { key: "adBudget", label: "Monthly ad budget (paid separately to ad platforms)", type: "select", options: ["No ads for now", "Up to $200", "$200–$500", "$500–$1,500", "Above $1,500"], default: "No ads for now" },
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
    description: "Describe the job you want automated — billing reminders, stock alerts, staff rosters, CRM sync — and our team designs, builds and connects it to IBAX AI.",
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
export const liveServices: readonly string[] = ["website", "custom"];
export const isLive = (id: string) => liveServices.includes(id);

export const annualPrice = (monthly: number) => monthly * 10;

export const providerInfo: Record<ProviderId, { name: string; help: string }> = {
  youtube: { name: "YouTube", help: "Sign in with the Google account that owns your channel and allow uploads." },
  instagram: { name: "Instagram", help: "Use a Business or Creator account linked to your Facebook Page." },
  facebook: { name: "Facebook Page", help: "Sign in as a Page admin and choose the Page IBAX AI should manage." },
  whatsapp: { name: "WhatsApp Business", help: "Sign in with Meta and pick (or register) the number customers message." },
  google: { name: "Google Business Profile", help: "Sign in with the Google account that manages your Business Profile." },
  gmail: { name: "Gmail / Email", help: "Sign in and allow IBAX AI to read and draft emails in this mailbox only." },
  phone: { name: "Business phone", help: "IBAX AI gives you a number; forward your business calls to it." },
  website: { name: "Website", help: "Add a small IBAX AI snippet to your existing site to capture enquiries." },
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
