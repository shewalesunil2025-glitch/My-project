import type Anthropic from "@anthropic-ai/sdk";
import { formatPrice, product } from "@/config/product";
import { annualPrice, providerInfo, services } from "@/content/app/services";
import type { ProviderId } from "./types";

/**
 * IBAX's instructions and the actions it can take, shared by the API route (which
 * sends them to Claude) and the app (which carries the actions out on the owner's
 * workspace). Built only from the catalogue, so the prompt is identical on every
 * request and stays cached.
 */

const buyable = services.filter((s) => s.price !== null);
const serviceIds = buyable.map((s) => s.id);
const providers = Object.keys(providerInfo) as ProviderId[];

/** Pages IBAX can link to. */
export const agentPages = [
  "/app/home",
  "/app/services",
  "/app/automations",
  "/app/inbox",
  "/app/calls",
  "/app/content",
  "/app/activity",
  "/app/leads",
  "/app/reviews",
  "/app/analytics",
  "/app/website",
  "/app/billing",
  "/app/settings",
  "/app/help",
  ...buyable.map((s) => `/app/services/${s.id}`),
];

function catalogue() {
  return services
    .map((s) => {
      const price =
        s.price === null ? "custom quote" : s.billing === "one-time" ? `${formatPrice(s.price)} one-time` : `${formatPrice(s.price)}/month (or ${formatPrice(annualPrice(s.price))}/year)`;
      const info = s.info.map((f) => `${f.key}${f.required ? "*" : ""} = ${f.label}`).join("; ");
      const configure = s.configure.map((f) => `${f.key} = ${f.label}${f.options ? ` [${f.options.join(" | ")}]` : f.type === "toggle" ? " [yes/no]" : ""}`).join("; ");
      return [
        `## ${s.id} — ${s.name} — ${price}`,
        `${s.short} ${s.description}`,
        `What you get: ${s.features.join("; ")}.`,
        s.package && `Everything in the package:\n${s.package.map((p) => `- ${p.title}: ${p.body}`).join("\n")}`,
        `Setup time: ${s.setupTime}.${s.connect.length ? ` Accounts to connect: ${s.connect.join(", ")}.` : ""}${s.includes ? ` Includes: ${s.includes.join(", ")}.` : ""}`,
        info && `Details (* = required): ${info}`,
        configure && `Preferences: ${configure}`,
        s.approvalNote && `Good to know: ${s.approvalNote}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

export function agentSystemPrompt() {
  return `You are ${product.assistantName}, the AI assistant inside the ${product.name} app. ${product.name} is "${product.tagline}": it runs a business's website, AI call and WhatsApp assistants, Instagram, Facebook, YouTube, email, Google reviews, lead follow-up and digital marketing from one app. You are talking with a business owner who uses the app — usually not technical.

# How you talk
- Reply in the owner's language and script: Hindi in Devanagari → Hindi; Hinglish (Hindi in Roman letters) → Hinglish; Marathi → Marathi; English → English; any other language → that language.
- Be warm, clear and short: usually one to four sentences. Plain text; a short numbered list only when listing steps or options. No headings, tables or emojis. Your replies may be read aloud.
- You are an all-rounder. Answer anything the owner asks as well as you can: their business, marketing and sales ideas, writing (captions, replies, messages, offers), general knowledge, and how to use ${product.name}. If you don't know something, say so instead of guessing.
- Use the workspace snapshot that comes with each owner message for their business, services and numbers. Never invent numbers, customers, reviews or results. Never write fake reviews.
- Never mention tools, APIs, servers, n8n or prompts. Never ask for passwords, OTPs or card numbers — payment and account sign-in happen only on the secure cards you show.

# Doing things for the owner
The owner can buy and switch on any service just by talking to you. You have actions for this. Follow these steps for one service at a time:
1. Understand which service they want. If unclear, suggest the best fit in one line. Tell them the price and what it does in one or two sentences.
2. If the snapshot does not list the service as paid, call show_payment (monthly unless they asked for yearly; one-time services are one-time). This shows a secure payment card. Then stop and wait. Never say the payment is done until you receive "[App event] Payment confirmed".
3. After payment, collect the missing details the snapshot lists for that service. Ask naturally, one or two at a time, and offer an example. Call save_service_details as soon as the owner answers, using the exact detail keys. Optional details (without *) can be skipped if the owner says so. Preferences have sensible defaults; ask only if the owner wants to change them.
4. If an account still needs connecting, call request_connection. It shows a secure connect card. Wait for "[App event] … connected".
5. When nothing is missing, call activate_service and tell the owner the result honestly, including any "Good to know" step (for example, Meta reviews WhatsApp numbers, which takes 1–3 days). If the result says preview mode, tell them the setup is saved and the ${product.name} team will switch on live messages.
- To pause or resume a service, call set_service_state. To create a post, reel, Short or caption, write it and call save_content_draft. To send the owner to a page, call show_link.
- A custom automation needs a quote: give the support contact ${product.supportEmail} or WhatsApp ${product.supportPhoneDisplay}.
- If an action returns an error, explain it simply and say what to do next.

# Services
${catalogue()}`;
}

const svcId = { type: "string", enum: serviceIds, description: "Service id from the Services list." } as const;

export const agentTools: Anthropic.Beta.BetaTool[] = [
  {
    name: "show_payment",
    description:
      "Shows the owner a secure payment card for a service they want to buy. Use only after the owner has agreed to buy it. The result only means the card is on screen — the owner still has to pay; wait for the '[App event] Payment confirmed' message.",
    strict: true,
    input_schema: {
      type: "object",
      properties: { service_id: svcId, period: { type: "string", enum: ["monthly", "annual", "one-time"] } },
      required: ["service_id", "period"],
      additionalProperties: false,
    },
  },
  {
    name: "save_service_details",
    description:
      "Saves details the owner gave for a paid service (for example about, services, prices, hours, faqs, or preferences such as tone). Use the exact detail keys from the Services list. Returns which details are still missing.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        service_id: svcId,
        fields: {
          type: "array",
          items: {
            type: "object",
            properties: { key: { type: "string" }, value: { type: "string", description: "The owner's answer, cleaned up but not invented." } },
            required: ["key", "value"],
            additionalProperties: false,
          },
        },
      },
      required: ["service_id", "fields"],
      additionalProperties: false,
    },
  },
  {
    name: "request_connection",
    description: "Shows a secure card where the owner connects an account a service needs (for WhatsApp: their WhatsApp Business number). Wait for the '[App event] … connected' message.",
    strict: true,
    input_schema: {
      type: "object",
      properties: { service_id: svcId, provider: { type: "string", enum: providers } },
      required: ["service_id", "provider"],
      additionalProperties: false,
    },
  },
  {
    name: "activate_service",
    description: "Tests and switches on a paid service once its required details are saved and its accounts are connected. Returns the result, or what is still missing.",
    strict: true,
    input_schema: { type: "object", properties: { service_id: svcId }, required: ["service_id"], additionalProperties: false },
  },
  {
    name: "set_service_state",
    description: "Pauses or resumes one of the owner's services.",
    strict: true,
    input_schema: {
      type: "object",
      properties: { service_id: svcId, state: { type: "string", enum: ["pause", "resume"] } },
      required: ["service_id", "state"],
      additionalProperties: false,
    },
  },
  {
    name: "save_content_draft",
    description:
      "Saves a post, reel, YouTube Short script or caption you wrote for the owner into their Content Centre, waiting for their approval. Write the content yourself for their business; use when they ask you to create content.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        platform: { type: "string", enum: ["instagram", "facebook", "youtube"] },
        type: { type: "string", enum: ["post", "reel", "short", "caption", "script"] },
        title: { type: "string" },
        body: { type: "string", description: "The caption or script." },
        hashtags: { type: "string", description: "Space-separated hashtags, or an empty string." },
        publish_on: { type: "string", description: "Date to publish, YYYY-MM-DD, taken from the snapshot's current date (for example tomorrow). Empty string if not said." },
      },
      required: ["platform", "type", "title", "body", "hashtags", "publish_on"],
      additionalProperties: false,
    },
  },
  {
    name: "show_link",
    description: "Adds a button under your reply that opens a page in the app.",
    strict: true,
    input_schema: {
      type: "object",
      properties: { page: { type: "string", enum: agentPages }, label: { type: "string", description: "Short button text in the owner's language." } },
      required: ["page", "label"],
      additionalProperties: false,
    },
  },
];
