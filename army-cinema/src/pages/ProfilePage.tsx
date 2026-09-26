import { BadgeCheck, Clock3, LogOut, ShieldX } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { CATEGORY_META, seatLabel } from '@/data/layouts';
import { useAsync } from '@/hooks/useAsync';
import { formatDate, formatDateTime, formatTime, todayKey, weekEndKey, weekStartKey } from '@/lib/date';
import { maskServiceId } from '@/lib/format';
import { usePageMeta } from '@/lib/seo';
import { api } from '@/services/api';
import { toAppError } from '@/services/errors';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/States';
import { statusBadge } from './MyBookingsPage';

export default function ProfilePage() {
  usePageMeta('Profile', 'Your account and booking history.');
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const history = useAsync(() => api.listMyBookings(), []);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ fullName: user?.fullName ?? '', email: user?.email ?? '', unit: user?.unit ?? '' });
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      setUser(await api.updateProfile(form));
      toast.success('Profile updated');
      setEdit(false);
    } catch (err) {
      toast.error('Couldn’t save', toAppError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const ver = user.verification;
  const thisWeek = history.data?.find((b) => b.status === 'confirmed' && b.weekStart === weekStartKey(todayKey()));

  return (
    <div className="container-page max-w-4xl py-8 sm:py-12">
      <div className="card overflow-hidden">
        <div className="tricolour-rule" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-saffron to-gold font-display text-2xl font-bold text-ink-950">
            {user.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('')}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold">
              {user.rankTitle} {user.fullName}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {ver === 'verified' && <Badge tone="green"><BadgeCheck className="size-3.5" aria-hidden /> Verified personnel</Badge>}
              {ver === 'pending' && <Badge tone="warning"><Clock3 className="size-3.5" aria-hidden /> Verification pending</Badge>}
              {ver === 'rejected' && <Badge tone="danger"><ShieldX className="size-3.5" aria-hidden /> Verification rejected</Badge>}
              <Badge>{CATEGORY_META[user.rankCategory].full}</Badge>
              {user.role === 'admin' && <Badge tone="saffron">Admin</Badge>}
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={async () => {
              await logout();
              toast.success('Logged out', 'Jai Hind!');
              navigate('/');
            }}
          >
            <LogOut className="size-4" aria-hidden /> Logout
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="card p-5 sm:p-6" aria-labelledby="info-title">
          <div className="flex items-center justify-between">
            <h2 id="info-title" className="text-lg font-semibold">Profile information</h2>
            {!edit && <Button size="sm" variant="ghost" onClick={() => setEdit(true)}>Edit</Button>}
          </div>
          {edit ? (
            <form onSubmit={save} className="mt-4 space-y-4">
              <Input label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Unit" optional value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              <p className="text-xs text-fg-subtle">Service ID, rank and mobile can only be changed by the station admin.</p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEdit(false)}>Cancel</Button>
                <Button type="submit" loading={busy}>Save</Button>
              </div>
            </form>
          ) : (
            <dl className="mt-4 divide-y divide-white/[0.06] text-sm">
              {[
                ['Name', `${user.rankTitle} ${user.fullName}`],
                ['Service ID', maskServiceId(user.serviceId)],
                ['Mobile', `+91 ${user.mobile.slice(0, 5)} ${user.mobile.slice(5)}`],
                ['Email', user.email],
                ['Unit', user.unit || '—'],
                ['Enclosure', `${CATEGORY_META[user.rankCategory].name} — ${CATEGORY_META[user.rankCategory].full}`],
                ['Member since', formatDateTime(user.createdAt)],
              ].map(([k, val]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-fg-subtle">{k}</dt>
                  <dd className="text-right font-medium [overflow-wrap:anywhere]">{val}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section className="space-y-6">
          <div className="card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">This week</h2>
            <p className="mt-1 text-sm text-fg-muted">
              {formatDate(weekStartKey(todayKey()), { year: false })} – {formatDate(weekEndKey(todayKey()), { year: false })} · 1 booking per mobile number
            </p>
            {thisWeek ? (
              <p className="mt-3 rounded-xl bg-green/10 p-3 text-sm ring-1 ring-green/25">
                Booked: <strong>{thisWeek.movie.title}</strong> · {formatDate(thisWeek.show.date, { year: false })} {formatTime(thisWeek.show.time)} ·{' '}
                {thisWeek.seats.map(seatLabel).join(', ')}
              </p>
            ) : (
              <p className="mt-3 rounded-xl bg-white/[0.04] p-3 text-sm text-fg-muted">
                {ver === 'verified' ? 'Your weekly booking is available.' : 'Booking unlocks once your verification is approved.'}
              </p>
            )}
          </div>
          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Booking history</h2>
              <ButtonLink to="/my-bookings" size="sm" variant="ghost">View all</ButtonLink>
            </div>
            {history.data?.length ? (
              <ul className="mt-3 divide-y divide-white/[0.06]">
                {history.data.slice(0, 5).map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{b.movie.title}</span>
                      <span className="text-xs text-fg-subtle">{b.code} · {formatDate(b.show.date, { year: false })}</span>
                    </span>
                    {statusBadge(b)}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState className="mt-3 border-0 bg-transparent py-6 shadow-none" title="No bookings yet" />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
