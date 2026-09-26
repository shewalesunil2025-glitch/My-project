import { cn } from '@/lib/cn';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('size-9', className)} aria-hidden>
      <defs>
        <linearGradient id="lm-t" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF9933" />
          <stop offset=".5" stopColor="#F5F7FB" />
          <stop offset="1" stopColor="#1DA01D" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#0b1731" />
      <path d="M32 9 50 17v14c0 11-7.6 20.4-18 24-10.4-3.6-18-13-18-24V17z" fill="none" stroke="url(#lm-t)" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="m32 21 3.4 7 7.6 1.1-5.5 5.3 1.3 7.6L32 38.4 25.2 42l1.3-7.6-5.5-5.3 7.6-1.1z" fill="#E9B95C" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-xl font-bold uppercase tracking-[0.14em] text-fg">
            Veer <span className="text-saffron">Cinema</span>
          </span>
          <span className="mt-1 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-fg-subtle">For those who serve</span>
        </span>
      )}
    </span>
  );
}
