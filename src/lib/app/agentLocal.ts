import { product } from "@/config/product";
import { isLive, providerInfo, serviceById, type FieldDef, type ServiceDef } from "@/content/app/services";
import { missingConnections } from "./automation";
import { activateService, automationFor, joinWaitlist, missingDetails, periodFor, priceLabel, saveServiceDetails } from "./agentActions";
import { localAnswer } from "./assistant";
import { currentWorkspace, updateWorkspace } from "./store";
import type { AgentCard, AgentFlow, ChatMessage, Workspace } from "./types";

/**
 * IBAX's built-in conversation, used when the AI model isn't configured or can't be
 * reached. It still lets the owner buy and switch on a service just by chatting:
 * pick the service → pay on the card → answer a few questions → connect the account →
 * activated. Everything else goes to the built-in workspace answers.
 */

export type Lang = NonNullable<AgentFlow["lang"]>;
export type LocalReply = { text: string; links?: ChatMessage["links"]; cards?: AgentCard[] };

const t = (lang: Lang, s: Record<Lang, string>) => s[lang];

export function detectLang(text: string, fallback?: Lang): Lang {
  if (/[ऀ-ॿ]/.test(text)) return "hi";
  if (/\b(chahiye|chaiye|karo|kro|karna|krna|kar|hai|hain|mujhe|muze|mera|meri|mere|kya|kyu|nahi|nhi|haan|han|chalu|lena|batao|bata|aur|krdo|kardo|dena|wala|wali|shuru|abhi|bhai|yaar|yar)\b/i.test(text)) return "hl";
  // Short answers like a price list or "skip" don't say which language the owner speaks.
  if (fallback && (text.match(/\b(i|i'm|the|is|are|my|we|you|want|need|please|what|how|and|our|it)\b/gi) ?? []).length < 2) return fallback;
  return "en";
}

const aliases: [string, RegExp][] = [
  ["digital-marketing", /digital\s*marketing|marketing|डिजिटल|मार्केटिंग/i],
  ["whatsapp", /whats\s*app|whatsap|watsapp|व्हाट्सए?प|वॉट्सऐप|व्हाट्सऐप/i],
  ["voice", /voice|call|calls|phone|कॉल|फोन|फ़ोन|वॉइस/i],
  ["instagram", /insta|इंस्टा/i],
  ["facebook", /facebook|\bfb\b|फेसबुक/i],
  ["youtube", /you\s*tube|यूट्यूब|युट्यूब/i],
  ["reviews", /review|रिव्यू|रिव्ह्यू/i],
  ["followup", /follow\s*-?\s*up|फॉलो/i],
  ["support", /support|सपोर्ट/i],
  ["email", /e-?mail|\bmail\b|ईमेल|मेल/i],
  ["website", /website|web\s*site|\bsite\b|वेबसाइट|वेबसाईट/i],
];

export function findServiceIn(text: string): ServiceDef | undefined {
  for (const [id, re] of aliases) if (re.test(text)) return serviceById(id);
  return undefined;
}

const wantsIt = (q: string) =>
  /\b(chahiye|chaiye|chahta|chahti|activate|active|chalu|start|shuru|lena|leni|kharid|buy|want|need|setup|set up|subscribe|lagao|laga do|kar do|kardo|krdo|on kar|book)\b|चाहिए|चालू|शुरू|एक्टिवेट|लेना|खरीद|लगाओ|कर दो|करना/i.test(q);
const isSkip = (q: string) => /^(skip|no|nahi|nhi|nahin|na|none|kuch nahi|later|baad me)\b|^(बाद में|नहीं|नही|छोड़ो|स्किप)(?=\s|[.!,।]|$)/i.test(q.trim());
const isCancel = (q: string) => /\b(cancel|stop|rehne do|rahne do|mat karo|nahi chahiye|nhi chahiye)\b|रहने दो|नहीं चाहिए|कैंसल/i.test(q);

/** Field labels the owner sees in Hindi / Hinglish. */
const fieldText: Record<string, { hi: string; hl: string }> = {
  "About your business": { hi: "आपका बिज़नेस क्या करता है (2–3 लाइन में)", hl: "aapka business kya karta hai (2–3 line me)" },
  "What should the videos be about?": { hi: "वीडियो किस बारे में होने चाहिए", hl: "videos kis baare me hone chahiye" },
  "What should your posts show?": { hi: "पोस्ट में क्या दिखाना है", hl: "posts me kya dikhana hai" },
  "Services / products": { hi: "आपकी सर्विसेज़ / प्रोडक्ट्स", hl: "aapki services / products" },
  Prices: { hi: "प्राइस लिस्ट", hl: "price list" },
  "Working hours": { hi: "काम के घंटे (कब से कब तक खुला रहता है)", hl: "working hours (kab se kab tak khula hai)" },
  "Frequently asked questions": { hi: "ग्राहक अक्सर क्या पूछते हैं और उसका जवाब", hl: "customers aksar kya puchte hain aur uska jawab" },
  "Appointment rules": { hi: "अपॉइंटमेंट के नियम", hl: "appointment ke rules" },
  "Domain you want (or already own)": { hi: "कौन सा डोमेन चाहिए (या पहले से है)", hl: "kaunsa domain chahiye (ya pehle se hai)" },
  "Brand colours & style": { hi: "ब्रांड के रंग और स्टाइल", hl: "brand ke colours aur style" },
  "Policies (returns, cancellations, delivery)": { hi: "पॉलिसी (रिटर्न, कैंसलेशन, डिलीवरी)", hl: "policies (return, cancellation, delivery)" },
  "Your Google review link (if you have it)": { hi: "आपका Google review लिंक (अगर है)", hl: "aapka Google review link (agar hai)" },
  "Email signature": { hi: "ईमेल सिग्नेचर", hl: "email signature" },
  "What do you offer new customers?": { hi: "नए ग्राहकों को क्या ऑफ़र देते हैं", hl: "naye customers ko kya offer dete ho" },
  "Area you want customers from": { hi: "किस एरिया से ग्राहक चाहिए", hl: "kis area se customers chahiye" },
  "Who should watch them?": { hi: "वीडियो कौन देखे (टारगेट ऑडियंस)", hl: "videos kaun dekhe (target audience)" },
  "Your main goal for the next 3 months": { hi: "अगले 3 महीने का मुख्य लक्ष्य", hl: "agle 3 mahine ka main goal" },
  "Competitors (optional)": { hi: "आपके कॉम्पिटिटर (ज़रूरी नहीं)", hl: "aapke competitors (zaroori nahi)" },
  "Monthly ad budget (paid separately to ad platforms)": { hi: "महीने का ऐड बजट (ऐड प्लेटफ़ॉर्म को अलग से)", hl: "mahine ka ad budget (ad platform ko alag se)" },
  "What should be automated?": { hi: "क्या ऑटोमेट करना है", hl: "kya automate karna hai" },
};

const label = (f: FieldDef, lang: Lang) => (lang === "en" ? f.label : (fieldText[f.label]?.[lang] ?? f.label));

function setFlow(flow: AgentFlow | null) {
  updateWorkspace((w) => {
    w.agentFlow = flow;
  });
}

function nextField(svc: ServiceDef, flow: AgentFlow) {
  const ws = currentWorkspace()!;
  return missingDetails(svc, automationFor(ws, svc.id), "all").find((f) => !flow.skipped?.includes(f.key));
}

/** Works out and says the next step for the service in the flow, doing it where it can. */
export async function flowNext(svc: ServiceDef, flow: AgentFlow): Promise<LocalReply> {
  const lang = flow.lang ?? "en";
  const ws = currentWorkspace()!;
  const a = automationFor(ws, svc.id);

  if (!a && !isLive(svc.id)) {
    setFlow(null);
    joinWaitlist(svc.id);
    const price = priceLabel(svc, periodFor(svc));
    return {
      text: t(lang, {
        en: `${svc.name} is launching soon (${price}). I've added you to the waitlist — no payment now — and I'll tell you here the day it goes live.`,
        hi: `${svc.name} जल्द आ रहा है (${price})। मैंने आपको वेटलिस्ट में जोड़ दिया है — अभी कोई पेमेंट नहीं — जिस दिन ये चालू होगा, मैं आपको यहीं बता दूँगा।`,
        hl: `${svc.name} jaldi aa raha hai (${price}). Maine aapko waitlist me jod diya hai — abhi koi payment nahi — jis din ye chalu hoga, main aapko yahin bata dunga.`,
      }),
      links: [{ label: svc.name, href: `/app/services/${svc.id}` }],
    };
  }

  if (!a) {
    setFlow({ ...flow, field: undefined });
    const period = periodFor(svc);
    return {
      text: t(lang, {
        en: `${svc.name} — ${priceLabel(svc, period)}. ${svc.short} Pay on the secure card below and I'll set it up for you right here.`,
        hi: `${svc.name} — ${priceLabel(svc, period)}. ${svc.short} नीचे दिए सुरक्षित कार्ड पर पेमेंट कीजिए, फिर मैं यहीं आपके लिए इसे सेट कर दूँगा।`,
        hl: `${svc.name} — ${priceLabel(svc, period)}. ${svc.short} Neeche diye secure card par payment kijiye, phir main yahin aapke liye ise set kar dunga.`,
      }),
      cards: [{ type: "pay", serviceId: svc.id, period }],
    };
  }

  const field = nextField(svc, flow);
  if (field) {
    setFlow({ ...flow, field: field.key });
    const example = field.placeholder ? `\n${t(lang, { en: "For example", hi: "जैसे", hl: "Jaise" })}: ${field.placeholder.split("\n")[0]}` : "";
    const optional = field.required ? "" : t(lang, { en: " (optional — say “skip” to leave it)", hi: " (ज़रूरी नहीं — छोड़ना हो तो “skip” लिखें)", hl: " (zaroori nahi — chhodna ho to “skip” likhiye)" });
    return { text: `${t(lang, { en: "Please tell me", hi: "कृपया बताइए", hl: "Kripya bataiye" })}: ${label(field, lang)}${optional}${example}` };
  }

  const accounts = missingConnections(ws, svc);
  if (accounts.length) {
    setFlow({ ...flow, field: undefined });
    const name = providerInfo[accounts[0]].name;
    return {
      text: t(lang, {
        en: `Details saved. Now connect your ${name} on the card below — you sign in on its own secure page, I never see your password.`,
        hi: `जानकारी सेव हो गई। अब नीचे दिए कार्ड पर अपना ${name} कनेक्ट कीजिए — लॉगिन आप खुद करेंगे, पासवर्ड मुझे कभी नहीं दिखता।`,
        hl: `Details save ho gayi. Ab neeche diye card par apna ${name} connect kijiye — login aap khud karenge, password mujhe kabhi nahi dikhta.`,
      }),
      cards: [{ type: "connect", provider: accounts[0], serviceId: svc.id }],
    };
  }

  setFlow(null);
  const result = await activateService(svc.id);
  if (!result.ok) return { text: t(lang, { en: "Something is still missing — let's check it together.", hi: "अभी कुछ बाकी है — चलिए साथ में देखते हैं।", hl: "Abhi kuch baaki hai — chaliye saath me dekhte hain." }) };
  const extra = [result.note, result.approvalNote].filter(Boolean).join(" ");
  const preview =
    result.backend === "preview" && svc.connect.length > 0
      ? t(lang, {
          en: ` Preview mode: your setup is saved and the ${product.name} team will switch on live messages.`,
          hi: ` प्रीव्यू मोड: आपका सेटअप सेव है, लाइव मैसेज ${product.name} टीम चालू करेगी।`,
          hl: ` Preview mode: aapka setup save hai, live messages ${product.name} team chalu karegi.`,
        })
      : "";
  return {
    text: t(lang, {
      en: `Done! ${svc.name} is now active for your business.${extra ? ` ${extra}` : ""}${preview}`,
      hi: `हो गया! ${svc.name} अब आपके बिज़नेस के लिए चालू है।${extra ? ` ${extra}` : ""}${preview}`,
      hl: `Ho gaya! ${svc.name} ab aapke business ke liye chalu hai.${extra ? ` ${extra}` : ""}${preview}`,
    }),
    cards: [{ type: "activated", serviceId: svc.id, automationId: result.automationId }],
  };
}

/** Answers one owner message without the AI model. */
export async function localTurn(ws: Workspace, text: string): Promise<LocalReply> {
  const flow = ws.agentFlow;
  const lang = detectLang(text, flow?.lang);

  if (flow && isCancel(text)) {
    setFlow(null);
    return { text: t(lang, { en: "Okay, I've stopped. Tell me whenever you want to continue.", hi: "ठीक है, रोक दिया। जब चाहें बताइए, आगे बढ़ेंगे।", hl: "Theek hai, rok diya. Jab chahein bataiye, aage badhenge." }) };
  }

  // Answering a question IBAX asked for the service being set up.
  const flowSvc = flow && serviceById(flow.serviceId);
  if (flow && flowSvc && flow.field) {
    const field = flowSvc.info.find((f) => f.key === flow.field);
    const next: AgentFlow = { ...flow, lang };
    if (field && isSkip(text) && !field.required) next.skipped = [...(flow.skipped ?? []), field.key];
    else if (field && !isSkip(text)) saveServiceDetails(flowSvc.id, [{ key: field.key, value: text }]);
    else if (field) return { text: t(lang, { en: `This one is needed to set up ${flowSvc.name}: ${label(field, lang)}`, hi: `${flowSvc.name} सेट करने के लिए यह ज़रूरी है: ${label(field, lang)}`, hl: `${flowSvc.name} set karne ke liye ye zaroori hai: ${label(field, lang)}` }) };
    return flowNext(flowSvc, next);
  }

  // Asking for a service.
  const svc = findServiceIn(text);
  if (svc && svc.price !== null && wantsIt(text)) {
    const a = automationFor(ws, svc.id);
    if (a?.status === "active") {
      return { text: t(lang, { en: `${svc.name} is already active.`, hi: `${svc.name} पहले से चालू है।`, hl: `${svc.name} pehle se chalu hai.` }), links: [{ label: svc.name, href: `/app/automations/${a.id}` }] };
    }
    return flowNext(svc, { serviceId: svc.id, lang });
  }
  // "WhatsApp ka price kya hai?" is about that one service, not the whole list.
  const aboutService = svc && /price|cost|kitna|kitne|kimat|keemat|kya hai|kya karta|details|batao|bataiye|what is|what does|tell me|कीमत|प्राइस|क्या है|बताओ|बताइए/i.test(text);
  const local = aboutService ? null : localAnswer(ws, text);
  if (local?.apply) updateWorkspace((w) => local.apply!(w));
  if (local?.matched) return { text: local.text, links: local.links };

  if (svc) {
    const price = svc.price === null ? null : `${priceLabel(svc, periodFor(svc))}${isLive(svc.id) ? "" : " (coming soon)"}`;
    const pack = svc.package ? `\n\n${svc.package.map((p) => `• ${p.title} — ${p.body}`).join("\n")}\n\n` : " ";
    return {
      text: t(lang, {
        en: `${svc.name}: ${svc.short}${pack}Price: ${price ?? "custom quote"}. ${isLive(svc.id) ? "To switch it on" : "To join the waitlist"}, just say “I want ${svc.name}”.`,
        hi: `${svc.name}: ${svc.short}${pack}कीमत: ${price ?? "कोटेशन पर"}। ${isLive(svc.id) ? "चालू करना हो" : "वेटलिस्ट में जुड़ना हो"} तो बस लिखिए “${svc.name} चाहिए”।`,
        hl: `${svc.name}: ${svc.short}${pack}Price: ${price ?? "quote par"}. ${isLive(svc.id) ? "Chalu karna ho" : "Waitlist me judna ho"} to bas likhiye “${svc.name} chahiye”.`,
      }),
      links: [{ label: svc.name, href: `/app/services/${svc.id}` }],
    };
  }

  return {
    text: t(lang, {
      en: `I can set up any ${product.name} service for you right here — just say which one, for example “I want WhatsApp automation”. I can also tell you about today's calls, messages, leads and reviews.`,
      hi: `मैं यहीं आपके लिए ${product.name} की कोई भी सर्विस चालू कर सकता हूँ — बस बताइए कौन सी, जैसे “मुझे WhatsApp ऑटोमेशन चाहिए”। आज की कॉल, मैसेज, लीड और रिव्यू के बारे में भी पूछ सकते हैं।`,
      hl: `Main yahin aapke liye ${product.name} ki koi bhi service chalu kar sakta hoon — bas bataiye kaunsi, jaise “mujhe WhatsApp automation chahiye”. Aaj ki calls, messages, leads aur reviews ke baare me bhi puch sakte hain.`,
    }),
    links: [{ label: t(lang, { en: "See all services", hi: "सारी सर्विसेज़", hl: "Saari services" }), href: "/app/services" }],
  };
}
