import { motion } from 'framer-motion';
import { BadgeCheck, CalendarDays, Clock, MapPin } from 'lucide-react';
import { CATEGORY_META, seatLabel } from '@/data/layouts';
import { formatDate, formatDateTime, formatTime } from '@/lib/date';
import { cn } from '@/lib/cn';
import type { BookingDetails } from '@/types';
import { QRCode, qrPayload } from './QRCode';

const STATUS: Record<string, { label: string; cls: string }> = {
  confirmed: { label: 'Confirmed', cls: 'bg-green/15 text-green ring-green/30' },
  cancelled: { label: 'Cancelled', cls: 'bg-danger/15 text-danger ring-danger/30' },
  payment_failed: { label: 'Payment failed', cls: 'bg-danger/15 text-danger ring-danger/30' },
  held: { label: 'Awaiting confirmation', cls: 'bg-warning/15 text-warning ring-warning/30' },
  expired: { label: 'Expired', cls: 'bg-white/10 text-fg-muted ring-white/10' },
};


export function TicketCard({ booking, className }: { booking: BookingDetails; className?: string }) {
  const st = STATUS[booking.status] ?? STATUS.expired;
  const past = booking.status === 'confirmed' && new Date(`${booking.show.date}T${booking.show.time}`) < new Date();
  return (
    <motion.article
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className={cn('print-area relative mx-auto w-full max-w-md', className)}
      aria-label={`Ticket ${booking.code}`}
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-800 shadow-2xl print:border-black print:bg-white print:text-black">
        <div className="tricolour-rule" />
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow">E-ticket</p>
              <h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none tracking-wide">{booking.movie.title}</h2>
              <p className="mt-1.5 text-sm text-fg-muted print:text-black">
                {booking.movie.language} · {booking.movie.certification}
              </p>
            </div>
            <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', st.cls)}>
              <BadgeCheck className="size-3.5" aria-hidden />
              {past ? 'Used / past' : st.label}
            </span>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <div className="col-span-2">
              <dt className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Theatre</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 font-semibold">
                <MapPin className="size-4 text-saffron" aria-hidden />
                {booking.theatre.name}
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Date</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 font-semibold">
                <CalendarDays className="size-4 text-saffron" aria-hidden />
                {formatDate(booking.show.date)}
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Time</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 font-semibold">
                <Clock className="size-4 text-saffron" aria-hidden />
                {formatTime(booking.show.time)}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">
                Seats · {CATEGORY_META[booking.category].full}
              </dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {booking.seats.map((s) => (
                  <span key={s} className="rounded-lg bg-saffron/15 px-2.5 py-1 font-semibold text-saffron-soft print:border print:border-black print:text-black">
                    {seatLabel(s)}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Name</dt>
              <dd className="mt-0.5 font-semibold">{booking.customerName}</dd>
            </div>
            <div>
              <dt className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Tickets</dt>
              <dd className="mt-0.5 font-semibold">{booking.seats.length}</dd>
            </div>
          </dl>
        </div>

        {/* perforation with punched cut-outs */}
        <div className="relative h-6" aria-hidden>
          <div className="absolute inset-x-6 top-1/2 border-t-2 border-dashed border-white/15" />
          <div className="absolute -left-3 top-0 size-6 rounded-full bg-ink-900 print:bg-white" />
          <div className="absolute -right-3 top-0 size-6 rounded-full bg-ink-900 print:bg-white" />
        </div>

        <div className="flex flex-col items-center gap-3 p-5 pt-3 sm:p-6 sm:pt-3">
          <QRCode value={qrPayload(booking.code)} size={176} />
          <p className="font-display text-2xl font-bold tracking-widest">{booking.code}</p>
          <p className="text-center text-xs text-fg-subtle print:text-black">
            Show this QR at the gate with your service ID card · Booked {formatDateTime(booking.createdAt)}
          </p>
        </div>
      </div>
    </motion.article>
  );
}
