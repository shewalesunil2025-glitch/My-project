import type { SupabaseClient } from "@supabase/supabase-js";
import { unsupportedClaims } from "@/lib/ads/claims";
import { copyPrompt, copySchema, factsOf, normalizeCopy } from "@/lib/ads/copy";
import { OBJECTIVES, type AdLanguage, type Cta, type ObjectiveId } from "@/lib/ads/types";
import { EDITABLE } from "@/lib/ads/status";
import { geminiJson } from "@/lib/server/gemini";
import { indiaToday, loadCampaign, move, type Fail, type Ok, type Row } from "./campaigns";
import type { AdStatus } from "@/lib/ads/types";

const fail = (reason: string, message: string, status = 400): Fail => ({ ok: false, reason, message, status });

export const COPY_PER_DAY = 30;
export const COPY_PER_CAMPAIGN = 12;

/**
 * Writes ad text for a campaign with the AI. Every price, percentage and strong claim the AI adds
 * is checked against what the owner typed; a variation with an invented one is thrown away.
 */
export async function generateCopy(db: SupabaseClient, ownerId: string, id: unknown, count: unknown): Promise<Ok<{ creatives: Row[]; rejected: number }> | Fail> {
  const l = await loadCampaign(db, ownerId, id);
  if (!("row" in l)) return l;
  const row = l.row;
  if (!EDITABLE.includes(row.status as AdStatus)) return fail("locked", "This campaign can't be changed any more.", 409);

  const dayStart = new Date(Date.parse(`${indiaToday()}T00:00:00+05:30`)).toISOString();
  const [today, mine] = await Promise.all([
    db.from("ad_creatives").select("id", { count: "exact", head: true }).eq("owner_id", ownerId).eq("kind", "copy").gte("created_at", dayStart),
    db.from("ad_creatives").select("id", { count: "exact", head: true }).eq("campaign_id", row.id as string).eq("kind", "copy"),
  ]);
  if ((today.count ?? 0) >= COPY_PER_DAY) return fail("limit", "You've reached today's limit for AI ad text. Try again tomorrow.", 429);
  if ((mine.count ?? 0) >= COPY_PER_CAMPAIGN) return fail("limit", "This campaign already has plenty of ad texts. Approve the ones you like.", 429);

  const biz = (row.business ?? {}) as Row;
  const language = row.language as AdLanguage;
  const brief = {
    businessName: String(biz.name ?? ""),
    category: String(biz.category ?? ""),
    city: String(biz.city ?? ""),
    services: String(biz.services ?? ""),
    description: String(biz.description ?? ""),
    targetCustomers: String(biz.targetCustomers ?? ""),
    objective: row.objective as ObjectiveId,
    offer: String(row.offer ?? ""),
    language,
    count: Math.min(4, Math.max(1, Number(count) || 3)),
  };
  const { system, user } = copyPrompt(brief);
  let raw: unknown;
  try {
    raw = await geminiJson(system, [{ role: "user", content: user }], copySchema);
  } catch (error) {
    console.error("[ads] copy failed", error instanceof Error ? error.message.slice(0, 200) : error);
    return fail("upstream", "The AI couldn't write the text right now. Please try again in a minute.", 502);
  }

  const cta = (OBJECTIVES.find((o) => o.id === brief.objective)?.cta ?? "LEARN_MORE") as Cta;
  const all = normalizeCopy(raw, language, cta);
  const facts = factsOf(brief);
  const safe = all.filter((v) => unsupportedClaims(`${v.headline} ${v.primaryText} ${v.description}`, facts).length === 0);
  const rejected = all.length - safe.length;
  if (safe.length === 0) return fail("no_safe_copy", "The AI wrote text we couldn't use (it made up details). Please try again.", 502);

  const rows = safe.map((v) => ({ campaign_id: row.id, owner_id: ownerId, kind: "copy", language: v.language, headline: v.headline, primary_text: v.primaryText, description: v.description, cta: v.cta }));
  const { data, error } = await db.from("ad_creatives").insert(rows).select("*");
  if (error) return fail("server_error", "Couldn't save the ad text.", 500);
  if (row.status === "draft") await move(db, row, "creatives_ready");
  return { ok: true, creatives: (data ?? []) as Row[], rejected };
}
