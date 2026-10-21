import { motion } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { CategoryLayout, SeatDef } from '@/data/layouts';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';

export type SeatState = 'available' | 'selected' | 'occupied' | 'reserved' | 'media';

const STATE_LABEL: Record<SeatState, string> = {
  available: 'available',
  selected: 'selected',
  occupied: 'already booked',
  reserved: 'reserved for offline booking',
  media: 'reserved for media',
};

interface SeatProps {
  seat: SeatDef;
  state: SeatState;
  disabled: boolean;
  size: number;
  onToggle: (id: string) => void;
  tabbable: boolean;
}

/** One seat. Plain button + CSS transitions keeps 500+ seats fast on phones. */
export const Seat = memo(function Seat({ seat, state, disabled, size, onToggle, tabbable }: SeatProps) {
  const clickable = !disabled && (state === 'available' || state === 'selected');
  const showNumber = size >= 22;
  return (
    <button
      type="button"
      data-seat={seat.id}
      tabIndex={tabbable ? 0 : -1}
      disabled={!clickable}
      aria-pressed={state === 'selected'}
      aria-label={`Row ${seat.row} seat ${seat.number}${seat.type ? `, ${seat.type} seat` : ''}, ${STATE_LABEL[state]}`}
      title={`${seat.row}${seat.number}${seat.type ? ` · ${seat.type}` : ''} · ${STATE_LABEL[state]}`}
      onClick={() => clickable && onToggle(seat.id)}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.36)) }}
      className={cn(
        'relative shrink-0 rounded-[28%] font-semibold tabular-nums leading-none transition-[transform,background-color,box-shadow,color] duration-150 ease-out',
        state === 'available' &&
          'bg-seat-free text-fg-muted ring-1 ring-inset ring-white/10 hover:-translate-y-0.5 hover:bg-ink-600 hover:text-fg active:scale-90',
        state === 'selected' && 'scale-105 bg-gradient-to-b from-saffron to-gold text-ink-950 shadow-[0_6px_18px_-6px_rgb(255_153_51/0.9)]',
        state === 'occupied' && 'bg-white/[0.04] text-transparent ring-1 ring-inset ring-white/[0.04]',
        state === 'reserved' && 'hatch bg-[#5c1320]/70 text-transparent',
        state === 'media' && 'hatch bg-warning/35 text-transparent',
        disabled && state === 'available' && 'cursor-not-allowed opacity-35 hover:translate-y-0 hover:bg-seat-free',
      )}
    >
      {/* Family / single member indicator bar (shape cue, not colour alone) */}
      {seat.type && state !== 'occupied' && state !== 'selected' && (
        <span
          aria-hidden
          className={cn(
            'absolute inset-x-[18%] bottom-[10%] h-[9%] rounded-full',
            seat.type === 'family' ? 'bg-seat-family' : 'bg-seat-single',
            state !== 'available' && 'opacity-40',
          )}
        />
      )}
      {state === 'occupied' ? (
        <svg viewBox="0 0 10 10" className="absolute inset-[30%] text-fg-subtle/60" aria-hidden>
          <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ) : (
        showNumber && <span className="relative -top-[4%]">{seat.number}</span>
      )}
    </button>
  );
});

function Screen() {
  return (
    <div className="relative mx-auto mb-8 w-[min(100%,560px)] pt-2" aria-hidden>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="h-8 w-full border-b-[3px] border-gold-soft/80"
        style={{
          borderBottomLeftRadius: '50% 100%',
          borderBottomRightRadius: '50% 100%',
          boxShadow: '0 18px 36px -10px rgb(243 212 147 / 0.35)',
        }}
      />
      <div className="absolute inset-x-[15%] top-10 h-16 bg-gradient-to-b from-gold-soft/15 to-transparent blur-xl" />
      <p className="mt-3 text-center font-display text-xs font-semibold uppercase tracking-[0.5em] text-fg-subtle">Screen this way</p>
    </div>
  );
}

export function SeatLegend({ types, showBlocked }: { types: string[]; showBlocked: boolean }) {
  const item = (cls: string, label: string, extra?: React.ReactNode) => (
    <li className="flex items-center gap-2">
      <span className={cn('relative grid size-5 place-items-center rounded-md', cls)} aria-hidden>
        {extra}
      </span>
      {label}
    </li>
  );
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-fg-muted" aria-label="Seat legend">
      {item('bg-seat-free ring-1 ring-inset ring-white/15', 'Available')}
      {item('bg-gradient-to-b from-saffron to-gold', 'Selected')}
      {item(
        'bg-white/[0.04] ring-1 ring-inset ring-white/10',
        'Booked',
        <svg viewBox="0 0 10 10" className="size-2.5 text-fg-subtle">
          <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" />
        </svg>,
      )}
      {types.includes('family') && item('bg-seat-free', 'Family member', <span className="absolute inset-x-1 bottom-0.5 h-0.5 rounded bg-seat-family" />)}
      {types.includes('single') && item('bg-seat-free', 'Single member', <span className="absolute inset-x-1 bottom-0.5 h-0.5 rounded bg-seat-single" />)}
      {showBlocked && item('hatch bg-[#5c1320]/70', 'Reserved (offline)')}
      {showBlocked && item('hatch bg-warning/35', 'Media')}
    </ul>
  );
}

interface SeatMapProps {
  category: CategoryLayout;
  occupied: Set<string>;
  selected: string[];
  onToggle: (id: string) => void;
  disabled?: boolean;
  vipSofas?: number;
}

const GAP = 5;
const LABEL_W = 22;

export function SeatMap({ category, occupied, selected, onToggle, disabled = false, vipSofas = 0 }: SeatMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [overview, setOverview] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);

  const cols = useMemo(
    () => Math.max(...category.rows.map((r) => r.items.reduce((n, it) => n + (it.kind === 'seat' ? 1 : 0.8), 0))),
    [category],
  );

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fit to width when possible; otherwise keep seats finger-sized and scroll sideways.
  const fitSize = width ? Math.floor((width - 2 * LABEL_W - 24 - cols * GAP) / cols) : 30;
  const coarse = useMediaQuery('(pointer: coarse)');
  const touchMin = coarse ? 28 : 18;
  const needsScroll = fitSize < touchMin;
  const size = overview ? Math.max(8, Math.min(fitSize, 34)) : Math.min(34, Math.max(fitSize, touchMin));

  // Centre the scroll position when the map is wider than the screen
  useEffect(() => {
    const el = wrapRef.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [category.key, size]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const stateOf = useCallback(
    (s: SeatDef): SeatState =>
      s.blocked ?? (selectedSet.has(s.id) ? 'selected' : occupied.has(s.id) ? 'occupied' : 'available'),
    [occupied, selectedSet],
  );

  const firstFocusable = useMemo(() => {
    for (const r of category.rows)
      for (const it of r.items) if (it.kind === 'seat' && stateOf(it.seat) === 'available') return it.seat.id;
    return null;
  }, [category, stateOf]);
  const activeFocus = focusId ?? selected[0] ?? firstFocusable;

  // Arrow-key navigation between seats (roving tabindex)
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    const target = e.target as HTMLElement;
    const id = target.dataset.seat;
    if (!id) return;
    e.preventDefault();
    const rows = [...(gridRef.current?.querySelectorAll<HTMLElement>('[data-row]') ?? [])];
    const rowIdx = rows.findIndex((r) => r.contains(target));
    const seatsIn = (i: number) => [...rows[i].querySelectorAll<HTMLButtonElement>('button[data-seat]')];
    let list = seatsIn(rowIdx);
    let idx = list.indexOf(target as HTMLButtonElement);
    if (e.key === 'ArrowLeft') idx = Math.max(0, idx - 1);
    if (e.key === 'ArrowRight') idx = Math.min(list.length - 1, idx + 1);
    if (e.key === 'Home') idx = 0;
    if (e.key === 'End') idx = list.length - 1;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const next = rowIdx + (e.key === 'ArrowUp' ? -1 : 1);
      if (next < 0 || next >= rows.length) return;
      const x = target.getBoundingClientRect().left;
      list = seatsIn(next);
      idx = list.reduce((best, b, i) => (Math.abs(b.getBoundingClientRect().left - x) < Math.abs(list[best].getBoundingClientRect().left - x) ? i : best), 0);
    }
    const nextEl = list[idx];
    if (nextEl) {
      setFocusId(nextEl.dataset.seat!);
      nextEl.focus({ preventScroll: false });
      nextEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };

  return (
    <div className="relative">
      {needsScroll && (
        <div className="mb-3 flex items-center justify-between gap-3 text-xs text-fg-subtle">
          <span>{overview ? 'Overview — zoom in to pick seats comfortably' : 'Swipe sideways to see the whole row'}</span>
          <button
            type="button"
            onClick={() => setOverview((o) => !o)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 font-medium text-fg ring-1 ring-white/10 hover:bg-white/5"
          >
            {overview ? <Maximize2 className="size-3.5" /> : <Minimize2 className="size-3.5" />}
            {overview ? 'Zoom in' : 'Fit hall'}
          </button>
        </div>
      )}
      <div ref={wrapRef} className="overflow-x-auto overscroll-x-contain pb-3 scrollbar-none [-webkit-overflow-scrolling:touch]">
        <div className="mx-auto w-max min-w-full px-3">
          <Screen />
          {vipSofas > 0 && (
            <div className="mb-6 flex items-center justify-center gap-2" aria-label={`VIP sofa row, ${vipSofas} sofas, not bookable online`}>
              <span className="font-display text-xs font-semibold uppercase tracking-widest text-gold">VIP</span>
              <div className="flex gap-1.5" aria-hidden>
                {Array.from({ length: vipSofas }).map((_, i) => (
                  <span key={i} className="h-3.5 rounded-md bg-gold/25 ring-1 ring-inset ring-gold/40" style={{ width: Math.max(12, size * 1.2) }} />
                ))}
              </div>
              <span className="text-[0.7rem] text-fg-subtle">not bookable</span>
            </div>
          )}
          <div
            ref={gridRef}
            role="group"
            aria-label={`${category.full} seats. Use arrow keys to move between seats.`}
            onKeyDown={onKeyDown}
            className="flex flex-col items-center"
            style={{ gap: Math.max(4, GAP + 1) }}
          >
            {category.rows.map((row, ri) => (
              <motion.div
                key={row.label}
                data-row={row.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ri * 0.035, duration: 0.3 }}
                className="flex items-center"
                style={{ gap: GAP }}
              >
                <span className="shrink-0 text-center text-xs font-semibold text-fg-subtle" style={{ width: LABEL_W }}>
                  {row.label}
                </span>
                {row.items.map((it) =>
                  it.kind === 'aisle' ? (
                    <span key={it.key} aria-hidden style={{ width: Math.round(size * 0.8) }} className="shrink-0" />
                  ) : (
                    <Seat
                      key={it.seat.id}
                      seat={it.seat}
                      size={size}
                      state={stateOf(it.seat)}
                      disabled={disabled}
                      onToggle={onToggle}
                      tabbable={it.seat.id === activeFocus}
                    />
                  ),
                )}
                <span className="shrink-0 text-center text-xs font-semibold text-fg-subtle" style={{ width: LABEL_W }}>
                  {row.label}
                </span>
              </motion.div>
            ))}
          </div>
          {category.types.length === 2 && (
            <p className="mt-4 text-center text-[0.7rem] uppercase tracking-widest text-fg-subtle">
              Seat 1 is on the right · {category.note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
