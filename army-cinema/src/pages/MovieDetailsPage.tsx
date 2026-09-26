import { motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, Clock, Clapperboard, Languages, Play, Star, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { addDays, formatDate, formatDuration, todayKey } from '@/lib/date';
import { usePageMeta } from '@/lib/seo';
import { api } from '@/services/api';
import type { ShowWithRefs } from '@/types';
import { DateSelector } from '@/components/booking/DateSelector';
import { ShowTimeSelector } from '@/components/booking/ShowTimeSelector';
import { TrailerModal } from '@/components/movies/TrailerModal';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Poster } from '@/components/ui/Poster';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

export default function MovieDetailsPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const movie = useAsync(() => api.getMovieBySlug(slug), [slug]);
  const m = movie.data;
  const shows = useAsync(() => (m ? api.listShows({ movieId: m.id, from: todayKey(), to: addDays(todayKey(), 6) }) : Promise.resolve([])), [m?.id]);
  const [trailer, setTrailer] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  usePageMeta(m?.title ?? 'Movie', m ? `${m.title} (${m.language}) — ${m.description.slice(0, 140)}` : undefined);

  const dates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => addDays(todayKey(), i)).map((key) => ({
        key,
        shows: shows.data?.filter((s) => s.date === key).length ?? 0,
      })),
    [shows.data],
  );
  const activeDate = date ?? dates.find((d) => d.shows > 0)?.key ?? todayKey();
  const byTheatre = useMemo(() => {
    const map = new Map<string, ShowWithRefs[]>();
    shows.data?.filter((s) => s.date === activeDate).forEach((s) => map.set(s.theatreId, [...(map.get(s.theatreId) ?? []), s]));
    return [...map.values()];
  }, [shows.data, activeDate]);
  const theatreNames = [...new Set(shows.data?.map((s) => s.theatre.name) ?? [])];

  if (movie.loading && !m) return <LoadingState className="min-h-[60vh]" />;
  if (movie.error) return <div className="container-page py-12"><ErrorState error={movie.error} onRetry={movie.reload} /></div>;
  if (!m)
    return (
      <div className="container-page py-12">
        <EmptyState title="Movie not found" message="It may have been removed from the schedule." action={<ButtonLink to="/movies">Browse movies</ButtonLink>} />
      </div>
    );

  const upcoming = m.status === 'upcoming';
  return (
    <article>
      {/* Backdrop */}
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-40 blur-3xl" style={{ background: `radial-gradient(60% 60% at 30% 20%, ${m.palette[0]}, transparent)` }} />
        <div className="container-page pb-8 pt-6 sm:pt-10">
          <button onClick={() => navigate(-1)} className="mb-5 inline-flex h-10 items-center gap-1.5 rounded-xl pr-3 text-sm text-fg-muted hover:text-fg">
            <ArrowLeft className="size-4" aria-hidden /> Back
          </button>
          <div className="grid gap-6 sm:grid-cols-[200px_1fr] lg:grid-cols-[280px_1fr] lg:gap-10">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto w-48 sm:w-full">
              <Poster movie={m} priority className="rounded-3xl shadow-2xl ring-1 ring-white/10" sizes="(min-width:1024px) 280px, 200px" />
            </motion.div>
            <div>
              <div className="flex flex-wrap gap-2">
                {upcoming ? <Badge tone="info">Coming soon</Badge> : <Badge tone="green">Now showing</Badge>}
                <Badge>{m.certification}</Badge>
                {m.score != null && (
                  <Badge tone="gold">
                    <Star className="size-3 fill-current" aria-hidden /> {m.score.toFixed(1)}/10
                  </Badge>
                )}
              </div>
              <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-none tracking-wide sm:text-6xl">{m.title}</h1>
              {m.tagline && <p className="mt-2 text-lg text-saffron-soft">{m.tagline}</p>}
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:flex sm:flex-wrap sm:gap-6">
                {[
                  { icon: Clapperboard, label: 'Genre', value: m.genres.join(', ') },
                  { icon: Clock, label: 'Duration', value: formatDuration(m.durationMin) },
                  { icon: Languages, label: 'Language', value: m.language },
                  { icon: CalendarDays, label: 'Release', value: formatDate(m.releaseDate, { weekday: false }) },
                ].map((d) => (
                  <div key={d.label} className="flex items-start gap-2">
                    <d.icon className="mt-0.5 size-4 shrink-0 text-saffron" aria-hidden />
                    <div>
                      <dt className="text-xs text-fg-subtle">{d.label}</dt>
                      <dd className="font-medium">{d.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
              <p className="mt-5 max-w-2xl leading-relaxed text-fg-muted">{m.description}</p>
              <div className="mt-4 space-y-1 text-sm">
                <p>
                  <span className="text-fg-subtle">Director: </span>
                  {m.director}
                </p>
                <p className="flex gap-1.5">
                  <Users className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
                  <span>
                    <span className="text-fg-subtle">Cast: </span>
                    {m.cast.join(', ')}
                  </span>
                </p>
                {theatreNames.length > 0 && (
                  <p>
                    <span className="text-fg-subtle">Playing at: </span>
                    {theatreNames.join(', ')}
                  </p>
                )}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {!upcoming && (
                  <ButtonLink to={`/book/${m.slug}`} size="lg" className="flex-1 sm:flex-none">
                    Book now
                  </ButtonLink>
                )}
                <Button variant="secondary" size="lg" onClick={() => setTrailer(true)} disabled={!m.trailerUrl} className="flex-1 sm:flex-none">
                  <Play className="size-4" aria-hidden /> {m.trailerUrl ? 'Watch trailer' : 'Trailer soon'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Availability */}
      <section className="container-page mt-4" aria-labelledby="avail-title">
        <h2 id="avail-title" className="text-xl font-semibold">
          Available dates &amp; show timings
        </h2>
        {upcoming ? (
          <EmptyState className="mt-4" title={`Releases ${formatDate(m.releaseDate)}`} message="Show timings will appear here once the station schedules screenings." />
        ) : (
          <>
            <div className="mt-4">
              <DateSelector dates={dates} value={activeDate} onChange={setDate} />
            </div>
            <div className="mt-4 space-y-3">
              {shows.error ? (
                <ErrorState error={shows.error} onRetry={shows.reload} />
              ) : shows.loading && !shows.data ? (
                <LoadingState label="Finding shows…" />
              ) : byTheatre.length === 0 ? (
                <EmptyState title="No shows on this date" message="Pick another date — or check other theatres." />
              ) : (
                byTheatre.map((list) => (
                  <div key={list[0].theatreId} className="card p-4 sm:p-5">
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                      <h3 className="font-semibold">{list[0].theatre.name}</h3>
                      <span className="text-xs text-fg-subtle">{list[0].theatre.location}</span>
                    </div>
                    <ShowTimeSelector shows={list} onSelect={(s) => navigate(`/book/show/${s.id}/seats`)} />
                  </div>
                ))
              )}
            </div>
            <p className="mt-3 text-sm text-fg-subtle">
              Prefer to compare theatres? <Link className="text-saffron-soft hover:underline" to={`/book/${m.slug}`}>Open the full show selector</Link>.
            </p>
          </>
        )}
      </section>
      <TrailerModal open={trailer} onClose={() => setTrailer(false)} title={m.title} url={m.trailerUrl} />
    </article>
  );
}
