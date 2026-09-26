import { motion } from 'framer-motion';
import { Armchair, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getLayout } from '@/data/layouts';
import type { Theatre } from '@/types';
import { Badge } from '@/components/ui/Badge';

export function TheatreCard({
  theatre,
  seatsAvailable,
  showsCount,
  children,
  action,
  index = 0,
}: {
  theatre: Theatre;
  seatsAvailable?: number;
  showsCount?: number;
  children?: ReactNode;
  action?: ReactNode;
  index?: number;
}) {
  const layout = getLayout(theatre.layoutKey);
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.06 }}
      className="card overflow-hidden"
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-fg">
              <Link to={`/theatres/${theatre.slug}`} className="hover:text-saffron-soft">
                {theatre.name}
              </Link>
            </h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-fg-muted">
              <MapPin className="size-4 shrink-0 text-saffron" aria-hidden />
              {theatre.location}
              {theatre.city ? `, ${theatre.city}` : ''}
            </p>
          </div>
          {action}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {theatre.facilities.map((f) => (
            <Badge key={f}>{f}</Badge>
          ))}
        </div>
        <dl className="grid grid-cols-3 gap-2 rounded-xl bg-ink-950/50 p-3 text-center">
          <div>
            <dt className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Shows</dt>
            <dd className="font-display text-xl font-bold">{showsCount ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Seats free</dt>
            <dd className="font-display text-xl font-bold text-green">{seatsAvailable ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Capacity</dt>
            <dd className="flex items-center justify-center gap-1 font-display text-xl font-bold">
              <Armchair className="size-4 text-fg-subtle" aria-hidden />
              {layout.capacity}
            </dd>
          </div>
        </dl>
        {children}
      </div>
    </motion.article>
  );
}
