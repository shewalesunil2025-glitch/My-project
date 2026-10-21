import { Eye, Search, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import { CATEGORY_META, seatLabel } from '@/data/layouts';
import { useAsync } from '@/hooks/useAsync';
import { formatDate, formatDateTime, formatTime, isShowPast } from '@/lib/date';
import { usePageMeta } from '@/lib/seo';
import { api } from '@/services/api';
import { toAppError } from '@/services/errors';
import type { BookingDetails, BookingStatus } from '@/types';
import { AdminPageHeader } from '@/components/admin/AdminLayout';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/States';

export default function AdminBookingsPage() {
  usePageMeta('Manage bookings');
  const toast = useToast();
  const [q, setQ] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<BookingStatus | 'all'>('all');
  const { data, loading, error, reload } = useAsync(() => api.adminListBookings({ query: q, date: date || undefined, status }), [q, date, status]);
  const [cancelling, setCancelling] = useState<BookingDetails | null>(null);
  const [busy, setBusy] = useState(false);

  const columns: Column<BookingDetails>[] = [
    { key: 'code', header: 'Booking ID', cell: (b) => <span className="font-mono text-xs font-semibold">{b.code}</span> },
    {
      key: 'user',
      header: 'User',
      cell: (b) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{b.customerName}</p>
          <p className="text-xs text-fg-subtle">{b.source === 'counter' ? 'Counter' : b.mobile}</p>
        </div>
      ),
    },
    { key: 'movie', header: 'Movie', cell: (b) => <span className="line-clamp-1">{b.movie.title}</span> },
    { key: 'theatre', header: 'Theatre', cell: (b) => <span className="line-clamp-1">{b.theatre.name}</span>, hideSm: true },
    { key: 'date', header: 'Date', cell: (b) => formatDate(b.show.date, { year: false }) },
    { key: 'time', header: 'Time', cell: (b) => formatTime(b.show.time), hideSm: true },
    { key: 'seats', header: 'Seats', cell: (b) => <span title={CATEGORY_META[b.category].full}>{CATEGORY_META[b.category].name} · {b.seats.map(seatLabel).join(', ')}</span> },
    {
      key: 'status',
      header: 'Status',
      cell: (b) =>
        b.status === 'confirmed' ? <Badge tone="green">Confirmed</Badge> : b.status === 'cancelled' ? <Badge tone="danger">Cancelled</Badge> : <Badge tone="warning">{b.status.replace('_', ' ')}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      cell: (b) => (
        <div className="flex justify-end gap-1">
          <Link to={`/tickets/${b.id}`} className="grid size-9 place-items-center rounded-lg text-fg-muted hover:bg-white/5 hover:text-fg" aria-label={`View ticket ${b.code}`}>
            <Eye className="size-4" />
          </Link>
          {b.status === 'confirmed' && !isShowPast(b.show.date, b.show.time) && (
            <Button size="sm" variant="ghost" className="hover:text-danger" onClick={() => setCancelling(b)} aria-label={`Cancel ${b.code}`}>
              <XCircle className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const cancel = async () => {
    if (!cancelling) return;
    setBusy(true);
    try {
      await api.cancelBooking(cancelling.id);
      toast.success('Booking cancelled', `${cancelling.code} — seats released.`);
    } catch (e) {
      toast.error('Couldn’t cancel', toAppError(e).message);
    } finally {
      setBusy(false);
      setCancelling(null);
      reload();
    }
  };

  return (
    <>
      <AdminPageHeader title="Bookings" description={`${data?.length ?? '…'} bookings match your filters.`} />
      <div className="mb-4 grid gap-3 sm:flex sm:flex-wrap">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
          <label htmlFor="bk-q" className="sr-only">Search bookings</label>
          <input id="bk-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Booking ID, name, mobile, movie…" className="h-11 w-full rounded-xl border border-white/10 bg-ink-950/60 pl-10 pr-3 text-[16px] focus:border-saffron/60 focus:outline-none" />
        </div>
        <label className="flex items-center gap-2 text-sm text-fg-muted">
          Show date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-xl border border-white/10 bg-ink-950/60 px-3 text-sm text-fg" />
        </label>
        <label className="flex items-center gap-2 text-sm text-fg-muted">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as BookingStatus | 'all')} className="h-11 rounded-xl border border-white/10 bg-ink-950/60 px-3 text-sm text-fg">
            <option value="all">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="payment_failed">Payment failed</option>
          </select>
        </label>
        {(q || date || status !== 'all') && (
          <Button variant="ghost" onClick={() => { setQ(''); setDate(''); setStatus('all'); }}>Clear</Button>
        )}
      </div>
      {error ? <ErrorState error={error} onRetry={reload} /> : <DataTable caption="Bookings" columns={columns} rows={data} rowKey={(b) => b.id} loading={loading} empty="No bookings match these filters." pageSize={15} />}
      <ConfirmDialog
        open={!!cancelling}
        title={`Cancel ${cancelling?.code}?`}
        message={cancelling ? `${cancelling.customerName} · ${cancelling.movie.title} · ${formatDateTime(`${cancelling.show.date}T${cancelling.show.time}`)}. Seats will be released and the weekly limit freed.` : ''}
        confirmLabel="Cancel booking"
        onConfirm={cancel}
        onClose={() => setCancelling(null)}
        busy={busy}
      />
    </>
  );
}
