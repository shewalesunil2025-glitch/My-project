import { formatTime } from '@/lib/date';
import { cn } from '@/lib/cn';
import type { ShowWithRefs } from '@/types';

export function availabilityTone(show: Pick<ShowWithRefs, 'seatsAvailable' | 'seatsTotal'>) {
  const ratio = show.seatsTotal ? show.seatsAvailable / show.seatsTotal : 0;
  if (show.seatsAvailable === 0) return { label: 'Sold out', cls: 'text-fg-subtle', dot: 'bg-fg-subtle' };
  if (ratio < 0.2) return { label: 'Filling fast', cls: 'text-danger', dot: 'bg-danger' };
  if (ratio < 0.5) return { label: 'Selling', cls: 'text-warning', dot: 'bg-warning' };
  return { label: 'Available', cls: 'text-green', dot: 'bg-green' };
}

export function ShowTimeSelector({
  shows,
  selectedId,
  onSelect,
  showMovie,
}: {
  shows: ShowWithRefs[];
  selectedId?: string;
  onSelect: (show: ShowWithRefs) => void;
  showMovie?: boolean;
}) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Show timings">
      {shows.map((s) => {
        const tone = availabilityTone(s);
        const soldOut = s.seatsAvailable === 0;
        const active = s.id === selectedId;
        return (
          <li key={s.id}>
            <button
              onClick={() => onSelect(s)}
              disabled={soldOut}
              aria-pressed={active}
              aria-label={`${formatTime(s.time)}${showMovie ? `, ${s.movie.title}` : ''}, ${tone.label}, ${s.seatsAvailable} seats left`}
              className={cn(
                'group flex min-h-12 min-w-[6.5rem] flex-col items-start rounded-xl border px-3.5 py-2 text-left transition-all',
                active
                  ? 'border-saffron bg-saffron/15 shadow-glow'
                  : 'border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-saffron/50',
                soldOut && 'cursor-not-allowed opacity-50 hover:translate-y-0',
              )}
            >
              <span className="text-[0.95rem] font-semibold text-fg">{formatTime(s.time)}</span>
              {showMovie && <span className="max-w-36 truncate text-xs text-fg-muted">{s.movie.title}</span>}
              <span className={cn('flex items-center gap-1.5 text-[0.7rem] font-medium', tone.cls)}>
                <span className={cn('size-1.5 rounded-full', tone.dot)} aria-hidden />
                {soldOut ? 'Sold out' : `${s.seatsAvailable} left`}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
