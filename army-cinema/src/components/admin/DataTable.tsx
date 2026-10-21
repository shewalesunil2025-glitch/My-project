import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { EmptyState, Skeleton } from '@/components/ui/States';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Hide on small screens */
  hideSm?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  empty = 'Nothing here yet.',
  pageSize = 12,
  caption,
}: {
  columns: Column<T>[];
  rows?: T[];
  rowKey: (r: T) => string;
  loading?: boolean;
  empty?: string;
  pageSize?: number;
  caption: string;
}) {
  const [page, setPage] = useState(0);
  const total = rows?.length ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => setPage(0), [total]);
  const view = useMemo(() => rows?.slice(page * pageSize, (page + 1) * pageSize) ?? [], [rows, page, pageSize]);

  if (loading && !rows) return <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>;
  if (!total) return <EmptyState title={empty} />;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-fg-subtle">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn('px-4 py-3 font-semibold', c.hideSm && 'hidden md:table-cell', c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={rowKey(r)} className="border-t border-white/[0.05] hover:bg-white/[0.02]">
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-4 py-3 align-middle', c.hideSm && 'hidden md:table-cell', c.className)}>
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 text-sm text-fg-muted">
          <span>
            {page * pageSize + 1}–{Math.min(total, (page + 1) * pageSize)} of {total}
          </span>
          <div className="flex gap-1">
            <button className="grid size-9 place-items-center rounded-lg ring-1 ring-white/10 disabled:opacity-40" onClick={() => setPage((p) => p - 1)} disabled={page === 0} aria-label="Previous page">
              <ChevronLeft className="size-4" />
            </button>
            <button className="grid size-9 place-items-center rounded-lg ring-1 ring-white/10 disabled:opacity-40" onClick={() => setPage((p) => p + 1)} disabled={page >= pages - 1} aria-label="Next page">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
