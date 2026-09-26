import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const base =
  'relative inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,border-color,color,box-shadow,opacity] duration-200 disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-saffron to-gold text-ink-950 shadow-glow hover:brightness-110 active:brightness-95',
  secondary: 'bg-white/[0.07] text-fg ring-1 ring-inset ring-white/10 hover:bg-white/[0.12]',
  outline: 'text-fg ring-1 ring-inset ring-saffron/50 hover:bg-saffron/10',
  ghost: 'text-fg-muted hover:bg-white/[0.06] hover:text-fg',
  danger: 'bg-danger/15 text-danger ring-1 ring-inset ring-danger/30 hover:bg-danger/25',
};

// Mobile-first: every size keeps a ≥44px touch target except `sm` used in dense tables.
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-[0.95rem]',
  lg: 'h-13 px-7 text-base min-h-[3.25rem]',
};

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, block, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={{ scale: 0.97 }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], block && 'w-full', className)}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </motion.button>
  );
});

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  block,
  className,
  ...rest
}: LinkProps & { variant?: Variant; size?: Size; block?: boolean }) {
  return <Link className={cn(base, variants[variant], sizes[size], block && 'w-full', className)} {...rest} />;
}
