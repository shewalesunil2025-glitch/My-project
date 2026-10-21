import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { Movie } from '@/types';

/**
 * Local, generated placeholder poster (no external or copyrighted images).
 * Replaced automatically once an admin uploads a real poster.
 */
function PosterArt({ movie, className }: { movie: Pick<Movie, 'title' | 'genres' | 'language' | 'certification' | 'palette'>; className?: string }) {
  const [a, b] = movie.palette;
  // Size the title to the poster's width (container units) so long words never break mid-word.
  const longest = Math.max(4, ...movie.title.split(/\s+/).map((w) => w.length));
  const titleSize = `min(15cqw, ${(150 / longest).toFixed(1)}cqw)`;
  return (
    <div
      className={cn('relative isolate flex h-full w-full flex-col justify-end overflow-hidden p-[8%]', className)}
      style={{ background: `radial-gradient(120% 80% at 70% 10%, ${a} 0%, ${b} 70%)` }}
    >
      <div className="contour-bg absolute inset-0 -z-10 opacity-70" />
      <div className="absolute inset-x-0 top-0 -z-10 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
      <svg viewBox="0 0 100 100" className="absolute right-[8%] top-[8%] w-[22%] text-white/25" aria-hidden>
        <path d="m50 8 11 23 25 3.6-18 17.6 4.3 25L50 65.4 27.7 77.2 32 52.2 14 34.6 39 31z" fill="currentColor" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      <p className="font-display text-[5.5cqw] font-semibold uppercase leading-tight tracking-[0.25em] text-saffron-soft">{movie.genres.slice(0, 2).join(' · ')}</p>
      <p className="mt-[1.5cqw] font-display font-bold uppercase leading-[0.95] tracking-wide text-white" style={{ fontSize: titleSize }}>
        {movie.title}
      </p>
      <div className="mt-[3cqw] flex items-center gap-[3cqw] text-[5cqw] font-medium uppercase tracking-widest text-white/70">
        <span className="rounded border border-white/30 px-[1.5cqw]">{movie.certification}</span>
        <span>{movie.language}</span>
      </div>
      <div className="tricolour-rule mt-[4cqw] w-1/3 opacity-80" />
    </div>
  );
}

export function Poster({
  movie,
  className,
  sizes = '(min-width: 1024px) 240px, 45vw',
  priority,
}: {
  movie: Movie;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn('relative aspect-[2/3] overflow-hidden bg-ink-800 [container-type:inline-size]', className)}>
      {movie.posterUrl && !failed ? (
        <img
          src={movie.posterUrl}
          alt={`${movie.title} poster`}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div role="img" aria-label={`${movie.title} poster`} className="absolute inset-0">
          <PosterArt movie={movie} />
        </div>
      )}
    </div>
  );
}
