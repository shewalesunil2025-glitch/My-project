import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search movies, genres, cast…',
  className,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  onSubmit?: () => void;
}) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={cn('relative', className)}
    >
      <label htmlFor="movie-search" className="sr-only">
        Search movies
      </label>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-fg-subtle" aria-hidden />
      <input
        id="movie-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 80))}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        className="h-12 w-full rounded-2xl border border-white/10 bg-ink-950/60 pl-12 pr-11 text-[16px] text-fg placeholder:text-fg-subtle focus:border-saffron/60 focus:outline-none focus:ring-2 focus:ring-saffron/20 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-fg-subtle hover:text-fg"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </form>
  );
}
