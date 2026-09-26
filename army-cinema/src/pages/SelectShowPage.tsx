import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { addDays, formatDate, formatDuration, todayKey, weekEndKey, weekStartKey } from '@/lib/date';
import { cn } from '@/lib/cn';
import { usePageMeta } from '@/lib/seo';
import { api } from '@/services/api';
import type { ShowWithRefs } from '@/types';
import { DateSelector } from '@/components/booking/DateSelector';
import { ShowTimeSelector } from '@/components/booking/ShowTimeSelector';
import { TheatreCard } from '@/components/booking/TheatreCard';
import { ButtonLink } from '@/components/ui/Button';
import { Poster } from '@/components/ui/Poster';
import { Stepper } from '@/components/ui/Stepper';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

export default function SelectShowPage() {
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const movie = useAsync(() => api.getMovieBySlug(slug), [slug]);
  const m = movie.data;
  const shows = useAsync(() => (m ? api.listShows({ movieId: m.id, from: todayKey(), to: addDays(todayKey(), 6) }) : Promise.resolve([])), [m?.id]);
  const theatres = useAsync(() => api.listTheatres(), []);
  usePageMeta(m ? `Book ${m.title}` : 'Select show', 'Choose a date, theatre and show time.');

  const theatreSlug = params.get('theatre') ?? '';
  const dates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => addDays(todayKey(), i)).map((key) => ({
        key,
        shows: shows.data?.filter((s) => s.date === key && (!theatreSlug || s.theatre.slug === theatreSlug)).length ?? 0,
      })),
    [shows.data, theatreSlug],
  );
  const requested = params.get('date');
  const activeDate =
    requested && dates.some((d) => d.key === requested && d.shows > 0) ? requested : (dates.find((d) => d.shows > 0)?.key ?? requested ?? todayKey());
  const [selected, setSelected] = useState<string>();

  const weekly = useAsync(() => (user ? api.weeklyBookingFor(activeDate) : Promise.resolve(null)), [user?.id, weekStartKey(activeDate)]);

  const grouped = useMemo(() => {
    const map = new Map<string, ShowWithRefs[]>();
    shows.data
      ?.filter((s) => s.date === activeDate && (!theatreSlug || s.theatre.slug === theatreSlug))
      .forEach((s) => map.set(s.theatreId, [...(map.get(s.theatreId) ?? []), s]));
    return [...map.values()];
  }, [shows.data, activeDate, theatreSlug]);

  const update = (key: string, value: string) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    setParams(p, { replace: true });
  };

  const choose = (s: ShowWithRefs) => {
    setSelected(s.id);
    navigate(`/book/show/${s.id}/seats`);
  };

  if (movie.loading && !m) return <LoadingState className="min-h-[60vh]" />;
  if (movie.error) return <div className="container-page py-10"><ErrorState error={movie.error} onRetry={movie.reload} /></div>;
  if (!m) return <div className="container-page py-10"><EmptyState title="Movie not found" action={<ButtonLink to="/movies">Browse movies</ButtonLink>} /></div>;

  return (
    <div className="container-page py-5 sm:py-8">
      <Stepper current={0} />
      <div className="mt-5 flex items-center gap-4">
        <Link to={`/movies/${m.slug}`} className="grid size-10 shrink-0 place-items-center rounded-xl ring-1 ring-white/10 hover:bg-white/5" aria-label="Back to movie details">
          <ArrowLeft className="size-4" />
        </Link>
        <Poster movie={m} className="w-12 shrink-0 rounded-lg" sizes="48px" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold sm:text-2xl">{m.title}</h1>
          <p className="text-xs text-fg-subtle">
            {m.language} · {m.certification} · {formatDuration(m.durationMin)} · {m.genres.join(', ')}
          </p>
        </div>
      </div>

      <section className="mt-6" aria-labelledby="date-label">
        <h2 id="date-label" className="mb-3 text-sm font-semibold text-fg-muted">Select date</h2>
        <DateSelector dates={dates} value={activeDate} onChange={(d) => update('date', d)} />
      </section>

      <section className="mt-5" aria-labelledby="theatre-label">
        <h2 id="theatre-label" className="mb-3 text-sm font-semibold text-fg-muted">Theatre</h2>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
          {[{ slug: '', name: 'All theatres' }, ...(theatres.data?.filter((t) => t.active) ?? [])].map((t) => (
            <button
              key={t.slug}
              onClick={() => update('theatre', t.slug)}
              aria-pressed={theatreSlug === t.slug}
              className={cn(
                'h-10 shrink-0 rounded-full px-4 text-sm font-medium ring-1 ring-inset',
                theatreSlug === t.slug ? 'bg-saffron/15 text-saffron-soft ring-saffron/40' : 'text-fg-muted ring-white/10 hover:text-fg',
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      {weekly.data && (
        <div role="alert" className="mt-5 flex gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="size-5 shrink-0 text-warning" aria-hidden />
          <div>
            <p className="font-semibold text-fg">You already have a booking this week</p>
            <p className="mt-0.5 text-fg-muted">
              {weekly.data.code} · {weekly.data.movie.title} on {formatDate(weekly.data.show.date)}. Only one booking per mobile number is allowed per
              week ({formatDate(weekStartKey(activeDate), { year: false })} – {formatDate(weekEndKey(activeDate), { year: false })}). Pick a date in another
              week, or <Link to="/my-bookings" className="text-saffron-soft underline">manage your booking</Link>.
            </p>
          </div>
        </div>
      )}

      <section className="mt-6 space-y-4" aria-label="Theatres and show timings">
        {shows.error ? (
          <ErrorState error={shows.error} onRetry={shows.reload} />
        ) : shows.loading && !shows.data ? (
          <LoadingState label="Finding shows…" />
        ) : grouped.length === 0 ? (
          <EmptyState title="No shows available" message={`There are no shows for ${m.title} on ${formatDate(activeDate)}${theatreSlug ? ' at this theatre' : ''}. Try another date or theatre.`} />
        ) : (
          grouped.map((list, i) => (
            <TheatreCard
              key={list[0].theatreId}
              index={i}
              theatre={list[0].theatre}
              showsCount={list.length}
              seatsAvailable={list.reduce((n, s) => n + s.seatsAvailable, 0)}
            >
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Show timings · {formatDate(activeDate, { year: false })}</p>
                <ShowTimeSelector shows={list} selectedId={selected} onSelect={choose} />
              </div>
            </TheatreCard>
          ))
        )}
      </section>
    </div>
  );
}
