import { motion } from 'framer-motion';
import { ArrowRight, CalendarClock, Clapperboard, Flag, IdCard, QrCode, ShieldCheck, Smartphone, Ticket, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { formatDate, formatDuration, todayKey, weekEndKey, weekStartKey } from '@/lib/date';
import { usePageMeta } from '@/lib/seo';
import { api } from '@/services/api';
import { Hero } from '@/components/home/Hero';
import { MovieGrid } from '@/components/movies/MovieGrid';
import { TheatreCard } from '@/components/booking/TheatreCard';
import { ButtonLink } from '@/components/ui/Button';
import { Poster } from '@/components/ui/Poster';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';

const STEPS = [
  { icon: IdCard, title: 'Verify once', text: 'Register with your Service ID. We confirm your eligibility before your first booking.' },
  { icon: Clapperboard, title: 'Pick a show', text: 'Choose a movie, your station theatre, date and show time.' },
  { icon: Ticket, title: 'Choose seats', text: 'Select up to 4 seats in your enclosure — family or single rows.' },
  { icon: QrCode, title: 'Show your QR', text: 'Get an instant e-ticket with a QR code. Show it at the gate with your ID card.' },
];

const RULES = [
  { icon: Smartphone, title: 'One booking per week', text: 'Each registered mobile number can make one booking per screening week (Friday to Thursday).' },
  { icon: Users, title: 'Up to 4 seats', text: 'Bring your family — book a maximum of 4 seats in a single booking.' },
  { icon: ShieldCheck, title: 'Your enclosure', text: 'Seats are grouped into Officers, JCOs and Other Ranks enclosures. You book within your category.' },
  { icon: CalendarClock, title: 'Theatre timings', text: 'Kerketta Auditorium is closed on Thursdays for maintenance. Sunday has a matinee and an evening show.' },
];

export default function HomePage() {
  usePageMeta('', 'Book movie tickets at garrison theatres in a few taps. Built for serving Army personnel and their families.');
  const movies = useAsync(() => api.listMovies(), []);
  const theatres = useAsync(() => api.listTheatres(), []);
  const shows = useAsync(() => api.listShows({ from: todayKey(), to: weekEndKey(todayKey()) }), []);

  const nowShowing = movies.data?.filter((m) => m.status === 'now_showing') ?? [];
  const upcoming = movies.data?.filter((m) => m.status === 'upcoming') ?? [];
  const featured = nowShowing.find((m) => m.featured) ?? nowShowing[0];
  const featuredShows = shows.data?.filter((s) => s.movieId === featured?.id).slice(0, 4) ?? [];

  return (
    <>
      <Hero movies={movies.data ?? []} featured={featured} />

      {/* Now showing */}
      <section className="container-page mt-16 md:mt-8" aria-labelledby="now-showing">
        <SectionHeading
          eyebrow="In theatres"
          title={<span id="now-showing">Now showing</span>}
          action={
            <Link to="/movies" className="inline-flex items-center gap-1 text-sm font-semibold text-saffron-soft hover:text-saffron">
              All movies <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />
        <div className="mt-6">
          {movies.error ? (
            <ErrorState error={movies.error} onRetry={movies.reload} />
          ) : (
            <MovieGrid movies={nowShowing} loading={movies.loading} count={4} empty={<EmptyState title="No movies are showing right now" message="Check back soon — new shows are added every week." />} />
          )}
        </div>
      </section>

      {/* Featured spotlight */}
      {featured && (
        <section className="container-page mt-20" aria-labelledby="featured-title">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card relative grid overflow-hidden md:grid-cols-[280px_1fr]"
          >
            <Poster movie={featured} className="hidden md:block" sizes="280px" />
            <div className="relative p-5 sm:p-8">
              <div className="contour-bg absolute inset-0 -z-0 opacity-60" aria-hidden />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="saffron">Featured this week</Badge>
                  <Badge>{featured.certification}</Badge>
                  <Badge>{formatDuration(featured.durationMin)}</Badge>
                </div>
                <h2 id="featured-title" className="mt-4 font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl">
                  {featured.title}
                </h2>
                <p className="mt-1 text-sm text-fg-subtle">
                  {featured.genres.join(' · ')} · {featured.language} · Dir. {featured.director}
                </p>
                <p className="mt-4 max-w-2xl text-fg-muted">{featured.description}</p>
                <p className="mt-3 text-sm text-fg-muted">
                  <span className="text-fg-subtle">Cast:</span> {featured.cast.join(', ')}
                </p>
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Next shows</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {shows.loading && !shows.data
                      ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-11 w-36" />)
                      : featuredShows.map((s) => (
                          <li key={s.id}>
                            <Link
                              to={`/book/show/${s.id}/seats`}
                              className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm hover:border-saffron/50"
                            >
                              <span className="font-semibold">{formatDate(s.date, { year: false })}</span>
                              <span className="text-fg-muted">{s.time}</span>
                              <span className="text-xs text-fg-subtle">· {s.theatre.name.split(' ')[0]}</span>
                            </Link>
                          </li>
                        ))}
                  </ul>
                </div>
                <ButtonLink to={`/book/${featured.slug}`} size="lg" className="mt-6 w-full sm:w-auto">
                  Book now <ArrowRight className="size-4" aria-hidden />
                </ButtonLink>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Coming soon */}
      <section className="container-page mt-20" aria-labelledby="coming-soon">
        <SectionHeading eyebrow="Mark your calendar" title={<span id="coming-soon">Coming soon</span>} />
        <div className="mt-6">
          <MovieGrid movies={upcoming} loading={movies.loading} count={4} empty={<EmptyState title="No upcoming titles announced yet" />} />
        </div>
      </section>

      {/* Theatres */}
      <section className="container-page mt-20" aria-labelledby="stations">
        <SectionHeading
          eyebrow="Station theatres"
          title={<span id="stations">Choose your theatre</span>}
          description="Garrison halls with dedicated enclosures for Officers, JCOs and Other Ranks."
          action={
            <Link to="/theatres" className="inline-flex items-center gap-1 text-sm font-semibold text-saffron-soft hover:text-saffron">
              All theatres <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {theatres.loading && !theatres.data
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)
            : theatres.data
                ?.filter((t) => t.active)
                .map((t, i) => {
                  const ts = shows.data?.filter((s) => s.theatreId === t.id) ?? [];
                  return (
                    <TheatreCard
                      key={t.id}
                      index={i}
                      theatre={t}
                      showsCount={ts.length}
                      seatsAvailable={ts.reduce((n, s) => n + s.seatsAvailable, 0)}
                    >
                      <ButtonLink to={`/theatres/${t.slug}`} variant="secondary" block>
                        View shows
                      </ButtonLink>
                    </TheatreCard>
                  );
                })}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="container-page mt-24 scroll-mt-24" aria-labelledby="how-title">
        <SectionHeading eyebrow="Simple by design" title={<span id="how-title">Book in four steps</span>} />
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card relative p-5"
            >
              <span className="absolute right-4 top-3 font-display text-5xl font-bold text-white/[0.05]">0{i + 1}</span>
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-saffron/20 to-green/15 text-saffron-soft">
                <s.icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-fg-muted">{s.text}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Booking rules (from the station auditorium's policy) */}
      <section className="container-page mt-20" aria-labelledby="rules-title">
        <div className="card overflow-hidden">
          <div className="tricolour-rule" />
          <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="eyebrow">Fair for everyone</p>
              <h2 id="rules-title" className="mt-2 text-2xl font-semibold sm:text-3xl">
                Booking rules
              </h2>
              <p className="mt-3 text-fg-muted">
                So that every soldier and family gets a fair chance at a seat. Current screening week:{' '}
                <strong className="text-fg">
                  {formatDate(weekStartKey(todayKey()), { year: false })} – {formatDate(weekEndKey(todayKey()), { year: false })}
                </strong>
                .
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {RULES.map((r) => (
                <li key={r.title} className="flex gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-saffron">
                    <r.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-semibold">{r.title}</h3>
                    <p className="mt-0.5 text-sm text-fg-muted">{r.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Tribute band */}
      <section className="mt-24" aria-labelledby="tribute">
        <div className="relative overflow-hidden border-y border-white/[0.06] bg-ink-950/70">
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-saffron/15 to-transparent" aria-hidden />
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-india-green/20 to-transparent" aria-hidden />
          <div className="container-page relative flex flex-col items-center py-14 text-center">
            <Flag className="size-8 text-saffron" aria-hidden />
            <h2 id="tribute" className="mt-4 max-w-3xl text-2xl font-semibold leading-snug sm:text-4xl">
              Every show is a small salute to your service — and to the families who stand beside you.
            </h2>
            <p lang="hi" className="mt-4 font-display text-2xl font-semibold tracking-wide text-tricolour sm:text-3xl">
              देश सेवा सर्वोपरि · जय हिन्द
            </p>
            <ButtonLink to="/register" size="lg" className="mt-8">
              Register &amp; verify
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
