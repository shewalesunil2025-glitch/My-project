#!/usr/bin/env node
/**
 * Makes "ibaxai in 2 minutes" (/app/demo/intro): the whole app in one video, one MP4 per
 * language (en, hi, mr) with IBAX's Gemini voice inside, each part timed to its narration.
 *
 *   npm run build && npx next start -p 3123      # frames are drawn by /render/tour
 *   node scripts/tour-video.mjs [--langs en,hi]
 *
 * Narration from TTS_URL (default https://www.ibaxai.com/api/speak), cached in .demo-cache/.
 * Output: public/demo/video/tour-<lang>.mp4, public/demo/poster/tour.jpg and manifest "tour".
 */
import { createHash } from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Loudness levelling also lifts the faint hiss in the pauses (it sounded like a radio between
 * and after sentences); this gate keeps the pauses silent and leaves the voice untouched.
 */
const QUIET = "agate=threshold=0.015:ratio=20:range=0.003:attack=8:release=180:knee=3";

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
};
const BASE = arg("base", "http://localhost:3123");
const TTS_URL = arg("tts", process.env.TTS_URL ?? "https://www.ibaxai.com/api/speak");
const OUT = arg("out", "public/demo");
const CACHE = arg("cache", ".demo-cache");
const FPS = Number(arg("fps", 24));
const PW = arg("playwright", process.env.PLAYWRIGHT_MODULE ?? "playwright");
for (const d of [`${OUT}/video`, `${OUT}/poster`, CACHE]) mkdirSync(d, { recursive: true });
const { chromium } = await import(PW);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const probe = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

async function speech(text) {
  const file = join(CACHE, `${createHash("sha256").update(text).digest("hex").slice(0, 24)}.wav`);
  if (existsSync(file)) return file;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(TTS_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) }).catch(() => null);
    if (res?.ok) {
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      return file;
    }
    if (attempt >= 6) throw new Error(`speech failed (${res?.status})`);
    await sleep(attempt * 8000);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 });
const load = async (d) => {
  await page.goto(`${BASE}/render/tour?d=${d.join(",")}&t=0`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__ready === true);
  await page.evaluate(() => document.fonts.ready);
};
await load([]);
const parts = await page.evaluate(() => window.__parts);
const scripts = await page.evaluate(() => window.__scripts);
const ONLY = arg("langs", "")?.split(",").filter(Boolean);
const langs = Object.keys(scripts).filter((l) => !ONLY?.length || ONLY.includes(l));

// Narration for every part in every language.
const wav = {};
for (const lang of langs) {
  wav[lang] = [];
  for (const p of parts) {
    wav[lang].push(await speech(scripts[lang][p]));
    process.stdout.write(`  voice ${lang} ${p}\r`);
  }
}
// Each part lasts as long as its longest narration (spoken up to 10% faster), plus a breath.
const MIN = { intro: 3.6, outro: 5 };
const durations = parts.map((p, i) => Math.max(MIN[p] ?? 3, ...langs.map((l) => probe(wav[l][i]) / 1.1 + 0.7)));
const total = durations.reduce((a, b) => a + b, 0);
console.log(`\nparts: ${durations.map((d) => d.toFixed(1)).join(", ")} = ${total.toFixed(1)}s`);

// Picture → silent MP4.
const D = durations.map((d) => d.toFixed(2));
await load(D);
const silent = join(CACHE, "tour.mp4");
const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", silent], { stdio: ["pipe", "inherit", "inherit"] });
const frames = Math.ceil(total * FPS);
for (let f = 0; f < frames; f++) {
  await page.evaluate((t) => window.__setT(t), f / FPS);
  const jpg = await page.screenshot({ type: "jpeg", quality: 90 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % (FPS * 5) === 0) process.stdout.write(`  frames ${f}/${frames}\r`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
await page.evaluate((t) => window.__setT(t), 2.4);
await page.screenshot({ path: join(OUT, "poster", "tour.jpg"), type: "jpeg", quality: 82 });
await browser.close();

// Each language: every part's narration fitted into its slot, then joined and muxed.
for (const lang of langs) {
  const pieces = [];
  for (const [i, src] of wav[lang].entries()) {
    const slot = durations[i];
    const fit = Math.min(1.12, Math.max(0.92, probe(src) / (slot - 0.5)));
    const out = join(CACHE, `tour-${lang}-${i}.wav`);
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", src, "-af", `adelay=250|250,atempo=${fit.toFixed(3)},aresample=44100,apad`, "-t", slot.toFixed(3), "-ac", "1", "-ar", "44100", out]);
    pieces.push(out);
  }
  const list = join(CACHE, `tour-${lang}.txt`);
  writeFileSync(list, pieces.map((p) => `file '${p.replace(/^\.demo-cache\//, "")}'`).join("\n"));
  const m4a = join(CACHE, `tour-${lang}.m4a`);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-af", `loudnorm=I=-16:TP=-1.5,${QUIET}`, "-ac", "1", "-ar", "44100", "-c:a", "aac", "-b:a", "96k", m4a]);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", silent, "-i", m4a, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-shortest", "-movflags", "+faststart", join(OUT, "video", `tour-${lang}.mp4`)]);
  console.log(`  ✓ ${lang}`);
}
const manifestFile = join(OUT, "manifest.json");
const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, "utf8")) : {};
manifest.tour = { talk: { duration: Number(total.toFixed(2)), langs: [...new Set([...(manifest.tour?.talk?.langs ?? []), ...langs])] } };
writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
console.log("Done.");
