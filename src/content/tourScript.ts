import type { DemoLang } from "./demoScripts";

/**
 * "ibaxai in 2 minutes": the whole app in one video. One line of narration per part;
 * the parts and their pictures are in src/components/demo/TourFilm.tsx.
 */
export const tourParts = ["intro", "what", "signup", "business", "ibax", "services", "say", "connect", "dashboard", "analytics", "outro"] as const;
export type TourPart = (typeof tourParts)[number];

export const tourLangs: DemoLang[] = ["en", "hi", "mr"];

export const tourScript: Partial<Record<DemoLang, Record<TourPart, string>>> = {
  en: {
    intro: "ibaxai, in two minutes. Just say it. IBAX does it.",
    what: "ibaxai is your AI business operating system. Your website, AI calls, WhatsApp, Instagram, Facebook, YouTube, email, Google reviews and marketing, all run from one app, with no technical work.",
    signup: "First, create your account: your name, email, mobile number and country. That's all.",
    business: "Next, tell us about your business. Pick your type, like a restaurant, clinic or salon, and add your hours and services.",
    ibax: "Now meet IBAX, your personal AI business assistant. It talks to your customers in their own language, just the way you would.",
    services: "Open Services and pick only what you need. Every service works on its own, and many start with a free trial.",
    say: "Or simply tell IBAX. Say, I want WhatsApp automation, and IBAX sets it up with you, step by step.",
    connect: "Connect your account on its own secure page. ibaxai never sees your password, and you can disconnect any time.",
    dashboard: "Your dashboard shows everything in one place: calls, messages, leads and reviews. Just ask IBAX, what happened today?",
    analytics: "Analytics shows your leads, visitors and growth, for today, this week or this month.",
    outro: "Create your free account today. Just say it. IBAX does it.",
  },
  hi: {
    intro: "ibaxai, दो मिनट में। सिर्फ बोलो, IBAX संभाल लेगा।",
    what: "ibaxai आपका AI बिज़नेस ऑपरेटिंग सिस्टम है। वेबसाइट, AI कॉल्स, WhatsApp, Instagram, Facebook, YouTube, ईमेल, Google reviews और मार्केटिंग, सब एक ही ऐप से, बिना किसी टेक्निकल झंझट के।",
    signup: "सबसे पहले अपना अकाउंट बनाइए: नाम, ईमेल, मोबाइल नंबर और देश। बस इतना ही।",
    business: "फिर अपने बिज़नेस के बारे में बताइए। अपना टाइप चुनिए, जैसे रेस्टोरेंट, क्लिनिक या सैलून, और अपना समय और सर्विसेज़ जोड़िए।",
    ibax: "अब मिलिए IBAX से, आपका अपना AI बिज़नेस असिस्टेंट। ये आपके ग्राहकों से उनकी अपनी भाषा में बात करता है, बिल्कुल आपकी तरह।",
    services: "Services खोलिए और सिर्फ वही चुनिए जो आपको चाहिए। हर सर्विस अलग से चलती है, और कई में फ्री ट्रायल भी है।",
    say: "या बस IBAX को बोलिए: मुझे WhatsApp automation चाहिए। और IBAX आपके साथ, कदम-कदम पर, इसे चालू कर देता है।",
    connect: "अपना अकाउंट उसके अपने सुरक्षित पेज पर जोड़िए। ibaxai आपका पासवर्ड कभी नहीं देखता, और आप कभी भी डिस्कनेक्ट कर सकते हैं।",
    dashboard: "आपका डैशबोर्ड सब कुछ एक जगह दिखाता है: कॉल्स, मैसेज, लीड्स और reviews। बस IBAX से पूछिए: आज क्या हुआ?",
    analytics: "Analytics में आपकी लीड्स, विज़िटर्स और ग्रोथ दिखती है, आज की, इस हफ्ते की या इस महीने की।",
    outro: "आज ही अपना फ्री अकाउंट बनाइए। सिर्फ बोलो, IBAX संभाल लेगा।",
  },
  mr: {
    intro: "ibaxai, दोन मिनिटांत. फक्त सांगा, IBAX करून देईल.",
    what: "ibaxai तुमची AI बिझनेस ऑपरेटिंग सिस्टम आहे. वेबसाइट, AI कॉल्स, WhatsApp, Instagram, Facebook, YouTube, ईमेल, Google reviews आणि मार्केटिंग, सगळं एकाच ॲपमधून, कोणत्याही टेक्निकल कामाशिवाय.",
    signup: "आधी तुमचं अकाउंट बनवा: नाव, ईमेल, मोबाइल नंबर आणि देश. एवढंच.",
    business: "मग तुमच्या बिझनेसबद्दल सांगा. तुमचा प्रकार निवडा, जसं रेस्टॉरंट, क्लिनिक किंवा सलून, आणि तुमची वेळ आणि सर्व्हिसेस जोडा.",
    ibax: "आता भेटा IBAX ला, तुमचा स्वतःचा AI बिझनेस असिस्टंट. तो तुमच्या ग्राहकांशी त्यांच्याच भाषेत बोलतो, अगदी तुमच्यासारखा.",
    services: "Services उघडा आणि फक्त तुम्हाला हवं तेच निवडा. प्रत्येक सर्व्हिस वेगळी चालते, आणि अनेकांमध्ये फ्री ट्रायल आहे.",
    say: "किंवा फक्त IBAX ला सांगा: मला WhatsApp automation हवं आहे. आणि IBAX तुमच्यासोबत, एकेक पाऊल, ते सुरू करतो.",
    connect: "तुमचं अकाउंट त्याच्या स्वतःच्या सुरक्षित पेजवर जोडा. ibaxai तुमचा पासवर्ड कधीच पाहत नाही, आणि तुम्ही कधीही डिस्कनेक्ट करू शकता.",
    dashboard: "तुमचा डॅशबोर्ड सगळं एका ठिकाणी दाखवतो: कॉल्स, मेसेज, लीड्स आणि reviews. फक्त IBAX ला विचारा: आज काय झालं?",
    analytics: "Analytics मध्ये तुमच्या लीड्स, व्हिजिटर्स आणि ग्रोथ दिसते, आजची, या आठवड्याची किंवा या महिन्याची.",
    outro: "आजच तुमचं फ्री अकाउंट बनवा. फक्त सांगा, IBAX करून देईल.",
  },
};

/**
 * How the narration should say the brand names: the voice reads "IBAX" as "E-bax", so the
 * spoken text spells them the way they sound — "Eye-backs" (आइबैक्स). On-screen text is unchanged.
 */
export function spoken(lang: DemoLang, text: string): string {
  const ibax = lang === "en" ? "Eye-backs" : "आइबैक्स";
  const ai = lang === "en" ? "Eye-backs A.I." : "आइबैक्स ए.आई.";
  return text.replace(/\bibaxai\b/gi, ai).replace(/\bIBAX\b/g, ibax);
}
