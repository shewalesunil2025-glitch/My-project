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

export type CharacterFrame = {
  src: string;
  /** Head direction: -1 = facing the viewer's left, 1 = right. */
  yaw: number;
  /** -1 = looking up, 1 = looking down. */
  pitch: number;
};

/**
 * Hero character — frames taken from a 360° turnaround video with the background
 * removed. The component shows whichever frame points closest to the cursor.
 * Replace the files in /public/images/character (and these yaw/pitch values) to swap it.
 * Set `frames` to [] to hide the character.
 */
export const heroCharacterConfig = {
  alt: "Nexa Flow AI mascot — a little boy in a turban with a painted moustache, turning to follow your cursor",
  width: 335,
  height: 436,
  /** Where the face sits in the frame (fraction of height) — the point the aim is measured from. */
  faceY: 0.34,
  /** "static" keeps the image on touch devices, "hidden" removes it. */
  mobileBehavior: "static" as "static" | "hidden",
  frames: [
    { src: "/images/character/pose-232.webp", yaw: 0.0, pitch: 0.0 },
    { src: "/images/character/pose-004.webp", yaw: -0.05, pitch: 0.0 },
    { src: "/images/character/pose-036.webp", yaw: -0.4, pitch: 0.15 },
    { src: "/images/character/pose-040.webp", yaw: -0.75, pitch: 0.05 },
    { src: "/images/character/pose-048.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/pose-076.webp", yaw: -0.65, pitch: -0.4 },
    { src: "/images/character/pose-080.webp", yaw: -0.35, pitch: -0.65 },
    { src: "/images/character/pose-084.webp", yaw: -0.15, pitch: -0.85 },
    { src: "/images/character/pose-096.webp", yaw: 0.0, pitch: -1.0 },
    { src: "/images/character/pose-104.webp", yaw: 0.05, pitch: -1.0 },
    { src: "/images/character/pose-112.webp", yaw: 0.15, pitch: -0.95 },
    { src: "/images/character/pose-120.webp", yaw: 0.4, pitch: -0.75 },
    { src: "/images/character/pose-124.webp", yaw: 0.6, pitch: -0.55 },
    { src: "/images/character/pose-128.webp", yaw: 0.75, pitch: -0.4 },
    { src: "/images/character/pose-136.webp", yaw: 0.9, pitch: -0.25 },
    { src: "/images/character/pose-140.webp", yaw: 1.0, pitch: -0.1 },
    { src: "/images/character/pose-160.webp", yaw: 1.0, pitch: 0.05 },
    { src: "/images/character/pose-176.webp", yaw: 0.85, pitch: 0.2 },
    { src: "/images/character/pose-180.webp", yaw: 0.65, pitch: 0.45 },
    { src: "/images/character/pose-184.webp", yaw: 0.3, pitch: 0.75 },
    { src: "/images/character/pose-200.webp", yaw: 0.0, pitch: 1.0 },
    { src: "/images/character/pose-216.webp", yaw: 0.0, pitch: 0.35 },
    { src: "/images/character/pose-220.webp", yaw: 0.0, pitch: 0.15 },
  ] as CharacterFrame[],
};

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
