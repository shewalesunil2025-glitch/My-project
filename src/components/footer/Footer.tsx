import { siteConfig } from "@/config/site";
import { store } from "@/content/shambhu";
import { Logo } from "@/components/navigation/Logo";

const columns = [
  {
    title: "Explore",
    links: [
      { label: "Services", href: "#solutions" },
      { label: "Digital Marketing", href: "#digital-marketing" },
      { label: "Lumi AI", href: "#shambhu" },
      { label: "Automation Store", href: "#store" },
      { label: "Industries", href: "#industries" },
      { label: "Lumi — the business app", href: "/app" },
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
    links: store.slice(0, 5).map((s) => ({ label: s.title, href: "#store" })),
  },
];

export function Footer() {
  return (
    <footer className="relative mt-4 overflow-hidden pb-28 md:pb-0">
      {/* Green glow rising from the floor, as in the reference */}
      <div aria-hidden className="absolute bottom-[-10rem] left-1/2 h-[26rem] w-[50rem] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(125_255_58/0.28),rgb(40_140_30/0.12)_55%,transparent)] blur-2xl" />
      <div className="container-x relative grid gap-12 pt-20 pb-12 md:grid-cols-12 md:pt-28">
        <div className="md:col-span-4">
          <Logo compact />
          <p className="display mt-6 text-[clamp(2rem,3.4vw,2.8rem)]">
            {siteConfig.name} —{" "}
            <span className="text-fg-subtle">
              intelligent business <span className="text-flow">⊙</span> systems
            </span>
          </p>
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
            <p className="font-mono text-[0.65rem] tracking-[0.14em] text-fg-subtle uppercase">[ {col.title} ]</p>
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
          <p className="font-mono text-[0.65rem] tracking-[0.14em] text-fg-subtle uppercase">[ Contact ]</p>
          <a href={`mailto:${siteConfig.email}`} className="link-underline mt-4 inline-block text-sm text-fg-muted hover:text-fg">
            {siteConfig.email}
          </a>
          <p className="mt-3 text-sm text-fg-muted">Reply within 24 hours</p>
        </div>
      </div>
      <div className="container-x relative">
        <div className="flex flex-col justify-between gap-3 border-t border-white/[0.07] pt-6 pb-24 text-xs text-fg-subtle sm:flex-row">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p>AI Automation • Websites • Intelligent Business Systems</p>
        </div>
      </div>
    </footer>
  );
}
