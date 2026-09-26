import { CalendarDays, Clock, MapPin, Ticket } from 'lucide-react';
import type { ReactNode } from 'react';
import { CATEGORY_META, seatLabel } from '@/data/layouts';
import { formatDate, formatDuration, formatTime } from '@/lib/date';
import { formatINR } from '@/lib/format';
import type { Movie, RankCategory, Show, Theatre } from '@/types';
import { Poster } from '@/components/ui/Poster';

interface Props {
  movie: Movie;
  theatre: Theatre;
  show: Pick<Show, 'date' | 'time'>;
  category: RankCategory;
  seats: string[];
  unitPrice: number;
  fee: number;
  feeLabel?: string;
  children?: ReactNode;
}

export function BookingSummary({ movie, theatre, show, category, seats, unitPrice, fee, feeLabel = 'Booking fee', children }: Props) {
  const subtotal = unitPrice * seats.length;
  const total = subtotal + fee;
  return (
    <section aria-label="Booking summary" className="card overflow-hidden">
      <div className="flex gap-4 p-4 sm:p-5">
        <Poster movie={movie} className="w-20 shrink-0 rounded-xl sm:w-24" sizes="96px" />
        <div className="min-w-0 space-y-1.5">
          <h2 className="text-lg font-semibold leading-tight">{movie.title}</h2>
          <p className="text-xs text-fg-subtle">
            {movie.language} · {movie.certification} · {formatDuration(movie.durationMin)}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-fg-muted">
            <MapPin className="size-4 shrink-0 text-saffron" aria-hidden /> {theatre.name}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 text-saffron" aria-hidden /> {formatDate(show.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-saffron" aria-hidden /> {formatTime(show.time)}
            </span>
          </p>
        </div>
      </div>
      <div className="border-y border-dashed border-white/10 bg-ink-950/40 px-4 py-3 sm:px-5">
        <p className="text-xs uppercase tracking-wider text-fg-subtle">
          {CATEGORY_META[category].full} ({CATEGORY_META[category].name})
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {seats.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-lg bg-saffron/15 px-2.5 py-1 text-sm font-semibold text-saffron-soft">
              <Ticket className="size-3.5" aria-hidden />
              {seatLabel(s)}
            </span>
          ))}
        </div>
      </div>
      <dl className="space-y-2 px-4 py-4 text-sm sm:px-5">
        <div className="flex justify-between text-fg-muted">
          <dt>Ticket quantity</dt>
          <dd className="text-fg">{seats.length}</dd>
        </div>
        <div className="flex justify-between text-fg-muted">
          <dt>Ticket price</dt>
          <dd className="text-fg">
            {formatINR(unitPrice)} × {seats.length}
          </dd>
        </div>
        <div className="flex justify-between text-fg-muted">
          <dt>{feeLabel}</dt>
          <dd className={fee ? 'text-fg' : 'text-green'}>{fee ? formatINR(fee) : 'Waived'}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-white/[0.07] pt-3">
          <dt className="font-semibold">Total amount</dt>
          <dd className="font-display text-2xl font-bold text-gold-soft">{formatINR(total)}</dd>
        </div>
      </dl>
      {children}
    </section>
  );
}
