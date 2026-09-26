import { CalendarDays, Clock, MapPin, Ticket, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import { seatLabel } from '@/data/layouts';
import { useAsync } from '@/hooks/useAsync';
import { cn } from '@/lib/cn';
import { formatDate, formatTime, isShowPast } from '@/lib/date';
import { formatINR } from '@/lib/format';
import { usePageMeta } from '@/lib/seo';
import { api } from '@/services/api';
import { toAppError } from '@/services/errors';
import type { BookingDetails } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Poster } from '@/components/ui/Poster';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';

export function statusBadge(b: BookingDetails) {
  if (b.status === 'cancelled') return <Badge tone="danger">Cancelled</Badge>;
  if (b.status === 'payment_failed') return <Badge tone="danger">Payment failed</Badge>;
  if (b.status === 'confirmed' && isShowPast(b.show.date, b.show.time)) return <Badge>Completed</Badge>;
  if (b.status === 'confirmed') return <Badge tone="green">Confirmed</Badge>;
  return <Badge tone="warning">{b.status}</Badge>;
}

function BookingRow({ b, onCancel }: { b: BookingDetails; onCancel?: () => void }) {
  return (
    <li className="card flex gap-4 p-4">
      <Poster movie={b.movie} className="w-16 shrink-0 rounded-xl sm:w-20" sizes="80px" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{b.movie.title}</h3>
            <p className="font-mono text-xs text-fg-subtle">{b.code}</p>
          </div>
          {statusBadge(b)}
        </div>
        <dl className="mt-2 grid gap-1 text-sm text-fg-muted sm:grid-cols-2">
          <div className="flex items-center gap-1.5"><dt className="sr-only">Theatre</dt><MapPin className="size-3.5 text-saffron" aria-hidden /><dd className="truncate">{b.theatre.name}</dd></div>
          <div className="flex items-center gap-1.5"><dt className="sr-only">Date</dt><CalendarDays className="size-3.5 text-saffron" aria-hidden /><dd>{formatDate(b.show.date)}</dd></div>
          <div className="flex items-center gap-1.5"><dt className="sr-only">Show time</dt><Clock className="size-3.5 text-saffron" aria-hidden /><dd>{formatTime(b.show.time)}</dd></div>
          <div className="flex items-center gap-1.5"><dt className="sr-only">Seats</dt><Ticket className="size-3.5 text-saffron" aria-hidden /><dd>{b.seats.map(seatLabel).join(', ')} · {formatINR(b.total)}</dd></div>
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">
          <ButtonLink to={`/tickets/${b.id}`} size="sm" variant="secondary">View ticket</ButtonLink>
          {onCancel && (
            <Button size="sm" variant="ghost" onClick={onCancel} className="text-danger hover:text-danger">
              <XCircle className="size-4" aria-hidden /> Cancel
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

export default function MyBookingsPage() {
  usePageMeta('My bookings', 'Your upcoming and previous movie bookings.');
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => api.listMyBookings(), []);
  const [tab, setTab] = useState<'upcoming' | 'previous'>('upcoming');
  const [cancelling, setCancelling] = useState<BookingDetails | null>(null);
  const [busy, setBusy] = useState(false);

  const { upcoming, previous } = useMemo(() => {
    const up: BookingDetails[] = [];
    const prev: BookingDetails[] = [];
    for (const b of data ?? []) (b.status === 'confirmed' && !isShowPast(b.show.date, b.show.time) ? up : prev).push(b);
    up.sort((a, b) => (a.show.date + a.show.time).localeCompare(b.show.date + b.show.time));
    return { upcoming: up, previous: prev };
  }, [data]);
  const list = tab === 'upcoming' ? upcoming : previous;

  const confirmCancel = async () => {
    if (!cancelling) return;
    setBusy(true);
    try {
      await api.cancelBooking(cancelling.id);
      toast.success('Booking cancelled', 'Your seats were released and you can book again this week.');
      setCancelling(null);
      reload();
    } catch (e) {
      toast.error('Couldn’t cancel', toAppError(e).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page max-w-4xl py-8 sm:py-12">
      <SectionHeading as="h1" eyebrow="Tickets" title="My bookings" />
      <div role="tablist" className="mt-6 inline-flex rounded-2xl bg-white/[0.04] p-1 ring-1 ring-white/[0.06]">
        {(['upcoming', 'previous'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn('h-10 rounded-xl px-5 text-sm font-semibold capitalize', tab === t ? 'bg-white/10 text-fg' : 'text-fg-muted')}
          >
            {t} <span className="text-fg-subtle">({t === 'upcoming' ? upcoming.length : previous.length})</span>
          </button>
        ))}
      </div>
      <div className="mt-5">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading && !data ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Ticket className="size-6" />}
            title={tab === 'upcoming' ? 'No upcoming bookings' : 'No previous bookings'}
            message={tab === 'upcoming' ? 'Your next movie night is a few taps away.' : 'Bookings you’ve watched or cancelled will appear here.'}
            action={tab === 'upcoming' && <ButtonLink to="/movies">Browse movies</ButtonLink>}
          />
        ) : (
          <ul className="space-y-3">
            {list.map((b) => (
              <BookingRow key={b.id} b={b} onCancel={tab === 'upcoming' ? () => setCancelling(b) : undefined} />
            ))}
          </ul>
        )}
      </div>
      <p className="mt-6 text-sm text-fg-subtle">
        Need help? Visit the theatre counter with your booking ID. <Link to="/theatres" className="text-saffron-soft hover:underline">Theatre details</Link>
      </p>
      <Modal
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        title="Cancel this booking?"
        description={cancelling ? `${cancelling.code} · ${cancelling.movie.title} · ${formatDate(cancelling.show.date)} ${formatTime(cancelling.show.time)}` : ''}
        size="sm"
        footer={
          <div className="grid gap-2 sm:flex sm:justify-end">
            <Button variant="secondary" onClick={() => setCancelling(null)}>Keep booking</Button>
            <Button variant="danger" onClick={confirmCancel} loading={busy}>Yes, cancel</Button>
          </div>
        }
      >
        <p className="text-sm text-fg-muted">
          Your seats ({cancelling?.seats.map(seatLabel).join(', ')}) will be released for others. Online payments are refunded to the original method. Cancelling
          also frees your weekly booking.
        </p>
      </Modal>
    </div>
  );
}
