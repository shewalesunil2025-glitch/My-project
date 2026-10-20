import { NextResponse } from "next/server";
import { serviceById } from "@/content/app/services";
import { sendActivation } from "@/lib/server/billing";
import { founderFromRequest } from "@/lib/server/founder";
import type { Workspace } from "@/lib/app/types";

const UUID = /^[0-9a-f-]{36}$/i;

/** One client in full, for the founder: account, business, services, WhatsApp, leads and requests. */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const f = await founderFromRequest(request);
  if (!f) return NextResponse.json({ ok: false }, { status: 403 });
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });

  const { data: auth } = await f.db.auth.admin.getUserById(id);
  if (!auth.user) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  const [profile, workspace, subs, wa, messages, siteLeads, site] = await Promise.all([
    f.db.from("profiles").select("name, phone, country").eq("id", id).maybeSingle(),
    f.db
      .from("workspaces")
      .select("updated_at, business:data->business, automations:data->automations, connections:data->connections, trial:data->trial, tickets:data->tickets, invoices:data->invoices, waitlist:data->waitlist")
      .eq("owner_id", id)
      .maybeSingle(),
    f.db.from("subscriptions").select("id, service_id, period, price, status, started_at, renews_at, payment_ref").eq("owner_id", id).order("started_at", { ascending: false }),
    f.db.from("wa_instances").select("instance, connection, checked_at, created_at").eq("owner_id", id),
    f.db.from("wa_messages").select("phone, name, direction, text, needs_human, created_at").eq("owner_id", id).order("created_at", { ascending: false }).limit(20),
    f.db.from("site_leads").select("name, phone, message, created_at").eq("owner_id", id).order("created_at", { ascending: false }).limit(10),
    f.db.from("sites").select("slug, published_at").eq("owner_id", id).maybeSingle(),
  ]);
  const ws = (workspace.data ?? {}) as Partial<Workspace> & { updated_at?: string };
  const { logo: _logo, ...business } = ws.business ?? ({} as NonNullable<Workspace["business"]>);
  void _logo;
  const meta = auth.user.user_metadata ?? {};

  return NextResponse.json({
    ok: true,
    client: {
      id,
      email: auth.user.email ?? "",
      name: profile.data?.name || meta.name || "",
      phone: profile.data?.phone || meta.phone || "",
      country: profile.data?.country || meta.country || "",
      signIn: auth.user.app_metadata?.provider ?? "email",
      joinedAt: auth.user.created_at,
      lastSeenAt: auth.user.last_sign_in_at ?? null,
      lastActiveAt: ws.updated_at ?? null,
      business: ws.business ? business : null,
      automations: (ws.automations ?? []).map((a) => ({
        serviceId: a.serviceId,
        status: a.status,
        note: a.note ?? "",
        trialEndsAt: a.trialEndsAt ?? null,
        paidUntil: a.paidUntil ?? null,
        activatedAt: a.activatedAt ?? null,
        logs: (a.logs ?? []).slice(0, 5),
      })),
      connections: Object.values(ws.connections ?? {}).map((c) => ({ provider: c?.provider, status: c?.status, account: c?.account, connectedAt: c?.connectedAt })),
      trialEndsAt: ws.trial?.endsAt ?? null,
      tickets: ws.tickets ?? [],
      invoices: (ws.invoices ?? []).slice(0, 20),
      waitlist: ws.waitlist ?? [],
      subscriptions: subs.data ?? [],
      whatsapp: wa.data ?? [],
      messages: messages.data ?? [],
      siteLeads: siteLeads.data ?? [],
      site: site.data ?? null,
    },
  });
}

/**
 * Help a client: extend a paid plan, send a service to the automation server again, or email a
 * password-reset link. Every action is logged with who did it.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const f = await founderFromRequest(request);
  if (!f) return NextResponse.json({ ok: false }, { status: 403 });
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  const body = (await request.json().catch(() => ({}))) as { action?: string; subscriptionId?: string; days?: number; serviceId?: string };
  const log = (what: string) => console.info(`[founder] ${f.email} → ${id}: ${what}`);

  if (body.action === "extend") {
    const days = Math.round(Number(body.days));
    if (!body.subscriptionId || !UUID.test(body.subscriptionId) || !(days >= 1 && days <= 366)) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
    const { data: sub } = await f.db.from("subscriptions").select("id, renews_at, period").eq("id", body.subscriptionId).eq("owner_id", id).maybeSingle();
    if (!sub || sub.period === "one-time") return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
    // From today if the plan already ended; the app picks up the new end date within minutes.
    const from = sub.renews_at && Date.parse(sub.renews_at) > Date.now() ? new Date(sub.renews_at) : new Date();
    from.setDate(from.getDate() + days);
    const { error } = await f.db.from("subscriptions").update({ renews_at: from.toISOString(), status: "active" }).eq("id", sub.id);
    if (error) return NextResponse.json({ ok: false, reason: "failed" }, { status: 500 });
    log(`extended ${sub.id} by ${days} days to ${from.toISOString()}`);
    return NextResponse.json({ ok: true, renewsAt: from.toISOString() });
  }

  if (body.action === "reactivate") {
    const svc = body.serviceId ? serviceById(body.serviceId) : undefined;
    if (!svc) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
    const { data: row } = await f.db.from("workspaces").select("id, data").eq("owner_id", id).maybeSingle();
    const ws = row?.data as Workspace | undefined;
    const auto = ws?.automations?.find((a) => a.serviceId === svc.id);
    if (!row || !ws || !auto) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
    const accounts = Object.fromEntries(Object.values(ws.connections ?? {}).filter((c) => c && c.status === "connected").map((c) => [c!.provider, c!.account]));
    const mode = await sendActivation({ workspaceId: ws.id || row.id, serviceId: svc.id, business: ws.business, config: auto.config, accounts, trialEndsAt: auto.trialEndsAt });
    log(`re-sent ${svc.id} to the automation server (${mode})`);
    if (mode === "failed") return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
    return NextResponse.json({ ok: true, mode });
  }

  if (body.action === "reset-password") {
    const { data } = await f.db.auth.admin.getUserById(id);
    const email = data.user?.email;
    if (!email) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
    const { error } = await f.db.auth.resetPasswordForEmail(email, { redirectTo: `${new URL(request.url).origin}/app/reset` });
    if (error) return NextResponse.json({ ok: false, reason: "failed", message: error.message }, { status: 502 });
    log("sent a password-reset email");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
}
