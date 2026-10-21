import { Armchair, Building2, CalendarDays, Clapperboard, Ticket, TrendingUp, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CATEGORY_META } from '@/data/layouts';
import { useAsync } from '@/hooks/useAsync';
import { formatDate, formatTime } from '@/lib/date';
import { usePageMeta } from '@/lib/seo';
import { api } from '@/services/api';
import { AdminPageHeader } from '@/components/admin/AdminLayout';
import { DailyBookingsChart, HorizontalBars } from '@/components/admin/Charts';
import { DashboardCard } from '@/components/admin/DashboardCard';
import { ErrorState, Skeleton } from '@/components/ui/States';

export default function AdminDashboardPage() {
  usePageMeta('Admin dashboard');
  const { data: s, loading, error, reload } = useAsync(() => api.adminStats(), []);

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !s)
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  if (!s) return null;

  return (
    <>
      <AdminPageHeader title="Dashboard" description="Live overview of bookings across all station theatres." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <DashboardCard index={0} icon={Ticket} label="Total bookings" value={s.totalBookings.toLocaleString('en-IN')} />
        <DashboardCard index={1} icon={TrendingUp} label="Today’s bookings" value={s.todaysBookings} />
        <DashboardCard index={2} icon={Users} label="Total users" value={s.totalUsers} sub={s.pendingVerifications ? `${s.pendingVerifications} awaiting verification` : 'All verified'} />
        <DashboardCard index={3} icon={Armchair} label="Tickets issued" value={s.ticketsSold.toLocaleString('en-IN')} />
        <DashboardCard index={4} icon={Clapperboard} label="Total movies" value={s.totalMovies} />
        <DashboardCard index={5} icon={Building2} label="Auditoriums" value={s.totalTheatres} />
        <DashboardCard index={6} icon={CalendarDays} label="Busiest day" value={s.busiestDay ? formatDate(s.busiestDay.date, { year: false, weekday: false }) : '—'} sub={s.busiestDay ? `${s.busiestDay.bookings} bookings` : 'No bookings yet'} />
        <DashboardCard index={7} icon={Trophy} label="Most popular" value={s.popularMovie?.title ?? '—'} sub={s.popularMovie ? `${s.popularMovie.bookings} bookings` : undefined} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="card p-5">
          <DailyBookingsChart data={s.bookingsByDay} />
        </div>
        <div className="card p-5">
          <HorizontalBars title="Tickets by enclosure" rows={s.byCategory.map((c) => ({ label: CATEGORY_META[c.category].name, value: c.tickets }))} />
          <p className="mt-4 text-xs text-fg-subtle">Confirmed bookings, all time.</p>
        </div>
      </div>

      <section className="card mt-6 p-5" aria-labelledby="upcoming-title">
        <div className="flex items-center justify-between">
          <h2 id="upcoming-title" className="font-semibold">Upcoming shows</h2>
          <Link to="/admin/shows" className="text-sm text-saffron-soft hover:underline">Manage shows</Link>
        </div>
        <ul className="mt-4 divide-y divide-white/[0.05]">
          {s.upcomingShows.map((sh) => {
            const pct = sh.seatsTotal ? Math.round(((sh.seatsTotal - sh.seatsAvailable) / sh.seatsTotal) * 100) : 0;
            return (
              <li key={sh.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 text-sm sm:grid-cols-[1.4fr_1fr_1fr_140px]">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{sh.movie.title}</span>
                  <span className="text-xs text-fg-subtle sm:hidden">{sh.theatre.name} · {formatDate(sh.date, { year: false })} {formatTime(sh.time)}</span>
                </span>
                <span className="hidden truncate text-fg-muted sm:block">{sh.theatre.name}</span>
                <span className="hidden text-fg-muted sm:block">{formatDate(sh.date, { year: false })} · {formatTime(sh.time)}</span>
                <span className="flex items-center gap-2" title={`${pct}% sold`}>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                    <span className="block h-full rounded-full bg-[#c96a1e]" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-10 text-right text-xs tabular-nums text-fg-muted">{pct}%</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
