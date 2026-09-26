import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

const control =
  'w-full rounded-xl border bg-ink-950/60 px-4 text-[16px] text-fg placeholder:text-fg-subtle transition-colors focus:outline-none focus:border-saffron/70 focus:ring-2 focus:ring-saffron/25 disabled:opacity-60';

interface WrapProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  id: string;
  children: ReactNode;
  optional?: boolean;
}

function Wrap({ label, hint, error, id, children, optional }: WrapProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium text-fg">
        {label}
        {optional && <span className="text-xs font-normal text-fg-subtle">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  icon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, optional, icon, className, id: idProp, type, ...rest },
  ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';
  return (
    <Wrap label={label} hint={hint} error={error} id={id} optional={optional}>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle">{icon}</span>}
        <input
          ref={ref}
          id={id}
          type={isPassword && reveal ? 'text' : type}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={cn(
            control,
            'h-12',
            icon && 'pl-11',
            isPassword && 'pr-12',
            error ? 'border-danger/70' : 'border-white/10',
            className,
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="absolute right-1.5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-fg-subtle hover:text-fg"
            aria-label={reveal ? 'Hide password' : 'Show password'}
          >
            {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </Wrap>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: ReactNode; error?: string };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id: idProp, children, ...rest },
  ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <Wrap label={label} hint={hint} error={error} id={id}>
      <select
        ref={ref}
        id={id}
        aria-invalid={!!error || undefined}
        className={cn(control, 'h-12 appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10', error ? 'border-danger/70' : 'border-white/10', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a9b4cc' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...rest}
      >
        {children}
      </select>
    </Wrap>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: ReactNode; error?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id: idProp, ...rest },
  ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <Wrap label={label} hint={hint} error={error} id={id}>
      <textarea
        ref={ref}
        id={id}
        aria-invalid={!!error || undefined}
        className={cn(control, 'min-h-28 py-3', error ? 'border-danger/70' : 'border-white/10', className)}
        {...rest}
      />
    </Wrap>
  );
});
