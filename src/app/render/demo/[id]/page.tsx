"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { serviceById } from "@/content/app/services";
import { demoLangs, demoScript, demoServices, type DemoMode } from "@/content/demoScripts";
import { Film } from "@/components/demo/Film";
import { spoken } from "@/content/tourScript";

/**
 * Renders demo-video frames for scripts/demo-videos.mjs (not for people): the page shows
 * one frame of /app/demo videos at a time, set from the script with window.__setT(t).
 */
function Frame() {
  const { id } = useParams<{ id: string }>();
  const q = useSearchParams();
  const svc = serviceById(id);
  const mode: DemoMode = q.get("mode") === "manual" ? "manual" : "talk";
  const durations = (q.get("d") ?? "3,3,3,3,3,3,3").split(",").map(Number);
  const [t, setT] = useState(Number(q.get("t") ?? 0));

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__setT = (x: number) => flushSync(() => setT(x));
    // The narration as it should be spoken (brand names spelled the way they sound).
    if (svc) w.__scripts = Object.fromEntries(demoLangs.map((l) => [l.code, demoScript(svc, mode, l.code).map((p) => spoken(l.code, p))]));
    w.__services = demoServices.map((s) => s.id);
    w.__ready = true;
  }, [svc, mode]);

  if (!svc) return null;
  return (
    <div style={{ width: 360, height: 640 }}>
      <Film svc={svc} mode={mode} durations={durations} t={t} />
    </div>
  );
}

export default function RenderDemoPage() {
  return (
    <Suspense>
      <Frame />
    </Suspense>
  );
}
