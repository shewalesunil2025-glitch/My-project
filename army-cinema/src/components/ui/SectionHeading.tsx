import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
  as: Tag = 'h2',
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  as?: 'h1' | 'h2';
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <Tag className={cn('font-semibold tracking-tight text-fg', Tag === 'h1' ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl')}>{title}</Tag>
        {description && <p className="mt-2 text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
