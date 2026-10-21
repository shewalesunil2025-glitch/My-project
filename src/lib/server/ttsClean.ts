/**
 * The voice model sometimes ends a clip with a short, loud burst of static (a "kssh" that sounds
 * like a radio). It always sits on its own: a near-silent gap, ~0.1–0.35 s of noise, then silence
 * or the end of the clip. Speech never looks like that (a hissy "s" is joined to the word around
 * it), so those bursts are muted. Same rule as scripts/tts-clean.mjs, which cleans the demo videos.
 *
 * Mutes in place and returns how many bursts it found. `pcm` is 16-bit mono.
 */
export function muteStaticBursts(pcm: Int16Array, rate: number): number {
  const W = Math.round(rate / 100); // 10 ms windows
  const db: number[] = [];
  const hz: number[] = []; // zero crossings per second: a voice crosses a few hundred times, static thousands
  for (let i = 0; i + W <= pcm.length; i += W) {
    let sq = 0;
    let zc = 0;
    for (let j = i; j < i + W; j++) {
      sq += pcm[j] * pcm[j];
      if (j > i && pcm[j] >= 0 !== pcm[j - 1] >= 0) zc++;
    }
    const rms = Math.sqrt(sq / W);
    db.push(rms > 0 ? 20 * Math.log10(rms / 32768) : -200);
    hz.push((zc / W) * (rate / 2));
  }
  const quiet = (k: number) => k >= db.length || db[k] < -45;

  let found = 0;
  for (let k = 15; k < db.length; k++) {
    if (quiet(k)) continue;
    // A sound that starts after ≥150 ms of near-silence…
    let before = 0;
    while (before < 15 && quiet(k - 1 - before)) before++;
    let end = k;
    while (end < db.length && !quiet(end)) end++;
    // …lasts at most 350 ms, is followed by ≥100 ms of near-silence (or the end), and is loud static.
    let after = 0;
    while (after < 10 && quiet(end + after)) after++;
    const len = end - k;
    const noisy = hz.slice(k, end).filter((h) => h > 2000).length >= len * 0.7;
    const loud = Math.max(...db.slice(k, end)) > -30;
    if (before >= 15 && len <= 35 && (after >= 10 || end + after >= db.length) && noisy && loud) {
      pcm.fill(0, k * W, Math.min(pcm.length, end * W + W));
      found++;
    }
    k = end;
  }
  return found;
}

/**
 * The span of the clip worth playing: the voice model leaves ~0.25 s of silence at the start
 * and end of every clip, which became a pause between the pieces of one answer. Keeps 60 ms
 * before the first sound and 150 ms after the last (so words still end naturally).
 */
export function speechSpan(pcm: Int16Array, rate: number): [number, number] {
  const W = Math.round(rate / 100);
  const loud = (i: number) => {
    let sq = 0;
    for (let j = i; j < Math.min(i + W, pcm.length); j++) sq += pcm[j] * pcm[j];
    return Math.sqrt(sq / W) > 330; // about -40 dB
  };
  let start = 0;
  while (start < pcm.length && !loud(start)) start += W;
  let end = pcm.length;
  while (end > start && !loud(Math.max(0, end - W))) end -= W;
  if (start >= end) return [0, pcm.length];
  return [Math.max(0, start - Math.round(rate * 0.06)), Math.min(pcm.length, end + Math.round(rate * 0.15))];
}
