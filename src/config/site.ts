export const siteConfig = {
  name: "Nexa Flow AI",
  wordmark: "NEXA FLOW AI",
  tagline: "AI Automation • Websites • Intelligent Business Systems",
  title: "Nexa Flow AI — AI Automation & Intelligent Business Systems",
  description:
    "Nexa Flow AI builds AI-powered websites, WhatsApp automation, AI voice agents and intelligent business systems that help businesses automate conversations, bookings and workflows.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexaflow.ai",
  email: "hello@nexaflow.ai",
  /** External booking page (Calendly, Cal.com…). When empty, the in-page demo form is used. */
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL || "",
  cta: {
    primary: "Book a Free Demo",
    secondary: "See What We Build",
  },
  nav: [
    { label: "Solutions", href: "#solutions" },
    { label: "Services", href: "#services" },
    { label: "How It Works", href: "#process" },
    { label: "Industries", href: "#industries" },
    { label: "Work / Demos", href: "#work" },
    { label: "About", href: "#about" },
  ],
  footerNav: [
    { label: "Solutions", href: "#solutions" },
    { label: "Services", href: "#services" },
    { label: "Industries", href: "#industries" },
    { label: "Work", href: "#work" },
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

export type HeroEye = {
  /** Iris sprite (transparent, round) that moves inside the eye. */
  irisSrc: string;
  /** Eye-opening mask (white where the eye is open, transparent elsewhere). */
  maskSrc: string;
  /** Eye opening box as [left, top, width, height] in % of the character image. */
  box: [number, number, number, number];
  /** Iris centre [x, y] and diameter, in % of the eye box width/height. */
  iris: [number, number, number];
};

/**
 * Hero character.
 * The body image has its irises painted out; each iris is a separate sprite that
 * follows the cursor inside its eye mask, while the head turns gently on the neck.
 * Replace the files in /public/images/hero-character to swap the character.
 * Set `src` to "" to show the AI core visual only.
 */
export const heroCharacterConfig = {
  src: "/images/hero-character/body.webp",
  alt: "Nexa Flow AI mascot — a little boy in a turban with a painted moustache, watching your cursor",
  width: 1020,
  height: 738,
  /** Max head travel in px at the viewport edge. */
  intensity: 18,
  /** Max head turn in degrees. */
  headTurn: 14,
  /** How far the irises can travel, as a fraction of the iris size. */
  eyeRange: 0.3,
  /** "static" keeps the image on touch devices, "hidden" removes it. */
  mobileBehavior: "static" as "static" | "hidden",
  eyes: [
    {
      irisSrc: "/images/hero-character/iris-left.webp",
      maskSrc: "/images/hero-character/eye-mask-left.png",
      box: [38.039, 56.911, 10.49, 10.027],
      iris: [52.336, 51.351, 56.075],
    },
    {
      irisSrc: "/images/hero-character/iris-right.webp",
      maskSrc: "/images/hero-character/eye-mask-right.png",
      box: [56.275, 55.014, 10.0, 10.84],
      iris: [46.078, 50.0, 58.824],
    },
  ] as HeroEye[],
};

/**
 * Founder profile for the About section.
 * Put the portrait in /public/images/founder/ and set `photo` (e.g. "/images/founder/sunil.webp").
 * While `photo` is empty a monogram card is shown instead.
 */
export const founder = {
  name: "Shewale Sunil",
  role: "Founder & AI Automation Strategist",
  photo: "/images/founder/shewale-sunil.webp",
  photoAlt: "Shewale Sunil, founder of Nexa Flow AI",
  headline:
    "Building next-generation digital systems that combine AI, automation, websites, WhatsApp, voice technology, and intelligent business workflows.",
  bio: [
    "Sunil focuses on creating premium digital experiences and automation systems that help businesses simplify operations, improve customer communication, capture leads, manage bookings, and automate repetitive tasks.",
    "Nexa Flow AI is built with a vision to go beyond traditional website development — creating an intelligent technology ecosystem where websites, AI agents, conversations, and business workflows work together as one connected system.",
  ],
  vision: "Building smarter businesses for the next generation.",
  focus: ["AI agents", "Automation", "Websites", "WhatsApp", "Voice AI", "Business workflows"],
};
