"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, LifeBuoy, MessageCircle, Phone, Search, ShieldCheck } from "lucide-react";
import { cloudAuthHeader } from "@/lib/app/cloud";
import { waLink } from "@/lib/app/founder";
import { serviceById } from "@/content/app/services";
import { EmptyState, Input, Notice, PageHeader, Pill, WalkingIbax, Stat, fmtDate, relTime } from "@/components/app/ui";

type FounderClient = {
  id: string;
  email: string;
  name: string;
  phone: string;
  country: string;
  business: string;
  category: string;
  joinedAt: string;
  lastSeenAt: string | null;
  lastActiveAt: string | null;
  paid: { serviceId: string; period: string; price: number; renewsAt: string | null }[];
  automations: { serviceId: string; status: string; trial: boolean }[];
  trialEndsAt: string | null;
  whatsapp: { instance: string; connection: string }[];
  leads: number;
  openTickets: number;
};
type Stats = { clients: number; newThisWeek: number; paying: number; onTrial: number; revenue: number; whatsappDown: number; openTickets: number };
type Filter = "all" | "paying" | "trial" | "attention";

const svcName = (id: string) => serviceById(id)?.name ?? id;


/** Needs the founder's help: WhatsApp unlinked, a service failed or waits for attention, or an open request. */
const needsHelp = (c: FounderClient) =>
  c.openTickets > 0 || c.whatsapp.some((w) => w.connection === "closed") || c.automations.some((a) => a.status === "failed" || a.status === "attention");

/** The founder's view of every client, to help anyone who is stuck. Only the founder's account gets data. */
export default function FounderConsole() {
  const [state, setState] = useState<"loading" | "denied" | "error" | "ready">("loading");
  const [stats, setStats] = useState<Stats | null>(null);
  const [clients, setClients] = useState<FounderClient[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loadedAt, setLoadedAt] = useState(0);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/founder", { headers: await cloudAuthHeader() }).catch(() => null);
      if (res?.status === 403) return setState("denied");
      const out = (await res?.json().catch(() => null)) as { ok?: boolean; stats: Stats; clients: FounderClient[] } | null;
      if (!out?.ok) return setState("error");
      setStats(out.stats);
      setClients(out.clients);
      setLoadedAt(Date.now());
      setState("ready");
    })();
  }, []);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    const now = loadedAt;
    return clients.filter((c) => {
      if (filter === "paying" && !c.paid.length) return false;
      if (filter === "trial" && !(c.trialEndsAt && Date.parse(c.trialEndsAt) > now)) return false;
      if (filter === "attention" && !needsHelp(c)) return false;
      return !t || [c.name, c.email, c.phone, c.business, c.category].some((v) => v.toLowerCase().includes(t));
    });
  }, [clients, q, filter, loadedAt]);

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 pt-6 pb-16">
      <Link href="/app/home" className="mb-5 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> Back to my workspace
      </Link>
      <Link href="/app/founder/voice" className="mb-4 ml-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <Phone className="size-4" aria-hidden /> AI Voice numbers &amp; packages
      </Link>
      <Link href="/app/founder/whatsapp" className="mb-4 ml-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <MessageCircle className="size-4" aria-hidden /> Free a stuck WhatsApp number
      </Link>
      <PageHeader eyebrow="Founder" title="Founder Console" subtitle="Every client, their services and where they are stuck. Only your founder account can open this." />

      {state === "loading" && (
        <div className="flex justify-center py-10" role="status" aria-label="Loading">
          <WalkingIbax />
        </div>
      )}
      {state === "denied" && (
        <Notice tone="amber">
          <ShieldCheck className="mr-1.5 inline size-4" aria-hidden />
          This page is only for the ibaxai founder. Log in with the founder account to open it.
        </Notice>
      )}
      {state === "error" && <Notice tone="amber">Couldn&apos;t load the clients right now. Please try again in a minute.</Notice>}

      {state === "ready" && stats && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Clients" value={stats.clients} hint={`${stats.newThisWeek} new this week`} />
            <Stat label="Paying" value={stats.paying} hint={`${stats.onTrial} on free trial`} />
            <Stat label="Active plans" value={`₹${stats.revenue.toLocaleString("en-IN")}`} hint="value of active paid plans" />
            <Stat label="Need help" value={clients.filter(needsHelp).length} hint={`${stats.openTickets} open requests · ${stats.whatsappDown} WhatsApp unlinked`} />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
              <span className="sr-only">Search clients</span>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, business, email or phone" className="pl-9" />
            </label>
            <div className="flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Filter">
              {(
                [
                  ["all", "All"],
                  ["attention", "Need help"],
                  ["paying", "Paying"],
                  ["trial", "Trial"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filter === id}
                  onClick={() => setFilter(id)}
                  className={`h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium ${filter === id ? "border-flow/50 bg-flow/15 text-flow" : "border-white/10 text-fg-muted hover:text-fg"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ul className="mt-4 grid gap-3">
            {shown.map((c) => (
              <li key={c.id} className="glass rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link href={`/app/founder/${c.id}`} className="min-w-0 flex-1 hover:opacity-90">
                    <p className="truncate font-semibold">{c.business || c.name || c.email}</p>
                    <p className="truncate text-sm text-fg-muted">
                      {[c.name, c.email].filter(Boolean).join(" · ")}
                      {c.category ? ` · ${c.category}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-fg-subtle">
                      Joined {fmtDate(c.joinedAt)}
                      {c.lastSeenAt ? ` · last login ${relTime(c.lastSeenAt)}` : ""}
                    </p>
                  </Link>
                  {c.phone && (
                    <div className="flex gap-2">
                      <a href={`tel:${c.phone.replace(/\s/g, "")}`} aria-label={`Call ${c.name || "client"}`} className="grid size-10 place-items-center rounded-full border border-white/12 hover:border-flow/50">
                        <Phone className="size-4" aria-hidden />
                      </a>
                      <a href={waLink(c.phone)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${c.name || "client"}`} className="grid size-10 place-items-center rounded-full border border-white/12 hover:border-flow/50">
                        <MessageCircle className="size-4" aria-hidden />
                      </a>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.paid.map((p) => (
                    <Pill key={p.serviceId + p.period} tone="green">
                      {svcName(p.serviceId)} · paid
                    </Pill>
                  ))}
                  {c.automations
                    .filter((a) => !c.paid.some((p) => p.serviceId === a.serviceId))
                    .map((a) => (
                      <Pill key={a.serviceId} tone={a.status === "failed" || a.status === "attention" ? "red" : a.trial ? "blue" : "gray"}>
                        {svcName(a.serviceId)} · {a.trial ? "trial" : a.status}
                      </Pill>
                    ))}
                  {c.whatsapp.map((w) => (
                    <Pill key={w.instance} tone={w.connection === "open" ? "green" : w.connection === "closed" ? "red" : "gray"}>
                      WhatsApp {w.connection === "open" ? "linked" : w.connection === "closed" ? "unlinked" : "unknown"}
                    </Pill>
                  ))}
                  {c.openTickets > 0 && (
                    <Pill tone="amber">
                      <LifeBuoy className="size-3" aria-hidden /> {c.openTickets} open request{c.openTickets > 1 ? "s" : ""}
                    </Pill>
                  )}
                  {!c.paid.length && !c.automations.length && <Pill>No service yet</Pill>}
                </div>
              </li>
            ))}
          </ul>
          {!shown.length && <EmptyState title="No clients here">Try another search or filter.</EmptyState>}
        </>
      )}
    </div>
  );
}
