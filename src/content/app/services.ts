import type { ProviderId } from "@/lib/app/types";

/**
 * Everything sold in the Automation Store, and what each activation wizard asks.
 * Prices are placeholders in USD per month — set your real prices here.
 * The annual plan is charged as 10 months (2 months free).
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
  /** USD / month. null = custom quote. */
  price: number | null;
  setupTime: string;
  /** Accounts the customer must authorise before activation. */
  connect: ProviderId[];
  /** Business information the service needs (step "Business information"). */
  info: FieldDef[];
  /** Behaviour / schedule choices (step "Configure"). */
  configure: FieldDef[];
  /** Third-party steps Lumi can't skip (rule: never promise instant activation). */
  approvalNote?: string;
  includes?: string[];
};

const faq: FieldDef = {
  key: "faqs",
  label: "Frequently asked questions",
  type: "textarea",
  placeholder: "Q: Do you take walk-ins?\nA: Yes, until 6 PM.",
  help: "One question and answer per line pair. Lumi answers customers from this.",
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
  options: ["The customer asks for a person", "Lumi isn't sure of the answer", "Any complaint", "Never — Lumi takes a message"],
  default: "Lumi isn't sure of the answer",
};

export const services: ServiceDef[] = [
  {
    id: "website",
    name: "Website",
    short: "A fast, mobile-ready website built from your business details.",
    group: "web",
    icon: "Globe",
    description:
      "Lumi builds your website from the details you already gave — pages, menu or services, gallery, reviews, map, WhatsApp button and enquiry form — with SEO basics in place. Already have a site? Connect it instead.",
    features: ["Home, About, Services/Menu, Gallery, Reviews, Contact", "WhatsApp button & enquiry form", "Google Maps & SEO basics", "Hosting, SSL and updates", "Edit text and photos from Lumi"],
    price: 29,
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
    name: "AI Voice & Call Assistant",
    short: "Answers your business calls 24/7, books appointments and captures leads.",
    group: "assistant",
    icon: "PhoneCall",
    description:
      "Your assistant picks up every call, answers questions about your business, takes enquiries and appointment requests, and transfers to a person when needed. You get a summary of every call in Lumi.",
    features: ["Answers incoming calls 24/7", "Business information, prices & hours", "Appointment requests", "Lead capture & follow-up", "Call summaries in Lumi", "Transfer to a person"],
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
    approvalNote: "Call forwarding to your Lumi number has to be switched on with your phone provider — Lumi shows you exactly how.",
  },
  {
    id: "whatsapp",
    name: "WhatsApp AI Assistant",
    short: "Replies to customers on WhatsApp instantly, day and night.",
    group: "assistant",
    icon: "MessageCircle",
    description:
      "Answers customer questions, shares product and service details, captures leads, handles appointment and order enquiries and follows up — all on your WhatsApp Business number. Conversations appear inside Lumi.",
    features: ["Instant answers & FAQs", "Product / service information", "Lead capture", "Appointment & order enquiries", "Follow-ups", "Conversations inside Lumi"],
    price: 39,
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
    approvalNote: "Meta reviews every WhatsApp Business API number. This usually takes 1–3 days; Lumi guides you through it.",
  },
  {
    id: "instagram",
    name: "Instagram Automation",
    short: "Posts, reels and captions planned and published for you.",
    group: "social",
    icon: "Instagram",
    description:
      "Lumi plans your content, writes captions and hashtags, schedules posts and reels, helps with comments and replies to DMs where Instagram allows it — with your approval or automatically.",
    features: ["Content ideas & captions", "Hashtag suggestions", "Post & reel scheduling", "Comment assistance", "DM replies where supported", "Lead capture & analytics"],
    price: 29,
    setupTime: "Same day",
    connect: ["instagram"],
    info: [{ key: "about", label: "What should your posts show?", type: "textarea", fromBusiness: "services", required: true }],
    configure: [contentStyle, frequency, postTime, approval, { key: "dms", label: "Reply to DMs automatically", type: "toggle", default: true }],
    approvalNote: "Instagram needs a Business or Creator account linked to a Facebook Page.",
  },
  {
    id: "facebook",
    name: "Facebook Automation",
    short: "Page posts, reels and Messenger replies on autopilot.",
    group: "social",
    icon: "Facebook",
    description: "Posts and reels for your Facebook Page, scheduled content, comment help and Messenger replies where supported, with lead handling and analytics.",
    features: ["Page posts & reels", "Content scheduling", "Comment assistance", "Messenger replies where supported", "Lead handling", "Analytics"],
    price: 29,
    setupTime: "Same day",
    connect: ["facebook"],
    info: [{ key: "about", label: "What should your posts show?", type: "textarea", fromBusiness: "services", required: true }],
    configure: [contentStyle, frequency, postTime, approval, { key: "messenger", label: "Reply on Messenger automatically", type: "toggle", default: true }],
  },
  {
    id: "youtube",
    name: "YouTube Automation",
    short: "AI-made Shorts about your business, published on schedule.",
    group: "social",
    icon: "Youtube",
    description:
      "Tell Lumi “every day at 7 PM upload one Short about my restaurant.” Lumi turns your business into ideas, scripts, AI video, voice, thumbnail, title and description, checks quality, schedules and publishes — and shows views, likes and comments in Lumi.",
    features: ["AI content ideas & scripts", "AI video & voice-over", "Thumbnail, title & description", "Quality check before publishing", "Scheduled publishing", "Views, likes & comments in Lumi"],
    price: 59,
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
    name: "Email Assistant",
    short: "Sorts enquiries, drafts replies and follows up by email.",
    group: "assistant",
    icon: "Mail",
    description: "With your permission Lumi reads your business inbox, sorts enquiries, drafts replies for you to approve, follows up with leads and customers and sends campaigns you authorise.",
    features: ["Reads only the inbox you authorise", "Sorts enquiries", "Drafts replies", "Customer & lead follow-up", "Notifications", "Email campaigns you approve"],
    price: 25,
    setupTime: "Same day",
    connect: ["gmail"],
    info: [{ key: "signature", label: "Email signature", type: "textarea", placeholder: "Team at My Business\n+1 555 0100" }, faq],
    configure: [
      { key: "mode", label: "Replies", type: "select", options: ["Draft replies for me to approve", "Send routine replies automatically"], default: "Draft replies for me to approve" },
      tone,
    ],
    approvalNote: "Google asks you to grant Lumi permission to your mailbox. You can revoke it anytime in Settings → Connected accounts.",
  },
  {
    id: "reviews",
    name: "Google Review Assistant",
    short: "Watches your reviews, suggests replies and asks happy customers for one.",
    group: "growth",
    icon: "Star",
    description: "Monitors your Google reviews, alerts you to new ones, suggests replies, runs review-request campaigns to real customers and tracks your rating. Lumi never writes fake reviews or manipulates ratings.",
    features: ["New-review alerts", "Suggested replies", "Review requests to real customers", "Rating analytics", "Google Business Profile help"],
    price: 19,
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
    name: "Lead Follow-up Automation",
    short: "No lead forgotten — timely follow-ups on WhatsApp, email or SMS.",
    group: "growth",
    icon: "UserCheck",
    description: "Every new lead from calls, WhatsApp, social media or your website gets a timely, personal follow-up. Lumi tells you who needs a call today.",
    features: ["Leads from every channel in one list", "Automatic follow-up sequence", "Daily follow-up list", "Status tracking to conversion"],
    price: 29,
    setupTime: "Same day",
    connect: [],
    info: [{ key: "offer", label: "What do you offer new customers?", type: "textarea", placeholder: "10% off the first visit" }],
    configure: [
      { key: "channel", label: "Follow up on", type: "select", options: ["WhatsApp", "Email", "SMS", "WhatsApp, then email"], default: "WhatsApp, then email" },
      { key: "delay", label: "First follow-up after", type: "select", options: ["1 hour", "1 day", "2 days"], default: "1 day" },
    ],
  },
  {
    id: "social",
    name: "Social Media Automation",
    short: "Instagram + Facebook + content calendar in one plan.",
    group: "social",
    icon: "Share2",
    description: "One content calendar for Instagram and Facebook: ideas, captions, AI images, scheduling and publishing across both.",
    features: ["Instagram & Facebook together", "AI images & captions", "One content calendar", "Cross-posting", "Engagement analytics"],
    price: 49,
    setupTime: "Same day",
    connect: ["instagram", "facebook"],
    info: [{ key: "about", label: "What should your posts show?", type: "textarea", fromBusiness: "services", required: true }],
    configure: [contentStyle, frequency, postTime, approval],
  },
  {
    id: "digital-marketing",
    name: "Digital Marketing",
    short: "The complete package — Lumi runs your entire online growth.",
    group: "premium",
    icon: "Rocket",
    description:
      "Our most complete service. Website, SEO, Google Business Profile, reviews, Instagram, Facebook, YouTube, WhatsApp and email marketing, AI images and video, lead generation and follow-up, retention, local marketing, campaigns, paid ads support and monthly reporting — managed together.",
    features: [
      "Website + SEO + Google Business Profile",
      "Review & reputation management",
      "Instagram, Facebook & YouTube marketing",
      "WhatsApp & email marketing",
      "AI image & video creation",
      "Content calendar & scheduling",
      "Lead generation & follow-up",
      "Customer retention & local marketing",
      "Campaign management & paid ads support",
      "Analytics & monthly reporting",
    ],
    includes: ["website", "reviews", "instagram", "facebook", "youtube", "whatsapp", "email", "followup", "social"],
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
    description: "Describe the job you want automated — billing reminders, stock alerts, staff rosters, CRM sync — and our team designs, builds and connects it to Lumi.",
    features: ["Free consultation", "Built and maintained for you", "Appears in your Automation Control Centre", "Any app with an API"],
    price: null,
    setupTime: "Quote within 2 working days",
    connect: [],
    info: [{ key: "request", label: "What should be automated?", type: "textarea", required: true, placeholder: "Every evening, send me a summary of today’s orders and low-stock items." }],
    configure: [],
  },
];

export const serviceById = (id: string) => services.find((s) => s.id === id);

export const annualPrice = (monthly: number) => monthly * 10;

export const providerInfo: Record<ProviderId, { name: string; help: string }> = {
  youtube: { name: "YouTube", help: "Sign in with the Google account that owns your channel and allow uploads." },
  instagram: { name: "Instagram", help: "Use a Business or Creator account linked to your Facebook Page." },
  facebook: { name: "Facebook Page", help: "Sign in as a Page admin and choose the Page Lumi should manage." },
  whatsapp: { name: "WhatsApp Business", help: "Sign in with Meta and pick (or register) the number customers message." },
  google: { name: "Google Business Profile", help: "Sign in with the Google account that manages your Business Profile." },
  gmail: { name: "Gmail / Email", help: "Sign in and allow Lumi to read and draft emails in this mailbox only." },
  phone: { name: "Business phone", help: "Lumi gives you a number; forward your business calls to it." },
  website: { name: "Website", help: "Add a small Lumi snippet to your existing site to capture enquiries." },
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
