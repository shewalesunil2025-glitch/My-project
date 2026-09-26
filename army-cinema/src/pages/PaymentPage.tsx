import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Building2, CreditCard, Lock, ShieldCheck, Smartphone } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { cn } from '@/lib/cn';
import { formatINR } from '@/lib/format';
import { usePageMeta } from '@/lib/seo';
import { api } from '@/services/api';
import { toAppError } from '@/services/errors';
import { paymentGateway } from '@/services/payments';
import type { PaymentMethod } from '@/types';
import { HoldTimer } from '@/components/booking/HoldTimer';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Stepper } from '@/components/ui/Stepper';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

const METHODS: { key: PaymentMethod; label: string; sub: string; icon: typeof CreditCard }[] = [
  { key: 'upi', label: 'UPI', sub: 'Any UPI app', icon: Smartphone },
  { key: 'card', label: 'Card', sub: 'Debit / credit', icon: CreditCard },
  { key: 'counter', label: 'Pay at counter', sub: 'Cash / UPI at the theatre', icon: Building2 },
];

export default function PaymentPage() {
  const { bookingId = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: b, loading, error, reload } = useAsync(() => api.getBooking(bookingId), [bookingId], { live: false });
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  usePageMeta('Payment', 'Complete your booking.');
  const onExpire = useCallback(() => setExpired(true), []);

  if (loading && !b) return <LoadingState className="min-h-[60vh]" />;
  if (error) return <div className="container-page py-10"><ErrorState error={error} onRetry={reload} /></div>;
  if (!b) return <div className="container-page py-10"><EmptyState title="Booking not found" action={<ButtonLink to="/movies">Browse movies</ButtonLink>} /></div>;
  if (b.status === 'confirmed') return <Navigate to={`/booking/${b.id}`} replace />;
  if (b.status !== 'held' || expired) {
    return (
      <div className="container-page py-10">
        <EmptyState
          title="Your seat hold has expired"
          message="No payment was taken. Please select your seats again."
          action={<ButtonLink to={`/book/show/${b.showId}/seats`}>Select seats again</ButtonLink>}
        />
      </div>
    );
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (method === 'upi' && !/^[\w.-]{2,}@[a-z]{2,}$/i.test(upiId.trim())) e.upi = 'Enter a valid UPI ID, e.g. name@bank';
    if (method === 'card') {
      const digits = card.number.replace(/\s/g, '');
      if (!/^\d{16}$/.test(digits)) e.number = 'Enter the 16-digit card number';
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) e.expiry = 'Use MM/YY';
      if (!/^\d{3}$/.test(card.cvv)) e.cvv = '3 digits';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const pay = async () => {
    if (!validate()) return;
    setPaying(true);
    setFailure(null);
    try {
      const result = await paymentGateway.pay({
        bookingId: b.id,
        bookingLabel: `${b.movie.title} · ${b.seats.length} seat(s)`,
        amount: b.total,
        method,
        details: { upiId, cardNumber: card.number, cardExpiry: card.expiry, cardCvv: card.cvv },
      });
      if (result.status === 'failed') {
        setFailure(result.message ?? 'The payment could not be completed.');
        return;
      }
      const confirmed = await api.confirmBooking(b.id, { method, reference: result.reference, paid: result.status === 'success' });
      toast.success('Booking confirmed', `Ticket ${confirmed.code} is ready. Jai Hind!`);
      navigate(`/booking/${confirmed.id}`, { replace: true });
    } catch (e) {
      const err = toAppError(e);
      if (err.code === 'HOLD_EXPIRED') setExpired(true);
      else setFailure(err.message);
    } finally {
      setPaying(false);
    }
  };

  const cancel = async () => {
    await api.releaseHold(b.id);
    navigate(`/book/show/${b.showId}/seats`);
  };

  return (
    <div className="container-page max-w-3xl py-5 sm:py-8">
      <Stepper current={3} />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Payment</h1>
        <HoldTimer expiresAt={b.holdExpiresAt} onExpire={onExpire} />
      </div>

      <div className="card mt-5 flex items-center justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="truncate font-semibold">{b.movie.title}</p>
          <p className="text-sm text-fg-muted">
            {b.seats.length} ticket(s) · {b.theatre.name}
          </p>
        </div>
        <p className="font-display text-3xl font-bold text-gold-soft">{formatINR(b.total)}</p>
      </div>

      <fieldset className="mt-6">
        <legend className="mb-3 text-sm font-semibold text-fg-muted">Choose a payment method</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {METHODS.map((m) => (
            <label
              key={m.key}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-saffron',
                method === m.key ? 'border-saffron/70 bg-saffron/10' : 'border-white/10 hover:border-white/25',
              )}
            >
              <input type="radio" name="method" value={m.key} checked={method === m.key} onChange={() => setMethod(m.key)} className="sr-only" />
              <m.icon className={cn('size-6', method === m.key ? 'text-saffron' : 'text-fg-subtle')} aria-hidden />
              <span>
                <span className="block font-semibold">{m.label}</span>
                <span className="block text-xs text-fg-subtle">{m.sub}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="card mt-4 p-4 sm:p-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={method} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {method === 'upi' && (
              <Input label="UPI ID" placeholder="yourname@bank" value={upiId} onChange={(e) => setUpiId(e.target.value)} error={errors.upi} autoComplete="off" inputMode="email" hint="Demo: any UPI ID succeeds · use fail@upi to test a failed payment" />
            )}
            {method === 'card' && (
              <div className="grid gap-4 sm:grid-cols-[1fr_120px_100px]">
                <Input
                  label="Card number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4111 1111 1111 1111"
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: e.target.value.replace(/[^\d]/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() })}
                  error={errors.number}
                  hint="Demo: 4000 0000 0000 0002 simulates a decline"
                />
                <Input label="Expiry" placeholder="MM/YY" inputMode="numeric" autoComplete="cc-exp" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value.replace(/[^\d/]/g, '').slice(0, 5) })} error={errors.expiry} />
                <Input label="CVV" type="password" inputMode="numeric" autoComplete="cc-csc" placeholder="•••" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })} error={errors.cvv} />
              </div>
            )}
            {method === 'counter' && (
              <p className="text-sm text-fg-muted">
                Your seats are confirmed now and you pay {formatINR(b.total)} at the theatre counter before the show — just like the station auditorium’s offline
                confirmation. Please arrive 20 minutes early.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {failure && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="mt-4 flex gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm">
            <AlertTriangle className="size-5 shrink-0 text-danger" aria-hidden />
            <div>
              <p className="font-semibold text-fg">Payment failed</p>
              <p className="text-fg-muted">{failure} Your seats are still held — you can try again or pick another method.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 grid gap-3 sm:flex sm:justify-end">
        <Button variant="ghost" size="lg" onClick={cancel} disabled={paying}>
          Cancel &amp; release seats
        </Button>
        <Button size="lg" onClick={pay} loading={paying}>
          <Lock className="size-4" aria-hidden />
          {method === 'counter' ? 'Confirm booking' : `Pay ${formatINR(b.total)}`}
        </Button>
      </div>
      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-fg-subtle">
        <ShieldCheck className="size-4" aria-hidden />
        {paymentGateway.simulated ? 'Simulated payment — no money is charged in this prototype.' : 'Payments are processed securely.'}
      </p>
    </div>
  );
}
