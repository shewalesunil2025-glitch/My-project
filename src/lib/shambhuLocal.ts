import { store } from "@/content/shambhu";
import { digitalMarketing } from "@/content/digitalMarketing";
import { siteConfig } from "@/config/site";
import type { AgentReply } from "@/lib/shambhuAgent";

/**
 * IBAX's free mode: answers common questions from the site's own content,
 * entirely in the browser — no API key and no cost. It detects English, Hindi
 * and Marathi (Devanagari or Roman letters) and answers in that language.
 * When ANTHROPIC_API_KEY is set, /api/shambhu (Claude) answers instead.
 */

type Lang = "en" | "hi" | "mr";
type Answers = Record<Lang, string>;

const price = (title: string) => {
  const s = store.find((x) => x.title === title);
  return s ? `${s.price}${s.billing === "monthly" ? "/mo" : ""}` : "";
};

const P = {
  web: price("Website"),
  voice: price("AI Voice Assistant"),
  wa: price("WhatsApp Automation"),
  support: price("Customer Support"),
  leads: price("Lead Follow-up"),
  social: price("Instagram Automation"),
  email: price("Email Automation"),
  reviews: price("Google Review Management"),
  dm: `${digitalMarketing.price}${digitalMarketing.billing}`,
};

const MARATHI_WORDS = /(आहे|काय|कसं|कसे|कशी|मला|तुम्ही|आम्ही|नाही|करतो|करता|हवं|हवे|किंमत|सांगा|ahe|aahe|kay|kasa|kashi|mala|tumhi|pahije|sanga)/i;
const HINDI_ROMAN = /\b(kya|hai|hain|kaise|kitna|kitne|kitni|mujhe|aap|kaun|kab|kahan|nahi|chahiye|batao|bataiye|karta|karti|keemat|kimat|paisa|daam|kharcha|shuru)\b/i;

export function detectLang(text: string): Lang {
  if (MARATHI_WORDS.test(text)) return "mr";
  if (/[ऀ-ॿ]/.test(text) || HINDI_ROMAN.test(text)) return "hi";
  return "en";
}

type Intent = { keys: RegExp; answers: Answers };

const intents: Intent[] = [
  {
    keys: /(digital|marketing|market|advert|\bads?\b|promot|seo|मार्केटिंग|विज्ञापन|जाहिरात|प्रचार)/i,
    answers: {
      en: `Digital Marketing is our premium package, starting at ${P.dm}. You get social media management for Instagram, Facebook and YouTube, content and a monthly calendar, Meta and Google ads, local SEO, WhatsApp campaigns, lead follow-up and a monthly report. Ad spend is paid separately to the platforms.`,
      hi: `डिजिटल मार्केटिंग हमारा प्रीमियम पैकेज है, ${P.dm} से शुरू। इसमें Instagram, Facebook और YouTube संभालना, कंटेंट और महीने का कैलेंडर, Meta और Google ऐड्स, लोकल SEO, WhatsApp कैंपेन, लीड फॉलो-अप और हर महीने की रिपोर्ट मिलती है। ऐड का खर्च अलग से प्लेटफ़ॉर्म को दिया जाता है।`,
      mr: `डिजिटल मार्केटिंग हे आमचं प्रीमियम पॅकेज आहे, ${P.dm} पासून सुरू. यात Instagram, Facebook आणि YouTube सांभाळणं, कंटेंट आणि महिन्याचं कॅलेंडर, Meta आणि Google जाहिराती, लोकल SEO, WhatsApp कॅम्पेन, लीड फॉलो-अप आणि दर महिन्याचा रिपोर्ट मिळतो. जाहिरातीचा खर्च वेगळा प्लॅटफॉर्मला दिला जातो.`,
    },
  },
  {
    keys: /(whats\s?app|व्हाट्सएप|व्हॉट्सॲप|वॉट्सऍप|व्हाट्सऐप)/i,
    answers: {
      en: `WhatsApp Automation replies to your customers instantly, shares details, sends reminders and follows up — starting at ${P.wa}.`,
      hi: `WhatsApp ऑटोमेशन आपके ग्राहकों को तुरंत जवाब देता है, जानकारी भेजता है, रिमाइंडर और फॉलो-अप करता है — ${P.wa} से शुरू।`,
      mr: `WhatsApp ऑटोमेशन तुमच्या ग्राहकांना लगेच उत्तर देतं, माहिती पाठवतं, रिमाइंडर आणि फॉलो-अप करतं — ${P.wa} पासून.`,
    },
  },
  {
    keys: /(call|phone|voice|कॉल|फोन|फ़ोन|आवाज)/i,
    answers: {
      en: `The AI Voice Assistant answers your calls day and night in a natural voice, takes enquiries and booking requests — starting at ${P.voice}.`,
      hi: `AI वॉइस असिस्टेंट दिन-रात आपके कॉल का जवाब देता है, पूछताछ और बुकिंग लेता है — ${P.voice} से शुरू।`,
      mr: `AI व्हॉइस असिस्टंट दिवस-रात्र तुमचे कॉल घेतो, चौकशी आणि बुकिंग घेतो — ${P.voice} पासून.`,
    },
  },
  {
    keys: /(website|web site|\bsite\b|वेबसाइट|वेबसाईट)/i,
    answers: {
      en: `We build a fast, modern website with IBAX built in, so every enquiry is answered — starting at ${P.web} one-time.`,
      hi: `हम तेज़ और मॉडर्न वेबसाइट बनाते हैं जिसमें आइबैक्स पहले से होता है, ताकि हर पूछताछ का जवाब मिले — ${P.web} एक बार से शुरू।`,
      mr: `आम्ही वेगवान, आधुनिक वेबसाईट बनवतो ज्यात आइबैक्स आधीच असतो, म्हणजे प्रत्येक चौकशीला उत्तर मिळतं — ${P.web} एकदाच, पासून.`,
    },
  },
  {
    keys: /(instagram|insta|facebook|youtube|social|इंस्टाग्राम|इन्स्टाग्राम|फेसबुक|यूट्यूब|युट्यूब|सोशल)/i,
    answers: {
      en: `IBAX replies to DMs and comments and plans posts for Instagram, Facebook and YouTube — ${P.social} per channel. For everything together, choose Digital Marketing at ${P.dm}.`,
      hi: `आइबैक्स Instagram, Facebook और YouTube पर DM और कमेंट का जवाब देता है और पोस्ट प्लान करता है — हर चैनल ${P.social}। सब कुछ एक साथ चाहिए तो डिजिटल मार्केटिंग ${P.dm} लीजिए।`,
      mr: `आइबैक्स Instagram, Facebook आणि YouTube वर DM आणि कमेंटला उत्तर देतो आणि पोस्ट प्लॅन करतो — प्रत्येक चॅनेल ${P.social}. सगळं एकत्र हवं असेल तर डिजिटल मार्केटिंग ${P.dm} घ्या.`,
    },
  },
  {
    keys: /(e-?mail|gmail|inbox|ईमेल|मेल)/i,
    answers: {
      en: `Email Automation sorts your Gmail, drafts replies and sends the follow-ups you approve — starting at ${P.email}.`,
      hi: `ईमेल ऑटोमेशन आपका Gmail छाँटता है, जवाब तैयार करता है और आपकी मंज़ूरी से फॉलो-अप भेजता है — ${P.email} से शुरू।`,
      mr: `ईमेल ऑटोमेशन तुमचा Gmail लावतो, उत्तरं तयार करतो आणि तुमच्या मंजुरीने फॉलो-अप पाठवतो — ${P.email} पासून.`,
    },
  },
  {
    keys: /(review|rating|रिव्यू|रिव्ह्यू|रेटिंग)/i,
    answers: {
      en: `Google Review Management asks happy customers for a review and drafts replies for you. We never create fake reviews. Starting at ${P.reviews}.`,
      hi: `गूगल रिव्यू मैनेजमेंट खुश ग्राहकों से रिव्यू माँगता है और आपके लिए जवाब तैयार करता है। हम कभी नकली रिव्यू नहीं बनाते। ${P.reviews} से शुरू।`,
      mr: `गूगल रिव्ह्यू मॅनेजमेंट खूश ग्राहकांकडे रिव्ह्यू मागतो आणि तुमच्यासाठी उत्तर तयार करतो. आम्ही कधीही खोटे रिव्ह्यू बनवत नाही. ${P.reviews} पासून.`,
    },
  },
  {
    keys: /(lead|follow|enquir|inquir|लीड|फॉलो|चौकशी|पूछताछ)/i,
    answers: {
      en: `Lead Follow-up makes sure every enquiry is followed up on time until it becomes a customer — starting at ${P.leads}.`,
      hi: `लीड फॉलो-अप यह पक्का करता है कि हर पूछताछ का समय पर फॉलो-अप हो, जब तक वह ग्राहक न बन जाए — ${P.leads} से शुरू।`,
      mr: `लीड फॉलो-अप प्रत्येक चौकशीचा वेळेवर पाठपुरावा करतो, ती ग्राहक होईपर्यंत — ${P.leads} पासून.`,
    },
  },
  {
    keys: /(support|customer service|help ?desk|सपोर्ट|सहायता|मदत)/i,
    answers: {
      en: `Customer Support answers common questions on every channel and hands tricky ones to your team — starting at ${P.support}.`,
      hi: `कस्टमर सपोर्ट हर चैनल पर आम सवालों का जवाब देता है और मुश्किल सवाल आपकी टीम को देता है — ${P.support} से शुरू।`,
      mr: `कस्टमर सपोर्ट प्रत्येक चॅनेलवर नेहमीच्या प्रश्नांना उत्तर देतो आणि अवघड प्रश्न तुमच्या टीमकडे देतो — ${P.support} पासून.`,
    },
  },
  {
    keys: /(price|pricing|cost|charge|\bfees?\b|\brates?\b|how much|kitna|kitne|kitni|keemat|kimat|daam|paisa|kharcha|कीमत|किंमत|दाम|पैसे|खर्च|शुल्क)/i,
    answers: {
      en: `Every service can be bought on its own. Website from ${P.web} one-time, AI Voice Assistant ${P.voice}, WhatsApp and Customer Support ${P.wa}, Lead Follow-up and each social channel ${P.leads}, Email and Google Reviews ${P.email}, and Digital Marketing ${P.dm}. All prices are in US dollars.`,
      hi: `हर सर्विस अलग से ले सकते हैं। वेबसाइट ${P.web} एक बार, AI वॉइस असिस्टेंट ${P.voice}, WhatsApp और कस्टमर सपोर्ट ${P.wa}, लीड फॉलो-अप और हर सोशल चैनल ${P.leads}, ईमेल और गूगल रिव्यू ${P.email}, और डिजिटल मार्केटिंग ${P.dm}। सभी कीमतें अमेरिकी डॉलर में हैं।`,
      mr: `प्रत्येक सेवा वेगळी घेता येते. वेबसाईट ${P.web} एकदाच, AI व्हॉइस असिस्टंट ${P.voice}, WhatsApp आणि कस्टमर सपोर्ट ${P.wa}, लीड फॉलो-अप आणि प्रत्येक सोशल चॅनेल ${P.leads}, ईमेल आणि गूगल रिव्ह्यू ${P.email}, आणि डिजिटल मार्केटिंग ${P.dm}. सर्व किंमती अमेरिकन डॉलरमध्ये आहेत.`,
    },
  },
  {
    keys: /(start|begin|setup|set up|how (does|do|to)|\blive\b|activat|kaise|shuru|शुरू|सुरू|कैसे|कसे|कसं|कसा)/i,
    answers: {
      en: "Five simple steps: choose a service, connect your account, share your business info, test and approve, then go live. Some platforms like WhatsApp Business need their own approval, so it isn't instant.",
      hi: "पाँच आसान स्टेप: सर्विस चुनिए, अपना अकाउंट जोड़िए, बिज़नेस की जानकारी दीजिए, टेस्ट करके मंज़ूरी दीजिए, फिर लाइव। WhatsApp Business जैसे प्लेटफ़ॉर्म की अपनी मंज़ूरी लगती है, इसलिए यह तुरंत नहीं होता।",
      mr: "पाच सोप्या पायऱ्या: सेवा निवडा, तुमचं अकाउंट जोडा, व्यवसायाची माहिती द्या, टेस्ट करून मंजुरी द्या, मग लाइव्ह. WhatsApp Business सारख्या प्लॅटफॉर्मची स्वतःची मंजुरी लागते, म्हणून हे लगेच होत नाही.",
    },
  },
  {
    keys: /(safe|secur|data|privacy|password|सुरक्षित|डेटा|सुरक्षा)/i,
    answers: {
      en: "Your data stays yours. Every business is kept separate, account access is encrypted and can be removed any time, every action is logged, and nothing goes live without your approval.",
      hi: "आपका डेटा आपका ही रहता है। हर बिज़नेस अलग रखा जाता है, अकाउंट एक्सेस एन्क्रिप्टेड है और कभी भी हटा सकते हैं, हर काम का रिकॉर्ड रहता है, और आपकी मंज़ूरी के बिना कुछ भी लाइव नहीं होता।",
      mr: "तुमचा डेटा तुमचाच राहतो. प्रत्येक व्यवसाय वेगळा ठेवला जातो, अकाउंट ॲक्सेस एन्क्रिप्टेड आहे आणि कधीही काढता येतो, प्रत्येक कामाची नोंद राहते, आणि तुमच्या मंजुरीशिवाय काहीही लाइव्ह होत नाही.",
    },
  },
  {
    keys: /(restaurant|hotel|clinic|hospital|doctor|dentist|salon|spa|gym|shop|store|school|college|real estate|travel|business type|रेस्टोरेंट|होटल|हॉटेल|क्लिनिक|डॉक्टर|दुकान|सलून|जिम)/i,
    answers: {
      en: "IBAX is built for businesses that talk to customers — restaurants, hotels, clinics, doctors, salons, spas, shops, real estate, education, gyms, travel, e-commerce and more.",
      hi: "आइबैक्स उन सभी बिज़नेस के लिए है जो ग्राहकों से बात करते हैं — रेस्टोरेंट, होटल, क्लिनिक, डॉक्टर, सलून, स्पा, दुकानें, रियल एस्टेट, शिक्षा, जिम, ट्रैवल, ई-कॉमर्स और भी बहुत।",
      mr: "आइबैक्स ग्राहकांशी बोलणाऱ्या सगळ्या व्यवसायांसाठी आहे — रेस्टॉरंट, हॉटेल, क्लिनिक, डॉक्टर, सलून, स्पा, दुकानं, रिअल इस्टेट, शिक्षण, जिम, ट्रॅव्हल, ई-कॉमर्स आणि बरंच काही.",
    },
  },
  {
    keys: /(contact|human|talk|team|number|reach|संपर्क|बात करनी|बोलायचं|टीम)/i,
    answers: {
      en: `Tap "Talk to a human" below or the Contact us button at the top, or email ${siteConfig.email}. Our team replies within 24 hours.`,
      hi: `नीचे "Talk to a human" या ऊपर Contact us बटन दबाइए, या ${siteConfig.email} पर ईमेल कीजिए। हमारी टीम 24 घंटे में जवाब देती है।`,
      mr: `खाली "Talk to a human" किंवा वर Contact us बटण दाबा, किंवा ${siteConfig.email} वर ईमेल करा. आमची टीम 24 तासांत उत्तर देते.`,
    },
  },
  {
    keys: /(ibax|ibex|shambhu|आइबैक्स|who are you|what is|kaun ho|kya hai|\bapp\b)/i,
    answers: {
      en: "I'm IBAX, your AI business assistant. I answer calls, WhatsApp, email and social media, follow up every lead and show you everything in one app. The full IBAX app is in early access.",
      hi: "मैं आइबैक्स हूँ, आपका AI बिज़नेस असिस्टेंट। मैं कॉल, WhatsApp, ईमेल और सोशल मीडिया संभालता हूँ, हर लीड का फॉलो-अप करता हूँ और सब कुछ एक ऐप में दिखाता हूँ। पूरा आइबैक्स ऐप अभी अर्ली एक्सेस में है।",
      mr: "मी आइबैक्स, तुमचा AI बिझनेस असिस्टंट. मी कॉल, WhatsApp, ईमेल आणि सोशल मीडिया सांभाळतो, प्रत्येक लीडचा पाठपुरावा करतो आणि सगळं एका ॲपमध्ये दाखवतो. पूर्ण आइबैक्स ॲप सध्या अर्ली ॲक्सेसमध्ये आहे.",
    },
  },
  {
    keys: /^\s*(hi|hello|hey|namaste|namaskar|नमस्ते|नमस्कार|हाय|हॅलो)\b/i,
    answers: {
      en: "Hello! I'm IBAX. Ask me about our services, prices or Digital Marketing.",
      hi: "नमस्ते! मैं आइबैक्स हूँ। हमारी सर्विस, कीमत या डिजिटल मार्केटिंग के बारे में पूछिए।",
      mr: "नमस्कार! मी आइबैक्स. आमच्या सेवा, किंमती किंवा डिजिटल मार्केटिंगबद्दल विचारा.",
    },
  },
];

const fallback: Answers = {
  en: `Good question! I can tell you about our services, prices, Digital Marketing and how to get started. For anything else, tap "Talk to a human" and our team will help.`,
  hi: `अच्छा सवाल! मैं आपको हमारी सर्विस, कीमत, डिजिटल मार्केटिंग और शुरू करने का तरीका बता सकता हूँ। बाकी किसी बात के लिए "Talk to a human" दबाइए, हमारी टीम मदद करेगी।`,
  mr: `छान प्रश्न! मी तुम्हाला आमच्या सेवा, किंमती, डिजिटल मार्केटिंग आणि सुरुवात कशी करायची हे सांगू शकतो. बाकी काहीही असेल तर "Talk to a human" दाबा, आमची टीम मदत करेल.`,
};

/** Answers a question from the site's content, in the visitor's language. */
export function answerLocally(question: string, preferred?: string): AgentReply {
  let lang = detectLang(question);
  // Plain English words typed while the visitor speaks Hindi/Marathi: keep their language.
  if (lang === "en" && (preferred === "hi" || preferred === "mr") && !/[a-z]{3,}\s+[a-z]{3,}\s+[a-z]{3,}/i.test(question)) {
    lang = preferred;
  }
  const hit = intents.find((i) => i.keys.test(question));
  return { reply: (hit ?? { answers: fallback }).answers[lang], lang };
}
