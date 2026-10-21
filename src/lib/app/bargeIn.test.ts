import { describe, expect, it } from "vitest";
import { bargeDetector } from "./bargeIn";

/*
 * A phone call, simulated in 128-sample pieces at 48 kHz (how the browser hands over the mic):
 * IBAX talks in syllables with short gaps, its voice comes back into the mic from the speaker
 * a little late (the echo), and sometimes the owner talks over it.
 */
const PIECE = 128 / 48000;
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function call({ seconds, coupling, owner }: { seconds: number; coupling: (t: number) => number; owner?: [number, number] }) {
  const d = bargeDetector();
  const delay = Math.round(0.04 / PIECE); // the speaker reaches the mic 40 ms late
  const out: number[] = [];
  let amp = 0.2;
  for (let i = 0, t = 0; t < seconds; i++, t += PIECE) {
    // Syllables of ~180 ms with ~70 ms gaps, each a little louder or softer.
    const phase = t % 0.25;
    if (phase < PIECE) amp = 0.05 + rand() * 0.3;
    const ibax = phase < 0.18 ? amp * (0.8 + rand() * 0.4) : 0.002;
    out.push(ibax);
    const echo = (out[i - delay] ?? 0) * coupling(t);
    const ownerVoice = owner && t >= owner[0] && t < owner[1] ? 0.25 + rand() * 0.1 : 0;
    const mic = Math.sqrt(echo * echo + ownerVoice * ownerVoice + 0.004 * 0.004);
    if (d.hear(mic, ibax, PIECE)) return t;
  }
  return null;
}

describe("bargeDetector", () => {
  it("never mistakes IBAX's own loud echo for the owner (speaker next to the mic)", () => {
    expect(call({ seconds: 60, coupling: () => 0.8 })).toBeNull();
  });

  it("copes with the echo slowly getting louder and softer (phone moved, volume changed)", () => {
    expect(call({ seconds: 60, coupling: (t) => 0.5 + 0.3 * Math.sin(t / 4) })).toBeNull();
  });

  it("stops IBAX quickly when the owner really talks over it", () => {
    const at = call({ seconds: 10, coupling: () => 0.5, owner: [5, 7] });
    expect(at).not.toBeNull();
    expect(at! - 5).toBeLessThan(0.6);
  });

  it("hears the owner even on a quiet echo (earpiece, headphones)", () => {
    const at = call({ seconds: 10, coupling: () => 0.05, owner: [4, 6] });
    expect(at).not.toBeNull();
    expect(at! - 4).toBeLessThan(0.6);
  });
});
