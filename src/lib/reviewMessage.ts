/** The Google review request sent on WhatsApp, in simple Hinglish, or the owner's own text with {name}, {link} and {business}. Shared by the server and the app preview. */
export function reviewMessage(name: string, business: string, link: string, custom = "") {
  const first = name.trim().split(/\s+/)[0] || "ji";
  if (custom.trim()) return custom.replaceAll("{name}", first).replaceAll("{link}", link).replaceAll("{business}", business);
  return [`Namaste ${first} 🙏`, `${business} chunne ke liye dhanyavaad!`, "Agar aapko hamari service achhi lagi, to kya aap 1 minute nikal kar Google par review de sakte hain? Isse hume bahut madad milti hai.", "", `⭐ ${link}`].join("\n");
}
