"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Gift, Lock, Monitor, Rocket, Smartphone } from "lucide-react";
import { formatPrice } from "@/config/product";
import { serviceById, TRIAL_DAYS } from "@/content/app/services";
import { beginTrial, timeLeft, trialState, websiteAccess } from "@/lib/app/trial";
import { setAutomationStatus } from "@/lib/app/automation";
import { cloudEnabled, cloudPublishSite, cloudUnpublishSite } from "@/lib/app/cloud";
import { openIbaxChat } from "@/lib/app/ibaxEvents";
import { audit, logActivity, nowIso, updateWorkspace, useSession } from "@/lib/app/store";
import type { SiteSection, WebsiteProject } from "@/lib/app/types";
import { accents, allSections, buildSite, premiumTemplate, slugify, templates, validSlug, withDefaults } from "@/lib/sites/site";
import { useWorkspace } from "@/components/app/AppShell";
import { SiteView } from "@/components/sites/SiteView";
import { themeFor } from "@/lib/sites/themes";
import { Btn, BtnLink, Card, Field, Input, Notice, PageHeader, Pill, Spinner, TextArea } from "@/components/app/ui";
import { cn } from "@/lib/cn";

/** Swatch for the template picker: the template's background with its two hero colours. */
const swatch = (id: string, accent: string) => {
  const t = themeFor(id);
  return `radial-gradient(circle at 72% 38%, ${accent} 0 14%, transparent 42%), radial-gradient(circle at 28% 78%, ${t.tint}aa 0 8%, transparent 40%), ${t.bg}`;
};

export default function WebsitePage() {
  const ws = useWorkspace();
  const { user } = useSession();
  const [draft, setDraft] = useState<WebsiteProject | null>(null);
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  if (!ws?.business) return null;
  const b = ws.business;
  const svc = serviceById("website")!;
  const automation = ws.automations.find((a) => a.serviceId === "website" || a.serviceId === "digital-marketing");

  const site = draft ?? withDefaults(ws.website, b);
  const set = (p: Partial<WebsiteProject>) => setDraft({ ...site, ...p });
  const live = ws.website?.status === "live" && ws.website.publishedAt;
  const liveUrl = live ? `${typeof window === "undefined" ? "https://www.ibaxai.com" : window.location.origin}/s/${ws.website!.slug}` : "";
  const canPublish = cloudEnabled && !!user?.cloud && !ws.sample;
  const published = buildSite(b, site);

  function save() {
    updateWorkspace((w) => {
      w.website = { ...site, updatedAt: nowIso() };
      audit(w, "Website draft saved");
    });
    setDraft(null);
    setMsg({ ok: true, text: "Saved." });
  }

  async function publish() {
    setMsg(null);
    const slug = slugify(site.slug ?? "");
    if (!validSlug(slug)) return setMsg({ ok: false, text: "Choose an address of 3–40 letters, numbers or dashes." });
    setBusy(true);
    const res = await cloudPublishSite({ ...buildSite(b, { ...site, slug }) });
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: res.error });
    void fetch("/api/site-refresh", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug }) });
    const first = !ws?.website?.publishedAt;
    updateWorkspace((w) => {
      w.website = { ...site, slug, status: "live", publishedAt: nowIso(), updatedAt: nowIso() };
      audit(w, first ? `Website published at /s/${slug}` : "Website updated");
      logActivity(w, { kind: "website", title: first ? "Your website is live" : "Website updated", detail: `ibaxai.com/s/${slug}`, href: "/app/website" });
    });
    if (automation && automation.status !== "active") setAutomationStatus(automation.id, "active", "Website published");
    setDraft(null);
    setMsg({ ok: true, text: first ? "Your website is live! 🎉" : "Changes are live." });
  }

  async function unpublish() {
    setBusy(true);
    const ok = await cloudUnpublishSite();
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: "Couldn't take the site down. Please try again." });
    updateWorkspace((w) => {
      if (w.website) w.website = { ...w.website, status: "draft", publishedAt: undefined };
      audit(w, "Website unpublished");
    });
    setMsg({ ok: true, text: "Your website is offline now. Publish again any time." });
  }

  if (ws.website?.connectedUrl) {
    return (
      <div>
        <PageHeader eyebrow="Website" title="Your website is connected" />
        <Card className="space-y-3">
          <p className="flex items-center gap-2 font-semibold">
            <Check className="size-4 text-emerald-300" aria-hidden /> {ws.website.connectedUrl}
          </p>
          <BtnLink href={ws.website.connectedUrl} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm">
            <ExternalLink className="size-4" aria-hidden /> Visit site
          </BtnLink>
        </Card>
      </div>
    );
  }

  // The builder is open on the free trial (build and preview only) and once the Website is bought.
  const access = websiteAccess(ws);
  if (access === "unused" || access === "over") {
    return (
      <div>
        <PageHeader eyebrow="Website builder" title="Build your website" subtitle="Premium templates with 3D effects — your business details filled in for you." />
        <Card className="relative mx-auto max-w-xl overflow-hidden border-flow/30 p-6 text-center sm:p-8">
          <div aria-hidden className="absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-flow/20 blur-3xl" />
          <span className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-flow text-ink-950">
            {access === "unused" ? <Gift className="size-7" aria-hidden /> : <Lock className="size-7" aria-hidden />}
          </span>
          {access === "unused" ? (
            <>
              <h2 className="display relative mt-4 text-2xl">Build your website free for {TRIAL_DAYS} days</h2>
              <p className="relative mt-2 text-sm leading-relaxed text-fg-muted">
                Start your free trial to pick a premium template and see your website exactly as customers will. Publishing it on the internet needs the Website service ({formatPrice(svc.price!)} one-time).
              </p>
              <Btn size="lg" className="relative mt-5" onClick={() => beginTrial()}>
                <Gift className="size-4" aria-hidden /> Start free trial
              </Btn>
            </>
          ) : (
            <>
              <h2 className="display relative mt-4 text-2xl">Your free trial has ended</h2>
              <p className="relative mt-2 text-sm leading-relaxed text-fg-muted">
                Get the Website service ({formatPrice(svc.price!)} one-time) to keep building and publish your website — your design is saved.
              </p>
              <BtnLink size="lg" className="relative mt-5" href="/app/services/website">
                <Rocket className="size-4" aria-hidden /> Get the Website — {formatPrice(svc.price!)}
              </BtnLink>
            </>
          )}
        </Card>
      </div>
    );
  }
  const trial = trialState(ws);

  const toggle = (s: SiteSection) => set({ sections: site.sections!.includes(s) ? site.sections!.filter((x) => x !== s) : [...site.sections!, s] });

  return (
    <div>
      <PageHeader
        eyebrow="Website builder"
        title="Build your website"
        subtitle="Pick a premium template — your business details are already filled in. Change anything, then publish in one click."
        action={live ? <Pill tone="green">Live</Pill> : <Pill tone="gray">Draft</Pill>}
      />

      {access === "trial" && trial.phase === "on" && (
        <Notice className="mb-6 flex flex-wrap items-center gap-3">
          <Gift className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1">
            <strong>Free trial · {timeLeft(trial.msLeft)}.</strong> Build and preview your website free. To put it on the internet, get the Website service ({formatPrice(svc.price!)} one-time).
          </span>
          <BtnLink size="sm" href="/app/services/website">
            Get the Website
          </BtnLink>
        </Notice>
      )}

      {live && (
        <Card className="mb-6 flex flex-wrap items-center gap-3 border-flow/30">
          <span className="grid size-10 place-items-center rounded-full bg-flow/15 text-flow">
            <Rocket className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Your website is live</p>
            <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-flow-soft underline underline-offset-2">
              {liveUrl.replace(/^https?:\/\//, "")}
            </a>
          </div>
          <Btn
            size="sm"
            variant="ghost"
            onClick={() => {
              void navigator.clipboard?.writeText(liveUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />} {copied ? "Copied" : "Copy link"}
          </Btn>
          <BtnLink href={liveUrl} target="_blank" rel="noopener noreferrer" size="sm">
            <ExternalLink className="size-4" aria-hidden /> Open
          </BtnLink>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 [&>*]:min-w-0 lg:grid-cols-[24rem_1fr]">
        <Card className="space-y-5 lg:self-start">
          <fieldset>
            <legend className="mb-2 text-[0.8rem] font-medium">Template</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => set({ template: t.id })}
                  aria-pressed={premiumTemplate(site.template) === t.id}
                  className={cn(
                    "overflow-hidden rounded-xl border text-left transition-colors",
                    premiumTemplate(site.template) === t.id ? "border-flow ring-2 ring-flow/40" : "border-white/10 hover:border-white/25",
                  )}
                >
                  <span className="block h-14" style={{ background: swatch(t.id, site.accent) }} />
                  <span className="block px-2.5 py-2">
                    <span className="block text-xs font-semibold">{t.label}</span>
                    <span className="block truncate text-[0.65rem] text-fg-subtle">{t.note}</span>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <Field label="Website address" htmlFor="w-slug" help="Letters, numbers and dashes.">
            <div className="flex items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] focus-within:border-flow/50">
              <span className="shrink-0 pl-3 text-sm text-fg-subtle">ibaxai.com/s/</span>
              <input
                id="w-slug"
                value={site.slug ?? ""}
                onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) })}
                className="h-11 min-w-0 flex-1 bg-transparent pr-3 text-sm focus:outline-none"
              />
            </div>
          </Field>
          <Field label="Headline" htmlFor="w-head">
            <Input id="w-head" value={site.headline} onChange={(e) => set({ headline: e.target.value })} />
          </Field>
          <Field label="Small line above the headline" htmlFor="w-tag">
            <Input id="w-tag" value={site.tagline ?? ""} onChange={(e) => set({ tagline: e.target.value })} placeholder="Salon · Pune" />
          </Field>
          <Field label="About your business" htmlFor="w-about">
            <TextArea id="w-about" value={site.about} onChange={(e) => set({ about: e.target.value })} />
          </Field>
          <Field label="Services & prices" htmlFor="w-services" help="One per line, e.g. Haircut — ₹300">
            <TextArea id="w-services" rows={5} value={site.servicesText ?? ""} onChange={(e) => set({ servicesText: e.target.value })} />
          </Field>
          <Field label="FAQ" htmlFor="w-faq" help="Q: on one line, A: on the next.">
            <TextArea id="w-faq" rows={4} value={site.faqText ?? ""} onChange={(e) => set({ faqText: e.target.value })} placeholder={"Q: Do you take walk-ins?\nA: Yes, until 6 PM."} />
          </Field>

          <fieldset>
            <legend className="mb-2 text-[0.8rem] font-medium">Brand colour</legend>
            <div className="flex flex-wrap items-center gap-2">
              {accents.map((c) => (
                <button key={c} type="button" onClick={() => set({ accent: c })} aria-label={`Colour ${c}`} aria-pressed={site.accent === c} className={cn("size-8 rounded-full border-2", site.accent === c ? "border-white" : "border-transparent")} style={{ background: c }} />
              ))}
              <label className="relative size-8 overflow-hidden rounded-full border-2 border-dashed border-white/30" title="Custom colour">
                <span className="sr-only">Custom colour</span>
                <input type="color" value={site.accent} onChange={(e) => set({ accent: e.target.value })} className="absolute inset-0 size-full cursor-pointer opacity-0" />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[0.8rem] font-medium">Sections</legend>
            <div className="grid grid-cols-2 gap-1.5">
              {allSections.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm text-fg-muted">
                  <input type="checkbox" checked={site.sections!.includes(s.id)} onChange={() => toggle(s.id)} className="accent-[var(--color-flow)]" />
                  {s.label}
                </label>
              ))}
            </div>
          </fieldset>

          {msg && <Notice tone={msg.ok ? "blue" : "amber"}>{msg.text}</Notice>}

          <div className="flex flex-wrap gap-2">
            <Btn variant="ghost" onClick={save} disabled={!draft || busy}>
              Save draft
            </Btn>
            {automation ? (
              <Btn onClick={publish} disabled={busy || !canPublish}>
                {busy ? <Spinner /> : <Rocket className="size-4" aria-hidden />} {live ? "Update website" : "Publish website"}
              </Btn>
            ) : (
              <Btn
                onClick={() => {
                  save();
                  openIbaxChat("I want the Website service");
                }}
              >
                <Rocket className="size-4" aria-hidden /> Get the Website service — {formatPrice(svc.price!)}
              </Btn>
            )}
            {live && (
              <Btn variant="subtle" size="sm" onClick={unpublish} disabled={busy}>
                Take offline
              </Btn>
            )}
          </div>
          {!canPublish && <p className="text-xs text-fg-subtle">{ws.sample ? "This is the sample business — create your own account to publish." : "Log in with your ibaxai account to publish."}</p>}
        </Card>

        {/* Live preview */}
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-fg-muted">Live preview</p>
            <div className="flex rounded-full border border-white/10 p-0.5" role="group" aria-label="Preview size">
              {(
                [
                  ["phone", Smartphone, "Phone"],
                  ["desktop", Monitor, "Computer"],
                ] as const
              ).map(([id, I, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDevice(id)}
                  aria-pressed={device === id}
                  className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium", device === id ? "bg-white/10 text-fg" : "text-fg-subtle")}
                >
                  <I className="size-3.5" aria-hidden /> {label}
                </button>
              ))}
            </div>
          </div>
          <div className={cn("mx-auto overflow-hidden border border-white/10 bg-black shadow-2xl", device === "phone" ? "max-w-[24rem] rounded-[2.2rem] border-[6px] border-ink-800" : "rounded-2xl")}>
            {device === "desktop" && (
              <div className="flex items-center gap-1.5 bg-[#1b1d1b] px-3 py-2">
                <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                <span className="size-2.5 rounded-full bg-[#febc2e]" />
                <span className="size-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 truncate rounded bg-white/10 px-3 py-0.5 text-[0.7rem] text-fg-muted">ibaxai.com/s/{site.slug}</span>
              </div>
            )}
            <div className="h-[40rem] overflow-y-auto overscroll-contain" aria-label="Website preview">
              <SiteView site={published} preview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
