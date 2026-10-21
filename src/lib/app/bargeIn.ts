/**
 * During a live call: is the owner talking over IBAX, or is the mic only hearing IBAX's own
 * voice from the speaker (its echo)? The echo is learned from the first second of IBAX's voice
 * and then follows slowly, so a quiet moment between IBAX's words never makes the next loud word
 * look like the owner — on phones with the speaker right next to the mic (most Androids), that
 * mistake used to stop IBAX in the middle of a sentence.
 *
 * Levels are RMS (0–1) of each small piece of sound; `seconds` is the piece's length.
 */
export type BargeDetector = { hear: (mic: number, out: number, seconds: number) => boolean; reset: () => void };

/** Seconds of IBAX's voice to learn the echo from, and how long the owner must talk to cut in. */
export const LEARN_SECONDS = 1;
export const TALK_SECONDS = 0.35;

export function bargeDetector(): BargeDetector {
  let micLevel = 0;
  let outLevel = 0;
  let echo = 0; // mic level ÷ IBAX's level, when only the echo is heard
  let learned = 0;
  const samples: number[] = [];
  let talkingFor = 0;
  // Smoothing by time, so the result is the same however small the pieces are.
  const blend = (seconds: number, tau: number) => 1 - Math.exp(-seconds / tau);
  return {
    reset: () => {
      talkingFor = 0;
    },
    hear(mic, out, seconds) {
      micLevel += (mic - micLevel) * blend(seconds, 0.03);
      // IBAX's level is held a little: its voice reaches the mic a moment late.
      outLevel = Math.max(out, outLevel * (1 - blend(seconds, 0.15)));
      if (outLevel <= 0.01) {
        talkingFor = Math.max(0, talkingFor - seconds / 2);
        return false;
      }
      const ratio = micLevel / outLevel;
      if (learned < LEARN_SECONDS) {
        learned += seconds;
        samples.push(ratio);
        if (learned >= LEARN_SECONDS) {
          // The echo is the loud end of what was heard (90th percentile), not the average.
          samples.sort((a, b) => a - b);
          echo = samples[Math.floor(samples.length * 0.9)];
        }
        return false;
      }
      const louder = micLevel > 0.03 && micLevel > echo * outLevel * 2.5 + 0.015;
      // Follow slow changes of the echo (phone moved, volume changed), never the owner's voice.
      if (!louder && ratio < echo * 2) echo += (ratio - echo) * blend(seconds, ratio > echo ? 1 : 4);
      talkingFor = louder ? talkingFor + seconds : Math.max(0, talkingFor - seconds / 2);
      return talkingFor >= TALK_SECONDS;
    },
  };
}
