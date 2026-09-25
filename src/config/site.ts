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

/** Movable irises for the front frame (the first frame at yaw 0, pitch 0). */
export type CharacterEyes = {
  /** Eye whites with the irises removed; its alpha is the eyelid opening. */
  plate: string;
  /** The irises alone, at their resting position. */
  iris: string;
  /** Where both images sit: [x, y, width, height] as fractions of the frame. */
  box: [number, number, number, number];
  /** Furthest iris shift: [sideways (of width), up, down (of height)]. */
  shift: [number, number, number];
};

/**
 * Hero character — frames from a turnaround video, upscaled 4× with Real-ESRGAN,
 * background removed and edge-defringed. Frames are picked so each differs only
 * slightly from the next (smooth blends), and every frame with closed or
 * blinking eyelids is left out. The front frame also has movable irises, so the
 * eyes can lead the head. Replace the files in /public/images/character (and
 * these values) to swap it. Set `frames` to [] to hide the character.
 */
export const heroCharacterConfig = {
  alt: "Nexa Flow AI mascot — a little boy in a turban with a painted moustache, turning to follow your cursor",
  width: 640,
  height: 804,
  /** Where the eyes sit in the frame (fraction of height) — the point the aim is measured from. */
  faceY: 0.48,
  /** "static" keeps the image on touch devices, "hidden" removes it. */
  mobileBehavior: "static" as "static" | "hidden",
  eyes: {
    plate: "/images/character/eyes-plate.webp",
    iris: "/images/character/eyes-iris.webp",
    box: [0.3521, 0.4686, 0.3521, 0.0807],
    shift: [0.0155, 0.0056, 0.0045],
  } as CharacterEyes,
  frames: [
    { src: "/images/character/turn-232.webp", yaw: 0.0, pitch: 0.0 },
    { src: "/images/character/turn-037.webp", yaw: -0.488, pitch: 0.125 },
    { src: "/images/character/turn-038.webp", yaw: -0.575, pitch: 0.1 },
    { src: "/images/character/turn-039.webp", yaw: -0.662, pitch: 0.075 },
    { src: "/images/character/turn-040.webp", yaw: -0.75, pitch: 0.05 },
    { src: "/images/character/turn-041.webp", yaw: -0.8, pitch: 0.043 },
    { src: "/images/character/turn-042.webp", yaw: -0.85, pitch: 0.035 },
    { src: "/images/character/turn-043.webp", yaw: -0.9, pitch: 0.028 },
    { src: "/images/character/turn-044.webp", yaw: -0.95, pitch: 0.02 },
    { src: "/images/character/turn-046.webp", yaw: -0.975, pitch: 0.01 },
    { src: "/images/character/turn-048.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/turn-051.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/turn-055.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/turn-057.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/turn-059.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/turn-061.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/turn-064.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/turn-069.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/turn-071.webp", yaw: -1.0, pitch: 0.0 },
    { src: "/images/character/turn-073.webp", yaw: -0.912, pitch: -0.1 },
    { src: "/images/character/turn-074.webp", yaw: -0.825, pitch: -0.2 },
    { src: "/images/character/turn-075.webp", yaw: -0.738, pitch: -0.3 },
    { src: "/images/character/turn-076.webp", yaw: -0.65, pitch: -0.4 },
    { src: "/images/character/turn-077.webp", yaw: -0.575, pitch: -0.463 },
    { src: "/images/character/turn-078.webp", yaw: -0.5, pitch: -0.525 },
    { src: "/images/character/turn-079.webp", yaw: -0.425, pitch: -0.588 },
    { src: "/images/character/turn-080.webp", yaw: -0.35, pitch: -0.65 },
    { src: "/images/character/turn-081.webp", yaw: -0.3, pitch: -0.7 },
    { src: "/images/character/turn-082.webp", yaw: -0.25, pitch: -0.75 },
    { src: "/images/character/turn-083.webp", yaw: -0.2, pitch: -0.8 },
    { src: "/images/character/turn-084.webp", yaw: -0.15, pitch: -0.85 },
    { src: "/images/character/turn-086.webp", yaw: -0.1, pitch: -0.9 },
    { src: "/images/character/turn-088.webp", yaw: -0.05, pitch: -0.95 },
    { src: "/images/character/turn-090.webp", yaw: -0.038, pitch: -0.962 },
    { src: "/images/character/turn-092.webp", yaw: -0.025, pitch: -0.975 },
    { src: "/images/character/turn-094.webp", yaw: -0.012, pitch: -0.988 },
    { src: "/images/character/turn-096.webp", yaw: 0.0, pitch: -1.0 },
    { src: "/images/character/turn-098.webp", yaw: 0.013, pitch: -1.0 },
    { src: "/images/character/turn-100.webp", yaw: 0.025, pitch: -1.0 },
    { src: "/images/character/turn-103.webp", yaw: 0.044, pitch: -1.0 },
    { src: "/images/character/turn-106.webp", yaw: 0.075, pitch: -0.988 },
    { src: "/images/character/turn-110.webp", yaw: 0.125, pitch: -0.962 },
    { src: "/images/character/turn-117.webp", yaw: 0.306, pitch: -0.825 },
    { src: "/images/character/turn-120.webp", yaw: 0.4, pitch: -0.75 },
    { src: "/images/character/turn-122.webp", yaw: 0.5, pitch: -0.65 },
    { src: "/images/character/turn-124.webp", yaw: 0.6, pitch: -0.55 },
    { src: "/images/character/turn-126.webp", yaw: 0.675, pitch: -0.475 },
    { src: "/images/character/turn-128.webp", yaw: 0.75, pitch: -0.4 },
    { src: "/images/character/turn-130.webp", yaw: 0.787, pitch: -0.363 },
    { src: "/images/character/turn-132.webp", yaw: 0.825, pitch: -0.325 },
    { src: "/images/character/turn-134.webp", yaw: 0.863, pitch: -0.287 },
    { src: "/images/character/turn-136.webp", yaw: 0.9, pitch: -0.25 },
    { src: "/images/character/turn-138.webp", yaw: 0.95, pitch: -0.175 },
    { src: "/images/character/turn-140.webp", yaw: 1.0, pitch: -0.1 },
    { src: "/images/character/turn-141.webp", yaw: 1.0, pitch: -0.07 },
    { src: "/images/character/turn-142.webp", yaw: 1.0, pitch: -0.04 },
    { src: "/images/character/turn-143.webp", yaw: 1.0, pitch: -0.01 },
    { src: "/images/character/turn-144.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-145.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-146.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-148.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-150.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-153.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-156.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-163.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-167.webp", yaw: 1.0, pitch: 0.02 },
    { src: "/images/character/turn-173.webp", yaw: 0.963, pitch: 0.065 },
    { src: "/images/character/turn-177.webp", yaw: 0.8, pitch: 0.263 },
    { src: "/images/character/turn-178.webp", yaw: 0.75, pitch: 0.325 },
    { src: "/images/character/turn-179.webp", yaw: 0.7, pitch: 0.388 },
    { src: "/images/character/turn-180.webp", yaw: 0.65, pitch: 0.45 },
    // Mirrored frames: the video turns right only while looking up/down.
    { src: "/images/character/turn-037.webp", yaw: 0.488, pitch: 0.125, mirror: true },
    { src: "/images/character/turn-038.webp", yaw: 0.575, pitch: 0.1, mirror: true },
    { src: "/images/character/turn-039.webp", yaw: 0.662, pitch: 0.075, mirror: true },
    { src: "/images/character/turn-040.webp", yaw: 0.75, pitch: 0.05, mirror: true },
    { src: "/images/character/turn-041.webp", yaw: 0.8, pitch: 0.043, mirror: true },
    { src: "/images/character/turn-042.webp", yaw: 0.85, pitch: 0.035, mirror: true },
    { src: "/images/character/turn-043.webp", yaw: 0.9, pitch: 0.028, mirror: true },
    { src: "/images/character/turn-044.webp", yaw: 0.95, pitch: 0.02, mirror: true },
    { src: "/images/character/turn-046.webp", yaw: 0.975, pitch: 0.01, mirror: true },
    { src: "/images/character/turn-173.webp", yaw: -0.963, pitch: 0.065, mirror: true },
    { src: "/images/character/turn-177.webp", yaw: -0.8, pitch: 0.263, mirror: true },
    { src: "/images/character/turn-178.webp", yaw: -0.75, pitch: 0.325, mirror: true },
    { src: "/images/character/turn-179.webp", yaw: -0.7, pitch: 0.388, mirror: true },
    { src: "/images/character/turn-180.webp", yaw: -0.65, pitch: 0.45, mirror: true },
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
