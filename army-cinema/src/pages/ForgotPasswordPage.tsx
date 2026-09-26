import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import { usePageMeta } from '@/lib/seo';
import { passwordIssues } from '@/lib/validation';
import { api } from '@/services/api';
import { toAppError } from '@/services/errors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { AuthShell } from './LoginPage';

export default function ForgotPasswordPage() {
  usePageMeta('Reset password', 'Reset your Kerketta Auditorium booking password.');
  const navigate = useNavigate();
  const toast = useToast();
  const [identifier, setIdentifier] = useState('');
  const [sent, setSent] = useState<{ demoCode?: string } | null>(null);
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (!sent) {
        if (!identifier.trim()) throw new Error('Enter your Service ID, mobile or email.');
        setSent(await api.requestPasswordReset(identifier));
      } else {
        const issue = passwordIssues(pw);
        if (issue) throw new Error(issue);
        await api.resetPassword(identifier, code, pw);
        toast.success('Password updated', 'Log in with your new password.');
        navigate('/login');
      }
    } catch (err) {
      setError(err instanceof Error && !('code' in err) ? err.message : toAppError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Reset password" subtitle="We’ll send a one-time code to your registered contact.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Service ID, mobile or email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} disabled={!!sent} autoComplete="username" />
        {sent && (
          <>
            <p className="rounded-xl bg-white/[0.04] px-3 py-2 text-sm text-fg-muted">
              If an account exists, a code has been sent.
              {sent.demoCode && (
                <>
                  {' '}
                  <span className="text-info">Demo code: <strong className="tracking-widest">{sent.demoCode}</strong></span>
                </>
              )}
            </p>
            <Input label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
            <Input label="New password" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} hint="8+ characters with a number." />
          </>
        )}
        {error && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger ring-1 ring-danger/25">{error}</p>}
        <Button type="submit" size="lg" block loading={busy}>
          {sent ? 'Update password' : 'Send code'}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm">
        <Link to="/login" className="text-saffron-soft hover:underline">Back to log in</Link>
      </p>
    </AuthShell>
  );
}
