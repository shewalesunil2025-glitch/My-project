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

/** Movable irises, drawn over the character's own eyes. */
export type CharacterEyes = {
  /** Eye whites with the irises removed; its alpha is the eyelid opening. */
  plate: string;
  /** The irises alone, at their resting position. */
  iris: string;
  /** Where both images sit: [x, y, width, height] as fractions of the character image. */
  box: [number, number, number, number];
  /** Furthest iris shift: [sideways (of image width), up, down (of image height)]. */
  shift: [number, number, number];
};

/**
 * Hero character — one front-facing image (upscaled 4× with Real-ESRGAN, background
 * removed) that watches the cursor. The body never moves: the irises follow the
 * cursor inside the eyelids and the head turns a few degrees after them.
 * To swap the character, replace the three files in /public/images/character and
 * update `face`, `neckY` and `eyes`. Set `src` to "" to hide it.
 */
export const heroCharacterConfig = {
  src: "/images/character/front.webp",
  alt: "Nexa Flow AI mascot — a little boy in a turban with a painted moustache, watching your cursor",
  width: 640,
  height: 804,
  /** Point between the eyes (fractions of the image) — the aim is measured from here. */
  face: { x: 0.5, y: 0.51 },
  /** Height of the neck (fraction of the image): the head turns above it, the body stays below. */
  neckY: 0.715,
  /** Largest head rotation toward the cursor, in degrees. */
  maxHeadTurn: { yaw: 4, pitch: 3 },
  eyes: {
    plate: "/images/character/eyes-plate.webp",
    iris: "/images/character/eyes-iris.webp",
    box: [0.3521, 0.4686, 0.3521, 0.0807],
    shift: [0.0155, 0.0056, 0.0045],
  } as CharacterEyes,
  /** A soft blink every few seconds. Off by default. */
  blink: false,
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
