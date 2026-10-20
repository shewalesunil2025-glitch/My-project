import { describe, expect, it } from "vitest";
import { muteStaticBursts } from "./ttsClean";

const RATE = 24000;
const tone = (secs: number, freq: number, amp = 12000) =>
  Array.from({ length: Math.round(secs * RATE) }, (_, i) => Math.round(amp * Math.sin((2 * Math.PI * freq * i) / RATE)));
const silence = (secs: number) => new Array(Math.round(secs * RATE)).fill(0);
// Loud static: the sign flips almost every sample.
const staticBurst = (secs: number) => Array.from({ length: Math.round(secs * RATE) }, (_, i) => (i % 2 ? 15000 : -15000) + ((i * 7919) % 2000) - 1000);

describe("muteStaticBursts", () => {
  it("mutes the burst of static at the end of a clip and keeps the voice", () => {
    const voice = tone(1, 220);
    const pcm = Int16Array.from([...voice, ...silence(0.3), ...staticBurst(0.13), ...silence(0.1)]);
    expect(muteStaticBursts(pcm, RATE)).toBe(1);
    expect(pcm.slice(voice.length + 0.3 * RATE).every((s) => s === 0)).toBe(true);
    expect(Array.from(pcm.slice(0, voice.length))).toEqual(Array.from(Int16Array.from(voice)));
  });

  it("leaves a short spoken word after a pause alone", () => {
    const pcm = Int16Array.from([...tone(1, 220), ...silence(0.4), ...tone(0.25, 180), ...silence(0.3)]);
    const before = Array.from(pcm);
    expect(muteStaticBursts(pcm, RATE)).toBe(0);
    expect(Array.from(pcm)).toEqual(before);
  });

  it("leaves a hissy sound that runs into speech alone", () => {
    const pcm = Int16Array.from([...silence(0.4), ...staticBurst(0.1), ...tone(0.8, 200), ...silence(0.3)]);
    expect(muteStaticBursts(pcm, RATE)).toBe(0);
  });
});
