"use client";

import Link from "next/link";
import { useState } from "react";
import { FlaskConical, Pause, Play, ScrollText } from "lucide-react";
import { serviceById } from "@/content/app/services";
import { missingConnections, runTest, setAutomationStatus } from "@/lib/app/automation";
import type { AutomationStatus } from "@/lib/app/types";
import { useWorkspace } from "@/components/app/AppShell";
import { automationStatus } from "@/components/app/status";
import { Btn, BtnLink, EmptyState, Icon, PageHeader, Pill, Segmented, relTime } from "@/components/app/ui";

type Filter = "all" | AutomationStatus;

export default function AutomationsPage() {
  const ws = useWorkspace();
  const [filter, setFilter] = useState<Filter>("all");
  if (!ws) return null;

  const count = (s: AutomationStatus) => ws.automations.filter((a) => a.status === s).length;
  const options: { value: Filter; label: string }[] = [
    { value: "all", label: `All ${ws.automations.length}` },
    { value: "active", label: `Active ${count("active")}` },
    { value: "paused", label: `Paused ${count("paused")}` },
    { value: "scheduled", label: `Scheduled ${count("scheduled")}` },
    { value: "failed", label: `Failed ${count("failed")}` },
    { value: "attention", label: `Needs attention ${count("attention")}` },
    { value: "setup", label: `Setup ${count("setup")}` },
  ];
  const list = ws.automations.filter((a) => filter === "all" || a.status === filter);

  return (
    <div>
      <PageHeader
        eyebrow="Control Centre"
        title="Automations"
        subtitle="Everything that runs for your business. Pause, resume, edit, test or check the logs."
        action={
          <BtnLink href="/app/services" size="sm">
            Add automation
          </BtnLink>
        }
      />
      <div className="mb-5">
        <Segmented label="Filter by status" value={filter} onChange={setFilter} options={options} />
      </div>

      {list.length === 0 ? (
        <EmptyState title={ws.automations.length ? "Nothing in this group" : "No automations yet"} action={!ws.automations.length && <BtnLink href="/app/services">Browse services</BtnLink>}>
          {ws.automations.length ? "Try another filter." : "Buy a service and it appears here, ready to set up."}
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {list.map((a) => {
            const svc = serviceById(a.serviceId)!;
            const st = automationStatus[a.status];
            const blocked = missingConnections(ws, svc).length > 0;
            return (
              <li key={a.id} className="glass rounded-2xl p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-flow/12 text-flow-soft">
                    <Icon name={svc.icon} className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/app/automations/${a.id}`} className="font-semibold hover:underline">
                      {svc.name}
                    </Link>
                    <p className="truncate text-xs text-fg-subtle">
                      {a.note ?? (a.lastRunAt ? `Last run ${relTime(a.lastRunAt)}` : a.status === "setup" ? `Step ${a.setupStep + 1} of setup` : "")}
                      {typeof a.config.frequency === "string" && a.status !== "setup" ? ` · ${a.config.frequency}${a.config.time ? ` at ${a.config.time}` : ""}` : ""}
                    </p>
                  </div>
                  <Pill tone={st.tone}>{st.label}</Pill>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
                  {a.status === "setup" ? (
                    <BtnLink href={`/app/automations/${a.id}`} size="sm">
                      Continue setup
                    </BtnLink>
                  ) : (
                    <>
                      {a.status === "active" || a.status === "scheduled" ? (
                        <Btn size="sm" variant="ghost" onClick={() => setAutomationStatus(a.id, "paused", "Paused")}>
                          <Pause className="size-3.5" aria-hidden /> Pause
                        </Btn>
                      ) : (
                        <Btn size="sm" onClick={() => setAutomationStatus(a.id, "active", a.status === "paused" ? "Resumed" : "Activated")} disabled={blocked} title={blocked ? "Reconnect the account first" : undefined}>
                          <Play className="size-3.5" aria-hidden /> {a.status === "paused" ? "Resume" : "Activate"}
                        </Btn>
                      )}
                      <BtnLink size="sm" variant="ghost" href={`/app/automations/${a.id}?edit=1`}>
                        Edit / Schedule
                      </BtnLink>
                      <Btn size="sm" variant="ghost" onClick={() => runTest(a.id)}>
                        <FlaskConical className="size-3.5" aria-hidden /> Test
                      </Btn>
                      <BtnLink size="sm" variant="subtle" href={`/app/automations/${a.id}`}>
                        <ScrollText className="size-3.5" aria-hidden /> Logs
                      </BtnLink>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
