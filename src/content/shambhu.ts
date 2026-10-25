import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bot,
  Camera,
  Clapperboard,
  Globe,
  Headset,
  Home,
  Info,
  KeyRound,
  LayoutGrid,
  Lock,
  Mail,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  PhoneCall,
  ScrollText,
  Share2,
  ShieldCheck,
  Star,
  ThumbsUp,
  UserRoundCheck,
  Wrench,
} from "lucide-react";

/**
 * ibaxai — the AI Business Operating System app, in development.
 * Everything here describes what the app is being built to do. Nothing on the
 * site claims it is live: no user counts, no activity numbers, no prices yet.
 */
export const shambhu = {
  name: "ibaxai",
  tagline: "Your AI Business Operating System",
  positioning: "One AI. One Platform. Your Entire Business.",
  status: "Preview · Try it on your phone",
  interest: "ibaxai — early access",
};

/** From choosing a service to going live. Each account is authorised by you. */
export const journey: { title: string; body: string }[] = [
  { title: "Choose a service", body: "Buy only what you need." },
  { title: "Connect your account", body: "WhatsApp, Gmail, Instagram and more." },
  { title: "Share business info", body: "Timings, services, prices and FAQs." },
  { title: "Test and approve", body: "Nothing goes live until you say yes." },
  { title: "Go live", body: "Watch every action in the app." },
];

export type StoreItem = {
  title: string;
  body: string;
  icon: LucideIcon;
  /** "Starting at" price in INR (all-inclusive). */
  price: string;
  /** The same price in US dollars, shown to visitors outside India. */
  usd: string;
  billing: "monthly" | "one-time";
  premium?: boolean;
  /** Free for the first TRIAL_DAYS days (messaging automations only). */
  trial?: boolean;
  /** A bundle of several services, shown as a wide card. */
  bundle?: boolean;
};

/** The Automation Store: every service can be bought on its own. */
export const store: StoreItem[] = [
  { title: "Website", body: "A fast, modern website with ibaxai built in.", icon: Globe, price: "₹2,999", usd: "$299", billing: "one-time" },
  { title: "AI Voice Assistant", body: "Answers your calls around the clock.", icon: PhoneCall, price: "₹5,999", usd: "$99", billing: "monthly" },
  { title: "WhatsApp Automation", body: "Replies, reminders and follow-ups.", icon: MessageCircle, price: "₹799", usd: "$49", billing: "monthly", trial: true },
  { title: "Customer Support", body: "Common questions answered on every channel.", icon: Headset, price: "₹699", usd: "$49", billing: "monthly", trial: true },
  { title: "Lead Follow-up", body: "Every enquiry followed up on time.", icon: UserRoundCheck, price: "₹499", usd: "$39", billing: "monthly", trial: true },
  { title: "Instagram Automation", body: "12 AI posts + 4 reels a month, DMs and comments.", icon: Camera, price: "₹1,999", usd: "$39", billing: "monthly" },
  { title: "Facebook Automation", body: "12 AI posts + 4 videos a month, page messages.", icon: ThumbsUp, price: "₹1,999", usd: "$39", billing: "monthly" },
  { title: "YouTube Automation", body: "8 AI Shorts a month, titles and comment replies.", icon: Clapperboard, price: "₹2,999", usd: "$39", billing: "monthly" },
  { title: "Email Automation", body: "Inbox sorting, drafts and follow-ups.", icon: Mail, price: "₹499", usd: "$29", billing: "monthly", trial: true },
  { title: "Google Review Management", body: "Review requests on WhatsApp after every sale. Never fake reviews.", icon: Star, price: "₹499", usd: "$29", billing: "monthly", trial: true },
  {
    title: "Social Pack",
    body: "Instagram, Facebook and YouTube together: 12 AI posts + 4 reels on Instagram & Facebook and 8 Shorts on YouTube every month, with DM and comment replies. Cheaper than buying all three separately.",
    icon: Clapperboard,
    price: "₹5,999", usd: "$99",
    billing: "monthly",
    bundle: true,
  },
  {
    title: "Digital Marketing",
    body: "The premium package: content, social media, campaigns and reporting, run together.",
    icon: Megaphone,
    price: "₹9,999", usd: "$299",
    billing: "monthly",
    premium: true,
  },
];

/** How customer data is protected. The backend stays invisible to the customer. */
export const safeguards: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "Your data stays yours", body: "Every business is kept separate from every other.", icon: Lock },
  { title: "Encrypted connections", body: "Account access is encrypted and can be removed any time.", icon: KeyRound },
  { title: "Audit log", body: "Every action ibaxai takes is recorded and visible to you.", icon: ScrollText },
  { title: "You approve", body: "Nothing goes live without your approval.", icon: ShieldCheck },
];

/** Sample rows for the app preview. Illustrations, not real activity. */
export const sampleActivity: { icon: LucideIcon; channel: string; text: string }[] = [
  { icon: MessageCircle, channel: "WhatsApp", text: "Replied to a question about opening hours" },
  { icon: PhoneCall, channel: "Call", text: "Took a booking request for Saturday" },
  { icon: Star, channel: "Google", text: "Drafted a review reply — waiting for your approval" },
  { icon: UserRoundCheck, channel: "Leads", text: "Scheduled a follow-up for a new enquiry" },
  { icon: Mail, channel: "Gmail", text: "Sorted the inbox and drafted two replies" },
  { icon: Camera, channel: "Instagram", text: "Answered a DM about prices" },
  { icon: Megaphone, channel: "Marketing", text: "This week's posts are ready for your approval" },
];

export const appNav: { label: string; icon: LucideIcon }[] = [
  { label: "Home", icon: Home },
  { label: "IBAX", icon: Bot },
  { label: "Services", icon: LayoutGrid },
  { label: "Activity", icon: Activity },
  { label: "More", icon: MoreHorizontal },
];

export const appAreas = [
  "Automation Control Centre",
  "Content Centre",
  "Activity Centre",
  "Leads",
  "Analytics",
  "Notifications",
  "Billing",
  "Settings",
  "Ask IBAX",
];

/** Businesses ibaxai is being built for. */
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
];
