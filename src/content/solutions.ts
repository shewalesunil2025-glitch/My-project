export type SolutionId = "website" | "whatsapp" | "voice" | "support" | "leads" | "reviews" | "social" | "email";

export type Solution = {
  id: SolutionId;
  title: string;
  headline: string;
  summary: string;
  /** "Starting at" price in USD, as shown in the Automation Store. */
  price: string;
};

/** The services Shambhu runs. Prices match the Automation Store (src/content/shambhu.ts). */
export const solutions: Solution[] = [
  {
    id: "website",
    title: "Website",
    headline: "A website that works while you sleep.",
    summary: "A fast, modern website that captures enquiries and hands them straight to Shambhu.",
    price: "$299",
  },
  {
    id: "whatsapp",
    title: "WhatsApp Automation",
    headline: "Every WhatsApp message answered.",
    summary: "Instant replies, details and follow-ups on WhatsApp Business.",
    price: "$49/mo",
  },
  {
    id: "voice",
    title: "AI Voice Assistant",
    headline: "Every call answered. Even at 2 a.m.",
    summary: "Answers calls in a natural voice, takes enquiries and booking requests.",
    price: "$79/mo",
  },
  {
    id: "support",
    title: "Customer Support",
    headline: "Answers from your business, not a script.",
    summary: "Common questions answered on every channel. Tricky ones go to your team.",
    price: "$49/mo",
  },
  {
    id: "leads",
    title: "Lead Follow-up",
    headline: "No lead goes cold again.",
    summary: "Every enquiry followed up on time, until it becomes a customer.",
    price: "$39/mo",
  },
  {
    id: "reviews",
    title: "Google Review Management",
    headline: "Real reviews from real customers.",
    summary: "Asks happy customers for a review and drafts replies for you. Never fake reviews.",
    price: "$29/mo",
  },
  {
    id: "social",
    title: "Instagram · Facebook · YouTube",
    headline: "Your social media, on autopilot.",
    summary: "Replies to DMs and comments, and plans posts in your brand voice.",
    price: "$39/mo each",
  },
  {
    id: "email",
    title: "Email Automation",
    headline: "An inbox that sorts itself.",
    summary: "Sorts Gmail, drafts replies and sends the follow-ups you approve.",
    price: "$29/mo",
  },
];
