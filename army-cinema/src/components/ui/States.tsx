import { motion } from 'framer-motion';
import { AlertTriangle, Film, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { AppError } from '@/services/errors';
import { Button } from './Button';

export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn('flex flex-col items-center justify-center gap-3 py-16 text-fg-muted', className)}>
      <Loader2 className="size-7 animate-spin text-saffron" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-xl bg-white/[0.06]', className)} />;
}

export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  message?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('card flex flex-col items-center px-6 py-12 text-center', className)}
    >
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-white/[0.05] text-saffron-soft">
        {icon ?? <Film className="size-6" aria-hidden />}
      </div>
      <h3 className="text-lg font-semibold text-fg">{title}</h3>
      {message && <p className="mt-1.5 max-w-md text-sm text-fg-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

export function ErrorState({ error, onRetry, className }: { error: AppError; onRetry?: () => void; className?: string }) {
  const offline = error.code === 'NETWORK';
  return (
    <EmptyState
      className={className}
      icon={offline ? <WifiOff className="size-6" /> : <AlertTriangle className="size-6" />}
      title={offline ? 'You’re offline' : 'Something went wrong'}
      message={error.message}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            <RefreshCw className="size-4" /> Try again
          </Button>
        )
      }
    />
  );
}
