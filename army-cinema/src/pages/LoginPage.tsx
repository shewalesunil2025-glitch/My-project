import { motion } from 'framer-motion';
import { KeyRound, Lock, MessageSquareText, ShieldCheck, UserRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ADMIN_PASSWORD, DEMO_PASSWORD, SEED_USERS } from '@/data/seed';
import { cn } from '@/lib/cn';
import { usePageMeta } from '@/lib/seo';
import { api } from '@/services/api';
import { toAppError } from '@/services/errors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { LogoMark } from '@/components/ui/Logo';

export function AuthShell({ title, subtitle, children, aside }: { title: string; subtitle: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="container-page grid gap-8 py-8 sm:py-14 lg:grid-cols-[1fr_0.9fr] lg:items-start">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card mx-auto w-full max-w-lg overflow-hidden">
        <div className="tricolour-rule" />
        <div className="p-5 sm:p-8">
          <LogoMark className="size-11" />
          <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </motion.div>
      {aside && <div className="mx-auto w-full max-w-lg">{aside}</div>}
    </div>
  );
}

export function SecureNote() {
  return (
    <div className="mt-6 flex gap-3 rounded-2xl bg-white/[0.03] p-4 text-xs text-fg-muted ring-1 ring-white/[0.06]">
      <ShieldCheck className="size-5 shrink-0 text-green" aria-hidden />
      <p>
        Secure sign-in. Your password is never stored in plain text and sessions expire automatically after inactivity. We only keep the details needed
        to verify eligibility and issue tickets.
      </p>
    </div>
  );
}

function DemoAccounts({ onPick }: { onPick: (id: string, pw: string) => void }) {
  if (api.mode !== 'demo') return null;
  return (
    <div className="card p-5">
      <p className="eyebrow">Demo accounts</p>
      <p className="mt-1 text-sm text-fg-muted">Tap one to fill the form.</p>
      <ul className="mt-4 space-y-2">
        {SEED_USERS.map((u) => (
          <li key={u.id}>
            <button
              onClick={() => onPick(u.mobile, u.role === 'admin' ? ADMIN_PASSWORD : DEMO_PASSWORD)}
              className="flex w-full items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 text-left text-sm ring-1 ring-white/[0.06] hover:ring-saffron/40"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {u.rankTitle} {u.fullName}
                </span>
                <span className="block text-xs text-fg-subtle">
                  {u.mobile} · {u.role === 'admin' ? 'Admin' : u.rankCategory} · {u.verification}
                </span>
              </span>
              <UserRound className="size-4 shrink-0 text-fg-subtle" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-fg-subtle">
        Password: <code className="text-fg">{DEMO_PASSWORD}</code> (admin: <code className="text-fg">{ADMIN_PASSWORD}</code>)
      </p>
    </div>
  );
}

export default function LoginPage() {
  usePageMeta('Log in', 'Log in with your Service ID or mobile number to book tickets.');
  const [params] = useSearchParams();
  const next = params.get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
  const navigate = useNavigate();
  const toast = useToast();
  const { setUser } = useAuth();
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState<{ channel: string; demoCode?: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const done = (name: string) => {
    toast.success(`Welcome, ${name}`, 'You’re logged in.');
    navigate(safeNext, { replace: true });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) return setError('Enter your Service ID, mobile number or email.');
    setBusy(true);
    try {
      if (mode === 'password') {
        if (!password) return setError('Enter your password.');
        const u = await api.login(identifier, password);
        setUser(u);
        done(`${u.rankTitle} ${u.fullName}`.trim());
      } else if (!otpSent) {
        const res = await api.requestOtp(identifier);
        setOtpSent(res);
        toast.info('Code sent', `We sent a 6-digit code to ${res.channel}.`);
      } else {
        const u = await api.verifyOtp(identifier, otp);
        setUser(u);
        done(`${u.rankTitle} ${u.fullName}`.trim());
      }
    } catch (err) {
      setError(toAppError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Log in"
      subtitle="Army personnel login — use your Service ID, mobile number or email."
      aside={
        <DemoAccounts
          onPick={(id, pw) => {
            setMode('password');
            setIdentifier(id);
            setPassword(pw);
          }}
        />
      }
    >
      <div role="tablist" aria-label="Login method" className="grid grid-cols-2 rounded-2xl bg-white/[0.04] p-1 ring-1 ring-white/[0.06]">
        {(
          [
            ['password', 'Password', KeyRound],
            ['otp', 'One-time code', MessageSquareText],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            role="tab"
            aria-selected={mode === k}
            onClick={() => {
              setMode(k);
              setError('');
              setOtpSent(null);
            }}
            className={cn('flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold', mode === k ? 'bg-white/10 text-fg' : 'text-fg-muted')}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <Input
          label="Service ID, mobile or email"
          autoComplete="username"
          placeholder="e.g. IC-78231K or 98765 00001"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          disabled={!!otpSent}
          icon={<UserRound className="size-4" />}
        />
        {mode === 'password' ? (
          <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock className="size-4" />} />
        ) : (
          otpSent && (
            <>
              <Input
                label="6-digit code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                hint={`Sent to ${otpSent.channel}. Valid for 5 minutes.`}
              />
              {otpSent.demoCode && (
                <p className="rounded-xl bg-info/10 px-3 py-2 text-sm text-info ring-1 ring-info/25">
                  Demo mode — no SMS is sent. Your code is <strong className="tracking-widest">{otpSent.demoCode}</strong>
                </p>
              )}
            </>
          )
        )}
        {error && (
          <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger ring-1 ring-danger/25">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-saffron-soft hover:underline">
            Forgot password?
          </Link>
          {otpSent && (
            <button type="button" className="text-fg-muted hover:text-fg" onClick={() => setOtpSent(null)}>
              Change number
            </button>
          )}
        </div>
        <Button type="submit" size="lg" block loading={busy}>
          {mode === 'otp' && !otpSent ? 'Send code' : 'Log in'}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-fg-muted">
        New here?{' '}
        <Link to="/register" className="font-semibold text-saffron-soft hover:underline">
          Register &amp; verify
        </Link>
      </p>
      <SecureNote />
    </AuthShell>
  );
}
