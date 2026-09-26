import { Check, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { CATEGORY_META } from '@/data/layouts';
import { useAsync } from '@/hooks/useAsync';
import { formatDateTime } from '@/lib/date';
import { usePageMeta } from '@/lib/seo';
import { api } from '@/services/api';
import { toAppError } from '@/services/errors';
import type { Profile, VerificationStatus } from '@/types';
import { AdminPageHeader } from '@/components/admin/AdminLayout';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/States';

const TONE: Record<VerificationStatus, 'green' | 'warning' | 'danger'> = { verified: 'green', pending: 'warning', rejected: 'danger' };

export default function AdminUsersPage() {
  usePageMeta('Manage users');
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => api.adminListUsers(), []);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<VerificationStatus | 'all'>('all');
  const [working, setWorking] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      (data ?? [])
        .filter((u) => filter === 'all' || u.verification === filter)
        .filter((u) => !q || `${u.fullName} ${u.serviceId} ${u.mobile} ${u.email}`.toLowerCase().includes(q.toLowerCase())),
    [data, q, filter],
  );

  const setStatus = async (u: Profile, status: VerificationStatus) => {
    setWorking(u.id);
    try {
      await api.adminSetVerification(u.id, status);
      toast.success(status === 'verified' ? 'User verified' : 'Verification rejected', `${u.rankTitle} ${u.fullName}`);
      reload();
    } catch (e) {
      toast.error('Couldn’t update', toAppError(e).message);
    } finally {
      setWorking(null);
    }
  };

  const columns: Column<Profile>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (u) => (
        <div>
          <p className="font-medium">{u.rankTitle} {u.fullName}</p>
          <p className="text-xs text-fg-subtle">{u.role === 'admin' ? 'Admin' : CATEGORY_META[u.rankCategory].full}</p>
        </div>
      ),
    },
    { key: 'sid', header: 'Service ID', cell: (u) => <span className="font-mono text-xs">{u.serviceId}</span> },
    { key: 'mobile', header: 'Mobile', cell: (u) => u.mobile },
    { key: 'email', header: 'Email', cell: (u) => <span className="line-clamp-1">{u.email}</span>, hideSm: true },
    { key: 'ver', header: 'Verification', cell: (u) => <Badge tone={TONE[u.verification]}>{u.verification}</Badge> },
    { key: 'reg', header: 'Registered', cell: (u) => <span className="text-xs text-fg-muted">{formatDateTime(u.createdAt)}</span>, hideSm: true },
    {
      key: 'actions',
      header: 'Review',
      className: 'text-right',
      cell: (u) =>
        u.role === 'admin' ? null : (
          <div className="flex justify-end gap-1">
            {u.verification !== 'verified' && (
              <Button size="sm" variant="secondary" loading={working === u.id} onClick={() => setStatus(u, 'verified')}>
                <Check className="size-4" aria-hidden /> Approve
              </Button>
            )}
            {u.verification !== 'rejected' && (
              <Button size="sm" variant="ghost" className="hover:text-danger" disabled={working === u.id} onClick={() => setStatus(u, 'rejected')} aria-label={`Reject ${u.fullName}`}>
                <X className="size-4" />
              </Button>
            )}
          </div>
        ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Registered personnel and their verification status. Verification uses the demo registry until an authorised service is connected."
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
          <label htmlFor="u-q" className="sr-only">Search users</label>
          <input id="u-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, service ID, mobile…" className="h-11 w-full rounded-xl border border-white/10 bg-ink-950/60 pl-10 pr-3 text-[16px] focus:border-saffron/60 focus:outline-none" />
        </div>
        {(['all', 'pending', 'verified', 'rejected'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className={`h-11 rounded-xl px-4 text-sm font-medium capitalize ring-1 ring-inset ${filter === f ? 'bg-saffron/15 text-saffron-soft ring-saffron/40' : 'text-fg-muted ring-white/10'}`}>
            {f}
          </button>
        ))}
      </div>
      {error ? <ErrorState error={error} onRetry={reload} /> : <DataTable caption="Users" columns={columns} rows={rows} rowKey={(u) => u.id} loading={loading} empty="No users match." />}
    </>
  );
}
