import type { SupabaseClient } from "@supabase/supabase-js";
import { CTAS, OBJECTIVES, objectiveIds, languages, platforms, type AdLanguage, type AdPlatform, type AdStatus, type Area, type ObjectiveId } from "@/lib/ads/types";
import { MAX_DAILY_BUDGET_INR, MAX_DAYS, MIN_DAILY_BUDGET_INR, VIDEOS_AVAILABLE, quote } from "@/lib/ads/quote";
import { canMove, EDITABLE } from "@/lib/ads/status";
import { validateAreas } from "@/lib/ads/targeting";

/**
 * Ad campaigns on the server: every rule is checked here, never trusted from the browser. The
 * browser only sends what the owner chose; prices, statuses and ownership are decided here.
 */

export type Row = Record<string, unknown>;
export type Fail = { ok: false; reason: string; message?: string; status: number };
export type Ok<T = object> = { ok: true } & T;

const fail = (reason: string, message: string, status = 400): Fail => ({ ok: false, reason, message, status });

/** Today's date in India, as YYYY-MM-DD. */
export const indiaToday = (now = new Date()) => new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** The database or the tables aren't there yet (the SQL hasn't been run). */
export const missingTables = (error: { message?: string; code?: string } | null | undefined) =>
  Boolean(error && (error.code === "42P01" || error.code === "PGRST205" || /does not exist|schema cache/i.test(error.message ?? "")));

export type Brief = { name: string; objective: ObjectiveId; platforms: AdPlatform; language: AdLanguage; offer: string; areas: Area[]; dailyBudgetInr: number; days: number; startDate: string };

/** Checks what the owner chose. With `partial`, only the fields that are present are checked. */
export function parseBrief(body: Record<string, unknown>, partial = false): Ok<{ brief: Partial<Brief> }> | Fail {
  const b: Partial<Brief> = {};
  const has = (k: string) => body[k] !== undefined;
  const need = (k: string) => !partial && !has(k);

  if (need("objective") || has("objective")) {
    if (!objectiveIds.includes(body.objective as ObjectiveId)) return fail("bad_objective", "Choose what you want from this ad.");
    b.objective = body.objective as ObjectiveId;
  }
  if (need("platforms") || has("platforms")) {
    if (!platforms.includes(body.platforms as AdPlatform)) return fail("bad_platform", "Choose Facebook, Instagram or both.");
    b.platforms = body.platforms as AdPlatform;
  }
  if (need("language") || has("language")) {
    if (!languages.includes(body.language as AdLanguage)) return fail("bad_language", "Choose English, Hindi or both.");
    b.language = body.language as AdLanguage;
  }
  if (need("areas") || has("areas")) {
    const a = validateAreas(body.areas);
    if (!a.ok) return fail("bad_area", a.error);
    b.areas = a.areas;
  }
  if (need("dailyBudgetInr") || has("dailyBudgetInr")) {
    const n = body.dailyBudgetInr;
    if (typeof n !== "number" || !Number.isInteger(n) || n < MIN_DAILY_BUDGET_INR || n > MAX_DAILY_BUDGET_INR) return fail("bad_budget", `The daily budget must be a whole number from ₹${MIN_DAILY_BUDGET_INR} to ₹${MAX_DAILY_BUDGET_INR.toLocaleString("en-IN")}.`);
    b.dailyBudgetInr = n;
  }
  if (need("days") || has("days")) {
    const n = body.days;
    if (typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > MAX_DAYS) return fail("bad_days", `Run the ad for 1 to ${MAX_DAYS} days.`);
    b.days = n;
  }
  if (need("startDate") || has("startDate")) {
    const d = typeof body.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.startDate) ? body.startDate : "";
    const today = indiaToday();
    if (!d || Number.isNaN(Date.parse(d)) || d < today || d > addDays(today, 60)) return fail("bad_start", "Pick a start date from today up to 60 days ahead.");
    b.startDate = d;
  }
  if (has("offer")) {
    if (typeof body.offer !== "string" || body.offer.length > 300) return fail("bad_offer", "Keep the offer under 300 characters.");
    b.offer = body.offer.trim();
  } else if (!partial) b.offer = "";
  if (has("name")) {
    if (typeof body.name !== "string" || body.name.length > 80) return fail("bad_name", "Keep the campaign name under 80 characters.");
    b.name = body.name.trim();
  } else if (!partial) b.name = "";
  return { ok: true, brief: b };
}

const event = async (db: SupabaseClient, campaignId: string, ownerId: string, type: string, detail: Row = {}) => {
  await db.from("ad_events").insert({ campaign_id: campaignId, owner_id: ownerId, type, detail });
};

async function load(db: SupabaseClient, ownerId: string, id: unknown): Promise<{ row: Row } | Fail> {
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return fail("bad_request", "Unknown campaign.", 400);
  const { data, error } = await db.from("ad_campaigns").select("*").eq("id", id).eq("owner_id", ownerId).maybeSingle();
  if (missingTables(error)) return fail("not_configured", "Ads aren't switched on yet.", 503);
  if (!data) return fail("not_found", "That campaign wasn't found.", 404);
  return { row: data as Row };
}
export { load as loadCampaign };

/** Moves a campaign only along an allowed path, and only if nobody changed it meanwhile. */
export async function move(db: SupabaseClient, row: Row, to: AdStatus, detail: Row = {}): Promise<boolean> {
  const from = row.status as AdStatus;
  if (!canMove(from, to)) return false;
  const { data } = await db.from("ad_campaigns").update({ status: to, updated_at: new Date().toISOString() }).eq("id", row.id as string).eq("status", from).select("id");
  if (!data || (Array.isArray(data) && data.length === 0)) return false;
  await event(db, row.id as string, row.owner_id as string, `status:${to}`, { from, ...detail });
  row.status = to;
  return true;
}

export async function createCampaign(db: SupabaseClient, ownerId: string, body: Record<string, unknown>): Promise<Ok<{ campaign: Row; existing: boolean }> | Fail> {
  const key = typeof body.idempotencyKey === "string" && body.idempotencyKey.length >= 8 && body.idempotencyKey.length <= 64 ? body.idempotencyKey : null;
  if (!key) return fail("bad_request", "Please try again.");

  const { data: found, error: findErr } = await db.from("ad_campaigns").select("*").eq("owner_id", ownerId).eq("idempotency_key", key).maybeSingle();
  if (missingTables(findErr)) return fail("not_configured", "Ads aren't switched on yet.", 503);
  if (found) return { ok: true, campaign: found as Row, existing: true };

  const parsed = parseBrief(body);
  if (!parsed.ok) return parsed;
  const b = parsed.brief as Brief;

  const { data: ws } = await db.from("workspaces").select("data").eq("owner_id", ownerId).maybeSingle();
  const business = ((ws?.data as { business?: Row } | undefined)?.business ?? {}) as Row;
  if (!business.name) return fail("no_business", "Add your business details first (Settings → Business profile).");
  const { logo: _logo, ...slim } = business; // the logo is a large image the ad text doesn't need
  void _logo;

  const row = {
    owner_id: ownerId,
    idempotency_key: key,
    name: b.name || `${String(business.name)} · ${OBJECTIVES.find((o) => o.id === b.objective)?.label ?? ""}`.slice(0, 80),
    objective: b.objective,
    platforms: b.platforms,
    language: b.language,
    offer: b.offer,
    areas: b.areas,
    daily_budget_inr: b.dailyBudgetInr,
    days: b.days,
    start_date: b.startDate,
    end_date: addDays(b.startDate, b.days - 1),
    business: slim,
    spend_estimate_inr: b.dailyBudgetInr * b.days,
  };
  const { data, error } = await db.from("ad_campaigns").insert(row).select("*").single();
  if (error || !data) {
    // Two taps at once: the second insert hits the unique key, so hand back the first.
    const { data: again } = await db.from("ad_campaigns").select("*").eq("owner_id", ownerId).eq("idempotency_key", key).maybeSingle();
    if (again) return { ok: true, campaign: again as Row, existing: true };
    console.error("[ads] create failed", error?.message);
    return fail(missingTables(error) ? "not_configured" : "server_error", "Couldn't save the campaign. Please try again.", missingTables(error) ? 503 : 500);
  }
  await event(db, data.id as string, ownerId, "created", { objective: b.objective, platforms: b.platforms });
  return { ok: true, campaign: data as Row, existing: false };
}

export async function updateCampaign(db: SupabaseClient, ownerId: string, id: unknown, body: Record<string, unknown>): Promise<Ok<{ campaign: Row }> | Fail> {
  const l = await load(db, ownerId, id);
  if (!("row" in l)) return l;
  if (!EDITABLE.includes(l.row.status as AdStatus)) return fail("locked", "This campaign can't be changed any more.", 409);
  const parsed = parseBrief(body, true);
  if (!parsed.ok) return parsed;
  const b = parsed.brief;
  const patch: Row = { updated_at: new Date().toISOString() };
  if (b.name !== undefined) patch.name = b.name;
  if (b.objective) patch.objective = b.objective;
  if (b.platforms) patch.platforms = b.platforms;
  if (b.language) patch.language = b.language;
  if (b.offer !== undefined) patch.offer = b.offer;
  if (b.areas) patch.areas = b.areas;
  const daily = b.dailyBudgetInr ?? (l.row.daily_budget_inr as number);
  const days = b.days ?? (l.row.days as number);
  const start = b.startDate ?? (l.row.start_date as string);
  if (b.dailyBudgetInr !== undefined) patch.daily_budget_inr = daily;
  if (b.days !== undefined) patch.days = days;
  if (b.startDate !== undefined || b.days !== undefined) {
    patch.start_date = start;
    patch.end_date = addDays(start, days - 1);
  }
  patch.spend_estimate_inr = daily * days;
  const { data, error } = await db.from("ad_campaigns").update(patch).eq("id", id as string).eq("owner_id", ownerId).in("status", EDITABLE as unknown as string[]).select("*").single();
  if (error || !data) return fail("locked", "This campaign can't be changed any more.", 409);
  await event(db, id as string, ownerId, "updated", { fields: Object.keys(patch).filter((k) => k !== "updated_at") });
  return { ok: true, campaign: data as Row };
}

export async function listCampaigns(db: SupabaseClient, ownerId: string): Promise<Ok<{ campaigns: Row[] }> | Fail> {
  const { data, error } = await db.from("ad_campaigns").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(100);
  if (missingTables(error)) return fail("not_configured", "Ads aren't switched on yet.", 503);
  return { ok: true, campaigns: (data ?? []) as Row[] };
}

export async function getCampaign(db: SupabaseClient, ownerId: string, id: unknown): Promise<Ok<{ campaign: Row; creatives: Row[]; payments: Row[]; events: Row[] }> | Fail> {
  const l = await load(db, ownerId, id);
  if (!("row" in l)) return l;
  const [creatives, payments, events] = await Promise.all([
    db.from("ad_creatives").select("*").eq("campaign_id", id as string).eq("owner_id", ownerId).order("created_at", { ascending: true }),
    db.from("ad_payments").select("*").eq("campaign_id", id as string).eq("owner_id", ownerId),
    db.from("ad_events").select("*").eq("campaign_id", id as string).eq("owner_id", ownerId).order("created_at", { ascending: true }),
  ]);
  return { ok: true, campaign: l.row, creatives: (creatives.data ?? []) as Row[], payments: (payments.data ?? []) as Row[], events: (events.data ?? []) as Row[] };
}

/** A picture the AI made (saved in our own storage by /api/image). Only that storage is accepted. */
export async function addAsset(db: SupabaseClient, ownerId: string, id: unknown, body: Record<string, unknown>): Promise<Ok<{ creative: Row }> | Fail> {
  const l = await load(db, ownerId, id);
  if (!("row" in l)) return l;
  if (!EDITABLE.includes(l.row.status as AdStatus)) return fail("locked", "This campaign can't be changed any more.", 409);
  const base = `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")}/storage/v1/object/public/ai-images/${ownerId}/`;
  const url = typeof body.url === "string" ? body.url : "";
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !url.startsWith(base) || url.length > 400) return fail("bad_asset", "That picture isn't from your ibaxai library.");
  const { count } = await db.from("ad_creatives").select("id", { count: "exact", head: true }).eq("campaign_id", id as string).eq("kind", "image");
  if ((count ?? 0) >= 12) return fail("limit", "This campaign already has 12 pictures. Remove some first.", 429);
  const row = { campaign_id: id, owner_id: ownerId, kind: "image", asset_url: url, placement: typeof body.placement === "string" ? body.placement.slice(0, 40) : "", prompt: typeof body.prompt === "string" ? body.prompt.slice(0, 1500) : "" };
  const { data, error } = await db.from("ad_creatives").insert(row).select("*").single();
  if (error || !data) return fail("server_error", "Couldn't save the picture.", 500);
  await event(db, id as string, ownerId, "asset_added", { creative: data.id });
  return { ok: true, creative: data as Row };
}

export async function setApproved(db: SupabaseClient, ownerId: string, id: unknown, creativeId: unknown, approved: unknown): Promise<Ok<{ creative: Row }> | Fail> {
  const l = await load(db, ownerId, id);
  if (!("row" in l)) return l;
  if (!EDITABLE.includes(l.row.status as AdStatus)) return fail("locked", "This campaign can't be changed any more.", 409);
  if (typeof creativeId !== "string" || typeof approved !== "boolean") return fail("bad_request", "Please try again.");
  const { data, error } = await db.from("ad_creatives").update({ approved }).eq("id", creativeId).eq("campaign_id", id as string).eq("owner_id", ownerId).select("*").single();
  if (error || !data) return fail("not_found", "That creative wasn't found.", 404);
  await event(db, id as string, ownerId, approved ? "creative_approved" : "creative_unapproved", { creative: creativeId });
  return { ok: true, creative: data as Row };
}

/**
 * The owner has chosen and approved the creatives: price them here and ask for payment. Needs at
 * least one approved text; image packs need approved pictures. Nothing is charged yet.
 */
export async function requestPayment(db: SupabaseClient, ownerId: string, id: unknown, body: Record<string, unknown>): Promise<Ok<{ campaign: Row; quote: ReturnType<typeof quote> & { ok: true } }> | Fail> {
  const l = await load(db, ownerId, id);
  if (!("row" in l)) return l;
  const row = l.row;
  if (!EDITABLE.includes(row.status as AdStatus)) return fail("locked", "This campaign can't be changed any more.", 409);
  const picks = { imagePacks: Number(body.imagePacks ?? 0), templateVideos: Number(body.templateVideos ?? 0), aiVideos: Number(body.aiVideos ?? 0) };
  if (!VIDEOS_AVAILABLE && (picks.templateVideos > 0 || picks.aiVideos > 0)) return fail("videos_soon", "Video ads are coming soon. For now you can order image packs.");
  const q = quote({ dailyBudgetInr: row.daily_budget_inr as number, days: row.days as number, ...picks });
  if (!q.ok) return fail("bad_quote", q.error);

  const { data: approved } = await db.from("ad_creatives").select("kind").eq("campaign_id", id as string).eq("owner_id", ownerId).eq("approved", true);
  const kinds = new Set(((approved ?? []) as { kind: string }[]).map((c) => c.kind));
  if (!kinds.has("copy")) return fail("no_copy", "Approve at least one ad text first.");
  if (picks.imagePacks > 0 && !kinds.has("image")) return fail("no_image", "Approve at least one picture first.");

  // draft → … → awaiting_payment goes through the allowed steps, one at a time.
  if (row.status === "draft") await move(db, row, "creatives_ready");
  if (row.status === "creatives_ready") await move(db, row, "awaiting_approval");
  const { data, error } = await db
    .from("ad_campaigns")
    .update({ creative_fee_inr: q.quote.creativeFeeInr, tax_inr: q.quote.taxInr, spend_estimate_inr: q.quote.adSpendInr, quote: { ...q.quote, picks }, updated_at: new Date().toISOString() })
    .eq("id", id as string)
    .eq("owner_id", ownerId)
    .eq("status", "awaiting_approval")
    .select("*")
    .single();
  if (error || !data) return fail("locked", "This campaign can't be changed any more.", 409);
  const next = data as Row;
  if (!(await move(db, next, "awaiting_payment", { payable: q.quote.payableToIbaxInr }))) return fail("locked", "This campaign can't be changed any more.", 409);
  return { ok: true, campaign: next, quote: q };
}

export const CTA_LIST = CTAS;
