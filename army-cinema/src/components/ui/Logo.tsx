import { cn } from '@/lib/cn';
import { KerkettaSign } from './KerkettaSign';

export function LogoMark({ className }: { className?: string }) {
  return <KerkettaSign className={cn('size-10', className)} />;
}

/** Kerketta Auditorium wordmark, optionally with the sign. */
export function Logo({ className, compact, showMark = true }: { className?: string; compact?: boolean; showMark?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {showMark && <LogoMark />}
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-xl font-bold uppercase tracking-[0.14em] text-fg">Kerketta</span>
          <span className="mt-0.5 font-display text-sm font-semibold uppercase tracking-[0.34em] text-saffron">Auditorium</span>
        </span>
      )}
    </span>
  );
}
