import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { SiteView } from "@/components/sites/SiteView";
import { premiumTemplate, validSlug, type PublishedSite } from "@/lib/sites/site";

/** A client's published website: www.ibaxai.com/s/<slug>. */

export const revalidate = 60;

const loadSite = cache(async (slug: string): Promise<PublishedSite | null> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !validSlug(slug)) return null;
  const res = await fetch(`${url}/rest/v1/sites?slug=eq.${encodeURIComponent(slug)}&select=data`, {
    headers: { apikey: key, authorization: `Bearer ${key}` },
    next: { revalidate: 60, tags: [`site:${slug}`] },
  }).catch(() => null);
  if (!res?.ok) return null;
  const rows = (await res.json().catch(() => [])) as { data: PublishedSite }[];
  const site = rows[0]?.data;
  return site ? { ...site, slug, template: premiumTemplate(site.template) } : null;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await loadSite(slug);
  if (!site) return { title: "Website not found" };
  const description = (site.about || site.tagline || `${site.name} — ${site.category}`).slice(0, 160);
  return {
    title: { absolute: `${site.name}${site.tagline ? ` — ${site.tagline}` : ""}` },
    description,
    alternates: { canonical: `/s/${slug}` },
    openGraph: { title: site.name, description, url: `/s/${slug}`, type: "website" },
    icons: site.logo ? { icon: site.logo } : undefined,
  };
}

export default async function ClientSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await loadSite(slug);
  if (!site) notFound();
  return <SiteView site={site} />;
}
