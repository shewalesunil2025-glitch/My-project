import type { CSSProperties, ReactNode } from "react";
import { ArrowUpRight, Clock, MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";
import type { PublishedSite } from "@/lib/sites/site";
import { themeFor, type HeroArt, type Theme } from "@/lib/sites/themes";
import { EnquiryForm } from "./EnquiryForm";
import { SiteFx } from "./SiteFx";

/**
 * A client's website in one of the premium templates (src/lib/sites/themes.ts): a 3D hero
 * scene that follows the mouse, a custom cursor, cards that tilt toward the cursor with a
 * moving spotlight, a services marquee and scroll animations. Motion is skipped for
 * reduced-motion users. Renders the live page at /s/<slug> and the builder's preview
 * (`preview` keeps links in the app and disables the form and the custom cursor).
 */

const fonts: Record<Theme["font"], string> = {
  display: "font-[family-name:var(--font-tight)] tracking-[-0.035em]",
  serif: "font-[family-name:var(--font-serif-display)] tracking-[-0.01em]",
  mono: "font-[family-name:var(--font-geist-mono)] tracking-[-0.02em]",
  sans: "tracking-tight",
};

/** The 3D hero scene. Everything is aria-hidden decoration; layers drift with the mouse (--mx/--my). */
function HeroScene({ art, a, tint, site, dark }: { art: HeroArt; a: string; tint: string; site: PublishedSite; dark: boolean }) {
  const mix = `color-mix(in oklab, ${a} 55%, ${tint})`;
  const fade = (
    <div
      className="absolute inset-x-0 bottom-0 h-48"
      style={{ background: `linear-gradient(to bottom, transparent, var(--site-bg-solid))` }}
    />
  );
  let scene: ReactNode = null;
  switch (art) {
    case "aurora":
      scene = (
        <>
          <span className="sx-blob sx-drift-1 sx-par-2 top-[-25%] left-[-10%] size-[32rem]" style={{ background: a }} />
          <span className="sx-blob sx-drift-2 sx-par-3 top-[5%] right-[-15%] size-[28rem]" style={{ background: tint }} />
          <span className="sx-blob sx-drift-3 sx-par-1 bottom-[-30%] left-[25%] size-[30rem]" style={{ background: mix }} />
        </>
      );
      break;
    case "rings":
      scene = (
        <div className="sx-par-2 absolute top-1/2 left-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 opacity-60 [perspective:900px]">
          <span className="sx-core absolute inset-[36%] rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, #fff, ${a} 45%, transparent 72%)` }} />
          {[0, 1, 2].map((i) => (
            <span key={i} className={`sx-ring sx-ring-${i} absolute inset-0 rounded-full`} style={{ borderColor: i === 1 ? tint : a }} />
          ))}
        </div>
      );
      break;
    case "cubes":
      scene = (
        <div className="absolute inset-0 [perspective:1000px]">
          {[
            ["right-[12%] top-[16%]", 92, "sx-par-3", 0],
            ["right-[30%] top-[52%]", 56, "sx-par-1", -4],
            ["left-[8%] top-[22%]", 48, "sx-par-2", -8],
            ["right-[6%] bottom-[12%]", 70, "sx-par-2", -2],
          ].map(([pos, size, par, delay], i) => (
            <span key={i} className={`sx-cube-wrap absolute ${pos} ${par}`} style={{ ["--s" as string]: `${size}px`, animationDelay: `${delay}s` }}>
              <span className="sx-cube" style={{ animationDelay: `${delay}s` }}>
                {["f", "b", "l", "r", "t", "d"].map((f) => (
                  <span key={f} className={`sx-face sx-face-${f}`} style={{ background: `linear-gradient(135deg, ${i % 2 ? tint : a}, ${mix})` }} />
                ))}
              </span>
            </span>
          ))}
        </div>
      );
      break;
    case "sphere":
      scene = (
        <div className="sx-par-2 absolute top-[10%] right-[4%] size-40 opacity-90 @2xl:size-60 @4xl:size-72">
          <span className="sx-float absolute inset-0 rounded-full" style={{ ["--orb" as string]: a, background: "var(--sx-orb)" }} />
          <span className="sx-moon absolute top-1/2 left-1/2 size-10 rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, #fff, ${tint} 60%)` }} />
        </div>
      );
      break;
    case "grid":
      scene = (
        <>
          <span className="sx-sun sx-par-1 absolute top-[18%] left-1/2 size-64 -translate-x-1/2 rounded-full" style={{ background: `linear-gradient(${tint}, ${a})` }} />
          <div className="sx-grid absolute inset-x-[-50%] bottom-[-10%] h-[55%]" style={{ ["--grid" as string]: a }} />
        </>
      );
      break;
    case "cards":
      scene = (
        <div className="sx-par-2 absolute top-1/2 right-[3%] hidden h-72 w-80 -translate-y-1/2 [perspective:1100px] [transform-style:preserve-3d] @4xl:block">
          {(site.services.length ? site.services.slice(0, 3) : [{ name: site.name, price: "" }]).map((s, i) => (
            <div
              key={s.name + i}
              className="sx-float absolute w-64 rounded-2xl border p-5 shadow-[0_30px_60px_-25px_rgb(0_0_0/0.45)] backdrop-blur"
              style={{
                borderColor: "var(--site-line)",
                background: "var(--site-card)",
                transform: `translate3d(${i * 34}px, ${i * 46}px, ${-i * 60}px) rotateY(-18deg) rotateX(8deg)`,
                animationDelay: `${i * 0.6}s`,
                zIndex: 3 - i,
              }}
            >
              <span className="block h-1.5 w-10 rounded-full" style={{ background: a }} />
              <p className="mt-3 font-semibold">{s.name}</p>
              {s.price && <p className="mt-1 text-sm font-semibold" style={{ color: a }}>{s.price}</p>}
            </div>
          ))}
        </div>
      );
      break;
    case "waves":
      scene = (
        <div className="absolute inset-x-0 bottom-0 h-[60%]">
          {[0, 1, 2].map((i) => (
            <svg key={i} viewBox="0 0 1440 320" preserveAspectRatio="none" className={`sx-wave sx-wave-${i} absolute bottom-0 h-full w-[200%]`}>
              <path
                d="M0 160 C 240 80 480 240 720 160 S 1200 80 1440 160 L 1440 320 L 0 320 Z"
                fill={i === 1 ? tint : a}
                fillOpacity={0.18 + i * 0.1}
              />
            </svg>
          ))}
        </div>
      );
      break;
    case "stars":
      scene = (
        <>
          <div className="sx-stars sx-par-1 absolute inset-0" />
          <div className="sx-stars sx-stars-2 sx-par-3 absolute inset-0" />
          {[0, 1, 2].map((i) => (
            <span key={i} className={`sx-comet sx-comet-${i}`} style={{ background: `linear-gradient(90deg, transparent, ${i === 1 ? tint : "#fff"})` }} />
          ))}
          <span className="sx-blob sx-par-2 bottom-[-40%] left-1/2 size-[36rem] -translate-x-1/2 opacity-40" style={{ background: a }} />
        </>
      );
      break;
    case "beams":
      scene = (
        <>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`sx-beam sx-beam-${i}`} style={{ background: `linear-gradient(180deg, ${i % 2 ? tint : a}, transparent)` }} />
          ))}
          <span className={`sx-blob sx-par-2 top-[-30%] left-1/2 size-[34rem] -translate-x-1/2 ${dark ? "opacity-35" : "opacity-20"}`} style={{ background: a }} />
        </>
      );
      break;
    case "mesh":
      scene = (
        <div
          className="sx-mesh sx-par-1 absolute inset-[-20%] opacity-70"
          style={{ background: `conic-gradient(from 0deg at 50% 50%, ${a}, ${tint}, #a5b4fc, ${a})` }}
        />
      );
      break;
    case "embers":
      scene = (
        <>
          <span className="sx-blob sx-par-2 bottom-[-35%] left-[20%] size-[34rem] opacity-45" style={{ background: a }} />
          {Array.from({ length: 22 }, (_, i) => (
            <span
              key={i}
              className="sx-ember"
              style={{
                left: `${(i * 37) % 100}%`,
                background: i % 3 ? a : tint,
                color: i % 3 ? a : tint,
                animationDelay: `${(i * 0.73) % 9}s`,
                animationDuration: `${7 + (i % 5)}s`,
                ["--drift" as string]: `${((i * 23) % 60) - 30}px`,
              }}
            />
          ))}
        </>
      );
      break;
    case "ripples":
      scene = (
        <div className="sx-par-1 absolute top-1/2 left-1/2 size-[40rem] -translate-x-1/2 -translate-y-1/2">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="sx-ripple absolute inset-0 rounded-full border" style={{ borderColor: i % 2 ? tint : a, animationDelay: `${i * 2}s` }} />
          ))}
        </div>
      );
      break;
    case "tunnel":
      scene = (
        <div className="absolute inset-0 [perspective:600px]">
          {Array.from({ length: 8 }, (_, i) => (
            <span
              key={i}
              className="sx-tunnel absolute top-1/2 left-1/2 size-[26rem] rounded-[2.5rem] border-2"
              style={{ borderColor: i % 2 ? tint : a, animationDelay: `${-i * 0.75}s` }}
            />
          ))}
        </div>
      );
      break;
    case "helix":
      scene = (
        <div className="sx-par-2 absolute top-[8%] right-[10%] h-[80%] w-40 [perspective:800px] @2xl:right-[16%]">
          <div className="sx-helix relative h-full w-full [transform-style:preserve-3d]">
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} className="absolute left-1/2 h-2 w-36 -translate-x-1/2" style={{ top: `${i * 7}%`, transform: `rotateY(${i * 26}deg)` }}>
                <span className="absolute left-0 size-3 rounded-full" style={{ background: a, boxShadow: `0 0 14px ${a}` }} />
                <span className="absolute top-1 left-3 h-px w-30" style={{ background: `linear-gradient(90deg, ${a}, ${tint})`, opacity: 0.5 }} />
                <span className="absolute right-0 size-3 rounded-full" style={{ background: tint, boxShadow: `0 0 14px ${tint}` }} />
              </span>
            ))}
          </div>
        </div>
      );
      break;
  }
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {scene}
      {fade}
    </div>
  );
}

function Section({ id, title, kicker, children, className = "", heading }: { id?: string; title?: string; kicker?: string; children: ReactNode; className?: string; heading: string }) {
  return (
    <section id={id} className={`sx-reveal mx-auto max-w-6xl scroll-mt-20 px-5 py-16 @xl:py-20 ${className}`}>
      {kicker && <p className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--accent)" }}>{kicker}</p>}
      {title && <h2 className={`mt-2 text-4xl font-medium @xl:text-5xl ${heading}`}>{title}</h2>}
      {children}
    </section>
  );
}

/** A card that tilts toward the cursor, with a spotlight that follows it (see SiteFx). */
function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`sx-tilt sx-card group relative overflow-hidden rounded-3xl border p-6 ${className}`}>
      <span aria-hidden className="sx-spot pointer-events-none absolute inset-0" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function SiteView({ site, preview }: { site: PublishedSite; preview?: boolean }) {
  const th = themeFor(site.template);
  const a = site.accent;
  const has = (s: PublishedSite["sections"][number]) => site.sections.includes(s);
  const wa = site.whatsapp ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Hi ${site.name}, I found you on your website.`)}` : "";
  const tel = site.phone ? `tel:${site.phone.replace(/[^\d+]/g, "")}` : "";
  const maps = site.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${site.name}, ${site.address}`)}` : "";
  const target = preview ? undefined : "_blank";
  const center = th.center ? "text-center" : "";
  const heading = `${fonts[th.font]} ${th.upper ? "uppercase" : ""}`;
  const solid = th.bg.startsWith("#") ? th.bg : th.dark ? "#05060a" : "#f7f7f5";
  const vars = {
    ["--accent" as string]: a,
    ["--tint" as string]: th.tint,
    ["--site-bg-solid" as string]: solid,
    ["--site-card" as string]: th.card,
    ["--site-line" as string]: th.line,
    ["--site-muted" as string]: th.muted,
    background: th.bg,
    color: th.fg,
  } as CSSProperties;
  const ghostBtn = th.dark ? "border-white/20 bg-white/10 text-white backdrop-blur" : "border-black/10 bg-white text-neutral-900";
  const marquee = site.services.filter((s) => s.name).map((s) => s.name);

  return (
    <div className={`site-root sx-root @container relative min-h-dvh overflow-x-clip font-sans ${th.dark ? "sx-dark" : "sx-light"}`} style={vars}>
      <SiteFx cursor={preview ? "none" : th.cursor} />
      {/* Scroll progress */}
      <div aria-hidden className="sx-progress fixed inset-x-0 top-0 z-50 h-[3px] origin-left" style={{ background: `linear-gradient(90deg, ${a}, ${th.tint})` }} />

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b backdrop-blur-xl" style={{ borderColor: th.line, background: th.dark ? "rgb(0 0 0 / 0.35)" : "rgb(255 255 255 / 0.7)" }}>
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
          {site.logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- owner's logo, a data URL
            <img src={site.logo} alt="" className="size-9 rounded-xl object-contain" />
          ) : (
            <span className="grid size-9 place-items-center rounded-xl text-sm font-bold text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${a}, ${th.tint})` }}>
              {site.name.charAt(0)}
            </span>
          )}
          <span className={`min-w-0 flex-1 truncate text-lg font-medium ${heading}`}>{site.name}</span>
          {tel && (
            <a href={tel} className="sx-magnetic rounded-full px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_var(--accent)]" style={{ background: a }}>
              Call now
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate flex min-h-[86svh] items-center overflow-hidden">
        <HeroScene art={th.art} a={a} tint={th.tint} site={site} dark={th.dark} />
        <div className={`sx-hero-out relative mx-auto w-full max-w-6xl px-5 py-24 ${center}`}>
          {site.tagline && (
            <p
              className="sx-rise inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.7rem] font-semibold tracking-[0.2em] uppercase backdrop-blur"
              style={{ borderColor: th.line, background: th.dark ? "rgb(255 255 255 / 0.06)" : "rgb(255 255 255 / 0.7)" }}
            >
              <Sparkles className="size-3" style={{ color: a }} aria-hidden /> {site.tagline}
            </p>
          )}
          <h1 className={`sx-rise mt-6 text-5xl leading-[1.02] font-medium @xl:text-7xl @4xl:text-8xl ${heading} ${th.center ? "mx-auto max-w-4xl" : "max-w-3xl"}`} style={{ animationDelay: "0.08s" }}>
            <span className="sx-shine bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(110deg, ${th.fg} 35%, ${a} 50%, ${th.fg} 65%)` }}>
              {site.headline}
            </span>
          </h1>
          {site.about && (
            <p className={`sx-rise mt-7 max-w-2xl text-lg leading-relaxed whitespace-pre-line ${th.center ? "mx-auto" : ""}`} style={{ color: th.muted, animationDelay: "0.16s" }}>
              {site.about}
            </p>
          )}
          <div className={`sx-rise mt-10 flex flex-wrap gap-3 ${th.center ? "justify-center" : ""}`} style={{ animationDelay: "0.24s" }}>
            {has("enquiry") && (
              <a href="#enquiry" className="sx-magnetic inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-semibold text-white shadow-[0_14px_34px_-10px_var(--accent)]" style={{ background: `linear-gradient(135deg, ${a}, color-mix(in oklab, ${a} 60%, ${th.tint}))` }}>
                Get in touch <ArrowUpRight className="size-4" aria-hidden />
              </a>
            )}
            {has("whatsapp") && wa && (
              <a href={wa} target={target} rel="noopener noreferrer" className={`sx-magnetic inline-flex h-12 items-center gap-2 rounded-full border px-6 text-sm font-semibold ${ghostBtn}`}>
                <MessageCircle className="size-4" style={{ color: "#25d366" }} aria-hidden /> WhatsApp us
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Services marquee */}
      {marquee.length > 1 && (
        <div aria-hidden className="relative overflow-hidden border-y py-5" style={{ borderColor: th.line }}>
          <div className={`sx-marquee flex w-max gap-10 text-2xl font-medium whitespace-nowrap @xl:text-3xl ${heading}`}>
            {[0, 1].map((k) => (
              <span key={k} className="flex gap-10">
                {marquee.map((m, i) => (
                  <span key={m + i} className="flex items-center gap-10">
                    {m}
                    <span style={{ color: a }}>✦</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {has("services") && site.services.length > 0 && (
        <Section kicker="What we do" title="Services" heading={heading} className={center}>
          <ul className="mt-10 grid gap-4 text-left [perspective:1200px] @xl:grid-cols-2 @4xl:grid-cols-3">
            {site.services.map((s, i) => (
              <li key={s.name + s.price + i} className={i === 0 && site.services.length > 2 ? "@4xl:col-span-2" : ""}>
                <TiltCard className="h-full">
                  <span className="block text-xs font-semibold tracking-widest uppercase" style={{ color: a }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`mt-6 block text-2xl font-medium ${fonts[th.font]}`}>{s.name}</span>
                  {s.price && <span className="mt-2 block text-lg font-semibold" style={{ color: a }}>{s.price}</span>}
                </TiltCard>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Hours & location */}
      {has("hours") && (site.hours || site.address) && (
        <Section kicker="Visit us" heading={heading} className="pt-0">
          <div className="mt-6 grid gap-4 [perspective:1200px] @xl:grid-cols-2">
            {site.hours && (
              <TiltCard>
                <p className="flex items-center gap-2 font-semibold">
                  <Clock className="size-5" style={{ color: a }} aria-hidden /> Opening hours
                </p>
                <p className="mt-3 leading-relaxed whitespace-pre-line" style={{ color: th.muted }}>{site.hours}</p>
              </TiltCard>
            )}
            {site.address && (
              <TiltCard>
                <p className="flex items-center gap-2 font-semibold">
                  <MapPin className="size-5" style={{ color: a }} aria-hidden /> Find us
                </p>
                <p className="mt-3 leading-relaxed" style={{ color: th.muted }}>{site.address}</p>
                <a href={maps} target={target} rel="noopener noreferrer" className="sx-magnetic mt-5 inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: a }}>
                  Open in Google Maps
                </a>
              </TiltCard>
            )}
          </div>
        </Section>
      )}

      {/* FAQ */}
      {has("faq") && site.faqs.length > 0 && (
        <Section kicker="Good to know" title="Questions" heading={heading} className={`max-w-3xl ${center}`}>
          <div className="mt-10 space-y-3 text-left">
            {site.faqs.map((f) => (
              <details key={f.q} className="sx-reveal sx-card group rounded-2xl border px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.q}
                  <span aria-hidden className="text-xl leading-none transition-transform group-open:rotate-45" style={{ color: a }}>
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed" style={{ color: th.muted }}>{f.a}</p>
              </details>
            ))}
          </div>
        </Section>
      )}

      {/* Enquiry */}
      {has("enquiry") && (
        <Section id="enquiry" heading={heading} className="max-w-3xl pb-24">
          <div className="sx-card relative overflow-hidden rounded-[2rem] border p-6 @xl:p-10">
            <span aria-hidden className="absolute -top-24 -left-24 size-64 rounded-full opacity-25 blur-3xl" style={{ background: a }} />
            <span aria-hidden className="absolute -right-24 -bottom-24 size-64 rounded-full opacity-20 blur-3xl" style={{ background: th.tint }} />
            <h2 className={`relative text-4xl font-medium ${heading}`}>Get in touch</h2>
            <p className="relative mt-2" style={{ color: th.muted }}>Leave your number and we&apos;ll call or WhatsApp you back.</p>
            <div className="relative mt-6">
              <EnquiryForm slug={site.slug} accent={a} dark={th.dark} preview={preview} />
            </div>
          </div>
        </Section>
      )}

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: th.line }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-10 text-sm" style={{ color: th.muted }}>
          <span className={`text-base font-medium ${heading}`} style={{ color: th.fg }}>{site.name}</span>
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
