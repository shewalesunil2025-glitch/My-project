#!/usr/bin/env node
/**
 * Content Studio video worker. Runs on the VPS (it needs ffmpeg; Vercel can't render video).
 * Every few minutes (cron): asks the server to run the next step, then renders a job that waits
 * for its video: each scene is its AI picture with a slow zoom, its own voice, and subtitles;
 * then the 1280x720 thumbnail with bold text. Uploads both through one-time links.
 *
 *   STUDIO_BASE=https://www.ibaxai.com IBAX_SECRET=… node scripts/studio-worker.mjs [--start]
 *   Optional: STUDIO_MUSIC=/path/licensed-track.mp3 (only music you have the rights to), STUDIO_FONT="Noto Sans Devanagari"
 * Needs: ffmpeg with libass, and a Devanagari font (Ubuntu: apt install ffmpeg fonts-noto-core).
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = (process.env.STUDIO_BASE || "https://www.ibaxai.com").replace(/\/$/, "");
const SECRET = process.env.IBAX_SECRET || "";
const FONT = process.env.STUDIO_FONT || "Noto Sans Devanagari";
const MUSIC = process.env.STUDIO_MUSIC || "";
const W = 1080;
const H = 1920;
const FPS = 30;

const call = async (path, body) => {
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers: { "content-type": "application/json", "x-ibax-secret": SECRET }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} ${res.status} ${JSON.stringify(data).slice(0, 200)}`);
  return data;
};
const ff = (args) => execFileSync("ffmpeg", ["-y", "-v", "error", ...args], { stdio: ["ignore", "inherit", "inherit"] });
const seconds = (file) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim()) || 0;
const download = async (url, file) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
};
const upload = async (url, file, type) => {
  const res = await fetch(url, { method: "PUT", headers: { "content-type": type, "x-upsert": "true" }, body: readFileSync(file) });
  if (!res.ok) throw new Error(`upload ${res.status} ${(await res.text()).slice(0, 200)}`);
};
const assTime = (t) => {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}:${(t % 60).toFixed(2).padStart(5, "0")}`;
};
const assText = (s) => String(s).replace(/[{}\\]/g, "").replace(/\n/g, " ");
const STYLE_HEAD = "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding";
const EVENT_HEAD = "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text";

/** Builds the vertical video from scenes [{ image, voice, text, subtitle }] (local files). Returns its length. */
export function buildVideo(dir, scenes, out) {
  const parts = [];
  const events = [];
  let t = 0;
  scenes.forEach((s, i) => {
    const dur = Math.max(2, seconds(s.voice) + 0.35);
    const clip = join(dir, `part-${i}.mp4`);
    const frames = Math.round(dur * FPS);
    // A slow zoom on the picture and the scene's own voice, cut to the length of that voice.
    ff([
      "-loop", "1", "-i", s.image, "-i", s.voice,
      "-filter_complex",
      `[0:v]scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,crop=${W * 2}:${H * 2},zoompan=z='min(zoom+0.0009,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS},format=yuv420p[v];[1:a]aresample=44100,apad[a]`,
      "-map", "[v]", "-map", "[a]", "-t", dur.toFixed(2), "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-c:a", "aac", "-b:a", "160k", clip,
    ]);
    parts.push(clip);
    if (s.text) events.push(`Dialogue: 0,${assTime(t)},${assTime(t + Math.min(dur, 2.5))},Top,,0,0,0,,${assText(s.text)}`);
    events.push(`Dialogue: 0,${assTime(t)},${assTime(t + dur)},Sub,,0,0,0,,${assText(s.subtitle)}`);
    t += dur;
  });
  const list = join(dir, "parts.txt");
  writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n"));
  const joined = join(dir, "joined.mp4");
  ff(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", joined]);
  const ass = join(dir, "subs.ass");
  writeFileSync(
    ass,
    `[Script Info]\nScriptType: v4.00+\nPlayResX: ${W}\nPlayResY: ${H}\nWrapStyle: 0\n\n[V4+ Styles]\n${STYLE_HEAD}\nStyle: Sub,${FONT},64,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,5,2,2,80,80,260,1\nStyle: Top,${FONT},92,&H0000E5FF,&H0000E5FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,6,3,8,80,80,220,1\n\n[Events]\n${EVENT_HEAD}\n${events.join("\n")}\n`,
  );
  const music = MUSIC ? ["-stream_loop", "-1", "-i", MUSIC] : [];
  const map = MUSIC ? ["-filter_complex", "[1:a]volume=0.12[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=2[a]", "-map", "0:v", "-map", "[a]"] : ["-map", "0:v", "-map", "0:a"];
  ff(["-i", joined, ...music, "-vf", `ass=${ass}`, ...map, "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", out]);
  return t;
}

/** 1280x720 thumbnail: the AI background with big bold text on the left. */
export function buildThumbnail(dir, background, text, out) {
  const ass = join(dir, "thumb.ass");
  writeFileSync(
    ass,
    `[Script Info]\nScriptType: v4.00+\nPlayResX: 1280\nPlayResY: 720\n\n[V4+ Styles]\n${STYLE_HEAD}\nStyle: T,${FONT},120,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,1,0,0,0,100,100,0,0,1,8,4,4,70,560,0,1\n\n[Events]\n${EVENT_HEAD}\nDialogue: 0,0:00:00.00,0:00:05.00,T,,0,0,0,,${assText(text).toUpperCase()}\n`,
  );
  ff(["-i", background, "-vf", `scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,ass=${ass}`, "-frames:v", "1", "-q:v", "3", out]);
}

async function renderOne() {
  const { job } = await call("/api/studio/render", { action: "claim" });
  if (!job) return false;
  const dir = mkdtempSync(join(tmpdir(), "studio-"));
  try {
    const scenes = [];
    for (const [i, s] of job.scenes.entries()) {
      const image = join(dir, `scene-${i}.img`);
      const voice = join(dir, `voice-${i}.wav`);
      await download(s.image, image);
      await download(s.voice, voice);
      scenes.push({ image, voice, text: s.text, subtitle: s.subtitle });
    }
    const video = join(dir, "video.mp4");
    const length = buildVideo(dir, scenes, video);
    await upload(job.uploadVideo, video, "video/mp4");
    if (job.thumbnailBackground) {
      const bg = join(dir, "thumb-bg.img");
      const thumb = join(dir, "thumbnail.jpg");
      await download(job.thumbnailBackground, bg);
      buildThumbnail(dir, bg, job.thumbnailText || job.topic, thumb);
      await upload(job.uploadThumbnail, thumb, "image/jpeg");
    }
    await call("/api/studio/render", { action: "finish", id: job.id, ok: true, seconds: length });
    console.log(`[studio] rendered ${job.id} (${length.toFixed(1)} s)`);
  } catch (e) {
    console.error("[studio] render failed", e);
    await call("/api/studio/render", { action: "finish", id: job.id, ok: false, error: String(e?.message ?? e).slice(0, 300) }).catch(() => {});
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  return true;
}

async function main() {
  if (!SECRET) throw new Error("Set IBAX_SECRET (the same value as N8N_WEBHOOK_SECRET in Vercel)");
  // --start (the morning cron): make today's job if there is none yet. Same as the n8n daily trigger.
  if (process.argv.includes("--start")) console.log("[studio] start", JSON.stringify((await call("/api/studio/run", { action: "start" })).created));
  // The server steps that are waiting (research, plan, images, voice, publishing), then the render.
  for (let i = 0; i < 6; i++) {
    const r = await call("/api/studio/run", { action: "advance" });
    if (r.did === "nothing") break;
  }
  while (await renderOne()) {
    /* next job */
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
