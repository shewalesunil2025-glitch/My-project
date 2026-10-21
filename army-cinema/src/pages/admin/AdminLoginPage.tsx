import { Lock, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ADMIN_PASSWORD, SEED_USERS } from '@/data/seed';
import { usePageMeta } from '@/lib/seo';
import { api } from '@/services/api';
import { toAppError } from '@/services/errors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Logo } from '@/components/ui/Logo';

export default function AdminLoginPage() {
  usePageMeta('Admin login');
  const { user, setUser, logout } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const next = params.get('next')?.startsWith('/admin') ? params.get('next')! : '/admin';

  if (user?.role === 'admin') return <Navigate to={next} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await api.login(email, password);
      if (u.role !== 'admin') {
        await logout();
        setError('This account doesn’t have admin access.');
        return;
      }
      setUser(u);
      navigate(next, { replace: true });
    } catch (err) {
      setError(toAppError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const admin = SEED_USERS.find((u) => u.role === 'admin')!;
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="card w-full max-w-md overflow-hidden">
        <div className="tricolour-rule" />
        <div className="p-6 sm:p-8">
          <Logo />
          <h1 className="mt-6 flex items-center gap-2 text-2xl font-semibold">
            <Lock className="size-5 text-saffron" aria-hidden /> Station admin
          </h1>
          <p className="mt-1 text-sm text-fg-muted">Restricted area. All admin actions are recorded.</p>
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Input label="Email or Service ID" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger ring-1 ring-danger/25">{error}</p>}
            <Button type="submit" size="lg" block loading={busy}>Log in</Button>
          </form>
          {api.mode === 'demo' && (
            <button
              onClick={() => {
                setEmail(admin.email);
                setPassword(ADMIN_PASSWORD);
              }}
              className="mt-4 flex w-full items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5 text-left text-xs text-fg-muted ring-1 ring-white/[0.06] hover:ring-saffron/40"
            >
              <ShieldCheck className="size-4 text-green" aria-hidden />
              Demo admin: {admin.email} / {ADMIN_PASSWORD} — tap to fill
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
