import type { CSSProperties, ReactNode } from "react";
import { Clock, MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";
import type { PremiumTemplate, PublishedSite } from "@/lib/sites/site";
import { EnquiryForm } from "./EnquiryForm";

/**
 * A client's website in one of five premium templates, with 3D touches and scroll
 * animations (CSS scroll-driven animations; motion is skipped for reduced-motion users
 * and on browsers without support). Renders the live page at /s/<slug> and the
 * builder's preview (`preview` keeps links in the app and disables the form).
 */

type Theme = { dark: boolean; page: string; card: string; muted: string; heading: string; center: boolean };

const themes: Record<PremiumTemplate, Theme> = {
  aurora: { dark: true, page: "bg-[#06070a] text-white", card: "site-glass-dark", muted: "text-white/60", heading: "tracking-tight", center: false },
  prism: { dark: false, page: "bg-[#f3f3ef] text-neutral-900", card: "bg-white border border-black/[0.06] shadow-[0_20px_50px_-30px_rgb(0_0_0/0.35)]", muted: "text-neutral-500", heading: "tracking-tight", center: false },
  glass: { dark: true, page: "bg-[#080b12] text-white", card: "site-glass-dark", muted: "text-white/60", heading: "tracking-tight", center: true },
  luxe: { dark: false, page: "bg-[#fbf9f4] text-neutral-900", card: "bg-white border border-black/[0.06]", muted: "text-neutral-500", heading: "font-serif tracking-tight", center: true },
  neon: { dark: true, page: "bg-black text-white", card: "site-glass-dark", muted: "text-white/55", heading: "tracking-tight uppercase", center: true },
};

function HeroArt({ t, a, site }: { t: PremiumTemplate; a: string; site: PublishedSite }) {
  if (t === "aurora")
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="site-blob site-drift-1 top-[-20%] left-[-10%] size-[28rem]" style={{ background: a }} />
        <span className="site-blob site-drift-2 top-[10%] right-[-15%] size-[24rem]" style={{ background: `color-mix(in oklab, ${a} 55%, #22d3ee)` }} />
        <span className="site-blob site-drift-3 bottom-[-30%] left-[30%] size-[26rem]" style={{ background: `color-mix(in oklab, ${a} 50%, #a855f7)` }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#06070a_85%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#06070a]" />
      </div>
    );
  if (t === "glass")
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 20% 0%, ${a}40, transparent 55%), radial-gradient(ellipse at 90% 30%, #6366f140, transparent 50%)` }} />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#080b12]" />
        <span className="site-orb site-float absolute top-[14%] right-[8%] size-40 @xl:size-56" style={{ ["--orb" as string]: a }} />
        <span className="site-orb site-float-slow absolute bottom-[8%] left-[6%] size-20 opacity-70" style={{ ["--orb" as string]: a }} />
      </div>
    );
  if (t === "neon")
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-2/3" style={{ background: `radial-gradient(ellipse at 50% 100%, ${a}55, transparent 65%)` }} />
        <div className="site-neon-grid absolute inset-x-[-50%] bottom-[-10%] h-[55%]" style={{ ["--grid" as string]: a }} />
      </div>
    );
  if (t === "prism")
    return (
      <div aria-hidden className="site-stack pointer-events-none absolute top-1/2 right-[4%] hidden -translate-y-1/2 @4xl:block">
        {(site.services.length ? site.services.slice(0, 3) : [{ name: site.name, price: "" }]).map((s, i) => (
          <div
            key={s.name + i}
            className="site-float absolute w-64 rounded-2xl border border-white/40 bg-white/80 p-5 shadow-[0_30px_60px_-25px_rgb(0_0_0/0.45)] backdrop-blur"
            style={{ transform: `translate3d(${i * 34}px, ${i * 46}px, ${-i * 60}px) rotateY(-18deg) rotateX(8deg)`, animationDelay: `${i * 0.6}s`, zIndex: 3 - i }}
          >
            <span className="block h-1.5 w-10 rounded-full" style={{ background: a }} />
            <p className="mt-3 font-semibold text-neutral-900">{s.name}</p>
            {s.price && <p className="mt-1 text-sm font-semibold" style={{ color: a }}>{s.price}</p>}
          </div>
        ))}
      </div>
    );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${a}, transparent)` }} />
      <div className="absolute top-[-30%] left-1/2 size-[34rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl" style={{ background: a }} />
    </div>
  );
}

function Section({ id, title, children, className = "", heading }: { id?: string; title?: string; children: ReactNode; className?: string; heading: string }) {
  return (
    <section id={id} className={`site-reveal mx-auto max-w-5xl scroll-mt-20 px-5 py-14 ${className}`}>
      {title && <h2 className={`text-3xl font-bold @xl:text-4xl ${heading}`}>{title}</h2>}
      {children}
    </section>
  );
}

export function SiteView({ site, preview }: { site: PublishedSite; preview?: boolean }) {
  const t = site.template;
  const th = themes[t] ?? themes.aurora;
  const a = site.accent;
  const has = (s: PublishedSite["sections"][number]) => site.sections.includes(s);
  const wa = site.whatsapp ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Hi ${site.name}, I found you on your website.`)}` : "";
  const tel = site.phone ? `tel:${site.phone.replace(/[^\d+]/g, "")}` : "";
  const maps = site.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${site.name}, ${site.address}`)}` : "";
  const target = preview ? undefined : "_blank";
  const center = th.center ? "text-center" : "";
  const glow: CSSProperties | undefined = t === "neon" ? { textShadow: `0 0 18px ${a}, 0 0 42px ${a}88` } : undefined;
  const lightHero = t === "prism" || t === "luxe";

  return (
    <div className={`site-root @container relative min-h-dvh overflow-x-clip font-sans ${th.page}`} style={{ ["--accent" as string]: a }}>
      {/* Top bar */}
      <header className={`sticky top-0 z-30 backdrop-blur-xl ${th.dark ? "bg-black/40 border-white/10" : "bg-white/70 border-black/[0.06]"} border-b`}>
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- owner's logo, a data URL */}
          {site.logo ? <img src={site.logo} alt="" className="size-9 rounded-xl object-contain" /> : <span className="grid size-9 place-items-center rounded-xl text-sm font-bold text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${a}, color-mix(in oklab, ${a} 50%, #000))` }}>{site.name.charAt(0)}</span>}
          <span className={`min-w-0 flex-1 truncate font-semibold ${th.heading}`}>{site.name}</span>
          {tel && (
            <a href={tel} className="rounded-full px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_var(--accent)]" style={{ background: a }}>
              Call now
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className={`relative isolate overflow-hidden ${t === "prism" ? "bg-[linear-gradient(160deg,#ffffff,#eef0ea)]" : ""}`}>
        <HeroArt t={t} a={a} site={site} />
        <div className={`site-hero-out relative mx-auto max-w-5xl px-5 py-24 @xl:py-32 ${center}`}>
          {site.tagline && (
            <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.7rem] font-semibold tracking-[0.2em] uppercase ${th.dark ? "border border-white/15 bg-white/5 text-white/80" : "border border-black/10 bg-white text-neutral-600"}`}>
              <Sparkles className="size-3" style={{ color: a }} aria-hidden /> {site.tagline}
            </p>
          )}
          <h1 className={`site-title mt-5 font-bold ${th.heading} ${t === "luxe" ? "text-5xl @xl:text-7xl" : "text-5xl @xl:text-7xl"} ${t === "prism" ? "max-w-xl" : ""}`} style={glow}>
            {t === "aurora" || t === "glass" ? (
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(120deg, #fff 30%, color-mix(in oklab, ${a} 70%, #fff))` }}>
                {site.headline}
              </span>
            ) : (
              site.headline
            )}
          </h1>
          {site.about && <p className={`mt-6 max-w-2xl text-lg leading-relaxed whitespace-pre-line ${th.center ? "mx-auto" : ""} ${th.muted}`}>{site.about}</p>}
          <div className={`mt-10 flex flex-wrap gap-3 ${th.center ? "justify-center" : ""}`}>
            {has("whatsapp") && wa && (
              <a href={wa} target={target} rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25d366] px-6 text-sm font-semibold text-white shadow-[0_12px_30px_-10px_#25d366] transition-transform hover:-translate-y-0.5">
                <MessageCircle className="size-4" aria-hidden /> WhatsApp us
              </a>
            )}
            {has("enquiry") && (
              <a
                href="#enquiry"
                className={`inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${lightHero ? "text-white" : "border border-white/20 bg-white/10 text-white backdrop-blur"}`}
                style={lightHero ? { background: a } : undefined}
              >
                Send an enquiry
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Services */}
      {has("services") && site.services.length > 0 && (
        <Section title="Services" heading={th.heading} className={center}>
          <ul className="site-perspective mt-8 grid gap-4 text-left @xl:grid-cols-2">
            {site.services.map((s, i) => (
              <li
                key={s.name + s.price + i}
                className={`site-tilt site-card-3d group relative overflow-hidden rounded-3xl p-6 ${th.card}`}
              >
                <span aria-hidden className="absolute -top-10 -right-10 size-28 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-50" style={{ background: a }} />
                <span className="relative block text-xs font-semibold tracking-widest uppercase" style={{ color: a }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="relative mt-2 flex items-end justify-between gap-4">
                  <span className="text-lg font-semibold">{s.name}</span>
                  {s.price && <span className="shrink-0 text-lg font-bold" style={{ color: a }}>{s.price}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Hours & location */}
      {has("hours") && (site.hours || site.address) && (
        <Section heading={th.heading} className="pt-0">
          <div className="site-perspective grid gap-4 @xl:grid-cols-2">
            {site.hours && (
              <div className={`site-tilt site-card-3d rounded-3xl p-6 ${th.card}`}>
                <p className="flex items-center gap-2 font-semibold">
                  <Clock className="size-5" style={{ color: a }} aria-hidden /> Opening hours
                </p>
                <p className={`mt-3 leading-relaxed whitespace-pre-line ${th.muted}`}>{site.hours}</p>
              </div>
            )}
            {site.address && (
              <div className={`site-tilt site-card-3d rounded-3xl p-6 ${th.card}`}>
                <p className="flex items-center gap-2 font-semibold">
                  <MapPin className="size-5" style={{ color: a }} aria-hidden /> Find us
                </p>
                <p className={`mt-3 leading-relaxed ${th.muted}`}>{site.address}</p>
                <a href={maps} target={target} rel="noopener noreferrer" className="mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: a }}>
                  Open in Google Maps
                </a>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* FAQ */}
      {has("faq") && site.faqs.length > 0 && (
        <Section title="Questions" heading={th.heading} className={`max-w-3xl ${center}`}>
          <div className="mt-8 space-y-3 text-left">
            {site.faqs.map((f) => (
              <details key={f.q} className={`site-reveal group rounded-2xl px-5 py-4 ${th.card}`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.q}
                  <span aria-hidden className="text-xl leading-none transition-transform group-open:rotate-45" style={{ color: a }}>
                    +
                  </span>
                </summary>
                <p className={`mt-3 leading-relaxed ${th.muted}`}>{f.a}</p>
              </details>
            ))}
          </div>
        </Section>
      )}

      {/* Enquiry */}
      {has("enquiry") && (
        <Section id="enquiry" heading={th.heading} className="max-w-3xl pb-20">
          <div className={`relative overflow-hidden rounded-[2rem] p-6 @xl:p-10 ${th.card}`}>
            <span aria-hidden className="absolute -top-20 -left-20 size-56 rounded-full opacity-20 blur-3xl" style={{ background: a }} />
            <h2 className={`relative text-3xl font-bold ${th.heading}`}>Get in touch</h2>
            <p className={`relative mt-2 ${th.muted}`}>Leave your number and we&apos;ll call or WhatsApp you back.</p>
            <div className="relative mt-6">
              <EnquiryForm slug={site.slug} accent={a} dark={th.dark} preview={preview} />
            </div>
          </div>
        </Section>
      )}

      {/* Footer */}
      <footer className={`border-t ${th.dark ? "border-white/10" : "border-black/[0.06]"}`}>
        <div className={`mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-8 text-sm ${th.muted}`}>
          <span className={`font-semibold ${th.dark ? "text-white" : "text-neutral-900"}`}>{site.name}</span>
          {site.phone && (
            <a href={tel} className="inline-flex items-center gap-1.5">
              <Phone className="size-3.5" aria-hidden /> {site.phone}
            </a>
          )}
          {site.email && <a href={`mailto:${site.email}`}>{site.email}</a>}
          <a href="https://www.ibaxai.com" target={target} rel="noopener" className="ml-auto text-xs opacity-70">
            Made with ibaxai
          </a>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      {has("whatsapp") && wa && !preview && (
        <a
          href={wa}
          target={target}
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed right-4 bottom-4 z-40 grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_14px_30px_-8px_#25d366]"
        >
          <MessageCircle className="size-6" aria-hidden />
        </a>
      )}
    </div>
  );
}
