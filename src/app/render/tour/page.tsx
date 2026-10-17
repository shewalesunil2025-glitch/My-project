"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { tourParts, tourScript } from "@/content/tourScript";
import { TourFilm } from "@/components/demo/TourFilm";

/** Renders frames of "ibaxai in 2 minutes" for scripts/tour-video.mjs (not for people). */
function Frame() {
  const q = useSearchParams();
  const durations = (q.get("d") ?? tourParts.map(() => 4).join(",")).split(",").map(Number);
  const [t, setT] = useState(Number(q.get("t") ?? 0));
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__setT = (x: number) => flushSync(() => setT(x));
    w.__parts = tourParts;
    w.__scripts = tourScript;
    w.__ready = true;
  }, []);
  return (
    <div style={{ width: 360, height: 640 }}>
      <TourFilm durations={durations} t={t} />
    </div>
  );
}

export default function RenderTourPage() {
  return (
    <Suspense>
      <Frame />
    </Suspense>
  );
}
