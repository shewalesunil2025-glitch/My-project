import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublishedSite } from "@/lib/sites/site";
import { connectionState, evo, evolutionReady, instanceFor, waDigits } from "./whatsapp";

/**
 * Customer Support: IBAX answers a business's customers from the owner's own FAQs, prices,
 * hours and policies (the chat on their ibaxai website, /s/<slug>), and tells the owner on
 * WhatsApp when a customer has a complaint or wants a person. Every published website gets
 * the chat; the Customer Support service adds the owner's extra FAQs, policies and tone.
 */

export type SupportSetup = {
  business: string;
  about: string;
  hours: string;
  faqs: string;
  policies: string;
  tone: string;
  handoff: string;
  /** The owner's WhatsApp, for complaint alerts (null: not linked). */
  instance: string | null;
  ownerPhone: string | null;
};

type WorkspaceData = {
  business?: { name?: string; phone?: string; description?: string; hours?: string } | null;
  automations?: { serviceId: string; status: string; config?: Record<string, unknown>; trialEndsAt?: string; paidUntil?: string }[];
  connections?: { whatsapp?: { account?: string; status?: string } };
};

const ended = (iso?: string) => Boolean(iso && Date.parse(iso) <= Date.now());
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** The owner's Customer Support settings (defaults from the business profile when the service is off). */
export async function supportFor(db: SupabaseClient, ownerId: string): Promise<SupportSetup | null> {
  const { data: row } = await db.from("workspaces").select("data").eq("owner_id", ownerId).maybeSingle();
  const ws = row?.data as WorkspaceData | undefined;
  if (!ws) return null;
  const auto = ws.automations?.find((a) => a.serviceId === "support" && a.status === "active" && !ended(a.trialEndsAt) && !ended(a.paidUntil));

  const c = auto?.config ?? {};
  const wa = ws?.connections?.whatsapp;
  const digits = wa?.status === "connected" ? waDigits(String(wa.account ?? "")) : null;
  return {
    business: str(ws?.business?.name) || "our business",
    about: str(c.about) || str(ws?.business?.description),
    hours: str(c.hours) || str(ws?.business?.hours),
    faqs: str(c.faqs),
    policies: str(c.policies),
    tone: str(c.tone) || "Warm & friendly",
    handoff: str(c.handoff) || "IBAX isn't sure of the answer",
    instance: digits ? instanceFor(digits) : null,
    ownerPhone: waDigits(str(ws?.business?.phone)) ?? digits,
  };
}

/** What IBAX knows when it answers this business's customers. */
export function supportPrompt(s: SupportSetup, site: PublishedSite) {
  const services = site.services.filter((x) => x.name).map((x) => `- ${x.name}${x.price ? `: ${x.price}` : ""}`).join("\n");
  const faqs = [s.faqs, ...site.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`)].filter(Boolean).join("\n");
  return `You are the customer support assistant on the website of ${s.business}${site.category ? ` (${site.category})` : ""}. You answer this business's customers.

# How you answer
- Reply in the customer's language and script (English, Hindi, Hinglish, Marathi or any other).
- Tone: ${s.tone}. Answer the question directly in your first sentence, in one to three short sentences. Plain text, no markdown.
- Use only the facts below. Never invent prices, timings, offers or policies. If you don't know, say so and offer to have the team contact them.
- Never ask for passwords, OTPs or card numbers.
- Hand over to a person when: ${s.handoff}. Also always for a complaint, an angry customer, or a refund or cancellation request. Then say kindly that the team will contact them, and ask for their name and phone number if you don't have them.

# Business
Name: ${s.business}
${s.about ? `About: ${s.about}\n` : ""}${s.hours ? `Hours: ${s.hours}\n` : ""}${site.address ? `Address: ${site.address}\n` : ""}${site.phone ? `Phone: ${site.phone}\n` : ""}${site.email ? `Email: ${site.email}\n` : ""}
# Services and prices
${services || "(not listed)"}

# FAQs
${faqs || "(none)"}

# Policies
${s.policies || "(none given)"}`;
}

/** Tells the owner on WhatsApp that a customer needs them. */
export async function alertOwner(s: SupportSetup, text: string) {
  if (!s.instance || !s.ownerPhone || !evolutionReady()) return false;
  if ((await connectionState(s.instance)) !== "open") return false;
  const r = await evo(`/message/sendText/${encodeURIComponent(s.instance)}`, { method: "POST", body: JSON.stringify({ number: s.ownerPhone, text }) });
  return r.ok;
}
