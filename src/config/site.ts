export const siteConfig = {
  name: "Nexa Flow AI",
  wordmark: "NEXA FLOW AI",
  tagline: "AI Automation • Websites • Intelligent Business Systems",
  title: "Nexa Flow AI — AI Automation & Intelligent Business Systems",
  description:
    "Nexa Flow AI and IBAX AI, your AI business assistant: websites, AI voice, WhatsApp, customer support, lead follow-up, social media, email and Google review automation, with clear USD pricing.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ibaxai.com",
  email: "hello@nexaflow.ai",
  /** External booking page (Calendly, Cal.com…). When empty, the in-page demo form is used. */
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL || "",
  cta: {
    primary: "Book a Free Demo",
    secondary: "See What We Build",
  },
  nav: [
    { label: "Services", href: "#solutions" },
    { label: "Digital Marketing", href: "#digital-marketing" },
    { label: "IBAX AI", href: "#shambhu" },
    { label: "Automation Store", href: "#store" },
    { label: "Industries", href: "#industries" },
    { label: "About", href: "#about" },
    { label: "FAQ", href: "#faq" },
  ],
  footerNav: [
    { label: "Services", href: "#solutions" },
    { label: "Digital Marketing", href: "#digital-marketing" },
    { label: "IBAX AI", href: "#shambhu" },
    { label: "Automation Store", href: "#store" },
    { label: "Industries", href: "#industries" },
    { label: "About", href: "#about" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#contact" },
  ],
  /** Replace `href` values with real profiles once they exist. */
  social: [
    { label: "LinkedIn", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "X", href: "#" },
    { label: "YouTube", href: "#" },
  ],
} as const;

/**
 * Founder profile for the About section.
 * Put the portrait in /public/images/founder/ and set `photo` (e.g. "/images/founder/sunil.webp").
 * While `photo` is empty a monogram card is shown instead.
 */
export const founder = {
  name: "Sunil S.",
  role: "Founder & AI Automation Strategist",
  photo: "/images/founder/shewale-sunil.webp",
  photoAlt: "Sunil S., founder of Nexa Flow AI",
  headline:
    "Building next-generation digital systems that combine AI, automation, websites, WhatsApp, voice technology, and intelligent business workflows.",
  bio: [
    "Sunil focuses on creating premium digital experiences and automation systems that help businesses simplify operations, improve customer communication, capture leads, manage bookings, and automate repetitive tasks.",
    "Nexa Flow AI is built with a vision to go beyond traditional website development — creating an intelligent technology ecosystem where websites, AI agents, conversations, and business workflows work together as one connected system.",
  ],
  vision: "Building smarter businesses for the next generation.",
  focus: ["AI agents", "Automation", "Websites", "WhatsApp", "Voice AI", "Business workflows"],
};
