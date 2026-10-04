import { siteConfig } from "@/config/site";

export type LeadRequest = {
  name: string;
  email: string;
  phone?: string;
  business?: string;
  interest?: string;
  message?: string;
};

export type LeadResponse =
  | { ok: true }
  | { ok: false; reason: "invalid" | "not_configured" | "upstream"; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLead(input: unknown): { lead?: LeadRequest; error?: string } {
  if (!input || typeof input !== "object") return { error: "Invalid request." };
  const data = input as Record<string, unknown>;
  const str = (key: string, max = 500) =>
    typeof data[key] === "string" ? (data[key] as string).trim().slice(0, max) : "";

  const lead: LeadRequest = {
    name: str("name", 120),
    email: str("email", 200),
    phone: str("phone", 40),
    business: str("business", 160),
    interest: str("interest", 80),
    message: str("message", 2000),
  };

  if (!lead.name) return { error: "Please tell us your name." };
  if (!EMAIL_RE.test(lead.email)) return { error: "Please enter a valid email address." };
  return { lead };
}

/** The enquiry as FormSubmit fields, used by the API route and the browser fallback. */
export function formSubmitPayload(lead: LeadRequest) {
  return {
    _subject: `New enquiry from ${lead.name} — ${siteConfig.name} website`,
    _template: "table",
    _captcha: "false",
    _replyto: lead.email,
    Name: lead.name,
    Email: lead.email,
    "Phone / WhatsApp": lead.phone || "—",
    Business: lead.business || "—",
    "Interested in": lead.interest || "—",
    Message: lead.message || "—",
  };
}

/** Emails the lead to the owner straight from the browser through FormSubmit. */
async function sendFromBrowser(lead: LeadRequest): Promise<boolean> {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(siteConfig.email)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(formSubmitPayload(lead)),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: string | boolean };
    return res.ok && String(data.success) === "true";
  } catch {
    return false;
  }
}

/**
 * Sends the lead through /api/lead. If the server can't deliver it, the browser
 * emails it directly, since FormSubmit accepts requests from the activated site.
 */
export async function submitLead(lead: LeadRequest): Promise<LeadResponse> {
  let result: LeadResponse;
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    result = (await res.json()) as LeadResponse;
  } catch {
    result = { ok: false, reason: "upstream", message: "Network error. Please try again." };
  }
  if (result.ok || result.reason === "invalid") return result;
  return (await sendFromBrowser(lead)) ? { ok: true } : result;
}

/** A wa.me link to the owner's WhatsApp, optionally with a prefilled message. */
export function whatsappLink(text?: string) {
  return `https://wa.me/${siteConfig.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** The enquiry as a WhatsApp message, so a visitor can send it straight to the owner. */
export function leadMessage(lead: LeadRequest) {
  return [
    `Hi ${siteConfig.name}, I'd like to talk.`,
    `Name: ${lead.name}`,
    lead.business && `Business: ${lead.business}`,
    lead.interest && `Interested in: ${lead.interest}`,
    `Email: ${lead.email}`,
    lead.phone && `Phone: ${lead.phone}`,
  ]
    .filter(Boolean)
    .join("\n");
}
