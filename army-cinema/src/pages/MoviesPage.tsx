import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { usePageMeta } from '@/lib/seo';
import { useAsync } from '@/hooks/useAsync';
import { api } from '@/services/api';
import type { Movie } from '@/types';
import { FilterPanel, type Filters } from '@/components/movies/FilterPanel';
import { MovieGrid } from '@/components/movies/MovieGrid';
import { SearchBar } from '@/components/movies/SearchBar';
import { Button } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EmptyState, ErrorState } from '@/components/ui/States';

const TABS = [
  { key: 'now', label: 'Now showing' },
  { key: 'upcoming', label: 'Coming soon' },
  { key: 'all', label: 'All' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

function sortMovies(list: Movie[], sort: Filters['sort']) {
  const l = [...list];
  if (sort === 'title') l.sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === 'newest') l.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  else if (sort === 'duration') l.sort((a, b) => a.durationMin - b.durationMin);
  else l.sort((a, b) => Number(b.featured) - Number(a.featured) || b.releaseDate.localeCompare(a.releaseDate));
  return l;
}

export default function MoviesPage() {
  usePageMeta('Movies', 'Browse movies now showing and coming soon at garrison theatres.');
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabKey) || 'now';
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [filters, setFilters] = useState<Filters>({ genre: params.get('genre') ?? '', language: '', sort: 'popular' });
  const { data, loading, error, reload } = useAsync(() => api.listMovies(), []);

  const visible = (data ?? []).filter((m) => m.status !== 'archived');
  const genres = useMemo(() => [...new Set(visible.flatMap((m) => m.genres))].sort(), [visible]);
  const languages = useMemo(() => [...new Set(visible.map((m) => m.language))].sort(), [visible]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = visible.filter((m) => {
      if (tab === 'now' && m.status !== 'now_showing') return false;
      if (tab === 'upcoming' && m.status !== 'upcoming') return false;
      if (filters.genre && !m.genres.includes(filters.genre)) return false;
      if (filters.language && m.language !== filters.language) return false;
      if (q) {
        const hay = [m.title, m.director, m.language, ...m.genres, ...m.cast].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return sortMovies(list, filters.sort);
  }, [visible, tab, filters, query]);

  const setTab = (t: TabKey) => {
    const p = new URLSearchParams(params);
    p.set('tab', t);
    setParams(p, { replace: true });
  };
  const reset = () => {
    setQuery('');
    setFilters({ genre: '', language: '', sort: 'popular' });
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <SectionHeading as="h1" eyebrow="Movies" title="What’s on" description="Find a film for your next evening with the family." />
      <div className="mt-6 space-y-4">
        <SearchBar value={query} onChange={setQuery} />
        <div role="tablist" aria-label="Movie categories" className="inline-flex rounded-2xl bg-white/[0.04] p-1 ring-1 ring-white/[0.06]">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'h-10 rounded-xl px-4 text-sm font-semibold transition-colors',
                tab === t.key ? 'bg-gradient-to-r from-saffron to-gold text-ink-950' : 'text-fg-muted hover:text-fg',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <FilterPanel genres={genres} languages={languages} value={filters} onChange={setFilters} />
      </div>
      <p className="mt-6 text-sm text-fg-subtle" aria-live="polite">
        {loading && !data ? 'Loading movies…' : `${results.length} ${results.length === 1 ? 'movie' : 'movies'}`}
      </p>
      <div className="mt-3">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <MovieGrid
            movies={results}
            loading={loading}
            empty={
              <EmptyState
                title="No movies match your search"
                message="Try a different title, genre or language."
                action={<Button variant="secondary" onClick={reset}>Clear filters</Button>}
              />
            }
          />
        )}
      </div>
    </div>
  );
}
