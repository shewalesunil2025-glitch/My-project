import { CalendarPlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useToast } from '@/context/ToastContext';
import { CATEGORY_META } from '@/data/layouts';
import { DEFAULT_PRICES } from '@/data/seed';
import { useAsync } from '@/hooks/useAsync';
import { addDays, formatDate, formatTime, isShowPast, todayKey } from '@/lib/date';
import { formatINR } from '@/lib/format';
import { usePageMeta } from '@/lib/seo';
import { api, type ShowInput } from '@/services/api';
import { toAppError } from '@/services/errors';
import type { CategoryPrices, Movie, RankCategory, ShowWithRefs, Theatre } from '@/types';
import { AdminPageHeader } from '@/components/admin/AdminLayout';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/States';

const CATS: RankCategory[] = ['OFFRS', 'JCOS', 'ORS'];

function PriceFields({ value, onChange }: { value: CategoryPrices; onChange: (p: CategoryPrices) => void }) {
  return (
    <fieldset className="grid grid-cols-3 gap-3 sm:col-span-2">
      <legend className="mb-2 text-sm font-medium">Ticket price (₹)</legend>
      {CATS.map((c) => (
        <Input key={c} label={CATEGORY_META[c].name} type="number" min={0} max={5000} value={value[c]} onChange={(e) => onChange({ ...value, [c]: Number(e.target.value) })} />
      ))}
    </fieldset>
  );
}

function ShowForm({ movies, theatres, initial, id, locked, onDone }: { movies: Movie[]; theatres: Theatre[]; initial: ShowInput; id?: string; locked?: boolean; onDone: () => void }) {
  const toast = useToast();
  const [v, setV] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.saveShow(v, id);
      toast.success(id ? 'Show updated' : 'Show created');
      onDone();
    } catch (err) {
      setError(toAppError(err).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Select label="Movie" value={v.movieId} onChange={(e) => setV({ ...v, movieId: e.target.value })} disabled={locked}>
        {movies.filter((m) => m.status !== 'archived').map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
      </Select>
      <Select label="Theatre" value={v.theatreId} onChange={(e) => setV({ ...v, theatreId: e.target.value })} disabled={locked}>
        {theatres.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </Select>
      <Input label="Date" type="date" min={id ? undefined : todayKey()} value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} disabled={locked} />
      <Input label="Time" type="time" value={v.time} onChange={(e) => setV({ ...v, time: e.target.value })} disabled={locked} />
      <PriceFields value={v.prices} onChange={(prices) => setV({ ...v, prices })} />
      {locked && <p className="text-xs text-fg-subtle sm:col-span-2">This show has bookings, so only prices can be changed.</p>}
      {error && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger ring-1 ring-danger/25 sm:col-span-2">{error}</p>}
      <div className="flex justify-end sm:col-span-2"><Button type="submit" loading={busy}>{id ? 'Save changes' : 'Create show'}</Button></div>
    </form>
  );
}

function GenerateForm({ movies, theatres, onDone }: { movies: Movie[]; theatres: Theatre[]; onDone: () => void }) {
  const toast = useToast();
  const [v, setV] = useState({ theatreId: theatres[0]?.id ?? '', movieId: movies.find((m) => m.status === 'now_showing')?.id ?? '', from: todayKey(), days: 7, prices: { ...DEFAULT_PRICES } });
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const n = await api.generateShows(v.theatreId, v.movieId, v.from, v.days, v.prices);
      toast.success(`${n} show${n === 1 ? '' : 's'} created`, 'Based on the theatre’s weekly schedule.');
      onDone();
    } catch (err) {
      toast.error('Couldn’t generate shows', toAppError(err).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Select label="Theatre" value={v.theatreId} onChange={(e) => setV({ ...v, theatreId: e.target.value })}>
        {theatres.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </Select>
      <Select label="Movie" value={v.movieId} onChange={(e) => setV({ ...v, movieId: e.target.value })}>
        {movies.filter((m) => m.status !== 'archived').map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
      </Select>
      <Input label="Starting" type="date" min={todayKey()} value={v.from} onChange={(e) => setV({ ...v, from: e.target.value })} />
      <Input label="Number of days" type="number" min={1} max={28} value={v.days} onChange={(e) => setV({ ...v, days: Number(e.target.value) })} />
      <PriceFields value={v.prices} onChange={(prices) => setV({ ...v, prices })} />
      <p className="text-xs text-fg-subtle sm:col-span-2">Slots already taken on the screen are skipped automatically.</p>
      <div className="flex justify-end sm:col-span-2"><Button type="submit" loading={busy}>Generate shows</Button></div>
    </form>
  );
}

export default function AdminShowsPage() {
  usePageMeta('Manage shows');
  const toast = useToast();
  const [from, setFrom] = useState(todayKey());
  const [theatreId, setTheatreId] = useState('');
  const shows = useAsync(() => api.listShows({ from, to: addDays(from, 13), theatreId: theatreId || undefined, includePast: true }), [from, theatreId]);
  const movies = useAsync(() => api.listMovies(), []);
  const theatres = useAsync(() => api.listTheatres(), []);
  const [editing, setEditing] = useState<{ show?: ShowWithRefs } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [removing, setRemoving] = useState<ShowWithRefs | null>(null);
  const [busy, setBusy] = useState(false);

  const ready = movies.data?.length && theatres.data?.length;

  const columns: Column<ShowWithRefs>[] = [
    { key: 'movie', header: 'Movie', cell: (s) => <span className="font-medium">{s.movie.title}</span> },
    { key: 'theatre', header: 'Theatre', cell: (s) => s.theatre.name, hideSm: true },
    { key: 'date', header: 'Date', cell: (s) => formatDate(s.date, { year: false }) },
    { key: 'time', header: 'Time', cell: (s) => formatTime(s.time) },
    {
      key: 'seats',
      header: 'Seats free',
      cell: (s) => (
        <span className="tabular-nums">
          {s.seatsAvailable}
          <span className="text-fg-subtle"> / {s.seatsTotal}</span>
        </span>
      ),
    },
    { key: 'price', header: 'Price', cell: (s) => <span className="text-xs text-fg-muted">{CATS.map((c) => formatINR(s.prices[c])).join(' · ')}</span>, hideSm: true },
    {
      key: 'status',
      header: 'Status',
      cell: (s) =>
        s.status === 'cancelled' ? <Badge tone="danger">Cancelled</Badge> : isShowPast(s.date, s.time) ? <Badge>Past</Badge> : <Badge tone="green">Scheduled</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (s) =>
        s.status === 'scheduled' && !isShowPast(s.date, s.time) ? (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEditing({ show: s })} aria-label="Edit show"><Pencil className="size-4" /></Button>
            <Button size="sm" variant="ghost" className="hover:text-danger" onClick={() => setRemoving(s)} aria-label="Delete or cancel show"><Trash2 className="size-4" /></Button>
          </div>
        ) : null,
    },
  ];

  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      const r = await api.deleteShow(removing.id);
      toast.success(r === 'deleted' ? 'Show deleted' : 'Show cancelled', r === 'cancelled' ? 'Its bookings were cancelled and seats released.' : undefined);
    } catch (e) {
      toast.error('Couldn’t remove show', toAppError(e).message);
    } finally {
      setBusy(false);
      setRemoving(null);
      shows.reload();
    }
  };

  const newInput = (): ShowInput => ({
    movieId: movies.data?.find((m) => m.status === 'now_showing')?.id ?? movies.data?.[0]?.id ?? '',
    theatreId: theatreId || theatres.data?.[0]?.id || '',
    date: addDays(todayKey(), 1),
    time: '18:30',
    prices: { ...DEFAULT_PRICES },
  });

  return (
    <>
      <AdminPageHeader
        title="Shows"
        description="Schedule screenings, set prices per enclosure and track seat availability."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setGenerating(true)} disabled={!ready}><CalendarPlus className="size-4" aria-hidden /> From schedule</Button>
            <Button onClick={() => setEditing({})} disabled={!ready}><Plus className="size-4" aria-hidden /> New show</Button>
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm text-fg-muted">
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value || todayKey())} className="h-10 rounded-xl border border-white/10 bg-ink-950/60 px-3 text-sm text-fg" />
        </label>
        <label className="flex items-center gap-2 text-sm text-fg-muted">
          Theatre
          <select value={theatreId} onChange={(e) => setTheatreId(e.target.value)} className="h-10 rounded-xl border border-white/10 bg-ink-950/60 px-3 text-sm text-fg">
            <option value="">All</option>
            {theatres.data?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <span className="self-center text-xs text-fg-subtle">Showing 14 days</span>
      </div>
      {shows.error ? <ErrorState error={shows.error} onRetry={shows.reload} /> : <DataTable caption="Shows" columns={columns} rows={shows.data} rowKey={(s) => s.id} loading={shows.loading} empty="No shows in this period." pageSize={15} />}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.show ? 'Edit show' : 'New show'} size="lg">
        {editing && movies.data && theatres.data && (
          <ShowForm
            key={editing.show?.id ?? 'new'}
            movies={movies.data}
            theatres={theatres.data}
            id={editing.show?.id}
            locked={!!editing.show && editing.show.seatsAvailable < editing.show.seatsTotal}
            initial={editing.show ? { movieId: editing.show.movieId, theatreId: editing.show.theatreId, date: editing.show.date, time: editing.show.time, prices: editing.show.prices } : newInput()}
            onDone={() => {
              setEditing(null);
              shows.reload();
            }}
          />
        )}
      </Modal>
      <Modal open={generating} onClose={() => setGenerating(false)} title="Create shows from weekly schedule" size="lg">
        {movies.data && theatres.data && (
          <GenerateForm
            movies={movies.data}
            theatres={theatres.data}
            onDone={() => {
              setGenerating(false);
              shows.reload();
            }}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={!!removing}
        title="Remove this show?"
        message={
          removing && removing.seatsAvailable < removing.seatsTotal
            ? 'This show has bookings. It will be cancelled, every booking cancelled and online payments marked for refund.'
            : 'The show has no bookings and will be deleted.'
        }
        confirmLabel={removing && removing.seatsAvailable < removing.seatsTotal ? 'Cancel show' : 'Delete show'}
        onConfirm={remove}
        onClose={() => setRemoving(null)}
        busy={busy}
      />
    </>
  );
}
