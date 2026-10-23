import { siteConfig } from "@/config/site";
import { TRIAL_DAYS, isLive, services } from "@/content/app/services";
import type { LeadRequest } from "@/lib/leads";
import { esc, ownerEmail, sendMail } from "./mail";

/** The emails a website demo request or a chat call-back request sends. */

const site = siteConfig.url.replace(/\/$/, "");
const live = services.filter((s) => isLive(s.id) && s.id !== "custom");

function ownerMail(kind: "demo" | "callback", lead: LeadRequest, page?: string) {
  const rows: [string, string | undefined][] = [
    ["Name", lead.name],
    ["Phone / WhatsApp", lead.phone],
    ["Email", lead.email],
    ["Business", lead.business],
    ["Interested in", lead.interest],
    ["Message", lead.message],
    ["From", page],
  ];
  const filled = rows.filter(([, v]) => v);
  const title = kind === "demo" ? `New demo request: ${lead.name}` : `Call back: ${lead.name}${lead.phone ? ` (${lead.phone})` : ""}`;
  const intro = kind === "demo" ? "Someone booked a free demo on the website." : "Someone in the IBAX chat asked you to call them back.";
  return sendMail({
    to: ownerEmail(),
    replyTo: lead.email || undefined,
    subject: `${kind === "demo" ? "📅" : "📞"} ${title}`,
    text: `${intro}\n\n${filled.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nPlease call them within 24 hours.`,
    html: `<p>${esc(intro)}</p><table cellpadding="6" style="border-collapse:collapse">${filled
      .map(([k, v]) => `<tr><td style="color:#666">${esc(k)}</td><td><b>${esc(v!)}</b></td></tr>`)
      .join("")}</table>${lead.phone ? `<p><a href="tel:${esc(lead.phone.replace(/[^\d+]/g, ""))}">Call ${esc(lead.phone)}</a></p>` : ""}<p>Please call them within 24 hours.</p>`,
  });
}

/** Thanks the visitor and tells them what ibaxai is, with a link to start free. */
function welcomeMail(kind: "demo" | "callback", lead: LeadRequest) {
  const first = lead.name.split(/\s+/)[0];
  const next = kind === "demo" ? "We'll call you within 24 hours to fix a time for your free demo." : "Our team will call you back within 24 hours.";
  const list = live.map((s) => `• ${s.name}: ${s.short}`).join("\n");
  return sendMail({
    to: lead.email,
    replyTo: siteConfig.email,
    subject: kind === "demo" ? "Your free ibaxai demo: we'll call you soon" : "We got your request: ibaxai will call you back",
    text: `Hi ${first},

Thank you for contacting ibaxai. ${next}

ibaxai is your AI business assistant. ${siteConfig.slogan} Tell IBAX what you need in your own words, and it runs the work for your business:

${list}

Try it free for ${TRIAL_DAYS} days, no payment needed: ${site}/app/signup
See how it works (2-minute videos): ${site}/app/demo

Questions? Just reply to this email.

Team ibaxai
${site}`,
    html: `<p>Hi ${esc(first)},</p>
<p>Thank you for contacting <b>ibaxai</b>. ${esc(next)}</p>
<p><b>ibaxai</b> is your AI business assistant. <b>${esc(siteConfig.slogan)}</b> Tell IBAX what you need in your own words, and it runs the work for your business:</p>
<ul>${live.map((s) => `<li><b>${esc(s.name)}</b>: ${esc(s.short)}</li>`).join("")}</ul>
<p><a href="${site}/app/signup" style="display:inline-block;background:#1aa152;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600">Start free for ${TRIAL_DAYS} days</a></p>
<p><a href="${site}/app/demo">See how it works (2-minute videos)</a></p>
<p>Questions? Just reply to this email.</p>
<p>Team ibaxai<br><a href="${site}">${site.replace(/^https?:\/\//, "")}</a></p>`,
  });
}

/** Sends the owner alert and the visitor's welcome email. True when the owner alert went out. */
export async function mailLead(kind: "demo" | "callback", lead: LeadRequest, page?: string) {
  const [owner] = await Promise.all([ownerMail(kind, lead, page), lead.email ? welcomeMail(kind, lead) : Promise.resolve(false)]);
  return owner;
}
