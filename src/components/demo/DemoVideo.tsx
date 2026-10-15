"use client";

import { useEffect, useRef, useState } from "react";
import { Hand, Languages, Play, RotateCcw, Sparkles } from "lucide-react";
import type { ServiceDef } from "@/content/app/services";
import { demoLangs, demoTagline, type DemoLang, type DemoMode } from "@/content/demoScripts";
import { cn } from "@/lib/cn";

type Manifest = Record<string, Partial<Record<DemoMode, { duration: number; langs: string[] }>>>;
const LANG_KEY = "ibaxai-demo-lang";

/**
 * A service's demo video (MP4) with IBAX's narration in the chosen language. The picture is
 * the same in every language; the voice is a separate track kept in step with it.
 * Below the video there are only three choices: Just say it, Manually, Language.
 */
export function DemoVideo({ svc }: { svc: ServiceDef }) {
  const [mode, setMode] = useState<DemoMode>("talk");
  const [lang, setLang] = useState<DemoLang>("en");
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const resume = useRef(false);

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

  const info = manifest?.[svc.id]?.[mode];
  const langs = demoLangs.filter((l) => !info || info.langs.includes(l.code));
  const voice = info && !info.langs.includes(lang) ? "en" : lang;
  const base = `/demo`;

  // Keep the voice in step with the picture.
  useEffect(() => {
    const v = video.current;
    const a = audio.current;
    if (!v || !a) return;
    const sync = () => {
      if (Math.abs(a.currentTime - v.currentTime) > 0.25) a.currentTime = v.currentTime;
    };
    const onPlay = () => {
      a.currentTime = v.currentTime;
      void a.play().catch(() => {});
      setPlaying(true);
      setEnded(false);
    };
    const onPause = () => {
      a.pause();
      setPlaying(false);
    };
    const onTime = () => {
      setTime(v.currentTime);
      setProgress(v.duration ? v.currentTime / v.duration : 0);
      if (!v.paused) sync();
    };
    const onEnd = () => {
      a.pause();
      setPlaying(false);
      setEnded(true);
    };
    const onSeek = () => (a.currentTime = v.currentTime);
    const onWait = () => a.pause();
    const onResume = () => !v.paused && void a.play().catch(() => {});
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnd);
    v.addEventListener("seeked", onSeek);
    v.addEventListener("waiting", onWait);
    v.addEventListener("playing", onResume);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnd);
      v.removeEventListener("seeked", onSeek);
      v.removeEventListener("waiting", onWait);
      v.removeEventListener("playing", onResume);
    };
  }, [mode, voice]);

  // After switching video or language, carry on playing if it was playing.
  useEffect(() => {
    const v = video.current;
    if (!v || !resume.current) return;
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
    setProgress(0);
    setEnded(false);
  }
  function chooseLang(code: DemoLang) {
    const v = video.current;
    resume.current = Boolean(v && !v.paused);
    const at = v?.currentTime ?? 0;
    setLang(code);
    try {
      localStorage.setItem(LANG_KEY, code);
    } catch {
      /* private mode */
    }
    // The new voice starts where the picture is.
    requestAnimationFrame(() => {
      if (audio.current) audio.current.currentTime = at;
    });
  }

  const has = (m: DemoMode) => !manifest || Boolean(manifest[svc.id]?.[m]);
  if (manifest && !manifest[svc.id]) {
    return <p className="mx-auto mt-10 max-w-sm rounded-2xl border border-white/10 p-6 text-center text-sm text-fg-muted">This demo video is coming soon.</p>;
  }

  return (
    <div className="mx-auto w-full max-w-[26rem]">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-flow/25 bg-ink-950 shadow-[0_40px_120px_-40px_rgb(102_211_76/0.55)]">
        <video
          key={mode}
          ref={video}
          src={`${base}/video/${svc.id}-${mode}.mp4`}
          poster={`${base}/poster/${svc.id}-${mode}.jpg`}
          playsInline
          muted
          preload="auto"
          onClick={toggle}
          className="block aspect-[9/16] w-full cursor-pointer bg-ink-950 object-cover"
        />
        <audio key={`${mode}-${voice}`} ref={audio} src={`${base}/audio/${svc.id}-${mode}-${voice}.m4a`} preload="auto" />

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

        {/* Progress (tap to jump) */}
        <button
          type="button"
          aria-label="Seek"
          onClick={(e) => {
            const v = video.current;
            if (!v?.duration) return;
            const r = e.currentTarget.getBoundingClientRect();
            v.currentTime = ((e.clientX - r.left) / r.width) * v.duration;
          }}
          className="absolute inset-x-0 bottom-0 h-4"
        >
          <span className="absolute inset-x-0 bottom-0 h-1 bg-white/15">
            <span className="block h-full bg-flow" style={{ width: `${progress * 100}%` }} />
          </span>
        </button>
      </div>

      {/* The only three choices */}
      <div className="mt-4 grid grid-cols-2 gap-2">
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
