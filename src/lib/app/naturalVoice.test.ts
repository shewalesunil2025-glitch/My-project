import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SLOW_REST_MS, WAIT_FIRST_MS, WAIT_NEXT_MS, speakNaturally, speechChunks, stopNaturalVoice, unlockAudio } from "./naturalVoice";

describe("speechChunks", () => {
  it("says the first sentence on its own, then groups the rest", () => {
    const text = "Dhiru ji, namaste! Main IBAX hoon. Aaj main aapki kya madad kar sakta hoon? WhatsApp Automation ya Google Reviews ka setup kar sakte hain.";
    const chunks = speechChunks(text, 80);
    expect(chunks[0]).toBe("Dhiru ji, namaste!");
    expect(chunks.join(" ")).toBe(text);
    expect(chunks.every((c) => c.length <= 80)).toBe(true);
  });

  it("keeps every word of a long answer, in pieces the voice server accepts", () => {
    const text = Array.from({ length: 30 }, (_, i) => `Yeh line number ${i + 1} hai aur isme kuch shabd hain।`).join(" ");
    const chunks = speechChunks(text);
    expect(chunks.join(" ")).toBe(text);
    expect(chunks.every((c) => c.length <= 260)).toBe(true);
  });

  it("splits one very long sentence without losing words", () => {
    const text = "shabd ".repeat(120).trim();
    const chunks = speechChunks(text, 100);
    expect(chunks.join(" ").replace(/\s+/g, " ")).toBe(text);
    expect(chunks.every((c) => c.length <= 100)).toBe(true);
  });
});

describe("speechChunks sizes", () => {
  it("starts small and grows, so each next piece is ready before the one before it ends", () => {
    const text = Array.from({ length: 20 }, (_, i) => `Yeh vaakya number ${i + 1} hai, thoda lamba.`).join(" ");
    const chunks = speechChunks(text);
    expect(chunks[1].length).toBeLessThanOrEqual(120);
    expect(chunks[2].length).toBeLessThanOrEqual(200);
    expect(chunks.join(" ")).toBe(text);
  });
});

/* A fake speaker and voice server, to check IBAX never goes quiet in the middle of an answer. */
describe("speakNaturally", () => {
  const played: string[] = [];
  let delays: Record<number, number> = {};
  let calls = 0;

  let clock = Date.UTC(2030, 0, 1);
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime((clock += 3_600_000)); // each test an hour later, past any rest from the one before
    played.length = 0;
    delays = {};
    calls = 0;
    class FakeAudio {
      src = "";
      onplaying: (() => void) | null = null;
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      load() {}
      pause() {}
      play() {
        if (this.src.startsWith("blob:")) {
          played.push(this.src.slice(5));
          setTimeout(() => this.onplaying?.(), 10);
          setTimeout(() => this.onended?.(), 1000); // every piece speaks for 1 s
        }
        return Promise.resolve();
      }
    }
    vi.stubGlobal("Audio", FakeAudio);
    vi.stubGlobal("URL", { createObjectURL: (b: { text: string }) => `blob:${b.text}`, revokeObjectURL: () => {} });
    vi.stubGlobal("fetch", (_: string, init: { body: string; signal: AbortSignal }) => {
      const n = calls++;
      const { text } = JSON.parse(init.body) as { text: string };
      return new Promise((resolve, reject) => {
        const t = setTimeout(() => resolve({ ok: true, status: 200, blob: async () => ({ text }) }), delays[n] ?? 500);
        init.signal.addEventListener("abort", () => (clearTimeout(t), reject(new Error("aborted"))));
      });
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const answer = "Pehla vaakya. Doosra vaakya yahan hai. Teesra vaakya bhi hai. Chautha aur aakhri vaakya.";

  it("says the whole answer when the voice server is quick", async () => {
    unlockAudio();
    const ended = vi.fn();
    const done = speakNaturally(answer, undefined, ended);
    await vi.runAllTimersAsync();
    expect(await done).toBe("");
    expect(ended).toHaveBeenCalled();
    expect(played.join(" ")).toBe(answer);
  });

  it("hands the rest to the phone's voice when a piece is late, instead of going quiet", async () => {
    unlockAudio();
    const chunks = speechChunks(answer, 650, [140, 600]);
    delays = { 1: 60_000 }; // the second piece never comes in time
    const done = speakNaturally(answer);
    await vi.advanceTimersByTimeAsync(500 + 1000 + WAIT_NEXT_MS + 100);
    expect(await done).toBe(chunks.slice(1).join(" "));
    expect(played).toEqual([chunks[0]]);
  });

  it("uses the phone's voice for everything when the first piece is too slow", async () => {
    unlockAudio();
    delays = { 0: 60_000 };
    const done = speakNaturally(answer);
    await vi.advanceTimersByTimeAsync(WAIT_FIRST_MS + 100);
    expect(await done).toBe(speechChunks(answer).join(" "));
    expect(played).toEqual([]);
  });

  it("after a late piece, the next answers start in the phone's voice right away (no new waiting)", async () => {
    unlockAudio();
    delays = { 0: 60_000 };
    const first = speakNaturally(answer);
    await vi.advanceTimersByTimeAsync(WAIT_FIRST_MS + 100);
    await first;
    const asked = calls;
    expect(await speakNaturally(answer)).toBe(answer);
    expect(calls).toBe(asked);
    await vi.advanceTimersByTimeAsync(SLOW_REST_MS + 1000);
    delays = {};
    const later = speakNaturally(answer);
    await vi.runAllTimersAsync();
    expect(await later).toBe("");
  });

  it("uses the phone's voice for a while when the voice server is at its limit, without asking again", async () => {
    unlockAudio();
    vi.stubGlobal("fetch", () => {
      calls++;
      return Promise.resolve({ ok: false, status: 503 });
    });
    const first = speakNaturally(answer);
    await vi.runAllTimersAsync();
    expect(await first).toBe(answer);
    const asked = calls;
    expect(await speakNaturally(answer)).toBe(answer); // straight away, no new request
    expect(calls).toBe(asked);
    await vi.advanceTimersByTimeAsync(91_000);
    vi.stubGlobal("fetch", (_: string, init: { body: string }) =>
      Promise.resolve({ ok: true, status: 200, blob: async () => ({ text: (JSON.parse(init.body) as { text: string }).text }) }),
    );
    const later = speakNaturally(answer);
    await vi.runAllTimersAsync();
    expect(await later).toBe(""); // the natural voice is back
  });

  it("says nothing more once stopped", async () => {
    unlockAudio();
    const done = speakNaturally(answer);
    await vi.advanceTimersByTimeAsync(700);
    stopNaturalVoice();
    await vi.runAllTimersAsync();
    expect(await done).toBe("");
    expect(played.length).toBeLessThanOrEqual(1);
  });
});
