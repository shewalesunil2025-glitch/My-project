/**
 * Autonomous Content Studio: the rules with no network or database (statuses, what may follow
 * what, cleaning what the AI wrote). One AI Reel / Short a day for the founder's own channels;
 * nothing is published before the founder approves it.
 */

export const statuses = [
  "queued", "scripting", "assets", "awaiting_render", "rendering",
  "ready_for_review", "approved", "publishing", "published", "partly_published", "rejected", "failed",
] as const;
export type JobStatus = (typeof statuses)[number];

/**
 * A job's status names the work it waits for: queued (research), scripting (the plan), assets
 * (images and voice), awaiting_render / rendering (the video worker), then the founder's review.
 */
export const NEXT_STEP: Partial<Record<JobStatus, JobStatus>> = {
  queued: "scripting",
  scripting: "assets",
  assets: "awaiting_render",
};

const MOVES: Record<JobStatus, JobStatus[]> = {
  queued: ["scripting", "failed", "rejected"],
  scripting: ["assets", "failed", "rejected"],
  assets: ["awaiting_render", "failed", "rejected"],
  awaiting_render: ["rendering", "failed", "rejected"],
  rendering: ["ready_for_review", "awaiting_render", "failed", "rejected"],
  ready_for_review: ["approved", "rejected"],
  approved: ["publishing"],
  publishing: ["published", "partly_published", "failed"],
  partly_published: ["publishing"],
  failed: ["queued", "publishing"],
  published: [],
  rejected: [],
};
export const canMove = (from: JobStatus, to: JobStatus) => MOVES[from]?.includes(to) ?? false;

/** Only a finished video the founder has watched can be approved; only approved jobs publish. */
export const approvable = (s: JobStatus) => s === "ready_for_review";

/** The date in India (the day a video is "for"). */
export const indiaDay = (now = new Date()) => new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);

export type Scene = { seconds: number; voiceover: string; visual: string; onScreen: string };
export type Script = { topic: string; angle: string; hook: string; scenes: Scene[]; cta: string; language: "hi" | "hinglish" };
export type InstagramMeta = { caption: string; hashtags: string[] };
export type YoutubeMeta = { title: string; description: string; tags: string[]; hashtags: string[]; thumbnailText: string };
export type Plan = { script: Script; instagram: InstagramMeta; youtube: YoutubeMeta };

const clip = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

/** Hashtags as #word, no duplicates, no spaces, at most `max` (Instagram allows 30, YouTube shows 3 above the title). */
export function cleanHashtags(list: unknown, max: number): string[] {
  const out: string[] = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const tag = String(raw ?? "").replace(/^#+/, "").replace(/[^\p{L}\p{M}\p{N}_]/gu, "");
    if (tag.length < 2 || tag.length > 40) continue;
    if (!out.some((t) => t.toLowerCase() === `#${tag}`.toLowerCase())) out.push(`#${tag}`);
    if (out.length >= max) break;
  }
  return out;
}

/** YouTube tags: plain words, total under 500 characters as YouTube requires. */
export function cleanTags(list: unknown): string[] {
  const out: string[] = [];
  let total = 0;
  for (const raw of Array.isArray(list) ? list : []) {
    const tag = clip(raw, 60).replace(/[<>#]/g, "");
    if (!tag || out.some((t) => t.toLowerCase() === tag.toLowerCase())) continue;
    if (total + tag.length + 1 > 480) break;
    out.push(tag);
    total += tag.length + 1;
  }
  return out;
}

/** Checks and trims what the AI returned. Returns null when it is not a usable plan. */
export function cleanPlan(raw: unknown): Plan | null {
  const r = (raw ?? {}) as Record<string, any>;
  const s = (r.script ?? {}) as Record<string, any>;
  const scenes: Scene[] = (Array.isArray(s.scenes) ? s.scenes : [])
    .map((x: Record<string, unknown>) => ({
      seconds: Math.min(8, Math.max(2, Math.round(Number(x?.seconds) || 4))),
      voiceover: clip(x?.voiceover, 400),
      visual: clip(x?.visual, 400),
      onScreen: clip(x?.onScreen, 60),
    }))
    .filter((x: Scene) => x.voiceover && x.visual)
    .slice(0, 8);
  const topic = clip(s.topic, 120);
  const total = scenes.reduce((a, x) => a + x.seconds, 0);
  if (!topic || scenes.length < 3 || total < 15 || total > 60) return null;
  const ig = (r.instagram ?? {}) as Record<string, unknown>;
  const yt = (r.youtube ?? {}) as Record<string, unknown>;
  const title = clip(yt.title, 100);
  if (!title) return null;
  return {
    script: { topic, angle: clip(s.angle, 200), hook: clip(s.hook, 160) || scenes[0].voiceover.slice(0, 160), scenes, cta: clip(s.cta, 160), language: s.language === "hi" ? "hi" : "hinglish" },
    instagram: { caption: clip(ig.caption, 2000), hashtags: cleanHashtags(ig.hashtags, 15) },
    youtube: {
      title: /#shorts/i.test(title) ? title : `${title.slice(0, 91)} #Shorts`,
      description: String(yt.description ?? "").trim().slice(0, 4500),
      tags: cleanTags(yt.tags),
      hashtags: cleanHashtags(yt.hashtags, 5),
      thumbnailText: clip(yt.thumbnailText, 40),
    },
  };
}

/** The whole voiceover, in scene order. */
export const voiceoverOf = (s: Script) => s.scenes.map((x) => x.voiceover).join(" ");

export const PLAN_SCHEMA = {
  type: "object",
  properties: {
    script: {
      type: "object",
      properties: {
        topic: { type: "string" },
        angle: { type: "string" },
        hook: { type: "string" },
        language: { type: "string", enum: ["hi", "hinglish"] },
        scenes: {
          type: "array",
          items: { type: "object", properties: { seconds: { type: "number" }, voiceover: { type: "string" }, visual: { type: "string" }, onScreen: { type: "string" } }, required: ["seconds", "voiceover", "visual", "onScreen"] },
        },
        cta: { type: "string" },
      },
      required: ["topic", "angle", "hook", "language", "scenes", "cta"],
    },
    instagram: { type: "object", properties: { caption: { type: "string" }, hashtags: { type: "array", items: { type: "string" } } }, required: ["caption", "hashtags"] },
    youtube: {
      type: "object",
      properties: { title: { type: "string" }, description: { type: "string" }, tags: { type: "array", items: { type: "string" } }, hashtags: { type: "array", items: { type: "string" } }, thumbnailText: { type: "string" } },
      required: ["title", "description", "tags", "hashtags", "thumbnailText"],
    },
  },
  required: ["script", "instagram", "youtube"],
};

export const PLAN_RULES = `You write one original short vertical video (Instagram Reel and YouTube Short, 25-45 seconds) for the ibaxai channel.
Category: artificial intelligence, AI tools, AI news, new technology, AI business ideas, AI automation, future technology.
Audience: India first, global AI enthusiasts. Language: natural spoken Hinglish (Hindi in Devanagari for the voiceover is fine; keep English tech words in English).
Rules:
- Original: never copy another creator's script, title or wording.
- Facts: use only what the research notes say, or general knowledge you are sure of. No invented numbers, dates, prices, quotes or promises. If unsure, say it as an idea or a tip, not as news.
- Hook in the first 3 seconds, one clear idea, a strong ending, then a short call to action to follow ibaxai.
- 4 to 7 scenes. Each scene: seconds (3-7), the voiceover spoken in that scene, a visual description for an AI image (vertical 9:16, cinematic, no text, no logos, no real people's faces), and 1-5 words of on-screen text.
- Hashtags and tags must match the video. Never add unrelated trending tags.
- YouTube title under 90 characters. thumbnailText: 2-5 bold words.`;
