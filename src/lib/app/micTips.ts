/** What to tell someone whose mic doesn't work, for the phone and browser they are on. */

/** iPhone/iPad (an iPad says "MacIntel" but has a touch screen). */
export const isAppleMobile = () =>
  typeof navigator !== "undefined" &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export const isAndroid = () => typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

/**
 * Phones record the voice and our server turns it into text. Their browsers' own speech
 * recognition is unreliable: iPhone loops on/off, and many Android browsers (Samsung Internet,
 * Mi, in-app browsers, some Chrome versions) refuse it without even asking for the mic.
 */
export const preferRecording = () => isAppleMobile() || isAndroid();

/** Opened inside WhatsApp, Instagram or Facebook: their built-in browser often can't use the mic. */
const isInAppBrowser = () => typeof navigator !== "undefined" && /\bwv\b|WhatsApp|Instagram|FBAN|FBAV|FB_IAB/i.test(navigator.userAgent);
const isIosChrome = () => typeof navigator !== "undefined" && /CriOS/.test(navigator.userAgent);
const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

const KEYBOARD = " Tab tak keyboard ka 🎤 use kar sakte hain.";

function blockedTip(): string {
  if (isInAppBrowser())
    return isAppleMobile()
      ? "Yeh page WhatsApp/Instagram ke andar khula hai, wahan mic nahi chalta. Neeche ya upar Safari ka icon dabakar \"Safari mein kholiye\", phir mic dabaiye."
      : "Yeh page WhatsApp/Instagram ke andar khula hai, wahan mic nahi chalta. Upar ⋮ dabakar \"Chrome mein kholiye\", phir mic dabaiye.";
  if (isAppleMobile()) {
    if (isIosChrome()) return "Mic ki permission band hai. iPhone ki Settings → Chrome → Microphone ON kariye, phir page reload kariye." + KEYBOARD;
    if (isStandalone()) return "Mic ki permission band hai. iPhone ki Settings → Apps → Safari → Microphone → \"Ask\" ya \"Allow\" kariye, phir app band karke dobara kholiye." + KEYBOARD;
    return "Mic ki permission band hai. Safari mein address bar ke \"aA\" dabaiye → Website Settings → Microphone → Allow, phir page reload kariye." + KEYBOARD;
  }
  if (isAndroid()) {
    if (isStandalone())
      return "Mic ki permission band hai. Chrome kholiye → ⋮ → Settings → Site settings → Microphone → www.ibaxai.com → Allow. Phir ibaxai app band karke dobara kholiye." + KEYBOARD;
    if (/SamsungBrowser/.test(navigator.userAgent))
      return "Mic ki permission band hai. Samsung Internet mein ☰ → Settings → Sites and downloads → Site permissions → Microphone → ibaxai.com → Allow, phir page reload kariye." + KEYBOARD;
    return "Mic ki permission band hai. Upar address bar mein 🔒 (ya ⓘ) dabaiye → Permissions → Microphone → Allow, phir page reload kariye. Wahan na mile toh phone Settings → Apps → Chrome → Permissions → Microphone → Allow." + KEYBOARD;
  }
  return "Mic ki permission band hai. Upar address bar mein 🔒 dabaiye → Permissions → Microphone → Allow, phir page reload kariye." + KEYBOARD;
}

/** A tip for a speech-recognition error code ("not-allowed", "no-speech", …). */
export const micErrorTip = (error?: string) =>
  error === "not-allowed" || error === "service-not-allowed"
    ? blockedTip()
    : error === "no-speech"
      ? "Kuch sunai nahi diya. Dobara mic dabakar boliye."
      : "Mic abhi kaam nahi kar raha. Likh kar ya keyboard ke 🎤 se boliye.";

/** A tip for a failed getUserMedia: blocked, no mic, or the mic busy in another app. */
export function captureErrorTip(error: unknown): string {
  const name = (error as { name?: string } | null)?.name;
  if (name === "NotFoundError" || name === "OverconstrainedError") return "Is phone mein mic nahi mila. Likh kar poochhiye.";
  if (name === "NotReadableError" || name === "AbortError") return "Mic kisi aur app mein chal raha hai (jaise call). Use band karke dobara mic dabaiye.";
  return blockedTip();
}
