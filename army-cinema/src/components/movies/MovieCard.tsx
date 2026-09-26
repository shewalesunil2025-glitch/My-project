import { motion } from 'framer-motion';
import { CalendarDays, Clock, Languages, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, formatDuration } from '@/lib/date';
import type { Movie } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Poster } from '@/components/ui/Poster';

export function MovieCard({ movie, index = 0 }: { movie: Movie; index?: number }) {
  const upcoming = movie.status === 'upcoming';
  return (
    <motion.article
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-850/80 shadow-[var(--shadow-card)] transition-colors hover:border-saffron/30"
    >
      <Link to={`/movies/${movie.slug}`} className="relative block focus-visible:outline-offset-[-2px]" aria-label={`${movie.title} — details`}>
        <Poster movie={movie} className="transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {upcoming ? <Badge tone="info">Coming soon</Badge> : movie.featured ? <Badge tone="saffron">Featured</Badge> : null}
        </div>
        {movie.score != null && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink-950/80 px-2 py-0.5 text-xs font-semibold text-gold-soft backdrop-blur">
            <Star className="size-3 fill-current" aria-hidden /> {movie.score.toFixed(1)}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <h3 className="line-clamp-1 font-semibold text-fg">
          <Link to={`/movies/${movie.slug}`} className="hover:text-saffron-soft">
            {movie.title}
          </Link>
        </h3>
        <p className="line-clamp-1 text-xs text-fg-subtle">{movie.genres.join(' · ')}</p>
        <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-fg-muted">
          <div className="flex items-center gap-1">
            <dt className="sr-only">Language</dt>
            <Languages className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
            <dd className="truncate">{movie.language}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="sr-only">Duration</dt>
            <Clock className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
            <dd>{formatDuration(movie.durationMin)}</dd>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <dt className="sr-only">Release date</dt>
            <CalendarDays className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
            <dd>
              {upcoming ? 'Releases ' : ''}
              {formatDate(movie.releaseDate, { weekday: false })} · <span className="rounded border border-white/15 px-1">{movie.certification}</span>
            </dd>
          </div>
        </dl>
        <Link
          to={upcoming ? `/movies/${movie.slug}` : `/book/${movie.slug}`}
          className={
            'mt-auto inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition ' +
            (upcoming
              ? 'bg-white/[0.06] text-fg ring-1 ring-inset ring-white/10 hover:bg-white/[0.1]'
              : 'bg-gradient-to-r from-saffron to-gold text-ink-950 hover:brightness-110')
          }
        >
          {upcoming ? 'View details' : 'Book Ticket'}
        </Link>
      </div>
    </motion.article>
  );
}
