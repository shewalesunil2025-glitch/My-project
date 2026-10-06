"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";

/** Tiny single-series trend line for a stat tile. Decorative: the tile states the value. */
export function Sparkline({ values, className, label }: { values: number[]; className?: string; label: string }) {
  const id = `spark-${useId().replace(/:/g, "")}`;
  if (values.length < 2) return null;
  const w = 100;
  const h = 32;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - (v / max) * (h - 6)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("h-8 w-full", className)} role="img" aria-label={label}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#66d34c" stopOpacity="0.35" />
          <stop offset="1" stopColor="#66d34c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w} ${h} L0 ${h}Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="#8be860" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Single-series area chart with a hover crosshair and tooltip. */
export function AreaChart({ data, unit, className }: { data: { date: string; value: number }[]; unit: string; className?: string }) {
  const id = `area-${useId().replace(/:/g, "")}`;
  const [hover, setHover] = useState<number | null>(null);
  if (data.length < 2) return null;
  const w = 600;
  const h = 180;
  const pad = { t: 12, b: 4 };
  const max = Math.max(...data.map((d) => d.value), 1);
  const x = (i: number) => (i / (data.length - 1)) * w;
  const y = (v: number) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(" ");
  const fmt = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString([], { day: "numeric", month: "short" });
  const active = hover === null ? null : data[hover];

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-40 w-full overflow-visible"
        role="img"
        aria-label={`${unit} per day: ${data.map((d) => `${fmt(d.date)} ${d.value}`).join(", ")}`}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const i = Math.round(((e.clientX - box.left) / box.width) * (data.length - 1));
          setHover(Math.max(0, Math.min(data.length - 1, i)));
        }}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#66d34c" stopOpacity="0.32" />
            <stop offset="1" stopColor="#66d34c" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={w} y1={pad.t + f * (h - pad.t - pad.b)} y2={pad.t + f * (h - pad.t - pad.b)} stroke="rgb(255 255 255 / 0.06)" strokeDasharray="3 5" />
        ))}
        <line x1="0" x2={w} y1={h - pad.b} y2={h - pad.b} stroke="rgb(255 255 255 / 0.12)" />
        <path d={`${line} L${w} ${h - pad.b} L0 ${h - pad.b}Z`} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke="#8be860" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={h - pad.b} stroke="rgb(255 255 255 / 0.25)" vectorEffect="non-scaling-stroke" />
            <circle cx={x(hover)} cy={y(data[hover].value)} r="5" fill="#8be860" stroke="#030703" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
      <div className="mt-1 flex justify-between text-[0.7rem] text-fg-subtle">
        <span>{fmt(data[0].date)}</span>
        <span>{fmt(data[data.length - 1].date)}</span>
      </div>
      {active && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-white/10 bg-ink-900/95 px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg"
          style={{ left: `${Math.min(88, Math.max(12, (hover / (data.length - 1)) * 100))}%` }}
        >
          <p className="text-fg-muted">{fmt(active.date)}</p>
          <p className="font-semibold text-fg tabular-nums">
            {active.value} {unit}
          </p>
        </div>
      )}
    </div>
  );
}
