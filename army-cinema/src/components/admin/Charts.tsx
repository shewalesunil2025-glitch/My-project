import { useState } from 'react';
import { MONTH_SHORT, parseDateKey } from '@/lib/date';

/** Single-series mark colour — validated for the dark surface (OKLCH L 0.48–0.67, ≥3:1). */
const MARK = '#c96a1e';
const MARK_HOVER = '#dd7a26';

function niceMax(v: number) {
  if (v <= 5) return 5;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p) * p;
}

/** Column chart of bookings per day, with hover/focus tooltip and a table fallback. */
export function DailyBookingsChart({ data }: { data: { date: string; bookings: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const W = 640;
  const H = 220;
  const pad = { l: 34, r: 8, t: 12, b: 28 };
  const max = niceMax(Math.max(1, ...data.map((d) => d.bookings)));
  const band = (W - pad.l - pad.r) / data.length;
  const barW = Math.min(24, band - 2);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const ticks = [0, max / 2, max];

  return (
    <figure>
      <div className="flex items-baseline justify-between gap-3">
        <figcaption className="font-semibold">Bookings per day <span className="text-sm font-normal text-fg-subtle">· last 14 days</span></figcaption>
        <button className="text-xs text-fg-muted underline" onClick={() => setTable((t) => !t)}>
          {table ? 'Show chart' : 'Show table'}
        </button>
      </div>
      {table ? (
        <div className="mt-3 max-h-60 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-fg-subtle"><tr><th className="py-1">Date</th><th>Bookings</th></tr></thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.date} className="border-t border-white/[0.05]"><td className="py-1">{d.date}</td><td>{d.bookings}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-3">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Column chart of bookings per day for the last 14 days">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgb(255 255 255 / 0.07)" strokeWidth={1} />
                <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="fill-fg-subtle text-[10px]">{Math.round(t)}</text>
              </g>
            ))}
            {data.map((d, i) => {
              const x = pad.l + i * band + (band - barW) / 2;
              const top = y(d.bookings);
              const h = Math.max(0, H - pad.b - top);
              const r = Math.min(4, h);
              const date = parseDateKey(d.date);
              return (
                <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  {/* generous hit target */}
                  <rect x={pad.l + i * band} y={pad.t} width={band} height={H - pad.t - pad.b} fill="transparent" />
                  {h > 0 && (
                    <path
                      d={`M${x},${H - pad.b} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${H - pad.b} Z`}
                      fill={hover === i ? MARK_HOVER : MARK}
                    />
                  )}
                  {(i % 2 === 0 || data.length <= 8) && (
                    <text x={pad.l + i * band + band / 2} y={H - 10} textAnchor="middle" className="fill-fg-subtle text-[10px]">
                      {date.getDate()} {MONTH_SHORT[date.getMonth()]}
                    </text>
                  )}
                </g>
              );
            })}
            <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke="rgb(255 255 255 / 0.15)" />
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg bg-ink-700 px-2.5 py-1.5 text-xs shadow-xl ring-1 ring-white/10"
              style={{ left: `${((pad.l + hover * band + band / 2) / W) * 100}%` }}
            >
              <p className="font-semibold">{data[hover].date}</p>
              <p className="text-fg-muted">{data[hover].bookings} bookings</p>
            </div>
          )}
        </div>
      )}
    </figure>
  );
}

/** Horizontal bars (tickets per enclosure) with values at the tips. */
export function HorizontalBars({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <figure>
      <figcaption className="font-semibold">{title}</figcaption>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[88px_1fr] items-center gap-3 text-sm" title={`${r.label}: ${r.value}`}>
            <span className="truncate text-fg-muted">{r.label}</span>
            <span className="flex items-center gap-2">
              <span className="h-4 rounded-r-[4px]" style={{ width: `${Math.max(2, (r.value / max) * 85)}%`, background: MARK }} />
              <span className="tabular-nums text-fg">{r.value.toLocaleString('en-IN')}</span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
