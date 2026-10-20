"use client";

import { useEffect, useRef, useState } from "react";
import { Hand, Languages, Pause, Play, RotateCcw, RotateCw, Sparkles } from "lucide-react";
import type { ServiceDef } from "@/content/app/services";
import { demoLangs, demoTagline, type DemoLang, type DemoMode } from "@/content/demoScripts";
import { cn } from "@/lib/cn";

type Manifest = Record<string, Partial<Record<DemoMode, { duration: number; langs: string[] }>>>;
const LANG_KEY = "ibaxai-demo-lang";
const clock = (secs: number) => `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, "0")}`;

/**
 * A service's demo video: one MP4 per language, with IBAX's narration inside.
 * Under the video: play/pause, back/forward 10 seconds and a seek bar, then three choices:
 * Just say it, Manually, Language.
 */
export function DemoVideo({ svc, id }: { svc?: ServiceDef; id?: string }) {
  // A service's two videos, or (with only `id`) one video such as the app tour.
  const vid = id ?? svc?.id ?? "";
  const single = !svc;
  const [mode, setMode] = useState<DemoMode>("talk");
  const [lang, setLang] = useState<DemoLang>("en");
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const resume = useRef(false);
  const startAt = useRef(0);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(LANG_KEY);
    } catch {
      /* private mode */
    }
    fetch("/demo/manifest.json")
      .then((r) => r.json() as Promise<Manifest>)
      .catch(() => ({}) as Manifest)
      .then((m) => {
        setManifest(m);
        const code = demoLangs.find((l) => l.code === saved)?.code;
        if (code) setLang(code);
      });
  }, []);

  const info = manifest?.[vid]?.[mode];
  const langs = demoLangs.filter((l) => !info || info.langs.includes(l.code));
  const voice = info && !info.langs.includes(lang) ? "en" : lang;
  const base = `/demo`;

  // The voice is inside each language's MP4, so there's nothing to keep in step.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const onPlay = () => {
      setPlaying(true);
      setEnded(false);
    };
    const onPause = () => setPlaying(false);
    const onTime = () => {
      setTime(v.currentTime);
      if (v.duration) setLength(v.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setEnded(true);
    };
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onTime);
    v.addEventListener("ended", onEnd);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onTime);
      v.removeEventListener("ended", onEnd);
    };
  }, [mode, voice]);

  // After switching video or language, carry on (from the same moment for a new language).
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const at = startAt.current;
    startAt.current = 0;
    if (at) v.currentTime = at;
    if (!resume.current) return;
    resume.current = false;
    void v.play().catch(() => {});
  }, [mode, voice]);

  function toggle() {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      if (v.ended) v.currentTime = 0;
      void v.play().catch(() => {});
    } else v.pause();
  }
  /** Jump to a moment (seconds), e.g. back 10 s to hear a point again. */
  function seekTo(at: number) {
    const v = video.current;
    if (!v) return;
    const end = v.duration || length;
    v.currentTime = Math.min(Math.max(0, at), end ? end - 0.05 : at);
    setTime(v.currentTime);
    if (v.currentTime < end - 0.1) setEnded(false);
  }
  function pick(next: DemoMode) {
    if (next === mode) {
      const v = video.current;
      if (v) {
        v.currentTime = 0;
        void v.play().catch(() => {});
      }
      return;
    }
    resume.current = true;
    setMode(next);
    setTime(0);
    setEnded(false);
  }
  function chooseLang(code: DemoLang) {
    const v = video.current;
    resume.current = Boolean(v && !v.paused);
    startAt.current = v?.currentTime ?? 0;
    setLang(code);
    try {
      localStorage.setItem(LANG_KEY, code);
    } catch {
      /* private mode */
    }
  }

  const has = (m: DemoMode) => !manifest || Boolean(manifest[vid]?.[m]);
  if (manifest && !manifest[vid]) {
    return <p className="mx-auto mt-10 max-w-sm rounded-2xl border border-white/10 p-6 text-center text-sm text-fg-muted">This demo video is coming soon.</p>;
  }

  return (
    <div className="mx-auto w-full max-w-[26rem]">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-flow/25 bg-ink-950 shadow-[0_40px_120px_-40px_rgb(102_211_76/0.55)]">
        <video
          key={`${mode}-${voice}`}
          ref={video}
          src={single ? `${base}/video/${vid}-${voice}.mp4` : `${base}/video/${vid}-${mode}-${voice}.mp4`}
          poster={single ? `${base}/poster/${vid}.jpg` : `${base}/poster/${vid}-${mode}.jpg`}
          playsInline
          preload="auto"
          onClick={toggle}
          className="block aspect-[9/16] w-full cursor-pointer bg-ink-950 object-cover"
        />

        {/* The tagline in the chosen language, as the video opens. */}
        {voice !== "en" && playing && time < 3.4 && (
          <p className="pointer-events-none absolute inset-x-6 bottom-16 rounded-2xl bg-black/55 px-4 py-2.5 text-center text-base font-semibold text-white backdrop-blur-sm">{demoTagline(voice)}</p>
        )}

        {!playing && (
          <button type="button" onClick={toggle} aria-label={ended ? "Watch again" : "Play"} className="absolute inset-0 grid place-items-center bg-black/30">
            <span className="grid size-20 place-items-center rounded-full bg-flow text-ink-950 shadow-[0_14px_50px_-8px_rgb(102_211_76/0.95)]">
              {ended ? <RotateCcw className="size-8" aria-hidden /> : <Play className="ml-1 size-9 fill-current" aria-hidden />}
            </span>
          </button>
        )}

      </div>

      {/* Controls: play/pause, back/forward 10 s and a seek bar to hear any point again. */}
      <div className="mt-3 rounded-2xl border border-white/12 px-3 pt-2.5 pb-2">
        <input
          type="range"
          min={0}
          max={(length || info?.duration || 0) || 1}
          step={0.1}
          value={Math.min(time, (length || info?.duration || 0) || 0)}
          onChange={(e) => seekTo(Number(e.target.value))}
          aria-label="Seek"
          className="block h-6 w-full cursor-pointer accent-[#25d366]"
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="w-12 font-mono text-xs text-fg-muted tabular-nums">{clock(time)}</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => seekTo(time - 10)} aria-label="Back 10 seconds" className="relative grid size-11 place-items-center rounded-full text-fg hover:bg-white/[0.06]">
              <RotateCcw className="size-6" aria-hidden />
              <span className="absolute text-[0.55rem] font-bold">10</span>
            </button>
            <button type="button" onClick={toggle} aria-label={playing ? "Pause" : ended ? "Watch again" : "Play"} className="grid size-12 place-items-center rounded-full bg-flow text-ink-950">
              {playing ? <Pause className="size-5 fill-current" aria-hidden /> : ended ? <RotateCcw className="size-5" aria-hidden /> : <Play className="ml-0.5 size-5 fill-current" aria-hidden />}
            </button>
            <button type="button" onClick={() => seekTo(time + 10)} aria-label="Forward 10 seconds" className="relative grid size-11 place-items-center rounded-full text-fg hover:bg-white/[0.06]">
              <RotateCw className="size-6" aria-hidden />
              <span className="absolute text-[0.55rem] font-bold">10</span>
            </button>
          </div>
          <span className="w-12 text-right font-mono text-xs text-fg-muted tabular-nums">{clock((length || info?.duration || 0))}</span>
        </div>
      </div>

      {/* The only three choices */}
      <div className={cn("mt-4 grid grid-cols-2 gap-2", single && "hidden")}>
        <button
          type="button"
          onClick={() => pick("talk")}
          disabled={!has("talk")}
          aria-pressed={mode === "talk"}
          className={cn("flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition-colors disabled:opacity-40", mode === "talk" ? "border-flow bg-flow text-ink-950" : "border-white/12 text-fg hover:border-flow/50")}
        >
          <Sparkles className="size-4 shrink-0" aria-hidden />
          <span className="leading-tight">Just say it. IBAX does it.</span>
        </button>
        <button
          type="button"
          onClick={() => pick("manual")}
          disabled={!has("manual")}
          aria-pressed={mode === "manual"}
          className={cn("flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition-colors disabled:opacity-40", mode === "manual" ? "border-flow bg-flow text-ink-950" : "border-white/12 text-fg hover:border-flow/50")}
        >
          <Hand className="size-4 shrink-0" aria-hidden />
          Manually
        </button>
      </div>
      <label className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl border border-white/12 px-3">
        <Languages className="size-4 shrink-0 text-flow" aria-hidden />
        <span className="sr-only">Language</span>
        <select value={voice} onChange={(e) => chooseLang(e.target.value as DemoLang)} className="h-12 w-full bg-transparent text-sm font-semibold text-fg focus:outline-none">
          {langs.map((l) => (
            <option key={l.code} value={l.code} className="bg-ink-900">
              {l.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
