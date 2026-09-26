import { siteConfig } from "@/config/site";
import { pillars } from "@/content/pillars";
import { Logo } from "@/components/navigation/Logo";

const columns = [
  {
    title: "Explore",
    links: [
      { label: "Solutions", href: "#solutions" },
      { label: "How It Works", href: "#process" },
      { label: "Industries", href: "#industries" },
      { label: "Work / Demos", href: "#work" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "FAQ", href: "#faq" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Services",
    links: pillars.map((p) => ({ label: p.title, href: "#services" })),
  },
];

export function Footer() {
  return (
    <footer className="relative mt-4 overflow-hidden">
      <div aria-hidden className="absolute top-0 right-[10%] h-72 w-[40rem] rotate-[-20deg] bg-[linear-gradient(90deg,transparent,rgb(139_92_246/0.12),transparent)] blur-3xl" />
      <div className="container-x relative grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-fg-muted">{siteConfig.tagline}</p>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Social links">
            {siteConfig.social.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  className="grid h-9 min-w-9 place-items-center rounded-full border border-white/10 px-3 text-xs font-medium text-fg-muted transition-colors hover:border-white/25 hover:text-fg"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="md:col-span-2">
            <p className="text-sm font-semibold">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="link-underline text-sm text-fg-muted hover:text-fg">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="md:col-span-2">
          <p className="text-sm font-semibold">Contact</p>
          <a href={`mailto:${siteConfig.email}`} className="link-underline mt-4 inline-block text-sm text-fg-muted hover:text-fg">
            {siteConfig.email}
          </a>
          <p className="mt-3 text-sm text-fg-muted">Reply within 24 hours</p>
        </div>
      </div>
      <div className="container-x relative">
        <div className="flex flex-col justify-between gap-3 border-t border-white/[0.07] py-6 text-xs text-fg-subtle sm:flex-row">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p>AI Automation • Websites • Intelligent Business Systems</p>
        </div>
      </div>
    </footer>
  );
}
