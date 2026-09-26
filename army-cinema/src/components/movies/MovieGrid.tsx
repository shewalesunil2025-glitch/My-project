import type { ReactNode } from 'react';
import type { Movie } from '@/types';
import { Skeleton } from '@/components/ui/States';
import { MovieCard } from './MovieCard';

export function MovieGrid({ movies, loading, empty, count = 8 }: { movies?: Movie[]; loading?: boolean; empty?: ReactNode; count?: number }) {
  if (loading && !movies) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4" aria-busy>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-white/[0.06]">
            <Skeleton className="aspect-[2/3] rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="mt-3 h-10" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (!movies?.length) return <>{empty}</>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {movies.map((m, i) => (
        <MovieCard key={m.id} movie={m} index={i} />
      ))}
    </div>
  );
}
