import { AnimatePresence, motion } from 'framer-motion';
import { Building2, CalendarClock, Clapperboard, ExternalLink, LayoutDashboard, LogOut, Ticket, Users } from 'lucide-react';
import { Suspense } from 'react';
import { Link, NavLink, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/ui/Logo';
import { LoadingState } from '@/components/ui/States';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/movies', label: 'Movies', icon: Clapperboard },
  { to: '/admin/theatres', label: 'Auditorium', icon: Building2 },
  { to: '/admin/shows', label: 'Shows', icon: CalendarClock },
  { to: '/admin/bookings', label: 'Bookings', icon: Ticket },
  { to: '/admin/users', label: 'Users', icon: Users },
];

export function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/[0.06] bg-ink-950/70 p-4 lg:flex">
      <Link to="/admin" className="px-2 py-2">
        <Logo />
      </Link>
      <p className="eyebrow mt-4 px-3 text-fg-subtle">Station admin</p>
      <nav aria-label="Admin" className="mt-2 flex flex-1 flex-col gap-1">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              cn(
                'relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                isActive ? 'bg-white/[0.07] text-fg' : 'text-fg-muted hover:bg-white/[0.04] hover:text-fg',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="admin-nav" className="absolute inset-y-2 left-0 w-1 rounded-r bg-saffron" />}
                <n.icon className="size-4.5" aria-hidden /> {n.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/[0.06] pt-3">
        <Link to="/" className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-fg-muted hover:text-fg">
          <ExternalLink className="size-4" aria-hidden /> View site
        </Link>
        <button
          onClick={async () => {
            await logout();
            navigate('/admin/login');
          }}
          className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-fg-muted hover:text-danger"
        >
          <LogOut className="size-4" aria-hidden /> Log out
        </button>
        <p className="truncate px-3 pt-2 text-xs text-fg-subtle">{user?.email}</p>
      </div>
    </aside>
  );
}

export function AdminLayout() {
  const outlet = useOutlet();
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-dvh">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        {/* Mobile admin nav */}
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-900/90 backdrop-blur-xl lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Link to="/admin"><Logo compact /></Link>
            <Link to="/" className="text-sm text-fg-muted">View site</Link>
          </div>
          <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-2 scrollbar-none">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn('flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm', isActive ? 'bg-saffron/15 text-saffron-soft' : 'text-fg-muted')
                }
              >
                <n.icon className="size-4" aria-hidden /> {n.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main id="main" className="px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.25 }}>
              <Suspense fallback={<LoadingState />}>{outlet}</Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export function AdminPageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
