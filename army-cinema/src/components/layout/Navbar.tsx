import { AnimatePresence, motion } from 'framer-motion';
import { Clapperboard, LayoutDashboard, LogIn, LogOut, Ticket, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/cn';
import { ButtonLink } from '@/components/ui/Button';
import { KerkettaSign } from '@/components/ui/KerkettaSign';
import { Logo } from '@/components/ui/Logo';

const LINKS = [
  { to: '/', label: 'Book Tickets', icon: Clapperboard, end: true },
  { to: '/my-bookings', label: 'My Tickets', icon: Ticket, end: false },
];

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function AccountMenu() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;
  const doLogout = async () => {
    setOpen(false);
    await logout();
    toast.success('Logged out', 'See you at the movies. Jai Hind!');
    navigate('/');
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 ring-1 ring-white/10 hover:bg-white/5"
      >
        <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-saffron to-gold text-xs font-bold text-ink-950">
          {initials(user.fullName)}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-medium lg:block">
          {user.rankTitle} {user.fullName.split(' ')[0]}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12 } }}
            className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-white/10 bg-ink-800 p-1.5 shadow-2xl"
          >
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-semibold">
                {user.rankTitle} {user.fullName}
              </p>
              <p className="truncate text-xs text-fg-subtle">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-white/[0.06]" />
            {[
              { to: '/profile', label: 'Profile', icon: User },
              { to: '/my-bookings', label: 'My bookings', icon: Ticket },
              ...(user.role === 'admin' ? [{ to: '/admin', label: 'Admin console', icon: LayoutDashboard }] : []),
            ].map((i) => (
              <Link
                key={i.to}
                to={i.to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fg-muted hover:bg-white/5 hover:text-fg"
              >
                <i.icon className="size-4" /> {i.label}
              </Link>
            ))}
            <button
              role="menuitem"
              onClick={doLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fg-muted hover:bg-white/5 hover:text-danger"
            >
              <LogOut className="size-4" /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const { user, ready } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-[background-color,box-shadow] duration-300',
        scrolled ? 'bg-ink-900/85 shadow-[0_1px_0_rgb(255_255_255/0.06)] backdrop-blur-xl' : 'bg-transparent',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" aria-label="Kerketta Auditorium home" className="rounded-xl">
          <Logo showMark={false} />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  'relative rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-fg' : 'text-fg-muted hover:text-fg',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded bg-gradient-to-r from-saffron via-white to-india-green" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {ready && !user && (
            <>
              <ButtonLink to="/login" variant="ghost" size="sm" className="max-sm:hidden">
                Log in
              </ButtonLink>
              <ButtonLink to="/register" size="sm" className="max-sm:hidden">
                Register
              </ButtonLink>
            </>
          )}
          <AccountMenu />
          <Link to="/" aria-label="Kerketta Auditorium" className="ml-1 rounded-full" title="Kerketta Auditorium">
            <KerkettaSign className="size-11 drop-shadow-[0_4px_14px_rgb(233_185_92/0.35)] sm:size-12" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Thumb-reachable tab bar for phones. Hidden inside the booking funnel, which has its own action bar. */
export function MobileTabBar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (/^\/(book|checkout|admin)/.test(pathname)) return null;
  const items = [
    ...LINKS,
    user ? { to: '/profile', label: 'Profile', icon: User, end: false } : { to: '/login', label: 'Log in', icon: LogIn, end: false },
  ];
  return (
    <nav aria-label="Primary" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-ink-900/90 backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-3">
        {items.map((l) => (
          <li key={l.to}>
            <NavLink
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn('relative flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium', isActive ? 'text-saffron' : 'text-fg-subtle')
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="tab-dot" className="absolute top-0 h-0.5 w-8 rounded-b bg-saffron" />}
                  <l.icon className="size-5" aria-hidden />
                  {l.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
