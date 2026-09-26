import { cn } from '@/lib/cn';

export type SortKey = 'popular' | 'newest' | 'title' | 'duration';

export interface Filters {
  genre: string;
  language: string;
  sort: SortKey;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-9 shrink-0 rounded-full px-4 text-sm font-medium ring-1 ring-inset transition-colors',
        active ? 'bg-saffron/15 text-saffron-soft ring-saffron/40' : 'text-fg-muted ring-white/10 hover:text-fg hover:ring-white/20',
      )}
    >
      {children}
    </button>
  );
}

export function FilterPanel({
  genres,
  languages,
  value,
  onChange,
}: {
  genres: string[];
  languages: string[];
  value: Filters;
  onChange: (f: Filters) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by genre">
        <Chip active={!value.genre} onClick={() => onChange({ ...value, genre: '' })}>
          All genres
        </Chip>
        {genres.map((g) => (
          <Chip key={g} active={value.genre === g} onClick={() => onChange({ ...value, genre: value.genre === g ? '' : g })}>
            {g}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-fg-muted">
          Language
          <select
            value={value.language}
            onChange={(e) => onChange({ ...value, language: e.target.value })}
            className="h-10 rounded-xl border border-white/10 bg-ink-950/60 px-3 text-sm text-fg focus:border-saffron/60 focus:outline-none"
          >
            <option value="">All</option>
            {languages.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-fg-muted">
          Sort by
          <select
            value={value.sort}
            onChange={(e) => onChange({ ...value, sort: e.target.value as SortKey })}
            className="h-10 rounded-xl border border-white/10 bg-ink-950/60 px-3 text-sm text-fg focus:border-saffron/60 focus:outline-none"
          >
            <option value="popular">Featured first</option>
            <option value="newest">Release date</option>
            <option value="title">Title A–Z</option>
            <option value="duration">Shortest first</option>
          </select>
        </label>
      </div>
    </div>
  );
}
