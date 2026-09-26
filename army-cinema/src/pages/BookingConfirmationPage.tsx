import { motion } from 'framer-motion';
import { CheckCircle2, Download, Home, Printer, Ticket } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { usePageMeta } from '@/lib/seo';
import { api } from '@/services/api';
import { downloadTicketImage } from '@/components/ticket/ticketImage';
import { TicketCard } from '@/components/ticket/TicketCard';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

/** Used both right after checkout (/booking/:id) and from My Bookings (/tickets/:id). */
export default function BookingConfirmationPage({ fresh = true }: { fresh?: boolean }) {
  const { bookingId = '' } = useParams();
  const toast = useToast();
  const { data: b, loading, error, reload } = useAsync(() => api.getBooking(bookingId), [bookingId]);
  const [downloading, setDownloading] = useState(false);
  usePageMeta(b ? `Ticket ${b.code}` : 'Your ticket', 'Your e-ticket and QR code.');

  if (loading && !b) return <LoadingState className="min-h-[60vh]" />;
  if (error) return <div className="container-page py-10"><ErrorState error={error} onRetry={reload} /></div>;
  if (!b || !b.code)
    return <div className="container-page py-10"><EmptyState title="Ticket not found" action={<ButtonLink to="/my-bookings">My bookings</ButtonLink>} /></div>;

  const download = async () => {
    setDownloading(true);
    try {
      await downloadTicketImage(b);
    } catch {
      toast.error('Download failed', 'Please try again, or use Print instead.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container-page max-w-3xl py-5 sm:py-8">
      {fresh && (
        <div className="no-print">
          <Stepper current={3} />
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 15, delay: 0.1 }}
              className="mx-auto grid size-16 place-items-center rounded-full bg-green/15 text-green ring-8 ring-green/5"
            >
              <CheckCircle2 className="size-9" aria-hidden />
            </motion.span>
            <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
              {b.status === 'confirmed' ? 'Booking confirmed!' : 'Booking details'}
            </h1>
            <p className="mt-1 text-fg-muted">
              Show the QR code at the gate with your service ID card. Jai Hind!
            </p>
          </motion.div>
        </div>
      )}
      {!fresh && <h1 className="no-print mb-6 flex items-center gap-2 text-2xl font-semibold"><Ticket className="size-6 text-saffron" aria-hidden /> Your ticket</h1>}
      <div className="mt-8">
        <TicketCard booking={b} />
      </div>
      {import.meta.env.VITE_PREVIEW === '1' && (
        <p className="no-print mx-auto mt-6 max-w-md text-center text-xs text-fg-subtle">Download and Print work on the deployed site; this preview blocks them.</p>
      )}
      <div className={`no-print mx-auto mt-6 grid max-w-md gap-3 ${import.meta.env.VITE_PREVIEW === '1' ? 'hidden' : 'sm:grid-cols-3'}`}>
        <Button onClick={download} loading={downloading} disabled={b.status !== 'confirmed'}>
          <Download className="size-4" aria-hidden /> Download
        </Button>
        <Button variant="secondary" onClick={() => window.print()} disabled={b.status !== 'confirmed'}>
          <Printer className="size-4" aria-hidden /> Print
        </Button>
        <ButtonLink to="/" variant="ghost">
          <Home className="size-4" aria-hidden /> Home
        </ButtonLink>
      </div>
      {import.meta.env.VITE_PREVIEW === '1' && (
        <div className="no-print mx-auto mt-4 max-w-md">
          <ButtonLink to="/" variant="secondary" block>
            <Home className="size-4" aria-hidden /> Back to Home
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
