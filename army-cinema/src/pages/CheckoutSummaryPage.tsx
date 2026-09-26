import { ArrowLeft, Info } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useBookingDraft } from '@/context/BookingContext';
import { useToast } from '@/context/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { usePageMeta } from '@/lib/seo';
import { api } from '@/services/api';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { HoldTimer } from '@/components/booking/HoldTimer';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

export default function CheckoutSummaryPage() {
  const { bookingId = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { clear } = useBookingDraft();
  const { data: b, loading, error, reload } = useAsync(() => api.getBooking(bookingId), [bookingId], { live: false });
  const [expired, setExpired] = useState(false);
  const [leaving, setLeaving] = useState(false);
  usePageMeta('Booking summary', 'Review your booking.');
  const onExpire = useCallback(() => setExpired(true), []);

  const back = async () => {
    setLeaving(true);
    if (b?.status === 'held') await api.releaseHold(b.id);
    navigate(`/book/show/${b?.showId}/seats`);
  };

  if (loading && !b) return <LoadingState className="min-h-[60vh]" />;
  if (error) return <div className="container-page py-10"><ErrorState error={error} onRetry={reload} /></div>;
  if (!b) return <div className="container-page py-10"><EmptyState title="Booking not found" action={<ButtonLink to="/#book">Book tickets</ButtonLink>} /></div>;
  if (b.status === 'confirmed') return <Navigate to={`/booking/${b.id}`} replace />;
  if (b.status !== 'held' || expired) {
    return (
      <div className="container-page py-10">
        <EmptyState
          title="Your seat hold has expired"
          message="Seats are held for 10 minutes while you check out. Please pick your seats again."
          action={<ButtonLink to={`/book/show/${b.showId}/seats`}>Select seats again</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-5 sm:py-8">
      <Stepper current={2} />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Booking summary</h1>
        <HoldTimer expiresAt={b.holdExpiresAt} onExpire={onExpire} />
      </div>
      <div className="mt-5">
        <BookingSummary movie={b.movie} theatre={b.theatre} show={b.show} category={b.category} seats={b.seats} unitPrice={b.unitPrice} fee={b.fee} />
      </div>
      <p className="mt-4 flex gap-2 text-sm text-fg-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
        This will be your booking for the week (one per mobile number, Fri–Thu). Carry your service ID card to the theatre.
      </p>
      <div className="mt-6 grid gap-3 sm:flex sm:justify-end">
        <Button variant="secondary" size="lg" onClick={back} loading={leaving}>
          <ArrowLeft className="size-4" aria-hidden /> Back
        </Button>
        <Button
          size="lg"
          onClick={() => {
            clear();
            toast.info('Seats held', 'Complete payment before the timer runs out.', 3000);
            navigate(`/checkout/${b.id}/pay`);
          }}
        >
          Confirm Booking
        </Button>
      </div>
    </div>
  );
}
