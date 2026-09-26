import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/[0.06] bg-ink-950/60 pb-24 md:pb-0">
      <div className="tricolour-rule opacity-70" />
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-fg-muted">
            Simple, secure movie booking for serving personnel and their families at station and garrison theatres. Built with
            gratitude for those who serve the nation.
          </p>
          <p className="mt-4 font-display text-lg font-semibold uppercase tracking-[0.3em] text-tricolour">Jai Hind</p>
        </div>
        <nav aria-label="Footer">
          <h2 className="eyebrow mb-3 text-fg-subtle">Book</h2>
          <ul className="space-y-2 text-sm text-fg-muted">
            <li><Link className="hover:text-fg" to="/movies">Now showing</Link></li>
            <li><Link className="hover:text-fg" to="/movies?tab=upcoming">Coming soon</Link></li>
            <li><Link className="hover:text-fg" to="/theatres">Theatres</Link></li>
            <li><Link className="hover:text-fg" to="/my-bookings">My tickets</Link></li>
          </ul>
        </nav>
        <nav aria-label="Account">
          <h2 className="eyebrow mb-3 text-fg-subtle">Account</h2>
          <ul className="space-y-2 text-sm text-fg-muted">
            <li><Link className="hover:text-fg" to="/login">Log in</Link></li>
            <li><Link className="hover:text-fg" to="/register">Register &amp; verify</Link></li>
            <li><Link className="hover:text-fg" to="/profile">Profile</Link></li>
            <li><Link className="hover:text-fg" to="/admin/login">Station admin</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/[0.06]">
        <p className="container-page py-5 text-xs leading-relaxed text-fg-subtle">
          © {new Date().getFullYear()} Veer Cinema · Independent prototype. Not affiliated with, or endorsed by, the Indian Army,
          the Ministry of Defence or any government body. Service verification uses demo data only and payments are simulated.
        </p>
      </div>
    </footer>
  );
}
