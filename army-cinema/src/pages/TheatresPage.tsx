import { useMemo, useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { DAY_SHORT, formatTime, todayKey, addDays } from '@/lib/date';
import { usePageMeta } from '@/lib/seo';
import { api } from '@/services/api';
import { TheatreCard } from '@/components/booking/TheatreCard';
import { ButtonLink } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SearchBar } from '@/components/movies/SearchBar';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';

export default function TheatresPage() {
  usePageMeta('Theatres', 'Station and garrison theatres, their facilities, schedules and seat availability.');
  const theatres = useAsync(() => api.listTheatres(), []);
  const shows = useAsync(() => api.listShows({ from: todayKey(), to: addDays(todayKey(), 6) }), []);
  const [q, setQ] = useState('');
  const list = useMemo(
    () =>
      (theatres.data ?? [])
        .filter((t) => t.active)
        .filter((t) => !q || `${t.name} ${t.location} ${t.city}`.toLowerCase().includes(q.toLowerCase())),
    [theatres.data, q],
  );

  return (
    <div className="container-page py-8 sm:py-12">
      <SectionHeading as="h1" eyebrow="Theatres" title="Station theatres" description="Pick your theatre to see what’s playing this week." />
      <SearchBar value={q} onChange={setQ} placeholder="Search by theatre or location…" className="mt-6 max-w-xl" />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {theatres.error ? (
          <ErrorState error={theatres.error} onRetry={theatres.reload} className="md:col-span-full" />
        ) : theatres.loading && !theatres.data ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80" />)
        ) : list.length === 0 ? (
          <EmptyState className="md:col-span-full" title="No theatres found" message="Try another search." />
        ) : (
          list.map((t, i) => {
            const ts = shows.data?.filter((s) => s.theatreId === t.id) ?? [];
            const next = ts.slice(0, 3);
            return (
              <TheatreCard key={t.id} index={i} theatre={t} showsCount={ts.length} seatsAvailable={ts.reduce((n, s) => n + s.seatsAvailable, 0)}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Weekly schedule</p>
                  <ul className="mt-2 grid grid-cols-7 gap-1 text-center text-[0.7rem]">
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                      const slots = t.weeklySchedule[d] ?? [];
                      return (
                        <li key={d} className={slots.length ? 'rounded-lg bg-white/[0.04] py-1.5' : 'rounded-lg py-1.5 opacity-40'}>
                          <span className="block font-semibold">{DAY_SHORT[d]}</span>
                          <span className="text-fg-subtle">{slots.length ? `${slots.length}×` : 'Closed'}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                {next.length > 0 && (
                  <p className="text-sm text-fg-muted">
                    Next: {next.map((s) => `${s.movie.title} · ${formatTime(s.time)}`).join('  •  ')}
                  </p>
                )}
                <ButtonLink to={`/theatres/${t.slug}`} block>
                  Book at this theatre
                </ButtonLink>
              </TheatreCard>
            );
          })
        )}
      </div>
    </div>
  );
}
