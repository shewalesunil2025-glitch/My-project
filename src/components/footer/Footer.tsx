import { siteConfig } from "@/config/site";
import { Logo } from "@/components/navigation/Logo";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="container-x grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-6">
          <Logo />
          <p className="mt-5 max-w-sm text-sm text-fg-muted">{siteConfig.tagline}</p>
          <a href={`mailto:${siteConfig.email}`} className="link-underline mt-6 inline-block text-sm text-fg">
            {siteConfig.email}
          </a>
        </div>
        <nav aria-label="Footer" className="md:col-span-3">
          <p className="eyebrow mb-4">Explore</p>
          <ul className="space-y-2.5">
            {siteConfig.footerNav.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="link-underline text-sm text-fg-muted hover:text-fg">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-3">
          <p className="eyebrow mb-4">Follow</p>
          <ul className="space-y-2.5">
            {siteConfig.social.map((s) => (
              <li key={s.label}>
                <a href={s.href} className="link-underline text-sm text-fg-muted hover:text-fg">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container-x">
        <div className="flex flex-col justify-between gap-3 border-t border-white/[0.06] py-6 text-xs text-fg-subtle sm:flex-row">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p className="font-mono tracking-wider">Built as one intelligent flow.</p>
        </div>
      </div>
    </footer>
  );
}
