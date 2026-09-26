import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, CircleAlert, Clock3, FlaskConical, IdCard, Mail, Phone, UserRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { CATEGORY_META } from '@/data/layouts';
import { MOCK_REGISTRY } from '@/data/seed';
import { usePageMeta } from '@/lib/seo';
import { normalizeMobile, normalizeServiceId } from '@/lib/sanitize';
import { isValidEmail, isValidMobile, isValidName, isValidServiceId, passwordIssues, type FieldErrors } from '@/lib/validation';
import { api, type VerificationResult } from '@/services/api';
import { toAppError } from '@/services/errors';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { AuthShell, SecureNote } from './LoginPage';

type F = 'fullName' | 'serviceId' | 'mobile' | 'email' | 'password' | 'confirm';

function validate(v: Record<F, string>): FieldErrors<F> {
  const e: FieldErrors<F> = {};
  if (!isValidName(v.fullName)) e.fullName = 'Enter your full name as in your service records (letters only).';
  if (!isValidServiceId(v.serviceId)) e.serviceId = 'Use a valid format: IC-12345A, JC-123456A or 12345678A.';
  if (!isValidMobile(v.mobile)) e.mobile = 'Enter a valid 10-digit Indian mobile number.';
  if (!isValidEmail(v.email)) e.email = 'Enter a valid email address.';
  const pw = passwordIssues(v.password);
  if (pw) e.password = pw;
  if (v.confirm !== v.password) e.confirm = 'Passwords don’t match.';
  return e;
}

function DemoRegistry() {
  if (api.mode !== 'demo') return null;
  return (
    <div className="card p-5">
      <p className="eyebrow flex items-center gap-2">
        <FlaskConical className="size-3.5" aria-hidden /> Demo verification
      </p>
      <p className="mt-2 text-sm text-fg-muted">
        No real military database is connected. Verification checks a small <strong className="text-fg">mock registry</strong>. Use one of these unregistered
        records (name must match):
      </p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {MOCK_REGISTRY.filter((r) => !['IC-78231K', 'JC-452190P', '15478231F'].includes(r.serviceId)).map((r) => (
          <li key={r.serviceId} className="flex justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
            <code className="text-fg">{r.serviceId}</code>
            <span className="truncate text-fg-muted">{r.fullName}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-fg-subtle">Any other correctly formatted ID is accepted as “pending” and needs admin approval.</p>
    </div>
  );
}

export default function RegisterPage() {
  usePageMeta('Register', 'Create your account and verify your service details to start booking.');
  const navigate = useNavigate();
  const toast = useToast();
  const { setUser } = useAuth();
  const [v, setV] = useState<Record<F, string>>({ fullName: '', serviceId: '', mobile: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<FieldErrors<F>>({});
  const [check, setCheck] = useState<VerificationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [done, setDone] = useState<VerificationResult | null>(null);

  const set = (k: F) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setV((cur) => ({ ...cur, [k]: e.target.value }));
    if (k === 'serviceId' || k === 'fullName') setCheck(null);
    if (errors[k]) setErrors((cur) => ({ ...cur, [k]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    const errs = validate(v);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`reg-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      if (!check) {
        // Step 1 — verify service details
        const res = await api.checkServiceRecord(v.serviceId, v.fullName);
        setCheck(res);
        if (res.status === 'rejected') setErrors({ serviceId: res.message });
        return;
      }
      // Step 2 — create the account
      const { profile, verification } = await api.register({
        fullName: v.fullName,
        serviceId: normalizeServiceId(v.serviceId),
        mobile: normalizeMobile(v.mobile),
        email: v.email,
        password: v.password,
      });
      setUser(profile);
      setDone(verification);
      toast.success('Account created', verification.status === 'verified' ? 'You’re verified and ready to book.' : 'We’ll notify you once approved.');
    } catch (err) {
      setFormError(toAppError(err).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    const verified = done.status === 'verified';
    return (
      <AuthShell title={verified ? 'You’re verified — Jai Hind!' : 'Registration received'} subtitle={done.message}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center py-4 text-center">
          <span className={`grid size-16 place-items-center rounded-full ${verified ? 'bg-green/15 text-green' : 'bg-warning/15 text-warning'}`}>
            {verified ? <BadgeCheck className="size-9" aria-hidden /> : <Clock3 className="size-9" aria-hidden />}
          </span>
          <p className="mt-4 text-fg-muted">
            {verified
              ? `Your enclosure: ${CATEGORY_META[done.rankCategory!].full}. You can book up to 4 seats, once per week.`
              : 'Your Service ID couldn’t be matched automatically. The station admin will review it — you can browse movies meanwhile.'}
          </p>
          <ButtonLink to={verified ? '/movies' : '/profile'} size="lg" className="mt-6">
            {verified ? 'Start booking' : 'View my status'}
          </ButtonLink>
        </motion.div>
      </AuthShell>
    );
  }

  const status = check?.status;
  return (
    <AuthShell title="Register" subtitle="For serving Army personnel. We verify your service details before your first booking." aside={<DemoRegistry />}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input id="reg-fullName" label="Full name" autoComplete="name" value={v.fullName} onChange={set('fullName')} error={errors.fullName} icon={<UserRound className="size-4" />} />
        <Input
          id="reg-serviceId"
          label="Army / Service ID"
          autoCapitalize="characters"
          placeholder="IC-12345A"
          value={v.serviceId}
          onChange={set('serviceId')}
          error={errors.serviceId}
          hint="Personal number exactly as on your ID card."
          icon={<IdCard className="size-4" />}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="reg-mobile" label="Mobile" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" value={v.mobile} onChange={set('mobile')} error={errors.mobile} icon={<Phone className="size-4" />} />
          <Input id="reg-email" label="Email" type="email" autoComplete="email" value={v.email} onChange={set('email')} error={errors.email} icon={<Mail className="size-4" />} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="reg-password" label="Password" type="password" autoComplete="new-password" value={v.password} onChange={set('password')} error={errors.password} hint="8+ characters with a number." />
          <Input id="reg-confirm" label="Confirm password" type="password" autoComplete="new-password" value={v.confirm} onChange={set('confirm')} error={errors.confirm} />
        </div>

        <AnimatePresence>
          {check && status !== 'rejected' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`flex gap-3 overflow-hidden rounded-2xl p-4 text-sm ring-1 ${status === 'verified' ? 'bg-green/10 ring-green/25' : 'bg-warning/10 ring-warning/25'}`}
              role="status"
            >
              {status === 'verified' ? <BadgeCheck className="size-5 shrink-0 text-green" aria-hidden /> : <CircleAlert className="size-5 shrink-0 text-warning" aria-hidden />}
              <div>
                <p className="font-semibold text-fg">
                  {status === 'verified' ? `Verified · ${check.rankTitle} · ${CATEGORY_META[check.rankCategory!].full}` : 'Manual review needed'}
                </p>
                <p className="text-fg-muted">{check.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {formError && (
          <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger ring-1 ring-danger/25">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" block loading={busy}>
          {check ? 'Create account' : 'Verify service details'}
        </Button>
        <p className="text-center text-xs text-fg-subtle">Step {check ? 2 : 1} of 2 · {check ? 'Create your account' : 'Verification'}</p>
      </form>
      <p className="mt-5 text-center text-sm text-fg-muted">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-saffron-soft hover:underline">
          Log in
        </Link>
      </p>
      <SecureNote />
      <p className="mt-4 text-center text-xs text-fg-subtle">
        By registering you confirm you are eligible serving personnel. This platform is independent and not an official government service.{' '}
        <button type="button" className="underline" onClick={() => navigate('/')}>
          Learn more
        </button>
      </p>
    </AuthShell>
  );
}
