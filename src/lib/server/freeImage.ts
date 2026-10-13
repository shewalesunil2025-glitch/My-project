/**
 * AI images without Gemini billing:
 *  1. Cloudflare Workers AI (FLUX.1 schnell): high quality, about 100 images a day free, then
 *     about ₹0.10 an image. Needs CF_ACCOUNT_ID and CF_AI_TOKEN (Workers AI permission).
 *  2. Pollinations: no key at all, lower quality with a small logo; the last resort.
 */

/** High-quality FLUX images from Cloudflare Workers AI (when CF_ACCOUNT_ID and CF_AI_TOKEN are set). */
export async function cloudflareImage(prompt: string): Promise<{ mime: string; data: string; model: string } | null> {
  const account = process.env.CF_ACCOUNT_ID;
  const token = process.env.CF_AI_TOKEN;
  if (!account || !token) return null;
  const model = process.env.CF_IMAGE_MODEL || "@cf/black-forest-labs/flux-1-schnell";
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/ai/run/${model}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ prompt: prompt.slice(0, 2000), steps: 8 }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Cloudflare ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const type = res.headers.get("content-type") ?? "";
  if (type.startsWith("image/")) return { mime: type.split(";")[0], data: Buffer.from(await res.arrayBuffer()).toString("base64"), model };
  const data = (await res.json()) as { result?: { image?: string } };
  if (!data.result?.image) throw new Error("Cloudflare returned no image");
  return { mime: "image/jpeg", data: data.result.image, model };
}

/** Picks the image size from the request: stories / reels tall, banners wide, posts square. */
export function sizeFor(prompt: string) {
  if (/9:16|story|stories|reel|status|vertical|portrait|स्टोरी|रील/i.test(prompt)) return { width: 768, height: 1344 };
  if (/16:9|banner|cover|thumbnail|wide|landscape|youtube|बैनर/i.test(prompt)) return { width: 1344, height: 768 };
  return { width: 1024, height: 1024 };
}

export async function freeImage(prompt: string): Promise<{ mime: string; data: string; model: string }> {
  const token = process.env.POLLINATIONS_TOKEN;
  const { width, height } = sizeFor(prompt);
  const params = new URLSearchParams({ width: String(width), height: String(height), seed: String(Math.floor(Math.random() * 1e9)), enhance: "true", private: "true" });
  if (token) {
    params.set("model", "flux");
    params.set("nologo", "true");
  }
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.slice(0, 1200))}?${params}`;
  let lastError: Error = new Error("Free image service unavailable");
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { headers: token ? { authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(45_000) });
      const type = res.headers.get("content-type") ?? "";
      if (res.ok && type.startsWith("image/")) {
        const data = Buffer.from(await res.arrayBuffer()).toString("base64");
        return { mime: type.split(";")[0], data, model: token ? "pollinations-flux" : "pollinations" };
      }
      lastError = new Error(`Pollinations ${res.status}: ${(await res.text()).slice(0, 200)}`);
    } catch (error) {
      lastError = error instanceof Error ? error : lastError;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw lastError;
}
