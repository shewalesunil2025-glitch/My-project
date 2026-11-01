/**
 * Publishing to the founder's own Instagram and YouTube accounts with their official APIs.
 * Credentials are Vercel environment variables only (never in the browser or the database):
 *   Instagram: STUDIO_IG_USER_ID, STUDIO_IG_TOKEN (Instagram Login or Facebook Login token with content publish permission)
 *   YouTube:   STUDIO_YT_CLIENT_ID, STUDIO_YT_CLIENT_SECRET, STUDIO_YT_REFRESH_TOKEN (scope youtube.upload)
 * Each step stores the platform's id, so a retry continues where it stopped instead of posting twice.
 */

export type PublishState = { status: "uploading" | "processing" | "published" | "failed"; external: Record<string, string>; url?: string; error?: string };
export type PublishInput = { videoUrl: string; thumbnailUrl?: string; caption?: string; title?: string; description?: string; tags?: string[]; external: Record<string, string> };

export interface Publisher {
  readonly platform: "instagram" | "youtube";
  configured(): boolean;
  /** One step forward. Call again while it answers "uploading" or "processing". */
  step(input: PublishInput): Promise<PublishState>;
}

const IG = "https://graph.instagram.com/v23.0";

export const instagram: Publisher = {
  platform: "instagram",
  configured: () => Boolean(process.env.STUDIO_IG_USER_ID && process.env.STUDIO_IG_TOKEN),
  async step(i) {
    const user = process.env.STUDIO_IG_USER_ID!;
    const token = process.env.STUDIO_IG_TOKEN!;
    const api = async (path: string, params: Record<string, string>, method = "POST") => {
      const q = new URLSearchParams({ ...params, access_token: token });
      const res = await fetch(method === "GET" ? `${IG}${path}?${q}` : `${IG}${path}`, { method, body: method === "GET" ? undefined : q, signal: AbortSignal.timeout(30_000) });
      const data = (await res.json().catch(() => ({}))) as Record<string, any>;
      if (!res.ok) throw new Error(`Instagram ${res.status}: ${String(data?.error?.message ?? "").slice(0, 200)}`);
      return data;
    };
    if (i.external.media_id) return { status: "published", external: i.external, url: i.external.permalink };
    // 1. A Reels container (Meta downloads the video from the short signed link).
    if (!i.external.container_id) {
      const c = await api(`/${user}/media`, { media_type: "REELS", video_url: i.videoUrl, caption: i.caption ?? "", share_to_feed: "true" });
      return { status: "processing", external: { ...i.external, container_id: String(c.id) } };
    }
    // 2. Wait until Meta has processed it.
    const st = await api(`/${i.external.container_id}`, { fields: "status_code" }, "GET");
    if (st.status_code === "IN_PROGRESS") return { status: "processing", external: i.external };
    if (st.status_code !== "FINISHED") return { status: "failed", external: { ...i.external, container_id: "" }, error: `Instagram container ${st.status_code}` };
    // 3. Publish once.
    const p = await api(`/${user}/media_publish`, { creation_id: i.external.container_id });
    const media = String(p.id);
    const link = await api(`/${media}`, { fields: "permalink" }, "GET").catch(() => ({}) as Record<string, any>);
    return { status: "published", external: { ...i.external, media_id: media, permalink: String(link.permalink ?? "") }, url: String(link.permalink ?? "") };
  },
};

async function youtubeToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ client_id: process.env.STUDIO_YT_CLIENT_ID!, client_secret: process.env.STUDIO_YT_CLIENT_SECRET!, refresh_token: process.env.STUDIO_YT_REFRESH_TOKEN!, grant_type: "refresh_token" }),
    signal: AbortSignal.timeout(20_000),
  });
  const d = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string };
  if (!d.access_token) throw new Error(`YouTube sign-in failed: ${d.error ?? res.status}`);
  return d.access_token;
}

export const youtube: Publisher = {
  platform: "youtube",
  configured: () => Boolean(process.env.STUDIO_YT_CLIENT_ID && process.env.STUDIO_YT_CLIENT_SECRET && process.env.STUDIO_YT_REFRESH_TOKEN),
  async step(i) {
    if (i.external.video_id && i.external.thumbnail_done) return { status: "published", external: i.external, url: `https://www.youtube.com/shorts/${i.external.video_id}` };
    const token = await youtubeToken();
    let videoId = i.external.video_id;
    if (!videoId) {
      const video = await fetch(i.videoUrl, { signal: AbortSignal.timeout(60_000) });
      if (!video.ok) throw new Error(`Could not read the video (${video.status})`);
      const bytes = Buffer.from(await video.arrayBuffer());
      const meta = { snippet: { title: i.title ?? "", description: i.description ?? "", tags: i.tags ?? [], categoryId: "28" }, status: { privacyStatus: "public", selfDeclaredMadeForKids: false } };
      const start = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "x-upload-content-type": "video/mp4", "x-upload-content-length": String(bytes.length) },
        body: JSON.stringify(meta),
        signal: AbortSignal.timeout(30_000),
      });
      const loc = start.headers.get("location");
      if (!start.ok || !loc) throw new Error(`YouTube upload start ${start.status}: ${(await start.text()).slice(0, 200)}`);
      const up = await fetch(loc, { method: "PUT", headers: { "content-type": "video/mp4" }, body: bytes, signal: AbortSignal.timeout(240_000) });
      const d = (await up.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
      if (!up.ok || !d.id) throw new Error(`YouTube upload ${up.status}: ${d.error?.message ?? ""}`.slice(0, 220));
      videoId = d.id;
    }
    let thumb = i.external.thumbnail_done ?? "";
    if (!thumb && i.thumbnailUrl) {
      // Custom thumbnails need a verified YouTube channel; a failure here never undoes the upload.
      const img = await fetch(i.thumbnailUrl, { signal: AbortSignal.timeout(30_000) }).catch(() => null);
      if (img?.ok) {
        const t = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${encodeURIComponent(videoId)}`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": img.headers.get("content-type") ?? "image/jpeg" }, body: Buffer.from(await img.arrayBuffer()), signal: AbortSignal.timeout(60_000) });
        thumb = t.ok ? "yes" : `failed ${t.status}`;
      } else thumb = "no image";
    }
    return { status: "published", external: { ...i.external, video_id: videoId, thumbnail_done: thumb || "none" }, url: `https://www.youtube.com/shorts/${videoId}` };
  },
};

export const publishers = { instagram, youtube };

/** A publisher for tests: counts posts so a test can prove nothing is posted twice. */
export function fakePublisher(platform: "instagram" | "youtube", opts: { fail?: boolean; steps?: number } = {}): Publisher & { posts: number } {
  let left = opts.steps ?? 0;
  const self = {
    platform,
    posts: 0,
    configured: () => true,
    async step(i: PublishInput): Promise<PublishState> {
      if (opts.fail) throw new Error(`${platform} down`);
      if (i.external.id) return { status: "published", external: i.external, url: `https://${platform}.test/${i.external.id}` };
      if (left-- > 0) return { status: "processing", external: { ...i.external, pending: "1" } };
      self.posts++;
      return { status: "published", external: { ...i.external, id: `p${self.posts}` }, url: `https://${platform}.test/p${self.posts}` };
    },
  };
  return self;
}
