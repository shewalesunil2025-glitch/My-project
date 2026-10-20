import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { founderFromRequest } from "@/lib/server/founder";
import type { Workspace } from "@/lib/app/types";

/**
 * Founder console: every client at a glance (`?check=1` only answers whether you're the founder).
 * Reads with the server key; only the founder's own signed-in request gets an answer.
 */
export async function GET(request: Request) {
  const f = await founderFromRequest(request);
  if (!f) return NextResponse.json({ ok: false }, { status: 403 });
  if (new URL(request.url).searchParams.get("check")) return NextResponse.json({ ok: true });

  const users: User[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await f.db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return NextResponse.json({ ok: false, reason: "users" }, { status: 502 });
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }

  const [profiles, workspaces, subs, instances, leads, contacts] = await Promise.all([
    f.db.from("profiles").select("id, name, phone, country"),
    // Only the parts the list needs (chats, logos and history stay out of it).
    f.db.from("workspaces").select("owner_id, updated_at, business:data->business, automations:data->automations, trial:data->trial, tickets:data->tickets"),
    f.db.from("subscriptions").select("owner_id, service_id, period, price, status, renews_at, started_at"),
    f.db.from("wa_instances").select("owner_id, instance, connection"),
    f.db.from("site_leads").select("owner_id"),
    f.db.from("wa_contacts").select("owner_id"),
  ]);
  const by = <T extends Record<string, unknown>>(rows: T[] | null, key: keyof T) => {
    const m = new Map<string, T[]>();
    for (const r of rows ?? []) m.set(String(r[key]), [...(m.get(String(r[key])) ?? []), r]);
    return m;
  };
  const prof = by(profiles.data, "id");
  const wsBy = by(workspaces.data, "owner_id");
  const subBy = by(subs.data, "owner_id");
  const waBy = by(instances.data, "owner_id");
  const leadBy = by(leads.data, "owner_id");
  const contactBy = by(contacts.data, "owner_id");

  const now = Date.now();
  const clients = users.map((u) => {
    const p = prof.get(u.id)?.[0];
    const row = wsBy.get(u.id)?.[0];
    const ws = (row ?? {}) as Partial<Pick<Workspace, "business" | "automations" | "trial" | "tickets">>;
    const paid = (subBy.get(u.id) ?? []).filter((s) => s.status === "active" && (!s.renews_at || Date.parse(String(s.renews_at)) > now));
    const automations = (ws.automations ?? []).map((a) => ({ serviceId: a.serviceId, status: a.status, trial: Boolean(a.trialEndsAt) }));
    const openTickets = (ws.tickets ?? []).filter((t) => t.status !== "resolved").length;
    const meta = u.user_metadata ?? {};
    return {
      id: u.id,
      email: u.email ?? "",
      name: p?.name || meta.name || "",
      phone: p?.phone || meta.phone || "",
      country: p?.country || meta.country || "",
      business: ws.business?.name ?? "",
      category: ws.business?.category ?? "",
      joinedAt: u.created_at,
      lastSeenAt: u.last_sign_in_at ?? null,
      lastActiveAt: row?.updated_at ?? null,
      paid: paid.map((s) => ({ serviceId: s.service_id, period: s.period, price: Number(s.price), renewsAt: s.renews_at })),
      automations,
      trialEndsAt: ws.trial?.endsAt ?? null,
      whatsapp: (waBy.get(u.id) ?? []).map((w) => ({ instance: w.instance, connection: w.connection ?? "unknown" })),
      leads: (leadBy.get(u.id) ?? []).length + (contactBy.get(u.id) ?? []).length,
      openTickets,
    };
  });
  clients.sort((a, b) => Date.parse(b.joinedAt) - Date.parse(a.joinedAt));

  const week = now - 7 * 86_400_000;
  const allPaid = (subs.data ?? []).filter((s) => s.status === "active");
  const stats = {
    clients: clients.length,
    newThisWeek: clients.filter((c) => Date.parse(c.joinedAt) > week).length,
    paying: clients.filter((c) => c.paid.length).length,
    onTrial: clients.filter((c) => c.trialEndsAt && Date.parse(c.trialEndsAt) > now).length,
    revenue: allPaid.reduce((s, r) => s + Number(r.price || 0), 0),
    whatsappDown: clients.filter((c) => c.whatsapp.some((w) => w.connection === "closed")).length,
    openTickets: clients.reduce((s, c) => s + c.openTickets, 0),
  };
  return NextResponse.json({ ok: true, stats, clients });
}
