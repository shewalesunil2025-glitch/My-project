import { motion } from 'framer-motion';
import { MONTH_SHORT, parseDateKey, relativeDayLabel } from '@/lib/date';
import { cn } from '@/lib/cn';

export interface DateOption {
  key: string;
  shows: number;
  /** Label for a day without shows, e.g. "Closed" */
  emptyLabel?: string;
}

export function DateSelector({ dates, value, onChange }: { dates: DateOption[]; value: string; onChange: (key: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Choose a date" className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:px-0">
      {dates.map((d) => {
        const date = parseDateKey(d.key);
        const active = d.key === value;
        const closed = d.shows === 0;
        return (
          <button
            key={d.key}
            role="radio"
            aria-checked={active}
            disabled={closed}
            onClick={() => onChange(d.key)}
            className={cn(
              'relative flex w-[4.5rem] shrink-0 snap-start flex-col items-center rounded-2xl border px-2 py-2.5 transition-colors',
              active ? 'border-transparent text-ink-950' : 'border-white/10 text-fg hover:border-saffron/40',
              closed && 'cursor-not-allowed opacity-40',
            )}
          >
            {active && (
              <motion.span
                layoutId="date-pill"
                className="absolute inset-0 -z-0 rounded-2xl bg-gradient-to-b from-saffron to-gold"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className={cn('relative text-[0.7rem] font-semibold uppercase tracking-wider', active ? 'text-ink-950/80' : 'text-fg-subtle')}>
              {relativeDayLabel(d.key)}
            </span>
            <span className="relative font-display text-2xl font-bold leading-tight">{date.getDate()}</span>
            <span className={cn('relative text-[0.7rem]', active ? 'text-ink-950/80' : 'text-fg-subtle')}>
              {closed ? (d.emptyLabel ?? 'No shows') : MONTH_SHORT[date.getMonth()]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
