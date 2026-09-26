import { ArrowLeft, Info, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLayout } from '@/data/layouts';
import { useAsync } from '@/hooks/useAsync';
import { addDays, DAY_NAMES, formatTime, todayKey } from '@/lib/date';
import { usePageMeta } from '@/lib/seo';
import { api } from '@/services/api';
import type { ShowWithRefs } from '@/types';
import { DateSelector } from '@/components/booking/DateSelector';
import { ShowTimeSelector } from '@/components/booking/ShowTimeSelector';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Poster } from '@/components/ui/Poster';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

export default function TheatreDetailsPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const theatre = useAsync(() => api.getTheatreBySlug(slug), [slug]);
  const t = theatre.data;
  const shows = useAsync(() => (t ? api.listShows({ theatreId: t.id, from: todayKey(), to: addDays(todayKey(), 6) }) : Promise.resolve([])), [t?.id]);
  const [date, setDate] = useState<string | null>(null);
  usePageMeta(t?.name ?? 'Theatre', t ? `${t.name}, ${t.location} — show timings and seat availability.` : undefined);

  const dates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(todayKey(), i)).map((key) => ({ key, shows: shows.data?.filter((s) => s.date === key).length ?? 0 })),
    [shows.data],
  );
  const activeDate = date ?? dates.find((d) => d.shows > 0)?.key ?? todayKey();
  const byMovie = useMemo(() => {
    const map = new Map<string, ShowWithRefs[]>();
    shows.data?.filter((s) => s.date === activeDate).forEach((s) => map.set(s.movieId, [...(map.get(s.movieId) ?? []), s]));
    return [...map.values()];
  }, [shows.data, activeDate]);

  if (theatre.loading && !t) return <LoadingState className="min-h-[60vh]" />;
  if (theatre.error) return <div className="container-page py-12"><ErrorState error={theatre.error} onRetry={theatre.reload} /></div>;
  if (!t) return <div className="container-page py-12"><EmptyState title="Theatre not found" action={<ButtonLink to="/theatres">All theatres</ButtonLink>} /></div>;

  const layout = getLayout(t.layoutKey);
  return (
    <div className="container-page py-6 sm:py-10">
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex h-10 items-center gap-1.5 pr-3 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> Back
      </button>
      <header className="card overflow-hidden">
        <div className="tricolour-rule" />
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="eyebrow">Station theatre</p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{t.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-fg-muted">
              <MapPin className="size-4 text-saffron" aria-hidden /> {t.location}, {t.city}
            </p>
            <p className="mt-4 max-w-xl text-fg-muted">{t.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {t.facilities.map((f) => <Badge key={f}>{f}</Badge>)}
            </div>
          </div>
          <div className="rounded-2xl bg-ink-950/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Enclosures · {layout.capacity} seats</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {layout.categories.map((c) => (
                <li key={c.key} className="flex justify-between">
                  <span>{c.name} — {c.full}</span>
                  <span className="text-fg-muted">{c.bookable} seats</span>
                </li>
              ))}
              {layout.vipSofas > 0 && (
                <li className="flex justify-between text-fg-subtle">
                  <span>VIP sofas (not bookable)</span>
                  <span>{layout.vipSofas}</span>
                </li>
              )}
            </ul>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Weekly schedule</p>
            <ul className="mt-2 space-y-1 text-sm">
              {[5, 6, 0, 1, 2, 3, 4].map((d) => (
                <li key={d} className="flex justify-between">
                  <span className="text-fg-muted">{DAY_NAMES[d]}</span>
                  <span>{(t.weeklySchedule[d] ?? []).length ? t.weeklySchedule[d].map(formatTime).join(', ') : <em className="text-fg-subtle">Closed</em>}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      <section className="mt-8" aria-labelledby="shows-title">
        <h2 id="shows-title" className="text-xl font-semibold">Shows this week</h2>
        <div className="mt-4">
          <DateSelector dates={dates} value={activeDate} onChange={setDate} />
        </div>
        <div className="mt-4 space-y-3">
          {shows.loading && !shows.data ? (
            <LoadingState label="Loading shows…" />
          ) : byMovie.length === 0 ? (
            <EmptyState icon={<Info className="size-6" />} title="No shows on this date" message="The theatre may be closed for maintenance. Try another day." />
          ) : (
            byMovie.map((list) => (
              <div key={list[0].movieId} className="card flex gap-4 p-4 sm:p-5">
                <Poster movie={list[0].movie} className="w-20 shrink-0 rounded-xl sm:w-24" sizes="96px" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{list[0].movie.title}</h3>
                  <p className="mb-3 text-xs text-fg-subtle">
                    {list[0].movie.language} · {list[0].movie.certification} · {list[0].movie.genres.join(', ')}
                  </p>
                  <ShowTimeSelector shows={list} onSelect={(s) => navigate(`/book/show/${s.id}/seats`)} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
