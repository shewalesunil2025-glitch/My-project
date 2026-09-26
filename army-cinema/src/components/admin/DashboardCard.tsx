import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export function DashboardCard({ label, value, sub, icon: Icon, index = 0 }: { label: string; value: string | number; sub?: string; icon: LucideIcon; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card flex items-start justify-between gap-3 p-4 sm:p-5"
    >
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">{label}</p>
        <p className="mt-1.5 font-display text-2xl font-bold leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-3xl">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-fg-muted">{sub}</p>}
      </div>
      <span className="hidden size-10 shrink-0 sm:grid place-items-center rounded-xl bg-white/[0.05] text-saffron-soft">
        <Icon className="size-5" aria-hidden />
      </span>
    </motion.div>
  );
}
