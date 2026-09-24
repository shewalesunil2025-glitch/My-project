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
    { label: "How It Works", href: "#process" },
    { label: "Industries", href: "#industries" },
    { label: "Work / Demos", href: "#work" },
    { label: "About", href: "#about" },
  ],
  footerNav: [
    { label: "Solutions", href: "#solutions" },
    { label: "Industries", href: "#industries" },
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
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
 * Hero character slot.
 * Drop a transparent PNG/WebP into /public/images and set `src` to enable the
 * mouse-following character. Leave `src` empty to show the AI core visual only.
 */
export const heroCharacterConfig = {
  src: "",
  headSrc: "",
  alt: "",
  width: 720,
  height: 900,
  /** Max translation in px at the edge of the viewport. */
  intensity: 18,
  /** "static" keeps the image on touch devices, "hidden" removes it. */
  mobileBehavior: "hidden" as "static" | "hidden",
};
