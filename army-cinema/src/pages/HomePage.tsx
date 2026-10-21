import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CalendarClock, Clock, Clapperboard, Languages, Lock, Play, ShieldCheck, Smartphone, UserRound, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { CATEGORY_META, getLayout } from '@/data/layouts';
import { useAsync } from '@/hooks/useAsync';
import { cn } from '@/lib/cn';
import { addDays, DAY_NAMES, formatDate, formatDuration, formatTime, parseDateKey, todayKey, weekEndKey, weekStartKey } from '@/lib/date';
import { usePageMeta } from '@/lib/seo';
import { api } from '@/services/api';
import type { Movie, RankCategory, ShowWithRefs } from '@/types';
import { DateSelector } from '@/components/booking/DateSelector';
import { availabilityTone } from '@/components/booking/ShowTimeSelector';
import { Hero } from '@/components/home/Hero';
import { TrailerModal } from '@/components/movies/TrailerModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Poster } from '@/components/ui/Poster';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';

const RULES = [
  { icon: Smartphone, title: 'One booking a week', text: 'One booking per mobile number per screening week (Friday to Thursday).' },
  { icon: Users, title: 'Up to 4 seats', text: 'Bring your family — a booking can hold up to 4 seats.' },
  { icon: ShieldCheck, title: 'Your enclosure', text: 'Officers, JCOs and Other Ranks each book in their own enclosure.' },
  { icon: CalendarClock, title: 'Closed Thursdays', text: 'Evening show daily; two shows on Sunday. Closed Thursday for maintenance.' },
];

function NowShowingCard({ movie, onTrailer }: { movie: Movie; onTrailer: () => void }) {
  const meta = [
    { icon: Clapperboard, label: 'Genre', value: movie.genres.join(', ') },
    { icon: Clock, label: 'Duration', value: formatDuration(movie.durationMin) },
    { icon: Languages, label: 'Language', value: movie.language },
    { icon: UserRound, label: 'Director', value: movie.director },
  ];
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.5 }}
      className="glass flex gap-4 rounded-3xl p-3 shadow-2xl sm:gap-5 sm:p-4"
      aria-label={`Now showing: ${movie.title}`}
    >
      <Poster movie={movie} priority className="w-28 shrink-0 rounded-2xl ring-1 ring-white/10 sm:w-36" sizes="144px" />
      <div className="min-w-0 flex-1 py-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="green">
            <span className="size-1.5 animate-pulse rounded-full bg-green" aria-hidden /> Now showing
          </Badge>
          <Badge>{movie.certification}</Badge>
        </div>
        <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-none tracking-wide sm:text-4xl">{movie.title}</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs sm:text-sm">
          {meta.map((m) => (
            <div key={m.label} className="flex min-w-0 items-center gap-1.5">
              <m.icon className="size-3.5 shrink-0 text-saffron" aria-hidden />
              <dt className="sr-only">{m.label}</dt>
              <dd className="truncate text-fg-muted">{m.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 line-clamp-2 text-xs text-fg-subtle sm:text-sm">
          <span className="text-fg-muted">Cast:</span> {movie.cast.join(', ')}
        </p>
        {movie.trailerUrl && (
          <button onClick={onTrailer} className="mt-2 inline-flex h-9 items-center gap-1.5 text-sm font-semibold text-saffron-soft hover:text-saffron">
            <Play className="size-4" aria-hidden /> Watch trailer
          </button>
        )}
      </div>
    </motion.article>
  );
}

export default function HomePage() {
  usePageMeta('', 'Book movie tickets at Kerketta Auditorium — for serving Army personnel and their families.');
  const navigate = useNavigate();
  const { user } = useAuth();
  const movies = useAsync(() => api.listMovies(), []);
  const theatres = useAsync(() => api.listTheatres(), []);
  const theatre = theatres.data?.find((t) => t.active);
  const shows = useAsync(
    () => (theatre ? api.listShows({ theatreId: theatre.id, from: todayKey(), to: addDays(todayKey(), 6) }) : Promise.resolve([] as ShowWithRefs[])),
    [theatre?.id],
  );
  const [trailer, setTrailer] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [showId, setShowId] = useState<string | null>(null);
  const [category, setCategory] = useState<RankCategory | null>(null);

  const movie = movies.data?.find((m) => m.status === 'now_showing' && m.featured) ?? movies.data?.find((m) => m.status === 'now_showing');
  const history = movies.data?.filter((m) => m.status === 'archived') ?? [];

  const dates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => addDays(todayKey(), i)).map((key) => ({
        key,
        shows: shows.data?.filter((s) => s.date === key).length ?? 0,
        emptyLabel: theatre && !(theatre.weeklySchedule[parseDateKey(key).getDay()] ?? []).length ? 'Closed' : 'No shows',
      })),
    [shows.data, theatre],
  );
  const activeDate = date ?? dates.find((d) => d.shows > 0)?.key ?? todayKey();
  const dayShows = useMemo(() => shows.data?.filter((s) => s.date === activeDate) ?? [], [shows.data, activeDate]);
  const show = dayShows.find((s) => s.id === showId) ?? dayShows[0];

  const occ = useAsync(() => (show ? api.getOccupiedSeats(show.id) : Promise.resolve([] as string[])), [show?.id]);
  const weekly = useAsync(() => (user ? api.weeklyBookingFor(activeDate) : Promise.resolve(null)), [user?.id, weekStartKey(activeDate)]);

  const layout = theatre ? getLayout(theatre.layoutKey) : null;
  const ownCat = user && user.role !== 'admin' ? user.rankCategory : null;
  const activeCat: RankCategory = category ?? ownCat ?? 'ORS';

  useEffect(() => setShowId(null), [activeDate]);

  const counts = useMemo(() => {
    const taken = occ.data ?? [];
    return (layout?.categories ?? []).map((c) => ({
      cat: c,
      free: Math.max(0, c.bookable - taken.filter((id) => id.startsWith(`${c.key}-`)).length),
    }));
  }, [occ.data, layout]);

  const loading = (movies.loading && !movies.data) || (theatres.loading && !theatres.data);
  const error = movies.error ?? theatres.error ?? shows.error;

  return (
    <>
      <Hero
        nowShowing={
          loading ? (
            <Skeleton className="h-52 rounded-3xl" />
          ) : movie ? (
            <NowShowingCard movie={movie} onTrailer={() => setTrailer(true)} />
          ) : (
            <EmptyState title="No movie scheduled yet" message="Please check back soon — the station will announce the next show." />
          )
        }
      />

      {/* Booking panel */}
      <section id="book" aria-labelledby="book-title" className="container-page mt-8 scroll-mt-20 md:mt-0">
        <div className="card overflow-hidden">
          <div className="tricolour-rule" />
          <div className="p-4 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Book tickets</p>
                <h2 id="book-title" className="mt-1 text-2xl font-semibold sm:text-3xl">Choose your show</h2>
              </div>
              <p className="text-sm text-fg-subtle">
                This week: {formatDate(weekStartKey(todayKey()), { year: false })} – {formatDate(weekEndKey(todayKey()), { year: false })}
              </p>
            </div>

            {error ? (
              <ErrorState className="mt-6" error={error} onRetry={() => { movies.reload(); theatres.reload(); shows.reload(); }} />
            ) : (
              <div className="mt-6 space-y-7">
                {/* 1. Day */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg-muted">
                    <span className="grid size-6 place-items-center rounded-full bg-white/[0.07] text-xs text-fg">1</span> Choose a day
                  </h3>
                  {shows.loading && !shows.data ? <Skeleton className="h-20" /> : <DateSelector dates={dates} value={activeDate} onChange={setDate} />}
                </div>

                {/* 2. Show time */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg-muted">
                    <span className="grid size-6 place-items-center rounded-full bg-white/[0.07] text-xs text-fg">2</span>
                    Show time · <span className="font-normal">{DAY_NAMES[parseDateKey(activeDate).getDay()]}, {formatDate(activeDate, { weekday: false, year: false })}</span>
                  </h3>
                  {dayShows.length === 0 ? (
                    <p className="rounded-2xl bg-white/[0.03] px-4 py-3 text-sm text-fg-muted">
                      {dates.find((d) => d.key === activeDate)?.emptyLabel === 'Closed' ? 'Closed — theatre maintenance day.' : 'No shows left on this day. Please pick another day.'}
                    </p>
                  ) : (
                    <div role="radiogroup" aria-label="Show time" className="flex flex-wrap gap-2">
                      {dayShows.map((s) => {
                        const tone = availabilityTone(s);
                        const active = s.id === show?.id;
                        return (
                          <button
                            key={s.id}
                            role="radio"
                            aria-checked={active}
                            disabled={s.seatsAvailable === 0}
                            onClick={() => setShowId(s.id)}
                            className={cn(
                              'flex min-h-14 min-w-[8.5rem] flex-col items-start rounded-2xl border px-4 py-2.5 text-left transition-all',
                              active ? 'border-saffron bg-saffron/15 shadow-glow' : 'border-white/10 bg-white/[0.03] hover:border-saffron/50',
                              s.seatsAvailable === 0 && 'cursor-not-allowed opacity-50',
                            )}
                          >
                            <span className="font-display text-2xl font-bold leading-none">{formatTime(s.time)}</span>
                            <span className={cn('mt-1 flex items-center gap-1.5 text-xs font-medium', tone.cls)}>
                              <span className={cn('size-1.5 rounded-full', tone.dot)} aria-hidden />
                              {s.seatsAvailable === 0 ? 'Sold out' : `${s.seatsAvailable} seats left`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Enclosure */}
                {show && layout && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg-muted">
                      <span className="grid size-6 place-items-center rounded-full bg-white/[0.07] text-xs text-fg">3</span> Enclosure
                    </h3>
                    <div role="radiogroup" aria-label="Enclosure" className="grid grid-cols-3 gap-2 sm:gap-3">
                      {counts.map(({ cat, free }) => {
                        const locked = !!ownCat && cat.key !== ownCat;
                        const active = activeCat === cat.key;
                        return (
                          <button
                            key={cat.key}
                            role="radio"
                            aria-checked={active}
                            onClick={() => setCategory(cat.key)}
                            className={cn(
                              'relative rounded-2xl border p-3 text-left transition-colors sm:p-4',
                              active ? 'border-saffron/70 bg-saffron/10' : 'border-white/10 hover:border-white/25',
                              locked && !active && 'opacity-55',
                            )}
                          >
                            <span className="flex items-center justify-between gap-1">
                              <span className="font-display text-xl font-bold uppercase tracking-wide sm:text-2xl">{cat.name}</span>
                              {locked && <Lock className="size-3.5 text-fg-subtle" aria-label="Not your enclosure" />}
                            </span>
                            <span className="block truncate text-[0.7rem] text-fg-subtle sm:text-xs">{cat.full}</span>
                            <span className="mt-2 block text-xs sm:text-sm">
                              {occ.loading && !occ.data ? (
                                <span className="text-fg-subtle">Checking…</span>
                              ) : (
                                <>
                                  <span className="font-semibold text-green">{free}</span>
                                  <span className="text-fg-subtle"> / {cat.bookable} free</span>
                                </>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {ownCat && (
                      <p className="mt-2 text-xs text-fg-subtle">Your enclosure: {CATEGORY_META[ownCat].full}. Other enclosures are view-only.</p>
                    )}
                  </div>
                )}

                {weekly.data && (
                  <div role="alert" className="flex gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
                    <AlertTriangle className="size-5 shrink-0 text-warning" aria-hidden />
                    <p className="text-fg-muted">
                      <span className="font-semibold text-fg">You already have a booking this week</span> ({weekly.data.code},{' '}
                      {formatDate(weekly.data.show.date, { year: false })}). One booking per mobile number per week.{' '}
                      <Link to="/my-bookings" className="text-saffron-soft underline">View my ticket</Link>
                    </p>
                  </div>
                )}

                <Button
                  size="lg"
                  block
                  disabled={!show}
                  onClick={() => show && navigate(`/book/show/${show.id}/seats?cat=${activeCat}`)}
                  className="sm:w-auto sm:px-10"
                >
                  Select seats <ArrowRight className="size-4" aria-hidden />
                </Button>
                {!user && (
                  <p className="-mt-3 text-sm text-fg-subtle">
                    Verified personnel only — <Link to="/login" className="text-saffron-soft underline">log in</Link> or{' '}
                    <Link to="/register" className="text-saffron-soft underline">register</Link> to confirm a booking.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Booking rules */}
      <section className="container-page mt-10" aria-labelledby="rules-title">
        <h2 id="rules-title" className="eyebrow mb-4 text-fg-subtle">Booking rules</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RULES.map((r) => (
            <li key={r.title} className="flex gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-saffron">
                <r.icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-semibold">{r.title}</h3>
                <p className="mt-0.5 text-sm text-fg-muted">{r.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Screening history */}
      {history.length > 0 && (
        <section className="container-page mt-10" aria-labelledby="history-title">
          <h2 id="history-title" className="eyebrow mb-4 text-fg-subtle">Recently screened at Kerketta</h2>
          <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:px-0">
            {history.map((m) => (
              <li key={m.id} className="w-28 shrink-0 sm:w-32">
                <Poster movie={m} className="rounded-xl opacity-80 ring-1 ring-white/10" sizes="128px" />
                <p className="mt-2 truncate text-sm font-medium">{m.title}</p>
                <p className="text-xs text-fg-subtle">{formatDate(m.releaseDate, { weekday: false })}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tribute */}
      <section className="mt-16" aria-labelledby="tribute">
        <div className="relative overflow-hidden border-y border-white/[0.06] bg-ink-950/70">
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-saffron/15 to-transparent" aria-hidden />
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-india-green/20 to-transparent" aria-hidden />
          <div className="container-page relative py-10 text-center">
            <h2 id="tribute" className="mx-auto max-w-2xl text-xl font-semibold leading-snug sm:text-2xl">
              Every show is a small salute to your service — and to the families who stand beside you.
            </h2>
            <p lang="hi" className="mt-3 font-display text-2xl font-semibold tracking-wide text-tricolour">
              देश सेवा सर्वोपरि · जय हिन्द
            </p>
          </div>
        </div>
      </section>

      {movie && <TrailerModal open={trailer} onClose={() => setTrailer(false)} title={movie.title} url={movie.trailerUrl} />}
    </>
  );
}
