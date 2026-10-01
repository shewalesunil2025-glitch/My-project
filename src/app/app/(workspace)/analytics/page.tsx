"use client";

import { useMemo, useState } from "react";
import { ChartColumn, Table2 } from "lucide-react";
import { deriveMetrics } from "@/lib/app/sample";
import type { DailyMetric } from "@/lib/app/types";
import { useWorkspace } from "@/components/app/AppShell";
import { BtnLink, Card, EmptyState, Field, Input, PageHeader, Segmented } from "@/components/app/ui";
import { cn } from "@/lib/cn";

type Period = "today" | "7" | "30" | "custom";
type Key = Exclude<keyof DailyMetric, "date">;

const metrics: { key: Key; label: string }[] = [
  { key: "leads", label: "Leads" },
  { key: "calls", label: "Calls" },
  { key: "messages", label: "Messages" },
  { key: "visitors", label: "Website visitors" },
  { key: "reach", label: "Social reach" },
  { key: "views", label: "Video views" },
  { key: "engagement", label: "Engagement" },
  { key: "reviews", label: "Reviews" },
  { key: "conversions", label: "Conversions" },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function AnalyticsPage() {
  const ws = useWorkspace();
  const [period, setPeriod] = useState<Period>("7");
  const [metric, setMetric] = useState<Key>("leads");
  const [view, setView] = useState<"chart" | "table">("chart");
  const [from, setFrom] = useState(() => iso(new Date(Date.now() - 13 * 86400_000)));
  const [to, setTo] = useState(() => iso(new Date()));
  const [hover, setHover] = useState<number | null>(null);

  const all = useMemo(() => (!ws ? [] : ws.metrics.length ? ws.metrics : ws.automations.length ? deriveMetrics(ws) : []), [ws]);
  const { current, previous } = useMemo(() => {
    if (period === "custom") {
      const cur = all.filter((m) => m.date >= from && m.date <= to);
      return { current: cur, previous: [] as DailyMetric[] };
    }
    const n = period === "today" ? 1 : Number(period);
    return { current: all.slice(-n), previous: all.slice(-2 * n, -n) };
  }, [all, period, from, to]);

  if (!ws) return null;

  if (!all.length) {
    return (
      <div>
        <PageHeader eyebrow="Analytics" title="Analytics" />
        <EmptyState icon={<ChartColumn className="size-5" aria-hidden />} title="Your numbers start with your first service" action={<BtnLink href="/app/services">Choose a service</BtnLink>}>
          Leads, calls, messages, website visitors, social reach, video views, reviews and conversions are tracked from the day a service goes live.
        </EmptyState>
      </div>
    );
  }

  const sum = (rows: DailyMetric[], k: Key) => rows.reduce((s, m) => s + m[k], 0);
  const selected = metrics.find((m) => m.key === metric)!;
  const max = Math.max(...current.map((m) => m[metric]), 1);
  const fmtDay = (d: string) => new Date(d + "T12:00:00").toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <div>
      <PageHeader eyebrow="Analytics" title="How your business is doing" subtitle={ws.sample ? "Sample data." : "Counted from your own calls, messages, leads, reviews and content. Website and social reach appear once those accounts report them."} />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Segmented
          label="Period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "today", label: "Today" },
            { value: "7", label: "7 Days" },
            { value: "30", label: "30 Days" },
            { value: "custom", label: "Custom" },
          ]}
        />
        {period === "custom" && (
          <div className="flex gap-2">
            <Field label="From" htmlFor="from">
              <Input id="from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="py-1.5 [color-scheme:dark]" />
            </Field>
            <Field label="To" htmlFor="to">
              <Input id="to" type="date" value={to} min={from} max={iso(new Date())} onChange={(e) => setTo(e.target.value)} className="py-1.5 [color-scheme:dark]" />
            </Field>
          </div>
        )}
      </div>

      <ul className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m) => {
          const cur = sum(current, m.key);
          const prev = sum(previous, m.key);
          const change = previous.length && prev ? Math.round(((cur - prev) / prev) * 100) : null;
          return (
            <li key={m.key}>
              <button
                type="button"
                onClick={() => setMetric(m.key)}
                aria-pressed={metric === m.key}
                className={cn("glass block w-full rounded-2xl p-4 text-left transition-colors hover:border-white/20", metric === m.key && "border-flow/50")}
              >
                <p className="text-xs font-medium text-fg-muted">{m.label}</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{cur.toLocaleString()}</p>
                {change !== null && (
                  <p className={cn("mt-1 text-xs", change >= 0 ? "text-emerald-300" : "text-red-300")}>
                    {change >= 0 ? "▲" : "▼"} {Math.abs(change)}% <span className="text-fg-subtle">vs previous</span>
                  </p>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">
            {selected.label} per day
            <span className="ml-2 text-sm font-normal text-fg-muted">{sum(current, metric).toLocaleString()} total</span>
          </h2>
          <Segmented
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: "chart", label: <ChartColumn className="size-4" aria-label="Chart" /> },
              { value: "table", label: <Table2 className="size-4" aria-label="Table" /> },
            ]}
          />
        </div>

        {current.length === 0 ? (
          <p className="py-10 text-center text-sm text-fg-muted">No data for this range.</p>
        ) : view === "chart" ? (
          <div className="relative">
            {/* Recessive gridlines */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-56" aria-hidden>
              {[0, 0.5, 1].map((t) => (
                <div key={t} className="absolute inset-x-0 border-t border-white/[0.06]" style={{ top: `${t * 100}%` }}>
                  <span className="absolute -top-2 right-0 bg-ink-850 pl-1 text-[0.65rem] text-fg-subtle tabular-nums">{Math.round(max * (1 - t))}</span>
                </div>
              ))}
            </div>
            <div className="flex h-56 items-end gap-[2px] pr-8" role="img" aria-label={`${selected.label} per day from ${fmtDay(current[0].date)} to ${fmtDay(current[current.length - 1].date)}. Use the table view for exact values.`} onMouseLeave={() => setHover(null)}>
              {current.map((m, i) => (
                <div key={m.date} className="relative flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)}>
                  <div
                    className={cn("w-full rounded-t-[4px] transition-colors", hover === null || hover === i ? "bg-flow" : "bg-flow/45")}
                    style={{ height: `${Math.max((m[metric] / max) * 100, m[metric] ? 2 : 0)}%` }}
                  />
                  {hover === i && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg border border-white/10 bg-ink-800 px-2.5 py-1.5 text-xs whitespace-nowrap shadow-xl">
                      <p className="text-fg-muted">{fmtDay(m.date)}</p>
                      <p className="font-semibold text-fg tabular-nums">
                        {m[metric].toLocaleString()} {selected.label.toLowerCase()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between pr-8 text-[0.7rem] text-fg-subtle">
              <span>{fmtDay(current[0].date)}</span>
              {current.length > 2 && <span>{fmtDay(current[Math.floor(current.length / 2)].date)}</span>}
              <span>{fmtDay(current[current.length - 1].date)}</span>
            </div>
          </div>
        ) : (
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-ink-850 text-left text-xs text-fg-muted">
                <tr>
                  <th className="py-2 font-medium">Date</th>
                  {metrics.map((m) => (
                    <th key={m.key} className="py-2 text-right font-medium">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {[...current].reverse().map((r) => (
                  <tr key={r.date} className="border-t border-white/[0.05]">
                    <td className="py-1.5 whitespace-nowrap text-fg-muted">{fmtDay(r.date)}</td>
                    {metrics.map((m) => (
                      <td key={m.key} className={cn("py-1.5 pl-3 text-right", m.key === metric && "font-semibold")}>
                        {r[m.key].toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 font-semibold">Campaign performance</h2>
        {ws.content.filter((c) => c.stats).length ? (
          <ul className="space-y-2 text-sm">
            {ws.content
              .filter((c) => c.stats)
              .map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.05] pb-2 last:border-0">
                  <span className="min-w-0 flex-1 truncate">{c.title}</span>
                  <span className="text-xs text-fg-muted tabular-nums">
                    {c.stats!.views.toLocaleString()} views · {c.stats!.likes} likes · {c.stats!.comments} comments
                  </span>
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-sm text-fg-muted">Published posts and videos show their performance here.</p>
        )}
      </Card>
    </div>
  );
}
