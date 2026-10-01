"use client";

import Link from "next/link";
import { useState } from "react";
import type { ActivityKind } from "@/lib/app/types";
import { useWorkspace } from "@/components/app/AppShell";
import { KindIcon, kindLabel } from "@/components/app/kinds";
import { EmptyState, PageHeader, Segmented, fmtTime, yesterday } from "@/components/app/ui";

type Filter = "all" | ActivityKind | "social";
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "call", label: "Calls" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Emails" },
  { value: "social", label: "Social posts" },
  { value: "youtube", label: "YouTube" },
  { value: "review", label: "Reviews" },
  { value: "lead", label: "Leads" },
  { value: "automation", label: "Automations" },
];

export default function ActivityPage() {
  const ws = useWorkspace();
  const [filter, setFilter] = useState<Filter>("all");
  if (!ws) return null;

  const list = ws.activity.filter((e) => filter === "all" || e.kind === filter || (filter === "social" && (e.kind === "instagram" || e.kind === "facebook")));
  const groups = new Map<string, typeof list>();
  for (const e of list) {
    const d = new Date(e.at);
    const today = new Date().toDateString();
    const yday = yesterday().toDateString();
    const key = d.toDateString() === today ? "Today" : d.toDateString() === yday ? "Yesterday" : d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }

  return (
    <div>
      <PageHeader eyebrow="Activity Centre" title="Activity" subtitle="Every call, conversation, email, post, upload, review, lead and automation event — one timeline." />
      <div className="mb-6">
        <Segmented label="Filter activity" value={filter} onChange={setFilter} options={filters} />
      </div>
      {list.length === 0 ? (
        <EmptyState title="No activity yet">Once a service is active, everything it does is recorded here.</EmptyState>
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([day, events]) => (
            <section key={day} aria-label={day}>
              <h2 className="eyebrow mb-3">{day}</h2>
              <ol className="relative space-y-1 border-l border-white/[0.08] pl-5">
                {events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute top-5 -left-[1.4rem] size-2 rounded-full bg-white/20" aria-hidden />
                    <Link href={e.href ?? "#"} className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-white/[0.04]">
                      <KindIcon kind={e.kind} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="text-fg-subtle">{fmtTime(e.at)} — </span>
                          {e.title}
                        </p>
                        {e.detail && <p className="mt-0.5 text-xs text-fg-subtle">{e.detail}</p>}
                      </div>
                      <span className="hidden text-[0.7rem] text-fg-subtle sm:block">{kindLabel(e.kind)}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
