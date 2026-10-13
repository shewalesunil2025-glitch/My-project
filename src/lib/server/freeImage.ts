/**
 * Free AI images (Pollinations): no key needed, so every customer can make posters, posts and
 * cartoons at no cost. With POLLINATIONS_TOKEN (free account at enter.pollinations.ai) the
 * better "flux" model is used and the small Pollinations logo is left off.
 */

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
