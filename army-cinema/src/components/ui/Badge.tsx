import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'saffron' | 'green' | 'danger' | 'info' | 'warning' | 'gold';

const tones: Record<Tone, string> = {
  neutral: 'bg-white/[0.07] text-fg-muted ring-white/10',
  saffron: 'bg-saffron/15 text-saffron-soft ring-saffron/30',
  gold: 'bg-gold/15 text-gold-soft ring-gold/30',
  green: 'bg-green/15 text-green ring-green/30',
  danger: 'bg-danger/15 text-danger ring-danger/30',
  info: 'bg-info/15 text-info ring-info/30',
  warning: 'bg-warning/15 text-warning ring-warning/30',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone], className)}>
      {children}
    </span>
  );
}
