"use client";

import { useState } from "react";
import { Check, ExternalLink, MapPin, MessageCircle, Phone, Star } from "lucide-react";
import { formatPrice } from "@/config/product";
import { serviceById } from "@/content/app/services";
import { audit, nowIso, updateWorkspace } from "@/lib/app/store";
import type { WebsiteProject } from "@/lib/app/types";
import { useWorkspace } from "@/components/app/AppShell";
import { automationStatus } from "@/components/app/status";
import { BtnLink, Btn, Card, Field, Input, Notice, PageHeader, Pill, Segmented, TextArea } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const allPages = ["Home", "About", "Services", "Products / Menu", "Gallery", "Reviews", "Contact", "Booking / Enquiry"];
const accents = ["#15803d", "#e11d48", "#7c3aed", "#2563eb", "#059669", "#ca8a04", "#111111"];

export default function WebsitePage() {
  const ws = useWorkspace();
  const [draft, setDraft] = useState<WebsiteProject | null>(null);
  if (!ws?.business) return null;
  const b = ws.business;
  const svc = serviceById("website")!;
  const automation = ws.automations.find((a) => a.serviceId === "website" || a.serviceId === "digital-marketing");

  const site: WebsiteProject = draft ??
    ws.website ?? {
      status: "draft",
      template: "classic",
      pages: ["Home", "About", "Services", "Gallery", "Reviews", "Contact"],
      headline: b.name,
      about: b.description,
      accent: "#15803d",
      updatedAt: nowIso(),
    };
  const set = (p: Partial<WebsiteProject>) => setDraft({ ...site, ...p });

  function save() {
    updateWorkspace((w) => {
      w.website = { ...site, updatedAt: nowIso() };
      audit(w, "Website draft saved");
    });
    setDraft(null);
  }

  if (ws.website?.connectedUrl) {
    return (
      <div>
        <PageHeader eyebrow="Website" title="Your website is connected" />
        <Card className="space-y-3">
          <p className="flex items-center gap-2 font-semibold">
            <Check className="size-4 text-emerald-300" aria-hidden /> {ws.website.connectedUrl}
          </p>
          <p className="text-sm text-fg-muted">Enquiries from your website arrive in Leads. Want a faster, refreshed site instead? We can rebuild it from your business details.</p>
          <div className="flex flex-wrap gap-2">
            <BtnLink href={ws.website.connectedUrl} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm">
              <ExternalLink className="size-4" aria-hidden /> Visit site
            </BtnLink>
            <BtnLink href="/app/services/website" size="sm">
              Rebuild with {svc.name} service
            </BtnLink>
          </div>
        </Card>
      </div>
    );
  }

  const status = automation ? automationStatus[automation.status] : null;

  return (
    <div>
      <PageHeader
        eyebrow="Website Service"
        title="Build My Website"
        subtitle="Your website is generated from the business details you already gave. Adjust it here, then we build and host it."
        action={status && <Pill tone={status.tone}>{automation!.status === "setup" ? "Setup in progress" : ws.website?.status === "requested" ? "Being built" : status.label}</Pill>}
      />
      {ws.website?.status === "requested" && <Notice className="mb-6">Our team is building your website from this design — first version within 3–5 working days. You can keep adjusting it here.</Notice>}

      <div className="grid grid-cols-1 gap-6 [&>*]:min-w-0 lg:grid-cols-[22rem_1fr]">
        <Card className="space-y-4 lg:self-start">
          <Field label="Style" htmlFor="w-template">
            <Segmented
              label="Style"
              value={site.template}
              onChange={(v) => set({ template: v })}
              options={[
                { value: "classic", label: "Classic" },
                { value: "bold", label: "Bold" },
                { value: "minimal", label: "Minimal" },
              ]}
            />
          </Field>
          <Field label="Headline" htmlFor="w-head">
            <Input id="w-head" value={site.headline} onChange={(e) => set({ headline: e.target.value })} />
          </Field>
          <Field label="About text" htmlFor="w-about">
            <TextArea id="w-about" value={site.about} onChange={(e) => set({ about: e.target.value })} />
          </Field>
          <fieldset>
            <legend className="mb-2 text-[0.8rem] font-medium">Brand colour</legend>
            <div className="flex flex-wrap gap-2">
              {accents.map((c) => (
                <button key={c} type="button" onClick={() => set({ accent: c })} aria-label={`Colour ${c}`} aria-pressed={site.accent === c} className={cn("size-8 rounded-full border-2", site.accent === c ? "border-white" : "border-transparent")} style={{ background: c }} />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-[0.8rem] font-medium">Pages</legend>
            <div className="grid grid-cols-2 gap-1.5">
              {allPages.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm text-fg-muted">
                  <input
                    type="checkbox"
                    checked={site.pages.includes(p)}
                    onChange={(e) => set({ pages: e.target.checked ? [...site.pages, p] : site.pages.filter((x) => x !== p) })}
                    className="accent-[var(--color-flow)]"
                  />
                  {p}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-xs text-fg-subtle">Always included: WhatsApp button, Google Maps, mobile layout and SEO basics. Logo and photos come from Settings.</p>
          <div className="flex flex-wrap gap-2">
            <Btn variant="ghost" onClick={save} disabled={!draft}>
              Save draft
            </Btn>
            {!automation && (
              <BtnLink href="/app/services/website" onClick={save}>
                Publish — {formatPrice(svc.price!)}/mo
              </BtnLink>
            )}
          </div>
        </Card>

        {/* Live preview */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white text-ink shadow-2xl" aria-label="Website preview">
          <div className="flex items-center gap-1.5 bg-[#ececec] px-3 py-2">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-3 truncate rounded bg-white px-3 py-0.5 text-[0.7rem] text-ink-muted">{b.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com</span>
          </div>
          <nav className="flex items-center justify-between px-5 py-3 text-xs">
            <span className="flex items-center gap-2 font-bold">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {b.logo && <img src={b.logo} alt="" className="size-6 rounded object-contain" />}
              {b.name}
            </span>
            <span className="hidden gap-3 text-ink-muted sm:flex">
              {site.pages.slice(0, 5).map((p) => (
                <span key={p}>{p.split(" /")[0]}</span>
              ))}
            </span>
          </nav>
          <header
            className={cn("px-6 py-12", site.template === "minimal" ? "bg-white" : "text-white")}
            style={site.template === "minimal" ? undefined : { background: site.template === "bold" ? site.accent : `linear-gradient(135deg, ${site.accent}, #1a1a1a)` }}
          >
            <p className={cn("text-[0.7rem] font-semibold tracking-widest uppercase", site.template === "minimal" ? "text-ink-muted" : "opacity-80")}>
              {b.category} · {b.city}
            </p>
            <h2 className={cn("mt-2 font-bold tracking-tight", site.template === "bold" ? "text-4xl" : "text-3xl")} style={site.template === "minimal" ? { color: site.accent } : undefined}>
              {site.headline || b.name}
            </h2>
            <p className="mt-3 max-w-md text-sm opacity-90">{site.about}</p>
            <div className="mt-5 flex gap-2">
              <span className="rounded-full px-4 py-2 text-xs font-semibold" style={site.template === "minimal" ? { background: site.accent, color: "#fff" } : { background: "#fff", color: site.accent }}>
                {site.pages.includes("Booking / Enquiry") ? "Book now" : "Contact us"}
              </span>
            </div>
          </header>
          {site.pages.includes("Services") || site.pages.includes("Products / Menu") ? (
            <section className="px-6 py-6">
              <h3 className="text-sm font-bold">{site.pages.includes("Products / Menu") ? "Menu & products" : "Services"}</h3>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {b.services
                  .split(/,|\n/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .slice(0, 6)
                  .map((s) => (
                    <li key={s} className="rounded-lg border border-paper-line p-3">
                      {s}
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}
          {site.pages.includes("Gallery") && (
            <section className="grid grid-cols-3 gap-1.5 px-6 pb-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="aspect-square rounded-lg" style={{ background: `linear-gradient(${120 + i * 40}deg, ${site.accent}33, #f6f4f1)` }} />
              ))}
            </section>
          )}
          {site.pages.includes("Reviews") && ws.reviews[0] && (
            <section className="bg-paper px-6 py-5 text-xs">
              <p className="flex gap-0.5 text-amber-500">
                {Array.from({ length: ws.reviews[0].rating }, (_, i) => (
                  <Star key={i} className="size-3" fill="currentColor" aria-hidden />
                ))}
              </p>
              <p className="mt-1">“{ws.reviews[0].text}” — {ws.reviews[0].author}</p>
            </section>
          )}
          {site.pages.includes("Contact") && (
            <footer className="flex flex-wrap gap-4 px-6 py-5 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5" aria-hidden /> {b.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden /> {[b.address, b.city].filter(Boolean).join(", ")}
              </span>
              <span className="ml-auto flex items-center gap-1.5 rounded-full bg-[#25d366] px-3 py-1 font-semibold text-white">
                <MessageCircle className="size-3.5" aria-hidden /> WhatsApp
              </span>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
