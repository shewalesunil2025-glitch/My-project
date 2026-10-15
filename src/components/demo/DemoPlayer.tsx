"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { inTrial, isLive, TRIAL_DAYS, type ServiceDef } from "@/content/app/services";
import { useCurrency } from "@/components/cta/Money";
import { BtnLink, Icon } from "@/components/app/ui";
import { cn } from "@/lib/cn";
import { demoPrice, demoScenes, speechParts } from "./scenes";

const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";
/** How long a scene stays up without the voice (about the time it takes to read it out). */
const readTime = (text: string) => Math.max(4500, text.length * 62);

/**
 * A service's demo video: motion-graphic scenes of the app, narrated in IBAX's natural
 * (Gemini) voice, with captions, play/pause, chapters and a call to action at the end.
 */
export function DemoPlayer({ svc }: { svc: ServiceDef }) {
  const [cur] = useCurrency();
  const price = demoPrice(svc, cur);
  const scenes = useMemo(() => demoScenes(svc, price), [svc, price]);
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const scene = scenes[i];
  const last = i === scenes.length - 1;

  // Plays the current scene: the narration (all its parts), then moves on.
  useEffect(() => {
    if (!started || !playing) return;
    let cancelled = false;
    const startedAt = Date.now();
    const est = readTime(scene.say);
    const next = () => {
      if (cancelled) return;
      if (last) {
        setPlaying(false);
        setEnded(true);
      } else setI((v) => v + 1);
    };
    const finish = (spoke: boolean) => {
      // Without the voice, keep the scene up for its reading time.
      const wait = spoke ? 700 : Math.max(700, est - (Date.now() - startedAt));
      timer = window.setTimeout(next, wait);
    };
    let timer = 0;
    const speak = async () => {
      const a = audio.current;
      if (muted || !a) return finish(false);
      const parts = speechParts(scene.say).length;
      let spoke = false;
      for (let k = 0; k < parts && !cancelled; k++) {
        const ok = await new Promise<boolean>((resolve) => {
          a.onended = () => resolve(true);
          a.onerror = () => resolve(false);
          a.src = `/api/demo-voice?service=${svc.id}&cur=${cur}&scene=${i}&part=${k}`;
          a.play().catch(() => resolve(false));
        });
        if (!ok) break;
        spoke = true;
      }
      if (!cancelled) finish(spoke);
    };
    void speak();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (audio.current) {
        audio.current.onended = audio.current.onerror = null;
        audio.current.pause();
      }
    };
  }, [started, playing, i, muted, scene.say, last, svc.id, cur]);

  // Stop the voice when leaving the page.
  useEffect(() => () => audio.current?.pause(), []);

  function start() {
    audio.current ??= new Audio();
    audio.current.src = SILENCE; // a tap lets the voice play on iPhone
    void audio.current.play().catch(() => {});
    setStarted(true);
    setEnded(false);
    setPlaying(true);
  }
  const go = (k: number) => {
    setI(Math.max(0, Math.min(scenes.length - 1, k)));
    setEnded(false);
  };

  const trial = inTrial(svc.id) && isLive(svc.id);
  const cta = isLive(svc.id) ? (trial ? `Start ${TRIAL_DAYS}-day free trial` : `Get ${svc.name}`) : "Join the waitlist";

  return (
    <div className="space-y-4">
      {/* Stage */}
      <div data-stage className="relative overflow-hidden rounded-[1.75rem] border border-flow/25 bg-ink-950 shadow-[0_40px_120px_-50px_rgb(102_211_76/0.6)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_80%_at_85%_10%,rgb(102_211_76/0.22),transparent_60%),radial-gradient(50%_70%_at_0%_100%,rgb(56_189_248/0.14),transparent_60%)]" />
        <div aria-hidden className="grid-backdrop pointer-events-none absolute inset-0 opacity-20" />

        <div key={started ? i : "poster"} className="relative grid min-h-[34rem] items-center gap-6 p-5 sm:p-8 lg:min-h-[30rem] lg:grid-cols-[1fr_auto]">
          {/* Words */}
          <div className="order-2 lg:order-1">
            <p className="font-mono text-[0.65rem] tracking-[0.2em] text-flow uppercase">
              {svc.name} · {started ? `${i + 1}/${scenes.length}` : "Demo video"}
            </p>
            <h2 className="display mt-2 animate-[dialog-in_0.6s_var(--ease-out-expo)] text-3xl sm:text-5xl">{started ? scene.title : svc.name}</h2>
            <p className="mt-3 max-w-xl animate-[dialog-in_0.8s_var(--ease-out-expo)] text-sm leading-relaxed text-fg-muted sm:text-base">{started ? scene.say : svc.short}</p>
            {(!started || i === 0 || last) && (
              <span className="mt-4 inline-flex rounded-full bg-flow/15 px-3 py-1 text-sm font-semibold text-flow">
                {price}
                {trial && ` · ${TRIAL_DAYS} days free`}
              </span>
            )}
          </div>

          {/* Phone */}
          <div className="order-1 mx-auto w-[15.5rem] shrink-0 rounded-[2.4rem] border border-white/12 bg-ink-900 p-2.5 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9),0_0_60px_-25px_rgb(102_211_76/0.6)] lg:order-2">
            <div className="mx-auto mb-1.5 h-1.5 w-14 rounded-full bg-white/10" />
            <div className="relative h-[27rem] overflow-hidden rounded-[1.9rem] bg-ink-950">
              {started && scene.picture ? (
                <div className="h-full animate-[demo-ken_1.2s_var(--ease-out-expo)] p-3">{scene.picture}</div>
              ) : (
                <div className="grid h-full place-items-center p-4 text-center">
                  <div className="animate-[dialog-in_0.7s_var(--ease-out-expo)]">
                    <span className="relative mx-auto grid size-20 place-items-center rounded-3xl bg-flow text-ink-950 shadow-[0_0_60px_-10px_rgb(102_211_76/0.9)]">
                      <Icon name={svc.icon} className="size-10" />
                    </span>
                    <p className="mt-4 font-semibold">{svc.name}</p>
                    <p className="mt-1 text-xs text-fg-muted">{started ? scene.title : "Just say it. IBAX does it."}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Big play button before it starts / after it ends */}
        {(!started || ended) && (
          <button type="button" onClick={start} aria-label={ended ? "Watch again" : `Play the ${svc.name} demo`} className="absolute inset-0 z-20 grid place-items-center bg-black/35 backdrop-blur-[1px]">
            <span className="flex items-center gap-3 rounded-full bg-flow px-6 py-3.5 text-base font-semibold text-ink-950 shadow-[0_14px_50px_-10px_rgb(102_211_76/0.95)]">
              {ended ? <RotateCcw className="size-5" aria-hidden /> : <Play className="size-5 fill-current" aria-hidden />}
              {ended ? "Watch again" : "Play demo"}
            </span>
          </button>
        )}

        {/* Progress */}
        <div className="relative flex gap-1 px-5 pb-4 sm:px-8">
          {scenes.map((s, k) => (
            <button key={k} type="button" onClick={() => (started ? go(k) : start())} aria-label={`Go to: ${s.title}`} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <span className={cn("block h-full rounded-full bg-flow", k < i || (k === i && ended) ? "w-full" : k === i && started ? "w-1/2 animate-pulse" : "w-0")} />
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => go(i - 1)} disabled={!started || i === 0} aria-label="Previous" className="grid size-10 place-items-center rounded-full border border-white/10 disabled:opacity-40">
          <ArrowLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => (!started || ended ? start() : setPlaying((p) => !p))}
          aria-label={playing ? "Pause" : "Play"}
          className="grid size-12 place-items-center rounded-full bg-flow text-ink-950"
        >
          {playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5 fill-current" aria-hidden />}
        </button>
        <button type="button" onClick={() => go(i + 1)} disabled={!started || last} aria-label="Next" className="grid size-10 place-items-center rounded-full border border-white/10 disabled:opacity-40">
          <ArrowRight className="size-4" aria-hidden />
        </button>
        <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Turn voice on" : "Turn voice off"} className="grid size-10 place-items-center rounded-full border border-white/10">
          {muted ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
        </button>
        <div className="ml-auto flex flex-wrap gap-2">
          <BtnLink href={`/app/services/${svc.id}`}>{cta}</BtnLink>
          <BtnLink href="/app/demo" variant="ghost">
            All demos
          </BtnLink>
        </div>
      </div>

      {/* Chapters */}
      <ol className="flex flex-wrap gap-1.5" aria-label="Chapters">
        {scenes.map((s, k) => (
          <li key={k}>
            <button
              type="button"
              onClick={() => (started ? go(k) : (start(), go(k)))}
              aria-current={started && k === i ? "step" : undefined}
              className={cn("h-8 rounded-full border px-3 text-xs transition-colors", started && k === i ? "border-flow/50 bg-flow/15 text-fg" : "border-white/[0.08] text-fg-muted hover:text-fg")}
            >
              {s.title}
            </button>
          </li>
        ))}
      </ol>
      <p className="text-xs text-fg-subtle">
        <Link href="/app/demo" className="underline">
          More demo videos
        </Link>{" "}
        · Voice by IBAX
      </p>
    </div>
  );
}
