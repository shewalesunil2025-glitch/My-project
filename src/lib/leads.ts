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

export async function submitLead(lead: LeadRequest): Promise<LeadResponse> {
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    return (await res.json()) as LeadResponse;
  } catch {
    return { ok: false, reason: "upstream", message: "Network error. Please try again." };
  }
}
