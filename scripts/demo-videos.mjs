#!/usr/bin/env node
/**
 * Makes the demo videos shown at /app/demo/<service>: for every service, a "talk" video
 * (just tell IBAX) and a "manual" video (do it yourself), as silent MP4s plus one narration
 * track per language in IBAX's natural (Gemini) voice. The player plays the MP4 with the
 * chosen language's track.
 *
 *   npm run build && npx next start -p 3123      # the frames are drawn by /render/demo/<id>
 *   node scripts/demo-videos.mjs [--only whatsapp] [--mode talk] [--langs en,hi]
 *
 * Narration comes from TTS_URL (default https://www.ibaxai.com/api/speak) and is cached in
 * .demo-cache/, so a rerun only makes what changed. Output: public/demo/.
 * Needs ffmpeg and Playwright (Chromium).
 */
import { createHash } from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
};
const BASE = arg("base", "http://localhost:3123");
const TTS_URL = arg("tts", process.env.TTS_URL ?? "https://www.ibaxai.com/api/speak");
const OUT = arg("out", "public/demo");
const CACHE = arg("cache", ".demo-cache");
const ONLY = arg("only", "")?.split(",").filter(Boolean);
const MODES = (arg("mode", "talk,manual") ?? "").split(",");
const LANGS = arg("langs", "")?.split(",").filter(Boolean);
const FPS = Number(arg("fps", 24));
const PW = arg("playwright", process.env.PLAYWRIGHT_MODULE ?? "playwright");
/** Also write ready-to-share MP4s with the voice inside (one per language), for review. */
const PREVIEW = arg("preview", "");

for (const d of [OUT, `${OUT}/video`, `${OUT}/audio`, `${OUT}/poster`, CACHE]) mkdirSync(d, { recursive: true });
const { chromium } = await import(PW);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const probe = (file) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());

/** Narration for one text (split into ≤650-character pieces), cached as WAV. */
async function speech(text) {
  const file = join(CACHE, `${createHash("sha256").update(text).digest("hex").slice(0, 24)}.wav`);
  if (existsSync(file)) return file;
  const pieces = [];
  let cur = "";
  for (const s of text.match(/[^.!?।]+[.!?।]*\s*/g) ?? [text]) {
    if ((cur + s).length > 650 && cur) (pieces.push(cur.trim()), (cur = ""));
    cur += s;
  }
  if (cur.trim()) pieces.push(cur.trim());
  const parts = [];
  for (const [i, piece] of pieces.entries()) {
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(TTS_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: piece }) }).catch(() => null);
      if (res?.ok) {
        const p = `${file}.${i}.wav`;
        writeFileSync(p, Buffer.from(await res.arrayBuffer()));
        parts.push(p);
        break;
      }
      if (attempt >= 8) throw new Error(`TTS failed (${res?.status}) for: ${piece.slice(0, 60)}`);
      const wait = Math.min(120, 10 * attempt);
      console.log(`  voice busy (${res?.status ?? "network"}), retry in ${wait}s`);
      await sleep(wait * 1000);
    }
    await sleep(1500);
  }
  if (parts.length === 1) execFileSync("cp", [parts[0], file]);
  else execFileSync("ffmpeg", ["-y", "-v", "error", ...parts.flatMap((p) => ["-i", p]), "-filter_complex", `concat=n=${parts.length}:v=0:a=1`, file]);
  return file;
}

/** Shortest time each part of the picture needs. */
const MIN = {
  talk: [3, 4.6, 3.6, 3.8, 4.2, 3.4, 3.8],
  manual: [3, 3.6, 3.2, 3.4, 4.2, 3.4, 5],
};

const browser = await chromium.launch({ executablePath: existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 });

async function load(id, mode, durations) {
  await page.goto(`${BASE}/render/demo/${id}?mode=${mode}&d=${durations.join(",")}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__ready === true);
  await page.evaluate(() => document.fonts.ready);
}

await load("whatsapp", "talk", MIN.talk);
const ids = (await page.evaluate(() => window.__services)).filter((id) => !ONLY?.length || ONLY.includes(id));
const manifestFile = join(OUT, "manifest.json");
const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, "utf8")) : {};

for (const id of ids) {
  for (const mode of MODES) {
    console.log(`\n▶ ${id} · ${mode}`);
    await load(id, mode, MIN[mode]);
    const scripts = await page.evaluate(() => window.__scripts);
    const langs = Object.keys(scripts).filter((l) => !LANGS?.length || LANGS.includes(l) || l === "en");

    // English sets the pace: each part gets time in proportion to its words.
    const en = scripts.en;
    const enWav = await speech(en.filter(Boolean).join(" "));
    const enDur = probe(enWav);
    const total = en.reduce((s, p) => s + p.length, 0);
    const trialBuy = mode === "manual" && /free trial/i.test(en[3]);
    const durations = en.map((p, i) => {
      if (!p) return 0;
      let min = MIN[mode][i];
      if (mode === "manual" && i === 3 && !trialBuy) min = 5.6; // buy + pay sheet
      return Math.max(min, (enDur * p.length) / total);
    });
    durations[durations.length - 1] += 1.2; // a moment on the last picture
    const video = durations.reduce((a, b) => a + b, 0);
    const D = durations.map((d) => d.toFixed(2));

    // Picture → MP4 (silent).
    const mp4 = join(OUT, "video", `${id}-${mode}.mp4`);
    await load(id, mode, D);
    const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4], { stdio: ["pipe", "inherit", "inherit"] });
    const frames = Math.ceil(video * FPS);
    for (let f = 0; f < frames; f++) {
      await page.evaluate((t) => window.__setT(t), f / FPS);
      const jpg = await page.screenshot({ type: "jpeg", quality: 90 });
      if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
      if (f % (FPS * 5) === 0) process.stdout.write(`  frames ${f}/${frames}\r`);
    }
    ff.stdin.end();
    await new Promise((r) => ff.on("close", r));
    await page.evaluate((t) => window.__setT(t), 1.8);
    await page.screenshot({ path: join(OUT, "poster", `${id}-${mode}.jpg`), type: "jpeg", quality: 82 });

    // Narration per language, fitted to the video: a little faster or slower, then padded.
    const made = [];
    for (const lang of langs) {
      const text = scripts[lang].filter(Boolean).join(" ");
      let wav;
      try {
        wav = lang === "en" ? enWav : await speech(text);
      } catch (e) {
        console.log(`  ✗ ${lang}: ${e.message}`);
        continue;
      }
      const dur = probe(wav);
      const fit = Math.min(1.3, Math.max(0.88, dur / (video - 0.8)));
      const m4a = join(OUT, "audio", `${id}-${mode}-${lang}.m4a`);
      execFileSync("ffmpeg", ["-y", "-v", "error", "-i", wav, "-af", `adelay=300|300,atempo=${fit.toFixed(3)},apad`, "-t", video.toFixed(2), "-ac", "1", "-c:a", "aac", "-b:a", "40k", m4a]);
      if (PREVIEW) {
        mkdirSync(PREVIEW, { recursive: true });
        execFileSync("ffmpeg", ["-y", "-v", "error", "-i", mp4, "-i", m4a, "-c:v", "copy", "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart", join(PREVIEW, `${id}-${mode}-${lang}.mp4`)]);
      }
      made.push(lang);
      console.log(`  ✓ ${lang} (${dur.toFixed(1)}s → ×${fit.toFixed(2)})`);
    }
    manifest[id] ??= {};
    manifest[id][mode] = { duration: Number(video.toFixed(2)), langs: [...new Set([...(manifest[id][mode]?.langs ?? []), ...made])] };
    writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  }
}
await browser.close();
console.log("\nDone.");
