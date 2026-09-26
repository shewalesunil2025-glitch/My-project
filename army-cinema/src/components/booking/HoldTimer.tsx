import { Timer } from 'lucide-react';
import { useEffect } from 'react';
import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/cn';

export function HoldTimer({ expiresAt, onExpire }: { expiresAt: string | null; onExpire?: () => void }) {
  const left = useCountdown(expiresAt);
  const expired = !!expiresAt && left <= 0;
  useEffect(() => {
    if (expired) onExpire?.();
  }, [expired, onExpire]);
  if (!expiresAt) return null;
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const urgent = left < 2 * 60 * 1000;
  return (
    <div
      role="timer"
      aria-live={urgent ? 'assertive' : 'off'}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset',
        urgent ? 'bg-danger/10 text-danger ring-danger/30' : 'bg-green/10 text-green ring-green/25',
      )}
    >
      <Timer className="size-4" aria-hidden />
      {expired ? 'Hold expired' : `Seats held for ${m}:${String(s).padStart(2, '0')}`}
    </div>
  );
}
