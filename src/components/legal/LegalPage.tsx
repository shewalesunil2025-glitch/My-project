import Link from "next/link";
import type { ReactNode } from "react";
import { legal } from "@/content/legal";

export type LegalSection = { id: string; title: string; body: ReactNode };

/** Plain, readable layout shared by the Privacy Policy and Terms of Service. */
export function LegalPage({ title, intro, sections }: { title: string; intro: ReactNode; sections: LegalSection[] }) {
  return (
    <main className="container-x mx-auto max-w-3xl py-16 sm:py-24">
      <Link href="/" className="link-underline text-sm text-fg-muted hover:text-fg">
        ← {legal.brand}
      </Link>
      <h1 className="display mt-8 text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-fg-subtle">Last updated: {legal.updated}</p>
      <div className="mt-8 space-y-4 text-[0.95rem] leading-relaxed text-fg-muted">{intro}</div>

      <nav aria-label="On this page" className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <p className="font-mono text-[0.65rem] tracking-[0.14em] text-fg-subtle uppercase">On this page</p>
        <ol className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-fg-muted hover:text-fg">
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((s, i) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="mt-12 scroll-mt-8">
          <h2 id={`${s.id}-h`} className="text-xl font-semibold text-fg">
            {i + 1}. {s.title}
          </h2>
          <div className="legal-body mt-4 space-y-3 text-[0.95rem] leading-relaxed text-fg-muted">{s.body}</div>
        </section>
      ))}

      <p className="mt-16 border-t border-white/[0.07] pt-6 text-xs text-fg-subtle">
        <Link href="/privacy" className="link-underline hover:text-fg">
          Privacy Policy
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="link-underline hover:text-fg">
          Terms of Service
        </Link>{" "}
        · © {new Date().getFullYear()} {legal.brand}
      </p>
    </main>
  );
}

export function Contact() {
  return (
    <ul className="list-none space-y-1">
      <li>
        <strong className="text-fg">{legal.operator}</strong>, {legal.brand}
      </li>
      <li>
        {legal.city}, {legal.state} {legal.postcode}, {legal.country}
      </li>
      <li>
        Email:{" "}
        <a className="link-underline text-fg" href={`mailto:${legal.email}`}>
          {legal.email}
        </a>
      </li>
      <li>Phone / WhatsApp: {legal.phoneDisplay}</li>
    </ul>
  );
}
