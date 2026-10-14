import type { SupabaseClient } from "@supabase/supabase-js";
import { annualPrice, priceIn, serviceById, type ServiceDef } from "@/content/app/services";
import { chargeInInr, currencyForCountry } from "@/config/product";
import type { Workspace } from "@/lib/app/types";

/**
 * Server-side billing shared by checkout, Autopay and the Razorpay webhook: the price an owner
 * pays (worked out here, never trusted from the browser), recording a paid period, and telling
 * the automation server (n8n) how long a service is paid for.
 */

const DAY = 86_400_000;
/** Same as GRACE_DAYS in src/lib/app/trial.ts. */
const GRACE_DAYS = 3;

export type Period = "monthly" | "annual" | "one-time";

export async function ownerPrice(db: SupabaseClient, userId: string, svc: ServiceDef, period: Period) {
  const { data: row } = await db.from("workspaces").select("data").eq("owner_id", userId).maybeSingle();
  const ws = row?.data as { business?: { country?: string; name?: string; email?: string; phone?: string } | null } | undefined;
  const currency = currencyForCountry(ws?.business?.country);
  const base = priceIn(svc, currency) ?? svc.price ?? 0;
  const amount = period === "annual" ? annualPrice(base) : base;
  return { currency, amount, inr: chargeInInr(amount, currency), business: ws?.business ?? null };
}

/** Forwards `service.activated` to the master n8n workflow. "preview" when n8n isn't set up. */
export async function sendActivation(payload: {
  workspaceId: string;
  serviceId: string;
  business: unknown;
  config: unknown;
  accounts: unknown;
  trialEndsAt?: unknown;
}): Promise<"sent" | "preview" | "failed"> {
  const url = process.env.N8N_ACTIVATE_WEBHOOK_URL;
  if (!url) return "preview";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ibax-secret": process.env.N8N_WEBHOOK_SECRET ?? "" },
      body: JSON.stringify({
        event: "service.activated",
        at: new Date().toISOString(),
        workspaceId: payload.workspaceId,
        serviceId: payload.serviceId,
        business: payload.business && typeof payload.business === "object" ? { ...(payload.business as Record<string, unknown>), logo: undefined } : null,
        config: payload.config ?? {},
        accounts: payload.accounts ?? {},
        // The service stops after this time unless it's paid again ("" = no end).
        trialEndsAt: typeof payload.trialEndsAt === "string" && !Number.isNaN(Date.parse(payload.trialEndsAt)) ? new Date(payload.trialEndsAt).toISOString() : "",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error(`[activate] automation server answered ${res.status}`);
    return res.ok ? "sent" : "failed";
  } catch (error) {
    console.error("[activate] automation server unreachable", error);
    return "failed";
  }
}

const loadWorkspace = async (db: SupabaseClient, userId: string) => {
  const { data } = await db.from("workspaces").select("data").eq("owner_id", userId).maybeSingle();
  return (data?.data as Workspace | undefined) ?? null;
};
const saveWorkspace = (db: SupabaseClient, userId: string, ws: Workspace) => db.from("workspaces").update({ data: ws }).eq("owner_id", userId);
const newId = () => crypto.randomUUID();

/** Autopay switched on (with the Razorpay subscription id) or off (null) for a plan. */
export async function markAutopay(db: SupabaseClient, userId: string, serviceId: string, autopayId: string | null) {
  const ws = await loadWorkspace(db, userId);
  const sub = ws?.subscriptions.find((s) => s.serviceId === serviceId && s.period !== "one-time" && s.status !== "trial");
  if (!ws || !sub) return;
  if (autopayId) sub.autopayId = autopayId;
  else if (sub.autopayId) delete sub.autopayId;
  else return;
  await saveWorkspace(db, userId, ws);
}

/** The server's record of a paid period (the `subscriptions` table), once per payment. */
export async function recordPaidRow(db: SupabaseClient, c: { userId: string; serviceId: string; period: "monthly" | "annual"; renewsAt: string; paymentId: string; amountInr: number }) {
  const { data: seen } = await db.from("subscriptions").select("id").eq("payment_ref", c.paymentId).maybeSingle();
  if (seen) return;
  const { data: current } = await db.from("subscriptions").select("id").eq("owner_id", c.userId).eq("service_id", c.serviceId).eq("status", "active").order("renews_at", { ascending: false }).limit(1).maybeSingle();
  const row = { period: c.period, price: c.amountInr, status: "active", renews_at: c.renewsAt, payment_ref: c.paymentId };
  const { error } = current ? await db.from("subscriptions").update(row).eq("id", current.id) : await db.from("subscriptions").insert({ owner_id: c.userId, service_id: c.serviceId, ...row });
  if (error) console.error("[pay] could not record subscription", error.message);
}

/**
 * Autopay took a payment: the plan now runs until `renewsAt`. Safe to call twice for the same
 * payment. Updates the subscriptions table, the owner's workspace (plan, invoice, service back
 * on) and tells n8n the new end date.
 */
export async function recordAutopayCharge(
  db: SupabaseClient,
  c: { userId: string; serviceId: string; period: "monthly" | "annual"; renewsAt: string; paymentId: string; amountInr: number; amount: number; currency: "INR" | "USD"; autopayId: string },
) {
  const svc = serviceById(c.serviceId);
  if (!svc) return;
  await recordPaidRow(db, c);

  const ws = await loadWorkspace(db, c.userId);
  if (!ws) return;
  const now = new Date().toISOString();
  const paidUntil = new Date(Date.parse(c.renewsAt) + GRACE_DAYS * DAY).toISOString();
  let sub = ws.subscriptions.find((s) => s.serviceId === c.serviceId && s.period !== "one-time");
  if (!sub) {
    sub = { id: newId(), serviceId: c.serviceId, period: c.period, price: c.amount, status: "active", startedAt: now, renewsAt: c.renewsAt, currency: c.currency };
    ws.subscriptions.unshift(sub);
  }
  // Absolute dates, so a second delivery of the same charge changes nothing.
  if (Date.parse(c.renewsAt) > Date.parse(sub.renewsAt) || sub.status !== "active") Object.assign(sub, { status: "active", renewsAt: c.renewsAt });
  Object.assign(sub, { period: c.period, price: c.amount, currency: c.currency, autopayId: c.autopayId });

  const fresh = !ws.invoices.some((i) => i.paymentRef === c.paymentId);
  if (fresh) {
    ws.invoices.unshift({ id: newId(), number: `LUMI-${1000 + ws.invoices.length + 1}`, serviceId: c.serviceId, period: c.period, amount: c.amount, currency: c.currency, date: now, status: "paid", paymentRef: c.paymentId });
    ws.activity.unshift({ id: newId(), at: now, kind: "payment", title: `${svc.name} renewed by Autopay`, href: "/app/billing" });
    if (ws.notificationPrefs?.payment) ws.notifications.unshift({ id: newId(), at: now, read: false, kind: "payment", title: "Autopay: plan renewed", detail: `${svc.name} runs until ${new Date(c.renewsAt).toLocaleDateString("en-IN")}.`, href: "/app/billing" });
  }

  const a = ws.automations.find((x) => x.serviceId === c.serviceId);
  if (a && !a.trialEndsAt) {
    const wasOver = Boolean(a.paidUntil && Date.parse(a.paidUntil) <= Date.now());
    if (!a.paidUntil || Date.parse(paidUntil) > Date.parse(a.paidUntil)) a.paidUntil = paidUntil;
    if (wasOver && a.status === "paused") {
      a.status = a.activatedAt ? "active" : "setup";
      a.note = undefined;
    }
    if (fresh) a.logs.unshift({ at: now, level: "success", message: `Autopay renewed until ${new Date(c.renewsAt).toLocaleDateString("en-IN")}` });
  }
  await saveWorkspace(db, c.userId, ws);

  // The automation server stops at the old end date unless it hears about the new one.
  if (a?.status === "active") {
    await sendActivation({
      workspaceId: ws.id,
      serviceId: svc.id,
      business: ws.business,
      config: a.config,
      accounts: Object.fromEntries(svc.connect.map((p) => [p, ws.connections[p]?.account ?? ""])),
      trialEndsAt: a.paidUntil,
    });
  }
}
