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
 * Shambhu — the AI Business Operating System app, in development.
 * Everything here describes what the app is being built to do. Nothing on the
 * site claims it is live: no user counts, no activity numbers, no prices yet.
 */
export const shambhu = {
  name: "Shambhu",
  tagline: "Your AI Business Operating System",
  positioning: "One AI. One Platform. Your Entire Business.",
  status: "In development · Early access",
  interest: "Shambhu AI — early access",
};

export type Capability = { title: string; body: string; icon: LucideIcon };

/** What the assistant is being built to handle, one connected account at a time. */
export const capabilities: Capability[] = [
  { title: "Calls & Voice", body: "Answers calls, takes enquiries and booking requests in a natural voice.", icon: PhoneCall },
  { title: "WhatsApp", body: "Replies to customers, shares details and follows up on WhatsApp Business.", icon: MessageCircle },
  { title: "Email & Gmail", body: "Sorts the inbox, drafts replies and sends follow-ups you approve.", icon: Mail },
  { title: "Instagram", body: "Replies to DMs and comments, and plans posts in your brand voice.", icon: Camera },
  { title: "Facebook", body: "Handles page messages and comments, and schedules page posts.", icon: ThumbsUp },
  { title: "YouTube", body: "Helps plan videos, titles and descriptions, and replies to comments.", icon: Clapperboard },
  { title: "Google Reviews", body: "Asks happy customers for a review and drafts replies. Never fake reviews.", icon: Star },
  { title: "Customer Support", body: "Answers common questions and hands tricky ones to your team.", icon: Headset },
  { title: "Lead Follow-up", body: "Follows up every enquiry on time, so no lead goes cold.", icon: UserRoundCheck },
  { title: "Business Information", body: "Knows your timings, services and prices, and answers from them.", icon: Info },
];

/** From sign-up to a working assistant. Each account is authorised by you, step by step. */
export const journey: { title: string; body: string }[] = [
  { title: "Sign in", body: "Create your Shambhu account." },
  { title: "Add your business", body: "Pick your category and name your assistant." },
  { title: "Choose a service", body: "Buy only what you need from the store." },
  { title: "Plan & payment", body: "Pick a plan and pay securely." },
  { title: "Connect your account", body: "Authorise WhatsApp, Gmail, Instagram and more." },
  { title: "Share business info", body: "Timings, services, prices and FAQs." },
  { title: "Shambhu configures", body: "Your automation is set up behind the scenes." },
  { title: "Test", body: "Try it yourself before any customer sees it." },
  { title: "Approve & activate", body: "Nothing goes live until you say yes." },
  { title: "Monitor", body: "Watch every reply and action in your Activity Centre." },
];

export type StoreItem = { title: string; body: string; icon: LucideIcon; premium?: boolean };

/** The Automation Store: every service can be bought on its own. */
export const store: StoreItem[] = [
  { title: "Website", body: "A fast, modern website for your business.", icon: Globe },
  { title: "AI Voice Assistant", body: "Answers your calls around the clock.", icon: PhoneCall },
  { title: "WhatsApp Automation", body: "Replies, reminders and follow-ups.", icon: MessageCircle },
  { title: "Instagram Automation", body: "DMs, comments and post planning.", icon: Camera },
  { title: "Facebook Automation", body: "Page messages, comments and posts.", icon: ThumbsUp },
  { title: "YouTube Automation", body: "Video planning and comment replies.", icon: Clapperboard },
  { title: "Email Automation", body: "Inbox sorting, drafts and follow-ups.", icon: Mail },
  { title: "Google Review Management", body: "Review requests and reply drafts.", icon: Star },
  { title: "Lead Follow-up", body: "Every enquiry followed up on time.", icon: UserRoundCheck },
  { title: "Customer Support", body: "Common questions answered on every channel.", icon: Headset },
  { title: "Social Media Management", body: "All your channels, planned in one place.", icon: Share2 },
  { title: "Custom Automation", body: "A flow built around how you work.", icon: Wrench },
  {
    title: "Digital Marketing",
    body: "The premium package: content, social media, campaigns and reporting, run together.",
    icon: Megaphone,
    premium: true,
  },
];

/** How customer data is protected. The backend stays invisible to the customer. */
export const safeguards: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "Your data stays yours", body: "Every business is kept separate from every other.", icon: Lock },
  { title: "Encrypted connections", body: "Account access is encrypted and can be removed any time.", icon: KeyRound },
  { title: "Audit log", body: "Every action Shambhu takes is recorded and visible to you.", icon: ScrollText },
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
];

export const appNav: { label: string; icon: LucideIcon }[] = [
  { label: "Home", icon: Home },
  { label: "Shambhu", icon: Bot },
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
  "Ask Shambhu",
];

/** Businesses Shambhu is being built for. */
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
