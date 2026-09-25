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
  /** Draw the image flipped horizontally (fills angles the video never shows). */
  mirror?: boolean;
};

/**
 * Hero character — 65 frames from a turnaround video, upscaled 4× with Real-ESRGAN,
 * background removed and edge-defringed. The component shows whichever frame points closest to the cursor.
 * Replace the files in /public/images/character (and these yaw/pitch values) to swap it.
 * Set `frames` to [] to hide the character.
 */
export const heroCharacterConfig = {
  alt: "Nexa Flow AI mascot — a little boy in a turban with a painted moustache, turning to follow your cursor",
  width: 640,
  height: 804,
  /** Where the face sits in the frame (fraction of height) — the point the aim is measured from. */
  faceY: 0.34,
  /** "static" keeps the image on touch devices, "hidden" removes it. */
  mobileBehavior: "static" as "static" | "hidden",
  frames: [
    { src: "/images/character/turn-232.webp", yaw: 0.0, pitch: 0.0 },
    { src: "/images/character/turn-034.webp", yaw: -0.2, pitch: 0.085 },
    { src: "/images/character/turn-037.webp", yaw: -0.488, pitch: 0.125 },
    { src: "/images/character/turn-040.webp", yaw: -0.75, pitch: 0.05 },
    { src: "/images/character/turn-043.webp", yaw: -0.9, pitch: 0.028 },
    { src: "/images/character/turn-046.webp", yaw: -0.975, pitch: 0.01 },
    { src: "/images/character/turn-049.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/turn-052.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/turn-055.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/turn-058.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/turn-061.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/turn-064.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/turn-067.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/turn-070.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/turn-073.webp", yaw: -0.912, pitch: -0.1 },
    { src: "/images/character/turn-076.webp", yaw: -0.65, pitch: -0.4 },
    { src: "/images/character/turn-079.webp", yaw: -0.425, pitch: -0.588 },
    { src: "/images/character/turn-082.webp", yaw: -0.25, pitch: -0.75 },
    { src: "/images/character/turn-085.webp", yaw: -0.125, pitch: -0.875 },
    { src: "/images/character/turn-088.webp", yaw: -0.05, pitch: -0.95 },
    { src: "/images/character/turn-091.webp", yaw: -0.031, pitch: -0.969 },
    { src: "/images/character/turn-094.webp", yaw: -0.012, pitch: -0.988 },
    { src: "/images/character/turn-097.webp", yaw: 0.006, pitch: -1.0 },
    { src: "/images/character/turn-100.webp", yaw: 0.025, pitch: -1.0 },
    { src: "/images/character/turn-103.webp", yaw: 0.044, pitch: -1.0 },
    { src: "/images/character/turn-106.webp", yaw: 0.075, pitch: -0.988 },
    { src: "/images/character/turn-109.webp", yaw: 0.112, pitch: -0.969 },
    { src: "/images/character/turn-112.webp", yaw: 0.15, pitch: -0.95 },
    { src: "/images/character/turn-115.webp", yaw: 0.244, pitch: -0.875 },
    { src: "/images/character/turn-118.webp", yaw: 0.338, pitch: -0.8 },
    { src: "/images/character/turn-121.webp", yaw: 0.45, pitch: -0.7 },
    { src: "/images/character/turn-124.webp", yaw: 0.6, pitch: -0.55 },
    { src: "/images/character/turn-127.webp", yaw: 0.713, pitch: -0.438 },
    { src: "/images/character/turn-130.webp", yaw: 0.787, pitch: -0.363 },
    { src: "/images/character/turn-133.webp", yaw: 0.844, pitch: -0.306 },
    { src: "/images/character/turn-136.webp", yaw: 0.9, pitch: -0.25 },
    { src: "/images/character/turn-139.webp", yaw: 0.975, pitch: -0.138 },
    { src: "/images/character/turn-142.webp", yaw: 1.0, pitch: -0.04 },
    { src: "/images/character/turn-145.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-148.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-151.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-154.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-157.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-160.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-163.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-166.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-169.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-172.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-175.webp", yaw: 0.887, pitch: 0.155 },
    { src: "/images/character/turn-178.webp", yaw: 0.75, pitch: 0.325 },
    { src: "/images/character/turn-181.webp", yaw: 0.562, pitch: 0.525 },
    { src: "/images/character/turn-184.webp", yaw: 0.3, pitch: 0.75 },
    { src: "/images/character/turn-187.webp", yaw: 0.15, pitch: 0.9 },
    { src: "/images/character/turn-190.webp", yaw: 0.05, pitch: 0.975 },
    { src: "/images/character/turn-193.webp", yaw: 0.0, pitch: 1.0 },
    { src: "/images/character/turn-196.webp", yaw: 0.0, pitch: 1.0 },
    { src: "/images/character/turn-199.webp", yaw: 0.0, pitch: 1.0 },
    { src: "/images/character/turn-202.webp", yaw: 0.0, pitch: 1.0 },
    { src: "/images/character/turn-205.webp", yaw: 0.0, pitch: 1.0 },
    { src: "/images/character/turn-208.webp", yaw: 0.0, pitch: 1.0 },
    { src: "/images/character/turn-211.webp", yaw: 0.0, pitch: 1.0 },
    { src: "/images/character/turn-214.webp", yaw: 0.0, pitch: 0.675 },
    { src: "/images/character/turn-217.webp", yaw: 0.0, pitch: 0.3 },
    { src: "/images/character/turn-220.webp", yaw: 0.0, pitch: 0.15 },
    { src: "/images/character/turn-223.webp", yaw: 0.0, pitch: 0.038 },
    // Mirrored frames: the video turns right only while looking up/down.
    { src: "/images/character/turn-034.webp", yaw: 0.2, pitch: 0.085, mirror: true },
    { src: "/images/character/turn-037.webp", yaw: 0.488, pitch: 0.125, mirror: true },
    { src: "/images/character/turn-040.webp", yaw: 0.75, pitch: 0.05, mirror: true },
    { src: "/images/character/turn-043.webp", yaw: 0.9, pitch: 0.028, mirror: true },
    { src: "/images/character/turn-046.webp", yaw: 0.975, pitch: 0.01, mirror: true },
    { src: "/images/character/turn-175.webp", yaw: -0.887, pitch: 0.155, mirror: true },
    { src: "/images/character/turn-178.webp", yaw: -0.75, pitch: 0.325, mirror: true },
    { src: "/images/character/turn-181.webp", yaw: -0.562, pitch: 0.525, mirror: true },
    { src: "/images/character/turn-184.webp", yaw: -0.3, pitch: 0.75, mirror: true },
    { src: "/images/character/turn-187.webp", yaw: -0.15, pitch: 0.9, mirror: true },
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
