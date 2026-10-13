/**
 * One-tap Google reviews: the link in the message should open the "write a review" box
 * straight away, not the business page. Google's own review links (g.page/r/…/review, from
 * Business Profile → Ask for reviews) and writereview?placeid=… links do that.
 */
export function directReviewLink(input: string) {
  const link = input.trim();
  // A bare Place ID ("ChIJ…") → Google's write-a-review link.
  if (/^ChIJ[\w-]{10,}$/.test(link)) return `https://search.google.com/local/writereview?placeid=${link}`;
  const placeId = link.match(/[?&](?:placeid|place_id)=([\w-]+)/i)?.[1];
  if (placeId) return `https://search.google.com/local/writereview?placeid=${placeId}`;
  // g.page/r/<code> opens the profile; with /review it opens the review box.
  const short = link.match(/^(https?:\/\/)?g\.page\/r\/([\w-]+)\/?$/i);
  if (short) return `https://g.page/r/${short[2]}/review`;
  return /^https?:\/\//i.test(link) ? link : link ? `https://${link}` : "";
}

/** True when the link opens Google's review box in one tap. */
export const isDirectReviewLink = (link: string) => /g\.page\/r\/[\w-]+\/review|search\.google\.com\/local\/writereview/i.test(directReviewLink(link));

/** The Google review request sent on WhatsApp, in simple Hinglish, or the owner's own text with {name}, {link} and {business}. Shared by the server and the app preview. */
export function reviewMessage(name: string, business: string, link: string, custom = "") {
  const first = name.trim().split(/\s+/)[0] || "ji";
  const url = directReviewLink(link);
  if (custom.trim()) return custom.replaceAll("{name}", first).replaceAll("{link}", url).replaceAll("{business}", business);
  return [`Namaste ${first} 🙏`, `${business} chunne ke liye dhanyavaad!`, "Aapka anubhav kaisa raha? Neeche diye link par tap karke bas stars chuniye — sirf 10 second lagenge 🙏", "", `⭐ ${url}`].join("\n");
}
