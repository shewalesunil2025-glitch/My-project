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
 * IBAXAI — the AI Business Operating System app, in development.
 * Everything here describes what the app is being built to do. Nothing on the
 * site claims it is live: no user counts, no activity numbers, no prices yet.
 */
export const shambhu = {
  name: "IBAXAI",
  tagline: "Your AI Business Operating System",
  positioning: "One AI. One Platform. Your Entire Business.",
  status: "Preview · Try it on your phone",
  interest: "IBAXAI — early access",
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
  /** "Starting at" price in USD. */
  price: string;
  billing: "monthly" | "one-time";
  premium?: boolean;
};

/** The Automation Store: every service can be bought on its own. */
export const store: StoreItem[] = [
  { title: "Website", body: "A fast, modern website with IBAXAI built in.", icon: Globe, price: "$299", billing: "one-time" },
  { title: "AI Voice Assistant", body: "Answers your calls around the clock.", icon: PhoneCall, price: "$79", billing: "monthly" },
  { title: "WhatsApp Automation", body: "Replies, reminders and follow-ups.", icon: MessageCircle, price: "$49", billing: "monthly" },
  { title: "Customer Support", body: "Common questions answered on every channel.", icon: Headset, price: "$49", billing: "monthly" },
  { title: "Lead Follow-up", body: "Every enquiry followed up on time.", icon: UserRoundCheck, price: "$39", billing: "monthly" },
  { title: "Instagram Automation", body: "DMs, comments and post planning.", icon: Camera, price: "$39", billing: "monthly" },
  { title: "Facebook Automation", body: "Page messages, comments and posts.", icon: ThumbsUp, price: "$39", billing: "monthly" },
  { title: "YouTube Automation", body: "Video planning and comment replies.", icon: Clapperboard, price: "$39", billing: "monthly" },
  { title: "Email Automation", body: "Inbox sorting, drafts and follow-ups.", icon: Mail, price: "$29", billing: "monthly" },
  { title: "Google Review Management", body: "Review requests and reply drafts. Never fake reviews.", icon: Star, price: "$29", billing: "monthly" },
  {
    title: "Digital Marketing",
    body: "The premium package: content, social media, campaigns and reporting, run together.",
    icon: Megaphone,
    price: "$299",
    billing: "monthly",
    premium: true,
  },
];

/** How customer data is protected. The backend stays invisible to the customer. */
export const safeguards: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "Your data stays yours", body: "Every business is kept separate from every other.", icon: Lock },
  { title: "Encrypted connections", body: "Account access is encrypted and can be removed any time.", icon: KeyRound },
  { title: "Audit log", body: "Every action IBAXAI takes is recorded and visible to you.", icon: ScrollText },
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

/** Businesses IBAXAI is being built for. */
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
