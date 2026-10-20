"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, KeyRound, Mail, MessageCircle, Phone, RefreshCw } from "lucide-react";
import { cloudAuthHeader } from "@/lib/app/cloud";
import { waLink } from "@/lib/app/founder";
import { serviceById } from "@/content/app/services";
import type { Business, LogEntry, Ticket } from "@/lib/app/types";
import { Btn, Card, Input, Notice, PageHeader, Pill, SectionTitle, Spinner, fmtDate, fmtDateTime, relTime } from "@/components/app/ui";


type Sub = { id: string; service_id: string; period: string; price: number; status: string; started_at: string; renews_at: string | null; payment_ref: string | null };
type Detail = {
  id: string;
  email: string;
  name: string;
  phone: string;
  country: string;
  signIn: string;
  joinedAt: string;
  lastSeenAt: string | null;
  lastActiveAt: string | null;
  business: Partial<Business> | null;
  automations: { serviceId: string; status: string; note: string; trialEndsAt: string | null; paidUntil: string | null; activatedAt: string | null; logs: LogEntry[] }[];
  connections: { provider?: string; status?: string; account?: string; connectedAt?: string }[];
  trialEndsAt: string | null;
  tickets: Ticket[];
  invoices: { id: string; number: string; serviceId: string; amount: number; date: string; status: string }[];
  waitlist: string[];
  subscriptions: Sub[];
  whatsapp: { instance: string; connection: string | null; checked_at: string | null }[];
  messages: { phone: string; name: string | null; direction: string; text: string; needs_human: boolean | null; created_at: string }[];
  siteLeads: { name: string | null; phone: string | null; message: string | null; created_at: string }[];
  site: { slug: string; published_at: string | null } | null;
};

const svcName = (id: string) => serviceById(id)?.name ?? id;
const ended = (iso: string | null) => Boolean(iso && Date.parse(iso) < Date.now());

/** One client in full, with the buttons the founder needs to get them unstuck. */
export default function FounderClientPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<"loading" | "denied" | "error" | "ready">("loading");
  const [c, setC] = useState<Detail | null>(null);
  const [days, setDays] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ tone: "blue" | "amber"; text: string } | null>(null);

  const [version, setVersion] = useState(0);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/founder/${id}`, { headers: await cloudAuthHeader() }).catch(() => null);
      if (res?.status === 403) return setState("denied");
      const out = (await res?.json().catch(() => null)) as { ok?: boolean; client: Detail } | null;
      if (!out?.ok) return setState("error");
      setC(out.client);
      setState("ready");
    })();
  }, [id, version]);

  const act = async (key: string, body: Record<string, unknown>, done: string) => {
    setBusy(key);
    setMsg(null);
    const res = await fetch(`/api/founder/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(await cloudAuthHeader()) },
      body: JSON.stringify(body),
    }).catch(() => null);
    const out = (await res?.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
    setBusy("");
    setMsg(out?.ok ? { tone: "blue", text: done } : { tone: "amber", text: `That didn't work${out?.message ? `: ${out.message}` : ""}. Please try again.` });
    if (out?.ok) setVersion((v) => v + 1);
  };

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 pt-6 pb-16">
      <Link href="/app/founder" className="mb-5 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> All clients
      </Link>

      {state === "loading" && (
        <div className="flex justify-center py-16">
          <Spinner className="size-6" />
        </div>
      )}
      {state === "denied" && <Notice tone="amber">This page is only for the ibaxai founder. Log in with the founder account to open it.</Notice>}
      {state === "error" && <Notice tone="amber">Couldn&apos;t load this client right now. Please try again in a minute.</Notice>}

      {state === "ready" && c && (
        <>
          <PageHeader
            eyebrow="Client"
            title={c.business?.name || c.name || c.email}
            subtitle={[c.name, c.business?.category, c.business?.city, c.country].filter(Boolean).join(" · ")}
          />

          <div className="flex flex-wrap gap-2">
            {c.phone && (
              <>
                <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 px-4 text-sm hover:border-flow/50">
                  <Phone className="size-4" aria-hidden /> Call
                </a>
                <a href={waLink(c.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 px-4 text-sm hover:border-flow/50">
                  <MessageCircle className="size-4" aria-hidden /> WhatsApp
                </a>
              </>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 px-4 text-sm hover:border-flow/50">
                <Mail className="size-4" aria-hidden /> Email
              </a>
            )}
            <Btn variant="ghost" size="sm" className="h-10 rounded-full" disabled={busy === "reset"} onClick={() => act("reset", { action: "reset-password" }, `Password-reset link sent to ${c.email}.`)}>
              <KeyRound className="size-4" aria-hidden /> {busy === "reset" ? "Sending…" : "Send password reset"}
            </Btn>
          </div>

          {msg && (
            <Notice tone={msg.tone} className="mt-4">
              {msg.text}
            </Notice>
          )}

          <Section title="Account">
            <Rows
              rows={[
                ["Email", c.email],
                ["Phone", c.phone],
                ["Signs in with", c.signIn],
                ["Joined", fmtDate(c.joinedAt)],
                ["Last login", c.lastSeenAt ? relTime(c.lastSeenAt) : "—"],
                ["Last active in app", c.lastActiveAt ? relTime(c.lastActiveAt) : "—"],
                ["Free trial", c.trialEndsAt ? `${ended(c.trialEndsAt) ? "ended" : "ends"} ${fmtDate(c.trialEndsAt)}` : "—"],
              ]}
            />
          </Section>

          {c.business && (
            <Section title="Business">
              <Rows
                rows={[
                  ["Owner", c.business.ownerName],
                  ["Business phone", c.business.phone],
                  ["Business email", c.business.email],
                  ["Address", [c.business.address, c.business.city].filter(Boolean).join(", ")],
                  ["Website", c.business.websiteUrl],
                  ["Hours", c.business.hours],
                  ["Services", c.business.services],
                  ["About", c.business.description],
                ]}
              />
            </Section>
          )}

          <Section title="Paid plans">
            {c.subscriptions.length ? (
              <ul className="grid gap-3">
                {c.subscriptions.map((s) => {
                  const live = s.status === "active" && !ended(s.renews_at);
                  return (
                    <li key={s.id} className="rounded-xl border border-white/8 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">
                          {svcName(s.service_id)} <span className="text-sm text-fg-muted">· {s.period} · ₹{Number(s.price).toLocaleString("en-IN")}</span>
                        </p>
                        <Pill tone={live ? "green" : "red"}>{live ? "active" : s.status === "active" ? "ended" : s.status}</Pill>
                      </div>
                      <p className="mt-1 text-xs text-fg-subtle">
                        Started {fmtDate(s.started_at)}
                        {s.renews_at ? ` · ${ended(s.renews_at) ? "ended" : "runs till"} ${fmtDate(s.renews_at)}` : ""}
                        {s.payment_ref ? ` · ${s.payment_ref}` : ""}
                      </p>
                      {s.period !== "one-time" && (
                        <div className="mt-2 flex items-center gap-2">
                          <label className="sr-only" htmlFor={`days-${s.id}`}>
                            Days to add
                          </label>
                          <Input id={`days-${s.id}`} type="number" min={1} max={366} inputMode="numeric" value={days[s.id] ?? "30"} onChange={(e) => setDays((d) => ({ ...d, [s.id]: e.target.value }))} className="h-9 w-20" />
                          <span className="text-sm text-fg-muted">days</span>
                          <Btn
                            size="sm"
                            variant="ghost"
                            disabled={busy === s.id}
                            onClick={() => {
                              const n = Number(days[s.id] ?? "30");
                              if (!(n >= 1 && n <= 366)) return setMsg({ tone: "amber", text: "Days must be between 1 and 366." });
                              void act(s.id, { action: "extend", subscriptionId: s.id, days: n }, `${svcName(s.service_id)} extended by ${n} days. The client's app shows it within a few minutes.`);
                            }}
                          >
                            {busy === s.id ? "Saving…" : "Extend plan"}
                          </Btn>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-fg-muted">No paid plan yet.</p>
            )}
          </Section>

          <Section title="Services (automations)">
            {c.automations.length ? (
              <ul className="grid gap-3">
                {c.automations.map((a) => (
                  <li key={a.serviceId} className="rounded-xl border border-white/8 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{svcName(a.serviceId)}</p>
                      <div className="flex items-center gap-2">
                        <Pill tone={a.status === "active" ? "green" : a.status === "failed" || a.status === "attention" ? "red" : "gray"}>{a.status}</Pill>
                        <Btn size="sm" variant="ghost" disabled={busy === a.serviceId} onClick={() => act(a.serviceId, { action: "reactivate", serviceId: a.serviceId }, `${svcName(a.serviceId)} sent to the automation server again.`)}>
                          <RefreshCw className="size-3.5" aria-hidden /> {busy === a.serviceId ? "Sending…" : "Re-send to n8n"}
                        </Btn>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-fg-subtle">
                      {[
                        a.activatedAt && `Activated ${fmtDate(a.activatedAt)}`,
                        a.trialEndsAt && `trial ${ended(a.trialEndsAt) ? "ended" : "till"} ${fmtDate(a.trialEndsAt)}`,
                        a.paidUntil && `paid till ${fmtDate(a.paidUntil)}`,
                        a.note,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {a.logs.length > 0 && (
                      <ul className="mt-2 grid gap-1 border-t border-white/6 pt-2 text-xs">
                        {a.logs.map((l, i) => (
                          <li key={i} className={l.level === "error" ? "text-red-300" : l.level === "warning" ? "text-amber-200" : "text-fg-muted"}>
                            {fmtDateTime(l.at)} — {l.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fg-muted">No service started yet.</p>
            )}
            {c.waitlist.length > 0 && <p className="mt-3 text-sm text-fg-muted">Waiting for: {c.waitlist.map(svcName).join(", ")}</p>}
          </Section>

          <Section title="WhatsApp & connected accounts">
            <div className="flex flex-wrap gap-1.5">
              {c.whatsapp.map((w) => (
                <Pill key={w.instance} tone={w.connection === "open" ? "green" : w.connection === "closed" ? "red" : "gray"}>
                  WhatsApp {w.connection === "open" ? "linked" : w.connection === "closed" ? "unlinked — ask them to scan the QR again" : "unknown"}
                </Pill>
              ))}
              {c.connections.map((x, i) => (
                <Pill key={i} tone={x.status === "connected" ? "green" : "gray"}>
                  {x.provider} · {x.status}
                  {x.account ? ` · ${x.account}` : ""}
                </Pill>
              ))}
              {!c.whatsapp.length && !c.connections.length && <p className="text-sm text-fg-muted">Nothing connected yet.</p>}
            </div>
          </Section>

          {c.tickets.length > 0 && (
            <Section title="Help requests">
              <ul className="grid gap-2">
                {c.tickets.map((t) => (
                  <li key={t.id} className="rounded-xl border border-white/8 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">
                        {t.number} · {t.subject}
                      </p>
                      <Pill tone={t.status === "resolved" ? "green" : "amber"}>{t.status.replace("_", " ")}</Pill>
                    </div>
                    <p className="mt-1 text-sm whitespace-pre-line text-fg-muted">{t.message}</p>
                    <p className="mt-1 text-xs text-fg-subtle">{fmtDateTime(t.createdAt)}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {c.messages.length > 0 && (
            <Section title="Latest WhatsApp messages">
              <ul className="grid gap-1.5 text-sm">
                {c.messages.map((m, i) => (
                  <li key={i} className={m.needs_human ? "text-amber-200" : "text-fg-muted"}>
                    <span className="text-xs text-fg-subtle">{fmtDateTime(m.created_at)}</span> {m.direction === "in" ? "←" : "→"} {m.name || m.phone}: {m.text}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {(c.site || c.siteLeads.length > 0) && (
            <Section title="Website & leads">
              {c.site && (
                <p className="mb-2 text-sm text-fg-muted">
                  Site: <span className="text-fg">{c.site.slug}</span> {c.site.published_at ? `· published ${fmtDate(c.site.published_at)}` : "· not published"}
                </p>
              )}
              <ul className="grid gap-1.5 text-sm text-fg-muted">
                {c.siteLeads.map((l, i) => (
                  <li key={i}>
                    <span className="text-xs text-fg-subtle">{fmtDateTime(l.created_at)}</span> {[l.name, l.phone, l.message].filter(Boolean).join(" · ")}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {c.invoices.length > 0 && (
            <Section title="Invoices">
              <ul className="grid gap-1.5 text-sm text-fg-muted">
                {c.invoices.map((v) => (
                  <li key={v.id}>
                    {v.number} · {svcName(v.serviceId)} · ₹{Number(v.amount).toLocaleString("en-IN")} · {fmtDate(v.date)} · {v.status}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <SectionTitle>{title}</SectionTitle>
      <Card className="p-4">{children}</Card>
    </section>
  );
}

function Rows({ rows }: { rows: [string, string | undefined][] }) {
  return (
    <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-fg-subtle">{k}</dt>
            <dd className="break-words whitespace-pre-line">{v}</dd>
          </div>
        ))}
    </dl>
  );
}
