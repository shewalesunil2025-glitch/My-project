import { ArrowRight, CalendarDays, Clapperboard, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, formatDate, todayKey } from '@/lib/date';
import { api } from '@/services/api';
import type { Movie, Theatre } from '@/types';
import { Button } from '@/components/ui/Button';

const selectCls =
  'h-12 w-full appearance-none rounded-xl border border-white/10 bg-ink-950/70 pl-10 pr-3 text-[16px] text-fg focus:border-saffron/60 focus:outline-none focus:ring-2 focus:ring-saffron/20';

/** Movie → theatre → date in three taps, then straight to show selection. */
export function QuickBook({ movies }: { movies: Movie[] }) {
  const navigate = useNavigate();
  const nowShowing = movies.filter((m) => m.status === 'now_showing');
  const [movie, setMovie] = useState('');
  const [theatre, setTheatre] = useState('');
  const [date, setDate] = useState(todayKey());
  const [theatres, setTheatres] = useState<Theatre[]>([]);

  useEffect(() => {
    api.listTheatres().then((t) => setTheatres(t.filter((x) => x.active))).catch(() => setTheatres([]));
  }, []);
  useEffect(() => {
    if (!movie && nowShowing[0]) setMovie(nowShowing[0].slug);
  }, [movie, nowShowing]);

  const go = () => {
    const params = new URLSearchParams({ date });
    if (theatre) params.set('theatre', theatre);
    navigate(`/book/${movie}?${params}`);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (movie) go();
      }}
      className="glass rounded-3xl p-4 shadow-2xl sm:p-5"
      aria-label="Quick booking"
    >
      <p className="mb-3 text-sm font-semibold text-fg">Quick booking</p>
      <div className="grid gap-2.5 sm:grid-cols-3">
        <div className="relative">
          <label htmlFor="qb-movie" className="sr-only">Movie</label>
          <Clapperboard className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-saffron" aria-hidden />
          <select id="qb-movie" value={movie} onChange={(e) => setMovie(e.target.value)} className={selectCls}>
            {nowShowing.map((m) => (
              <option key={m.id} value={m.slug}>{m.title}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <label htmlFor="qb-theatre" className="sr-only">Theatre</label>
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-saffron" aria-hidden />
          <select id="qb-theatre" value={theatre} onChange={(e) => setTheatre(e.target.value)} className={selectCls}>
            <option value="">All theatres</option>
            {theatres.map((t) => (
              <option key={t.id} value={t.slug}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <label htmlFor="qb-date" className="sr-only">Date</label>
          <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-saffron" aria-hidden />
          <select id="qb-date" value={date} onChange={(e) => setDate(e.target.value)} className={selectCls}>
            {Array.from({ length: 7 }, (_, i) => addDays(todayKey(), i)).map((d, i) => (
              <option key={d} value={d}>
                {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatDate(d, { year: false })}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" size="lg" block className="mt-3" disabled={!movie}>
        Find shows <ArrowRight className="size-4" aria-hidden />
      </Button>
    </form>
  );
}
