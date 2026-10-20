/**
 * The voice service sometimes ends a clip with a short, loud burst of static (a "kssh" that
 * sounds like a radio). It always sits on its own: a near-silent gap, ~0.1–0.35 s of noise,
 * then silence or the end of the clip. Speech never looks like that (a hissy "s" is joined to
 * the word around it), so those bursts are muted. Works on 16-bit mono WAV files in place.
 *
 *   node scripts/tts-clean.mjs file.wav [more.wav …]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dbfs = (rms) => (rms > 0 ? 20 * Math.log10(rms / 32768) : -200);

/** Mutes the static bursts in one WAV; returns how many were found. */
export function cleanWav(path) {
  const buf = readFileSync(path);
  const rate = buf.readUInt32LE(24);
  let off = 12;
  while (off + 8 <= buf.length && buf.toString("ascii", off, off + 4) !== "data") off += 8 + buf.readUInt32LE(off + 4);
  if (off + 8 > buf.length || buf.readUInt16LE(22) !== 1 || buf.readUInt16LE(34) !== 16) return 0;
  const start = off + 8;
  const n = Math.floor(Math.min(buf.readUInt32LE(off + 4), buf.length - start) / 2);
  const s = new Int16Array(buf.buffer, buf.byteOffset + start, n);

  // Loudness and "noisiness" (zero crossings per second) in 10 ms windows.
  const W = Math.round(rate / 100);
  const wins = [];
  for (let i = 0; i + W <= n; i += W) {
    let sq = 0;
    let zc = 0;
    for (let j = i; j < i + W; j++) {
      sq += s[j] * s[j];
      if (j > i && (s[j] >= 0) !== (s[j - 1] >= 0)) zc++;
    }
    wins.push({ db: dbfs(Math.sqrt(sq / W)), hz: (zc / W) * (rate / 2) });
  }
  const quiet = (k) => k >= wins.length || wins[k].db < -45;

  let found = 0;
  for (let k = 15; k < wins.length; k++) {
    if (quiet(k)) continue;
    // A sound that starts after ≥150 ms of near-silence…
    let before = 0;
    while (before < 15 && quiet(k - 1 - before)) before++;
    if (before < 15) continue;
    // …lasts at most 350 ms…
    let end = k;
    while (end < wins.length && !quiet(end)) end++;
    const len = end - k;
    if (len > 35) {
      k = end;
      continue;
    }
    // …is followed by ≥100 ms of near-silence (or the end), and is loud, hissy noise.
    let after = 0;
    while (after < 10 && quiet(end + after)) after++;
    const burst = wins.slice(k, end);
    // Static crosses zero far more often than a voice does (a voice: a few hundred times a second).
    const noisy = burst.filter((w) => w.hz > 2000).length >= burst.length * 0.7;
    const loud = Math.max(...burst.map((w) => w.db)) > -30;
    if ((after >= 10 || end + after >= wins.length) && noisy && loud) {
      s.fill(0, k * W, Math.min(n, end * W + W));
      found++;
    }
    k = end;
  }
  if (found) writeFileSync(path, buf);
  return found;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const f of process.argv.slice(2)) console.log(`${f}: ${cleanWav(f)} burst(s) muted`);
}
