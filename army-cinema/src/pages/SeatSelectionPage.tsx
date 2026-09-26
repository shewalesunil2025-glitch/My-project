import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Lock, ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBookingDraft } from '@/context/BookingContext';
import { useToast } from '@/context/ToastContext';
import { CATEGORY_META, getLayout, MAX_SEATS_PER_BOOKING, seatLabel, sortSeatIds } from '@/data/layouts';
import { useAsync } from '@/hooks/useAsync';
import { cn } from '@/lib/cn';
import { formatDate, formatTime, weekEndKey, weekStartKey } from '@/lib/date';
import { usePageMeta } from '@/lib/seo';
import { api } from '@/services/api';
import { AppError, toAppError } from '@/services/errors';
import type { RankCategory } from '@/types';
import { SeatLegend, SeatMap } from '@/components/booking/SeatMap';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

export default function SeatSelectionPage() {
  const { showId = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { draft, setDraft } = useBookingDraft();
  const show = useAsync(() => api.getShow(showId), [showId]);
  const occ = useAsync(() => api.getOccupiedSeats(showId), [showId]);
  const s = show.data;
  usePageMeta(s ? `Seats · ${s.movie.title}` : 'Select seats', 'Pick your seats.');

  const layout = s ? getLayout(s.theatre.layoutKey) : null;
  const allowed: RankCategory | 'ALL' = user?.role === 'admin' ? 'ALL' : (user?.rankCategory ?? 'ALL');
  const [params] = useSearchParams();
  const catParam = params.get('cat');
  const [category, setCategory] = useState<RankCategory | null>(
    catParam === 'OFFRS' || catParam === 'JCOS' || catParam === 'ORS' ? catParam : null,
  );
  const [selected, setSelected] = useState<string[]>(() => (draft?.showId === showId ? draft.seats : []));
  const [holding, setHolding] = useState(false);
  const [blocker, setBlocker] = useState<AppError | null>(null);

  const activeCat = category ?? (allowed !== 'ALL' ? allowed : (layout?.categories[0].key ?? 'ORS'));
  const catLayout = layout?.categories.find((c) => c.key === activeCat);
  const occupied = useMemo(() => new Set(occ.data ?? []), [occ.data]);

  // Keep the draft in sync so seats survive a login redirect or refresh.
  useEffect(() => {
    setDraft(selected.length ? { showId, seats: selected } : null);
  }, [selected, showId, setDraft]);

  // Poll availability so the map stays live while the user decides.
  const reloadOcc = occ.reload;
  useEffect(() => {
    const id = window.setInterval(reloadOcc, 15_000);
    return () => window.clearInterval(id);
  }, [reloadOcc]);

  // If someone else grabs a seat we had selected, drop it and tell the user.
  // Set while our own hold is being placed, so our own seats aren't reported as "taken by someone else".
  const holdingRef = useRef(false);
  useEffect(() => {
    if (holdingRef.current) return;
    const lost = selected.filter((id) => occupied.has(id));
    if (lost.length) {
      setSelected((cur) => cur.filter((id) => !occupied.has(id)));
      toast.warning('Seat no longer available', `${lost.map(seatLabel).join(', ')} was just booked by someone else.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [occupied]);

  const toggle = useCallback(
    (id: string) => {
      setSelected((cur) => {
        if (cur.includes(id)) return cur.filter((x) => x !== id);
        // All seats in a booking must come from one enclosure
        const base = cur.filter((x) => x.startsWith(`${activeCat}-`));
        if (base.length >= MAX_SEATS_PER_BOOKING) {
          toast.info(`Maximum ${MAX_SEATS_PER_BOOKING} seats`, 'You can book up to 4 seats in one booking.');
          return cur;
        }
        return [...base, id];
      });
    },
    [activeCat, toast],
  );

  const catSelected = selected.filter((x) => x.startsWith(`${activeCat}-`));
  const categoryLocked = allowed !== 'ALL' && activeCat !== allowed;
  const unverified = !!user && user.verification !== 'verified';

  const proceed = async () => {
    if (!s) return;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/book/show/${showId}/seats`)}`);
      return;
    }
    setHolding(true);
    holdingRef.current = true;
    setBlocker(null);
    try {
      const booking = await api.holdSeats({ showId, seats: catSelected });
      navigate(`/checkout/${booking.id}/summary`);
    } catch (e) {
      holdingRef.current = false;
      const err = toAppError(e);
      if (err.code === 'SEAT_TAKEN') {
        const clash = (err.details?.seats as string[]) ?? [];
        setSelected((cur) => cur.filter((x) => !clash.includes(x)));
        occ.reload();
        toast.error('Seats just taken', err.message);
      } else if (err.code === 'AUTH_REQUIRED' || err.code === 'SESSION_EXPIRED') {
        toast.warning('Please log in again', err.message);
        navigate(`/login?next=${encodeURIComponent(`/book/show/${showId}/seats`)}`);
      } else if (err.code === 'WEEKLY_LIMIT' || err.code === 'NOT_VERIFIED' || err.code === 'CATEGORY_NOT_ALLOWED' || err.code === 'SHOW_UNAVAILABLE') {
        setBlocker(err);
      } else {
        toast.error('Couldn’t hold your seats', err.message);
      }
    } finally {
      setHolding(false);
    }
  };

  if (show.loading && !s) return <LoadingState className="min-h-[60vh]" label="Loading seat map…" />;
  if (show.error) return <div className="container-page py-10"><ErrorState error={show.error} onRetry={show.reload} /></div>;
  if (!s || !layout || !catLayout)
    return (
      <div className="container-page py-10">
        <EmptyState title="Show not available" message="This show may have ended or been cancelled." action={<ButtonLink to="/#book">Book tickets</ButtonLink>} />
      </div>
    );

  return (
    <div className="pb-40">
      <div className="container-page py-5 sm:py-8">
        <Stepper current={1} />
        <div className="mt-5 flex items-start gap-3">
          <Link to="/#book" className="grid size-10 shrink-0 place-items-center rounded-xl ring-1 ring-white/10 hover:bg-white/5" aria-label="Back to show selection">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold sm:text-2xl">{s.movie.title}</h1>
            <p className="text-sm text-fg-muted">
              {s.theatre.name} · {formatDate(s.date, { year: false })} · {formatTime(s.time)}
            </p>
          </div>
        </div>

        {/* Status notices */}
        {!user && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-info/30 bg-info/10 p-4 text-sm">
            <Lock className="size-5 shrink-0 text-info" aria-hidden />
            <p className="text-fg-muted">
              <span className="font-semibold text-fg">Verified personnel only.</span> You can explore the seat map now —{' '}
              <Link to={`/login?next=/book/show/${showId}/seats`} className="text-saffron-soft underline">log in</Link> or{' '}
              <Link to="/register" className="text-saffron-soft underline">register</Link> to book.
            </p>
          </div>
        )}
        {unverified && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm" role="alert">
            <ShieldAlert className="size-5 shrink-0 text-warning" aria-hidden />
            <p className="text-fg-muted">
              <span className="font-semibold text-fg">Verification {user!.verification}.</span> You can book as soon as the station admin approves your
              service details.
            </p>
          </div>
        )}
        {blocker && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm" role="alert">
            <AlertTriangle className="size-5 shrink-0 text-danger" aria-hidden />
            <div className="text-fg-muted">
              <p className="font-semibold text-fg">{blocker.code === 'WEEKLY_LIMIT' ? 'Weekly limit reached' : 'Can’t book this selection'}</p>
              <p className="mt-0.5">
                {blocker.message}
                {blocker.code === 'WEEKLY_LIMIT' && (
                  <>
                    {' '}This week: {formatDate(weekStartKey(s.date), { year: false })} – {formatDate(weekEndKey(s.date), { year: false })}.{' '}
                    <Link to="/my-bookings" className="text-saffron-soft underline">View my booking</Link>
                  </>
                )}
              </p>
            </div>
          </motion.div>
        )}

        {/* Enclosure (category) picker */}
        <div role="tablist" aria-label="Seat enclosure" className="mt-6 grid grid-cols-3 gap-2">
          {layout.categories.map((c) => {
            const taken = [...occupied].filter((id) => id.startsWith(`${c.key}-`)).length;
            const avail = Math.max(0, c.bookable - taken);
            const active = c.key === activeCat;
            const locked = allowed !== 'ALL' && c.key !== allowed;
            return (
              <button
                key={c.key}
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(c.key)}
                className={cn(
                  'relative rounded-2xl border p-3 text-left transition-colors',
                  active ? 'border-saffron/70 bg-saffron/10' : 'border-white/10 hover:border-white/25',
                  locked && !active && 'opacity-60',
                )}
              >
                <span className="flex items-center justify-between gap-1">
                  <span className="font-display text-lg font-bold uppercase tracking-wide">{c.name}</span>
                  {locked && <Lock className="size-3.5 text-fg-subtle" aria-label="Not your enclosure" />}
                </span>
                <span className="block truncate text-[0.7rem] text-fg-subtle">{c.full}</span>
                <span className="mt-1 block text-xs">
                  <span className="font-semibold text-green">{avail}</span>
                  <span className="text-fg-subtle"> / {c.bookable} free</span>
                </span>
              </button>
            );
          })}
        </div>
        {categoryLocked && (
          <p className="mt-3 text-sm text-fg-muted">
            You’re viewing the {CATEGORY_META[activeCat].full} enclosure. Your account books in{' '}
            <button className="font-semibold text-saffron-soft underline" onClick={() => setCategory(allowed as RankCategory)}>
              {CATEGORY_META[allowed as RankCategory].full}
            </button>
            .
          </p>
        )}

        {/* Seat map */}
        <div className="card mt-5 p-3 sm:p-6">
          {occ.loading && !occ.data ? (
            <LoadingState label="Checking availability…" />
          ) : (
            <SeatMap
              category={catLayout}
              occupied={occupied}
              selected={catSelected}
              onToggle={toggle}
              disabled={categoryLocked || unverified}
              vipSofas={layout.vipSofas}
            />
          )}
          <div className="mt-5 border-t border-white/[0.06] pt-4">
            <SeatLegend types={catLayout.types} showBlocked={catLayout.rows.some((r) => r.items.some((it) => it.kind === 'seat' && it.seat.blocked))} />
          </div>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-900/95 backdrop-blur-xl">
        <div className="container-page flex items-center gap-4 py-3">
          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait" initial={false}>
              {catSelected.length ? (
                <motion.div key="sel" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <p className="truncate text-sm font-semibold">
                    {sortSeatIds(catSelected).map(seatLabel).join(', ')}{' '}
                    <span className="font-normal text-fg-subtle">
                      · {catSelected.length}/{MAX_SEATS_PER_BOOKING}
                    </span>
                  </p>
                  <p className="text-xs text-fg-subtle">{CATEGORY_META[activeCat].full}</p>
                </motion.div>
              ) : (
                <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-fg-muted">
                  Select up to {MAX_SEATS_PER_BOOKING} seats
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <Button size="lg" onClick={proceed} loading={holding} disabled={!catSelected.length || categoryLocked || unverified} className="shrink-0 px-6">
            {user ? 'Continue' : 'Log in to book'}
          </Button>
        </div>
      </div>
    </div>
  );
}
