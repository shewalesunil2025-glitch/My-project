import type { Business, SiteSection, WebsiteProject } from "@/lib/app/types";
import { themeFor, themes } from "./themes";

/**
 * A client's published website: everything the public page needs, and nothing private.
 * Built in the app from the business profile + the website builder, stored in Supabase
 * (`sites` table) and rendered at /s/<slug>.
 */
export type PublishedSite = {
  slug: string;
  template: PremiumTemplate;
  accent: string;
  name: string;
  category: string;
  headline: string;
  tagline: string;
  about: string;
  services: { name: string; price: string }[];
  hours: string;
  address: string;
  phone: string;
  /** Digits with country code, for wa.me links. */
  whatsapp: string;
  email: string;
  faqs: { q: string; a: string }[];
  logo: string;
  sections: SiteSection[];
};

export const allSections: { id: SiteSection; label: string }[] = [
  { id: "services", label: "Services & prices" },
  { id: "hours", label: "Hours & location" },
  { id: "faq", label: "FAQ" },
  { id: "enquiry", label: "Enquiry form" },
  { id: "whatsapp", label: "WhatsApp button" },
];

/** Template id: one of the premium templates in ./themes. */
export type PremiumTemplate = string;

export const templates: { id: PremiumTemplate; label: string; note: string }[] = themes.map(({ id, label, note }) => ({ id, label, note }));

export const premiumTemplate = (t: string): PremiumTemplate => themeFor(t).id;

export const accents = ["#15803d", "#0f766e", "#2563eb", "#7c3aed", "#e11d48", "#ea580c", "#ca8a04", "#111111"];

/** URL-safe address: lowercase letters, digits and dashes, 3–40 characters. */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

export const validSlug = (slug: string) => /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(slug);

/** "Haircut ₹300, Facial — ₹800" → [{ name: "Haircut", price: "₹300" }, …] */
export function parseServices(text: string) {
  return text
    .split(/\n|,(?!\s*\d)(?![^(]*\))/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 24)
    .map((line) => {
      const m = line.match(/^(.*?)(?:\s*[—–:-]\s*|\s+)((?:₹|rs\.?|inr|\$|€|£)\s?[\d,.]+(?:\s*(?:onwards|\+))?|[\d,.]+\s?(?:₹|rs\.?|\/-))$/i);
      return m && m[1].trim() ? { name: m[1].trim(), price: m[2].trim() } : { name: line, price: "" };
    });
}

/** "Q: … A: …" blocks (or alternating lines) → question/answer pairs. */
export function parseFaqs(text: string) {
  const out: { q: string; a: string }[] = [];
  let q = "";
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const qm = line.match(/^q[:.)]\s*(.*)$/i);
    const am = line.match(/^a[:.)]\s*(.*)$/i);
    if (qm) q = qm[1];
    else if (am && q) {
      out.push({ q, a: am[1] });
      q = "";
    } else if (!q) q = line;
    else {
      out.push({ q, a: line });
      q = "";
    }
  }
  return out.slice(0, 12);
}

const digits = (s: string) => s.replace(/\D/g, "");

export function defaultProject(b: Business): WebsiteProject {
  return {
    status: "draft",
    template: "aurora",
    pages: [],
    headline: b.name,
    tagline: [b.category, b.city].filter(Boolean).join(" · "),
    about: b.description,
    accent: "#15803d",
    slug: slugify(b.name),
    servicesText: b.services,
    faqText: "",
    sections: ["services", "hours", "enquiry", "whatsapp"],
    updatedAt: new Date().toISOString(),
  };
}

/** Fills in fields added after a project was first saved. */
export function withDefaults(project: WebsiteProject | null, b: Business): WebsiteProject {
  const base = defaultProject(b);
  if (!project) return base;
  return {
    ...base,
    ...project,
    template: premiumTemplate(project.template),
    slug: project.slug ?? base.slug,
    tagline: project.tagline ?? base.tagline,
    servicesText: project.servicesText ?? base.servicesText,
    faqText: project.faqText ?? "",
    sections: project.sections ?? base.sections,
  };
}

export function buildSite(b: Business, p: WebsiteProject): PublishedSite {
  const phone = b.phone || "";
  const wa = digits(phone);
  return {
    slug: p.slug ?? slugify(b.name),
    template: premiumTemplate(p.template),
    accent: p.accent,
    name: b.name,
    category: b.category,
    headline: p.headline || b.name,
    tagline: p.tagline ?? "",
    about: p.about,
    services: parseServices(p.servicesText ?? b.services),
    hours: b.hours,
    address: [b.address, b.city].filter(Boolean).join(", "),
    phone,
    whatsapp: wa.length === 10 ? `91${wa}` : wa,
    email: b.email,
    faqs: parseFaqs(p.faqText ?? ""),
    logo: b.logo && b.logo.length < 200_000 ? b.logo : "",
    sections: p.sections ?? [],
  };
}
