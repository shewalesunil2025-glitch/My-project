import { Blocks, Handshake, TrendingUp, Workflow, type LucideIcon } from "lucide-react";

export type Pillar = {
  title: string;
  lead: string;
  items: string[];
  icon: LucideIcon;
  cta: string;
  interest: string;
  /** How the engagement is billed — never a made-up number. */
  terms: string;
  featured?: boolean;
};

/** The four ways to work with Nexa Flow AI. */
export const pillars: Pillar[] = [
  {
    title: "Build",
    lead: "The digital front door your customers see.",
    items: ["Premium business websites", "AI chatbots", "AI voice agents", "Booking & landing pages"],
    icon: Blocks,
    cta: "Talk about a build",
    interest: "AI-powered website",
    terms: "fixed price",
  },
  {
    title: "Automate",
    lead: "The work that runs itself behind it.",
    items: ["n8n workflow automation", "AI agents for lead capture & follow-up", "CRM & email automation", "WhatsApp business bots"],
    icon: Workflow,
    cta: "Talk about automation",
    interest: "Workflow automation",
    terms: "fixed price",
    featured: true,
  },
  {
    title: "Grow",
    lead: "More of the right customers finding you.",
    items: ["Technical SEO & content strategy", "Google review growth", "Branding & visual identity", "Instagram content & reels"],
    icon: TrendingUp,
    cta: "Talk about growth",
    interest: "Growth & marketing",
    terms: "fixed price",
  },
  {
    title: "Partner",
    lead: "A long-term team for your systems.",
    items: ["Monthly retainers", "Ongoing development & optimisation", "Growth sprints", "Strategic advisory"],
    icon: Handshake,
    cta: "Talk about a partnership",
    interest: "Monthly partnership",
    terms: "monthly",
  },
];

/** Commitments shown with the pillars. */
export const promises = [
  { title: "Free 30-minute call", body: "We look at how your customers reach you today." },
  { title: "Proposal within 24 hours", body: "Clear scope, timeline and a fixed price." },
  { title: "Fixed price, no surprises", body: "No commitment until you say yes." },
];
