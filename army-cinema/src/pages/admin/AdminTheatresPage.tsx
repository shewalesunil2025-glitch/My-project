import { MapPin, Pencil, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useToast } from '@/context/ToastContext';
import { LAYOUTS } from '@/data/layouts';
import { useAsync } from '@/hooks/useAsync';
import { DAY_SHORT, formatTime } from '@/lib/date';
import { usePageMeta } from '@/lib/seo';
import { api, type TheatreInput } from '@/services/api';
import { toAppError } from '@/services/errors';
import type { LayoutKey, Theatre, WeeklySchedule } from '@/types';
import { AdminPageHeader } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';

const EMPTY: TheatreInput = {
  name: '',
  location: '',
  city: '',
  description: '',
  facilities: [],
  layoutKey: 'compact',
  weeklySchedule: { 0: ['18:00'], 1: ['18:00'], 2: ['18:00'], 3: ['18:00'], 4: [], 5: ['18:00'], 6: ['18:00'] },
  active: true,
};

function ScheduleEditor({ value, onChange }: { value: WeeklySchedule; onChange: (v: WeeklySchedule) => void }) {
  const [draft, setDraft] = useState<Record<number, string>>({});
  return (
    <fieldset>
      <legend className="text-sm font-medium">Weekly schedule</legend>
      <p className="text-xs text-fg-subtle">Leave a day empty to mark it closed.</p>
      <ul className="mt-3 space-y-2">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <li key={d} className="flex flex-wrap items-center gap-2">
            <span className="w-10 text-sm font-semibold text-fg-muted">{DAY_SHORT[d]}</span>
            {(value[d] ?? []).map((t) => (
              <span key={t} className="inline-flex h-8 items-center gap-1 rounded-lg bg-white/[0.06] pl-2.5 pr-1 text-sm">
                {formatTime(t)}
                <button type="button" aria-label={`Remove ${t} on ${DAY_SHORT[d]}`} onClick={() => onChange({ ...value, [d]: value[d].filter((x) => x !== t) })} className="grid size-6 place-items-center rounded hover:text-danger">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            {!(value[d] ?? []).length && <span className="text-xs italic text-fg-subtle">Closed</span>}
            <input
              type="time"
              aria-label={`Add show time on ${DAY_SHORT[d]}`}
              value={draft[d] ?? ''}
              onChange={(e) => setDraft({ ...draft, [d]: e.target.value })}
              className="h-8 rounded-lg border border-white/10 bg-ink-950/60 px-2 text-sm"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const t = draft[d];
                if (!t || (value[d] ?? []).includes(t)) return;
                onChange({ ...value, [d]: [...(value[d] ?? []), t].sort() });
                setDraft({ ...draft, [d]: '' });
              }}
            >
              Add
            </Button>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

function TheatreForm({ initial, id, onDone }: { initial: TheatreInput; id?: string; onDone: () => void }) {
  const toast = useToast();
  const [v, setV] = useState({ ...initial, facilitiesText: initial.facilities.join(', ') });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!v.name.trim() || !v.location.trim()) return setError('Name and location are required.');
    setBusy(true);
    try {
       
      const { facilitiesText, ...rest } = v;
      await api.saveTheatre({ ...rest, facilities: facilitiesText.split(',').map((s) => s.trim()).filter(Boolean) }, id);
      toast.success(id ? 'Theatre updated' : 'Theatre added', v.name);
      onDone();
    } catch (err) {
      setError(toAppError(err).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2"><Input label="Theatre name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
      <Input label="Location" value={v.location} onChange={(e) => setV({ ...v, location: e.target.value })} />
      <Input label="City / cantonment" value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })} />
      <div className="sm:col-span-2"><Textarea label="Description" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></div>
      <Select label="Seat layout (capacity)" value={v.layoutKey} onChange={(e) => setV({ ...v, layoutKey: e.target.value as LayoutKey })} hint="Changes are blocked once the theatre has bookings.">
        {Object.values(LAYOUTS).map((l) => <option key={l.key} value={l.key}>{l.name}</option>)}
      </Select>
      <Input label="Facilities" hint="Comma separated" value={v.facilitiesText} onChange={(e) => setV({ ...v, facilitiesText: e.target.value })} />
      <div className="sm:col-span-2"><ScheduleEditor value={v.weeklySchedule} onChange={(ws) => setV({ ...v, weeklySchedule: ws })} /></div>
      <label className="flex items-center gap-3 text-sm sm:col-span-2">
        <input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} className="size-5 accent-[#ff9933]" />
        Active (visible for booking)
      </label>
      {error && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger ring-1 ring-danger/25 sm:col-span-2">{error}</p>}
      <div className="flex justify-end sm:col-span-2"><Button type="submit" loading={busy}>{id ? 'Save changes' : 'Add theatre'}</Button></div>
    </form>
  );
}

export default function AdminTheatresPage() {
  usePageMeta('Manage theatres');
  const { data, loading, error, reload } = useAsync(() => api.listTheatres(), []);
  const [editing, setEditing] = useState<{ theatre?: Theatre } | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toInput = ({ id, createdAt, ...rest }: Theatre): TheatreInput => rest;

  return (
    <>
      <AdminPageHeader title="Auditorium" description="Kerketta Auditorium details, facilities and weekly show timings." />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : !data?.length ? (
        <EmptyState title="Auditorium not set up" action={<Button onClick={() => setEditing({})}>Add auditorium</Button>} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {data.map((t) => (
            <li key={t.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">{t.name}</h2>
                  <p className="flex items-center gap-1.5 text-sm text-fg-muted"><MapPin className="size-4 text-saffron" aria-hidden />{t.location}, {t.city}</p>
                </div>
                <Badge tone={t.active ? 'green' : 'neutral'}>{t.active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-fg-subtle">Capacity</dt><dd className="font-semibold">{LAYOUTS[t.layoutKey].capacity} seats</dd></div>
                <div><dt className="text-xs text-fg-subtle">Layout</dt><dd className="truncate font-semibold">{LAYOUTS[t.layoutKey].name.split(' (')[0]}</dd></div>
                <div className="col-span-2">
                  <dt className="text-xs text-fg-subtle">Shows per week</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                      <span key={d} className={`rounded-md px-1.5 py-0.5 text-xs ${(t.weeklySchedule[d] ?? []).length ? 'bg-white/[0.06]' : 'text-fg-subtle line-through'}`}>
                        {DAY_SHORT[d]} {(t.weeklySchedule[d] ?? []).length || ''}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditing({ theatre: t })}><Pencil className="size-4" aria-hidden /> Edit</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.theatre ? `Edit ${editing.theatre.name}` : 'Add theatre'} size="lg">
        {editing && (
          <TheatreForm
            key={editing.theatre?.id ?? 'new'}
            id={editing.theatre?.id}
            initial={editing.theatre ? toInput(editing.theatre) : EMPTY}
            onDone={() => {
              setEditing(null);
              reload();
            }}
          />
        )}
      </Modal>
    </>
  );
}
