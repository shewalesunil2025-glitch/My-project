import type { SupabaseClient } from "@supabase/supabase-js";
import { NEXT_STEP, approvable, canMove, indiaDay, type JobStatus, type Plan } from "@/lib/studio/core";
import type { Publisher } from "./publish";
import type { Research } from "./generate";

/**
 * The daily video job: one step at a time, so every call stays short and any step can be retried.
 * The founder approves before anything is published; each platform is published at most once.
 */

type Row = Record<string, any>;
export type Fail = { ok: false; reason: string; message: string; status: number };
const fail = (reason: string, message: string, status = 400): Fail => ({ ok: false, reason, message, status });

export type Storage = {
  upload(path: string, data: Buffer, type: string): Promise<void>;
  signedUrl(path: string, seconds: number): Promise<string>;
  signedUpload(path: string): Promise<string>;
  exists(path: string): Promise<boolean>;
};
export type Deps = {
  db: SupabaseClient;
  storage: Storage;
  ai: {
    research(avoid: string[]): Promise<Research>;
    writePlan(notes: string, avoid: string[], live: boolean): Promise<Plan>;
    picture(prompt: string): Promise<{ mime: string; data: Buffer }>;
    voice(text: string): Promise<Buffer>;
    thumbnailPrompt(p: Plan): string;
  };
  publishers: Publisher[];
  notify(title: string, detail: string): Promise<void>;
  now?: () => Date;
};

const MAX_TRIES = 3;
const RENDER_TIMEOUT_MS = 30 * 60_000;

async function log(db: SupabaseClient, jobId: string | null, level: "info" | "warning" | "error", message: string, detail: Row = {}) {
  await db.from("studio_events").insert({ job_id: jobId, level, message: message.slice(0, 500), detail });
}

async function move(db: SupabaseClient, job: Row, to: JobStatus, patch: Row = {}) {
  if (!canMove(job.status, to)) throw new Error(`Can't move a ${job.status} job to ${to}`);
  const { error } = await db.from("studio_jobs").update({ ...patch, status: to, updated_at: new Date().toISOString() }).eq("id", job.id).eq("status", job.status);
  if (error) throw new Error(error.message);
  Object.assign(job, patch, { status: to });
}

const getJob = async (db: SupabaseClient, id: unknown) => (await db.from("studio_jobs").select("*").eq("id", String(id ?? "")).maybeSingle()).data as Row | null;

/** Today's job, made once a day (the n8n daily trigger and the dashboard both call this). */
export async function startDay(d: Deps): Promise<{ ok: true; job: Row; created: boolean }> {
  const day = indiaDay(d.now?.());
  const { data: jobs } = await d.db.from("studio_jobs").select("*").eq("day", day).order("attempt", { ascending: false });
  const live = (jobs ?? []).find((j: Row) => j.status !== "rejected");
  if (live) return { ok: true, job: live, created: false };
  return { ok: true, job: await newAttempt(d, day, (jobs ?? []) as Row[]), created: true };
}

async function newAttempt(d: Deps, day: string, earlier: Row[]) {
  const avoid = [...new Set(earlier.flatMap((j) => [j.topic, ...(j.avoid ?? [])]).filter(Boolean))].slice(0, 20);
  const attempt = Math.max(0, ...earlier.map((j) => Number(j.attempt) || 0)) + 1;
  const { data, error } = await d.db.from("studio_jobs").insert({ day, attempt, avoid, status: "queued" }).select("*").single();
  if (error || !data) throw new Error(error?.message ?? "could not create the job");
  await log(d.db, data.id, "info", `Job for ${day} (attempt ${attempt}) created`);
  return data as Row;
}

/** Runs the next server step of the oldest job that has one. Returns what it did. */
export async function advance(d: Deps): Promise<{ ok: true; did: string; jobId?: string; status?: JobStatus }> {
  // Publishing that is still waiting on a platform (Instagram processes videos for a while).
  const { data: pub } = await d.db.from("studio_jobs").select("*").eq("status", "publishing").order("updated_at").limit(1);
  if (pub?.[0]) {
    await publishAll(d, pub[0]);
    return { ok: true, did: "publish", jobId: pub[0].id, status: pub[0].status };
  }
  // A render the worker claimed but never finished goes back in the queue.
  const stale = new Date((d.now?.() ?? new Date()).getTime() - RENDER_TIMEOUT_MS).toISOString();
  const { data: stuck } = await d.db.from("studio_jobs").select("*").eq("status", "rendering").lt("render_claimed_at", stale).limit(1);
  if (stuck?.[0]) {
    await move(d.db, stuck[0], "awaiting_render", { render_claimed_at: null });
    await log(d.db, stuck[0].id, "warning", "Render took too long; queued again");
    return { ok: true, did: "render_requeued", jobId: stuck[0].id };
  }
  const { data: work } = await d.db.from("studio_jobs").select("*").in("status", ["queued", "scripting", "assets"]).order("created_at").limit(1);
  const job = work?.[0] as Row | undefined;
  if (!job) return { ok: true, did: "nothing" };
  const to = NEXT_STEP[job.status as JobStatus]!;
  try {
    if (job.status === "queued") {
      const r = await d.ai.research(job.avoid ?? []);
      await move(d.db, job, to, { research: r, error: "", tries: 0 });
    } else if (job.status === "scripting") {
      const plan = await d.ai.writePlan(String(job.research?.notes ?? ""), job.avoid ?? [], Boolean(job.research?.live));
      await move(d.db, job, to, { topic: plan.script.topic, script: plan.script, instagram: plan.instagram, youtube: plan.youtube, error: "", tries: 0 });
    } else {
      const base = `${job.day}/${job.id}`;
      const scenes: Row[] = [];
      for (const [i, s] of (job.script?.scenes ?? []).entries()) {
        const img = await d.ai.picture(s.visual);
        const image = `${base}/scene-${i + 1}.${img.mime.includes("png") ? "png" : "jpg"}`;
        await d.storage.upload(image, img.data, img.mime);
        const voice = `${base}/voice-${i + 1}.wav`;
        await d.storage.upload(voice, await d.ai.voice(s.voiceover), "audio/wav");
        scenes.push({ image, voice, seconds: s.seconds, text: s.onScreen, subtitle: s.voiceover });
      }
      const plan = { script: job.script, instagram: job.instagram, youtube: job.youtube } as Plan;
      const t = await d.ai.picture(d.ai.thumbnailPrompt(plan));
      const thumbBg = `${base}/thumbnail-bg.${t.mime.includes("png") ? "png" : "jpg"}`;
      await d.storage.upload(thumbBg, t.data, t.mime);
      await move(d.db, job, to, { scene_paths: scenes, thumbnail_path: thumbBg, error: "", tries: 0 });
    }
    await log(d.db, job.id, "info", `Step done: now ${to}`);
    return { ok: true, did: "step", jobId: job.id, status: to };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const tries = (Number(job.tries) || 0) + 1;
    if (tries >= MAX_TRIES) {
      await move(d.db, job, "failed", { error: message.slice(0, 500), tries });
      await log(d.db, job.id, "error", `Failed after ${tries} tries: ${message}`);
      await d.notify("Today's AI video could not be made", `${message.slice(0, 140)} — open Content Studio to try again.`);
    } else {
      await d.db.from("studio_jobs").update({ error: message.slice(0, 500), tries, updated_at: new Date().toISOString() }).eq("id", job.id);
      await log(d.db, job.id, "warning", `Step failed (try ${tries}): ${message}`);
    }
    return { ok: true, did: "error", jobId: job.id, status: job.status };
  }
}

/* ── the video worker (VPS with ffmpeg) ── */

export async function claimRender(d: Deps) {
  const { data } = await d.db.from("studio_jobs").select("*").eq("status", "awaiting_render").order("created_at").limit(1);
  const job = data?.[0] as Row | undefined;
  if (!job) return { ok: true as const, job: null };
  await move(d.db, job, "rendering", { render_claimed_at: (d.now?.() ?? new Date()).toISOString() });
  const base = `${job.day}/${job.id}`;
  const sign = (p: string) => d.storage.signedUrl(p, 3600);
  return {
    ok: true as const,
    job: {
      id: job.id,
      topic: job.topic,
      thumbnailText: job.youtube?.thumbnailText ?? "",
      scenes: await Promise.all((job.scene_paths ?? []).map(async (s: Row) => ({ ...s, image: await sign(s.image), voice: await sign(s.voice) }))),
      thumbnailBackground: job.thumbnail_path ? await sign(job.thumbnail_path) : null,
      uploadVideo: await d.storage.signedUpload(`${base}/video.mp4`),
      uploadThumbnail: await d.storage.signedUpload(`${base}/thumbnail.jpg`),
    },
  };
}

export async function finishRender(d: Deps, body: Row): Promise<{ ok: true } | Fail> {
  const job = await getJob(d.db, body.id);
  if (!job || job.status !== "rendering") return fail("not_rendering", "This job is not being rendered.", 409);
  if (body.ok !== true) {
    await move(d.db, job, "awaiting_render", { render_claimed_at: null, error: String(body.error ?? "render failed").slice(0, 500) });
    await log(d.db, job.id, "warning", `Render failed: ${String(body.error ?? "")}`);
    return { ok: true };
  }
  const base = `${job.day}/${job.id}`;
  if (!(await d.storage.exists(`${base}/video.mp4`))) return fail("no_video", "The video file is not in storage.", 409);
  const thumb = (await d.storage.exists(`${base}/thumbnail.jpg`)) ? `${base}/thumbnail.jpg` : job.thumbnail_path;
  await move(d.db, job, "ready_for_review", { video_path: `${base}/video.mp4`, thumbnail_path: thumb, error: "" });
  await log(d.db, job.id, "info", "Video ready for review");
  await d.notify("Your AI video is ready! 🎬", `${job.topic} — watch it and approve to publish.`);
  return { ok: true };
}

/* ── the founder's buttons ── */

export async function approve(d: Deps, id: unknown): Promise<{ ok: true; status: JobStatus } | Fail> {
  const job = await getJob(d.db, id);
  if (!job) return fail("not_found", "No such video.", 404);
  if (!approvable(job.status)) return fail("not_ready", "Only a finished video can be approved.", 409);
  await move(d.db, job, "approved", { approved_at: (d.now?.() ?? new Date()).toISOString() });
  await log(d.db, job.id, "info", "Approved by the founder");
  await move(d.db, job, "publishing");
  await publishAll(d, job);
  return { ok: true, status: job.status };
}

export async function reject(d: Deps, id: unknown): Promise<{ ok: true } | Fail> {
  const job = await getJob(d.db, id);
  if (!job) return fail("not_found", "No such video.", 404);
  if (!canMove(job.status, "rejected")) return fail("too_late", "This video is already being published or was published.", 409);
  await move(d.db, job, "rejected");
  await log(d.db, job.id, "info", "Rejected by the founder");
  return { ok: true };
}

/** A fresh video for the same day with a different topic; nothing to type. */
export async function regenerate(d: Deps, id: unknown): Promise<{ ok: true; job: Row } | Fail> {
  const job = await getJob(d.db, id);
  if (!job) return fail("not_found", "No such video.", 404);
  if (job.status !== "rejected" && job.status !== "failed") {
    if (!canMove(job.status, "rejected")) return fail("too_late", "This video is already being published or was published.", 409);
    await move(d.db, job, "rejected");
  }
  const { data: jobs } = await d.db.from("studio_jobs").select("*").eq("day", job.day);
  return { ok: true, job: await newAttempt(d, job.day, (jobs ?? []) as Row[]) };
}

/** Retry publishing on the platforms that failed (never the ones that already published). */
export async function retryPublish(d: Deps, id: unknown): Promise<{ ok: true; status: JobStatus } | Fail> {
  const job = await getJob(d.db, id);
  if (!job) return fail("not_found", "No such video.", 404);
  if (!job.video_path || !job.approved_at || !canMove(job.status, "publishing")) return fail("not_publishable", "Only an approved, finished video can be published.", 409);
  await move(d.db, job, "publishing");
  await publishAll(d, job);
  return { ok: true, status: job.status };
}

/* ── publishing ── */

export async function publishAll(d: Deps, job: Row) {
  const videoUrl = await d.storage.signedUrl(job.video_path, 3600);
  const thumbnailUrl = job.thumbnail_path ? await d.storage.signedUrl(job.thumbnail_path, 3600) : undefined;
  const ig = job.instagram ?? {};
  const yt = job.youtube ?? {};
  const results: string[] = [];
  for (const p of d.publishers) {
    // One row per job and platform (unique): a second insert fails, so there is never a second post.
    await d.db.from("studio_publish").insert({ job_id: job.id, platform: p.platform });
    const { data: row } = await d.db.from("studio_publish").select("*").eq("job_id", job.id).eq("platform", p.platform).maybeSingle();
    if (!row) continue;
    if (row.status === "published") {
      results.push("published");
      continue;
    }
    if (!p.configured()) {
      await d.db.from("studio_publish").update({ status: "failed", error: `Not connected: add the ${p.platform} keys in Vercel`, updated_at: new Date().toISOString() }).eq("id", row.id);
      results.push("failed");
      continue;
    }
    try {
      const r = await p.step({
        videoUrl,
        thumbnailUrl,
        caption: [ig.caption, (ig.hashtags ?? []).join(" ")].filter(Boolean).join("\n\n"),
        title: yt.title,
        description: [yt.description, (yt.hashtags ?? []).join(" ")].filter(Boolean).join("\n\n"),
        tags: yt.tags ?? [],
        external: row.external ?? {},
      });
      await d.db.from("studio_publish").update({ status: r.status, external: r.external, url: r.url ?? row.url ?? null, error: r.error ?? "", attempts: (row.attempts ?? 0) + 1, updated_at: new Date().toISOString() }).eq("id", row.id);
      results.push(r.status);
      if (r.status === "published") await log(d.db, job.id, "info", `Published on ${p.platform}`, { url: r.url });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const attempts = (row.attempts ?? 0) + 1;
      // A few tries for a platform that is busy; then it waits for "Retry publish".
      await d.db.from("studio_publish").update({ status: attempts >= MAX_TRIES ? "failed" : "uploading", error: message.slice(0, 500), attempts, updated_at: new Date().toISOString() }).eq("id", row.id);
      await log(d.db, job.id, "warning", `${p.platform} publish failed: ${message}`);
      results.push(attempts >= MAX_TRIES ? "failed" : "uploading");
    }
  }
  const done = results.filter((r) => r === "published").length;
  const waiting = results.some((r) => r === "uploading" || r === "processing");
  if (waiting) return; // the next advance() continues
  const to: JobStatus = done === results.length && done > 0 ? "published" : done > 0 ? "partly_published" : "failed";
  await move(d.db, job, to);
  await d.notify(to === "published" ? "Your AI video is live ✅" : "Publishing needs a look", to === "published" ? `${job.topic} is on Instagram and YouTube.` : "Open Content Studio: one platform did not publish.");
}

/* ── the dashboard ── */

export async function overview(d: Deps) {
  const { data: jobs } = await d.db.from("studio_jobs").select("*").order("created_at", { ascending: false }).limit(30);
  const latest = (jobs ?? [])[0] as Row | undefined;
  const pubs = latest ? ((await d.db.from("studio_publish").select("platform, status, url, error, attempts").eq("job_id", latest.id)).data ?? []) : [];
  const events = latest ? ((await d.db.from("studio_events").select("level, message, created_at").eq("job_id", latest.id).order("created_at", { ascending: false }).limit(20)).data ?? []) : [];
  const sign = async (p?: string | null) => (p ? d.storage.signedUrl(p, 3600).catch(() => null) : null);
  return {
    latest: latest && {
      ...latest,
      videoUrl: await sign(latest.video_path),
      thumbnailUrl: await sign(latest.thumbnail_path),
      publish: pubs,
      events,
    },
    history: (jobs ?? []).map((j: Row) => ({ id: j.id, day: j.day, attempt: j.attempt, status: j.status, topic: j.topic })),
    connected: Object.fromEntries(d.publishers.map((p) => [p.platform, p.configured()])),
  };
}
