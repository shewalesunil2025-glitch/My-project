import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export const BOOKING_STEPS = ['Show', 'Seats', 'Summary', 'Payment', 'Ticket'] as const;

/** "Step n of 5" progress for the booking funnel. */
export function Stepper({ current }: { current: number }) {
  return (
    <nav aria-label="Booking progress" className="w-full">
      <p className="sr-only">
        Step {current + 1} of {BOOKING_STEPS.length}: {BOOKING_STEPS[current]}
      </p>
      <ol className="flex items-center gap-1.5 sm:gap-3" aria-hidden>
        {BOOKING_STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex flex-1 items-center gap-1.5 sm:gap-3">
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors',
                  done && 'bg-green text-ink-950',
                  active && 'bg-gradient-to-br from-saffron to-gold text-ink-950',
                  !done && !active && 'bg-white/[0.07] text-fg-subtle',
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn('hidden text-sm sm:inline', active ? 'font-semibold text-fg' : 'text-fg-subtle')}>{label}</span>
              {i < BOOKING_STEPS.length - 1 && (
                <span className="relative h-0.5 flex-1 overflow-hidden rounded bg-white/[0.08]">
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-saffron to-green"
                    initial={false}
                    animate={{ width: done ? '100%' : '0%' }}
                    transition={{ duration: 0.4 }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs font-medium text-fg-subtle sm:hidden">
        Step {current + 1} of {BOOKING_STEPS.length} · <span className="text-fg">{BOOKING_STEPS[current]}</span>
      </p>
    </nav>
  );
}
