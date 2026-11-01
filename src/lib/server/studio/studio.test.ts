import { beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { advance, approve, claimRender, finishRender, overview, regenerate, reject, retryPublish, startDay, type Deps } from "./jobs";
import { fakePublisher } from "./publish";
import { cleanHashtags, cleanPlan, cleanTags, type Plan } from "@/lib/studio/core";

/** The Content Studio job rules with a fake database, fake AI and fake platforms: nothing real is posted. */

type Row = Record<string, any>;
let tables: Record<string, Row[]> = {};
const unique: Record<string, string[]> = { studio_jobs: ["day", "attempt"], studio_publish: ["job_id", "platform"] };
let n = 0;
class Q {
  private f: ((r: Row) => boolean)[] = [];
  private sort?: [string, boolean];
  private max = Infinity;
  private ret = false;
  constructor(private t: string, private mode: "select" | "insert" | "update", private payload?: Row) {}
  select() { this.ret = true; return this; }
  eq(c: string, v: unknown) { this.f.push((r) => r[c] === v); return this; }
  in(c: string, vs: unknown[]) { this.f.push((r) => vs.includes(r[c])); return this; }
  lt(c: string, v: string) { this.f.push((r) => r[c] != null && String(r[c]) < v); return this; }
  order(c: string, o?: { ascending?: boolean }) { this.sort = [c, o?.ascending !== false]; return this; }
  limit(k: number) { this.max = k; return this; }
  private run() {
    const rows = (tables[this.t] ??= []);
    if (this.mode === "insert") {
      const p = this.payload!;
      const cols = unique[this.t];
      if (cols && rows.some((r) => cols.every((c) => r[c] === p[c]))) return { rows: [], error: { message: "duplicate key" } };
      const row = { id: `id-${++n}`, created_at: new Date(1_700_000_000_000 + n).toISOString(), status: this.t === "studio_publish" ? "pending" : "queued", external: {}, attempts: 0, tries: 0, avoid: [], ...p };
      rows.push(row);
      return { rows: [row], error: null };
    }
    let hit = rows.filter((r) => this.f.every((x) => x(r)));
    if (this.mode === "update") for (const r of hit) Object.assign(r, this.payload);
    if (this.sort) { const [c, asc] = this.sort; hit = [...hit].sort((a, b) => (String(a[c]) < String(b[c]) ? -1 : 1) * (asc ? 1 : -1)); }
    return { rows: hit.slice(0, this.max), error: null };
  }
  single() { const r = this.run(); return Promise.resolve({ data: r.rows[0] ?? null, error: r.rows[0] ? null : (r.error ?? { message: "none" }) }); }
  maybeSingle() { const r = this.run(); return Promise.resolve({ data: r.rows[0] ?? null, error: r.error }); }
  then(res: (v: unknown) => unknown) { const r = this.run(); return Promise.resolve({ data: this.mode === "select" || this.ret ? r.rows : null, error: r.error }).then(res); }
}
const db = { from: (t: string) => ({ select: () => new Q(t, "select"), insert: (p: Row) => new Q(t, "insert", p), update: (p: Row) => new Q(t, "update", p) }) } as unknown as SupabaseClient;

const PLAN: Plan = {
  script: { topic: "Free AI tool for invoices", angle: "save time", hook: "Invoice in 10 seconds?", language: "hinglish", cta: "Follow ibaxai", scenes: [1, 2, 3, 4].map((i) => ({ seconds: 6, voiceover: `line ${i}`, visual: `scene ${i}`, onScreen: `S${i}` })) },
  instagram: { caption: "Try this", hashtags: ["#AI", "#Tools"] },
  youtube: { title: "Free AI invoice tool #Shorts", description: "desc", tags: ["ai"], hashtags: ["#AI"], thumbnailText: "AI INVOICES" },
};
let files: Set<string>;
let notes: string[];
let failResearch = 0;
let ig: ReturnType<typeof fakePublisher>;
let yt: ReturnType<typeof fakePublisher>;
const deps = (over: Partial<Deps> = {}): Deps => ({
  db,
  storage: {
    upload: async (p) => void files.add(p),
    signedUrl: async (p) => `https://signed/${p}`,
    signedUpload: async (p) => `https://upload/${p}`,
    exists: async (p) => files.has(p),
  },
  ai: {
    research: async () => { if (failResearch-- > 0) throw new Error("Gemini busy"); return { notes: "news", sources: [], live: false, at: "" }; },
    writePlan: async (_n, avoid) => ({ ...PLAN, script: { ...PLAN.script, topic: avoid.length ? `Topic ${avoid.length + 1}` : PLAN.script.topic } }),
    picture: async () => ({ mime: "image/jpeg", data: Buffer.from("x") }),
    voice: async () => Buffer.from("w"),
    thumbnailPrompt: () => "thumb",
  },
  publishers: [ig, yt],
  notify: async (t) => void notes.push(t),
  now: () => new Date("2026-11-01T03:00:00Z"),
  ...over,
});

async function readyJob(d: Deps) {
  const { job } = await startDay(d);
  for (let i = 0; i < 3; i++) await advance(d);
  const c = await claimRender(d);
  files.add(`${job.day}/${job.id}/video.mp4`);
  await finishRender(d, { id: c.job!.id, ok: true });
  return tables.studio_jobs.find((j) => j.id === job.id)!;
}

beforeEach(() => { tables = {}; files = new Set(); notes = []; failResearch = 0; ig = fakePublisher("instagram"); yt = fakePublisher("youtube"); });

describe("the daily job", () => {
  it("is made once a day", async () => {
    const d = deps();
    const a = await startDay(d);
    const b = await startDay(d);
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(tables.studio_jobs).toHaveLength(1);
    expect(a.job.day).toBe("2026-11-01");
  });
  it("runs research → plan → images and voice → waits for the video worker", async () => {
    const d = deps();
    const { job } = await startDay(d);
    expect((await advance(d)).status).toBe("scripting");
    expect((await advance(d)).status).toBe("assets");
    expect((await advance(d)).status).toBe("awaiting_render");
    const j = tables.studio_jobs[0];
    expect(j.topic).toBe(PLAN.script.topic);
    expect(j.scene_paths).toHaveLength(4);
    expect(files.has(`${job.day}/${job.id}/voice-1.wav`)).toBe(true);
    expect(j.thumbnail_path).toContain("thumbnail-bg");
    expect((await advance(d)).did).toBe("nothing");
  });
  it("retries a failing step and stops after 3 tries with a notice", async () => {
    const d = deps();
    await startDay(d);
    failResearch = 5;
    await advance(d);
    await advance(d);
    expect(tables.studio_jobs[0].status).toBe("queued");
    await advance(d);
    expect(tables.studio_jobs[0].status).toBe("failed");
    expect(notes.some((t) => /could not be made/.test(t))).toBe(true);
  });
  it("tells the founder when the video is ready; a missing video file is refused", async () => {
    const d = deps();
    const { job } = await startDay(d);
    for (let i = 0; i < 3; i++) await advance(d);
    const c = await claimRender(d);
    expect(c.job?.uploadVideo).toContain("video.mp4");
    expect(c.job?.scenes[0].image).toContain("https://signed/");
    expect(await finishRender(d, { id: job.id, ok: true })).toMatchObject({ ok: false, reason: "no_video" });
    files.add(`${job.day}/${job.id}/video.mp4`);
    expect((await finishRender(d, { id: job.id, ok: true })).ok).toBe(true);
    expect(tables.studio_jobs[0].status).toBe("ready_for_review");
    expect(notes).toContain("Your AI video is ready! 🎬");
  });
  it("a render that never finishes goes back in the queue", async () => {
    const d = deps();
    await startDay(d);
    for (let i = 0; i < 3; i++) await advance(d);
    await claimRender(d);
    tables.studio_jobs[0].render_claimed_at = "2026-11-01T01:00:00.000Z";
    expect((await advance(d)).did).toBe("render_requeued");
    expect(tables.studio_jobs[0].status).toBe("awaiting_render");
  });
});

describe("approval and publishing", () => {
  it("nothing is published before approval, and only a finished video can be approved", async () => {
    const d = deps();
    const { job } = await startDay(d);
    expect(await approve(d, job.id)).toMatchObject({ ok: false, reason: "not_ready" });
    expect(ig.posts + yt.posts).toBe(0);
  });
  it("approve publishes once on each platform, a second approve posts nothing", async () => {
    const d = deps();
    const j = await readyJob(d);
    expect(await approve(d, j.id)).toMatchObject({ ok: true, status: "published" });
    expect([ig.posts, yt.posts]).toEqual([1, 1]);
    expect(await approve(d, j.id)).toMatchObject({ ok: false });
    expect(await retryPublish(d, j.id)).toMatchObject({ ok: false });
    expect([ig.posts, yt.posts]).toEqual([1, 1]);
    expect(tables.studio_publish.filter((p) => p.status === "published")).toHaveLength(2);
    expect(notes).toContain("Your AI video is live ✅");
  });
  it("when one platform fails, a retry posts only that one", async () => {
    const bad = fakePublisher("youtube", { fail: true });
    const d = deps({ publishers: [ig, bad] });
    const j = await readyJob(d);
    await approve(d, j.id);
    await advance(d);
    await advance(d);
    expect(tables.studio_jobs[0].status).toBe("partly_published");
    const good = fakePublisher("youtube");
    const d2 = deps({ publishers: [ig, good] });
    expect(await retryPublish(d2, j.id)).toMatchObject({ ok: true, status: "published" });
    expect(ig.posts).toBe(1);
    expect(good.posts).toBe(1);
  });
  it("waits while a platform is still processing, then finishes", async () => {
    const slow = fakePublisher("instagram", { steps: 2 });
    const d = deps({ publishers: [slow, yt] });
    const j = await readyJob(d);
    expect((await approve(d, j.id)).ok).toBe(true);
    expect(tables.studio_jobs[0].status).toBe("publishing");
    await advance(d);
    await advance(d);
    expect(tables.studio_jobs[0].status).toBe("published");
    expect(slow.posts).toBe(1);
    expect(yt.posts).toBe(1);
  });
  it("a platform that is not connected is marked so, and nothing is faked", async () => {
    const off = { ...fakePublisher("instagram"), configured: () => false };
    const d = deps({ publishers: [off, yt] });
    const j = await readyJob(d);
    await approve(d, j.id);
    expect(tables.studio_jobs[0].status).toBe("partly_published");
    expect(tables.studio_publish.find((p) => p.platform === "instagram")).toMatchObject({ status: "failed", error: expect.stringContaining("Not connected") });
  });
  it("reject cancels before publishing; regenerate makes a new attempt with another topic", async () => {
    const d = deps();
    const j = await readyJob(d);
    expect((await reject(d, j.id)).ok).toBe(true);
    expect(await approve(d, j.id)).toMatchObject({ ok: false });
    const r = await regenerate(d, j.id);
    expect(r.ok).toBe(true);
    const fresh = (r as { job: Row }).job;
    expect(fresh.attempt).toBe(2);
    expect(fresh.avoid).toContain(PLAN.script.topic);
    for (let i = 0; i < 2; i++) await advance(d);
    expect(tables.studio_jobs.find((x) => x.id === fresh.id)!.topic).not.toBe(PLAN.script.topic);
  });
  it("a published video can't be rejected or regenerated over", async () => {
    const d = deps();
    const j = await readyJob(d);
    await approve(d, j.id);
    expect(await reject(d, j.id)).toMatchObject({ ok: false, reason: "too_late" });
    expect(await regenerate(d, j.id)).toMatchObject({ ok: false, reason: "too_late" });
  });
  it("the dashboard shows the latest job, signed links and which accounts are connected", async () => {
    const d = deps();
    await readyJob(d);
    const o = await overview(d);
    expect(o.latest?.videoUrl).toContain("https://signed/");
    expect(o.connected).toEqual({ instagram: true, youtube: true });
  });
});

describe("cleaning what the AI wrote", () => {
  it("hashtags: #word, no duplicates, limited", () => {
    expect(cleanHashtags(["AI", "#ai", "AI Tools", "x", "#नया"], 10)).toEqual(["#AI", "#AITools", "#नया"]);
    expect(cleanHashtags(Array.from({ length: 50 }, (_, i) => `tag${i}`), 15)).toHaveLength(15);
  });
  it("tags stay under YouTube's 500 characters", () => {
    expect(cleanTags(Array.from({ length: 100 }, (_, i) => `tag number ${i}`)).join(",").length).toBeLessThan(500);
  });
  it("refuses a plan that is too short, too long or has no title; adds #Shorts", () => {
    const ok = cleanPlan(PLAN);
    expect(ok?.youtube.title).toMatch(/#Shorts/);
    expect(cleanPlan({ ...PLAN, script: { ...PLAN.script, scenes: PLAN.script.scenes.slice(0, 2) } })).toBeNull();
    expect(cleanPlan({ ...PLAN, script: { ...PLAN.script, scenes: Array.from({ length: 8 }, () => ({ seconds: 8, voiceover: "a", visual: "b", onScreen: "" })) } })).toBeNull();
    expect(cleanPlan({ ...PLAN, youtube: { ...PLAN.youtube, title: "" } })).toBeNull();
    expect(cleanPlan("garbage")).toBeNull();
  });
});
