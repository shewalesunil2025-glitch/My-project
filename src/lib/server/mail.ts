import nodemailer, { type Transporter } from "nodemailer";
import { siteConfig } from "@/config/site";

/**
 * Email from ibaxai's own Gmail (free, about 500 emails a day). Vercel env: SMTP_USER (the Gmail
 * address) and SMTP_PASS (a Google "App password", never the normal password). SMTP_HOST / SMTP_PORT
 * are optional for another provider. Without them nothing is sent and sendMail returns false.
 */

let transport: Transporter | null = null;

export const mailReady = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

/** Where alerts for the owner go: OWNER_ALERT_EMAIL, else the support email. */
export const ownerEmail = () => process.env.OWNER_ALERT_EMAIL || siteConfig.email;

export async function sendMail(m: { to: string; subject: string; text: string; html?: string; replyTo?: string }) {
  if (!mailReady()) return false;
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: (Number(process.env.SMTP_PORT) || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  try {
    await transport.sendMail({ from: `"${siteConfig.name}" <${process.env.SMTP_USER}>`, ...m });
    return true;
  } catch (err) {
    console.error("[mail] send failed", err instanceof Error ? err.message : err);
    return false;
  }
}

/** Escapes text for the HTML part of an email. */
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
