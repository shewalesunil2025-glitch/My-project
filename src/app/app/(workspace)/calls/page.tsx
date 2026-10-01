"use client";

import { PhoneCall } from "lucide-react";
import type { Call } from "@/lib/app/types";
import { useWorkspace } from "@/components/app/AppShell";
import { BtnLink, Card, EmptyState, PageHeader, Pill, Stat, fmtDateTime, type PillTone } from "@/components/app/ui";

const outcome: Record<Call["outcome"], { label: string; tone: PillTone }> = {
  answered: { label: "Answered", tone: "gray" },
  appointment: { label: "Appointment", tone: "green" },
  lead: { label: "New lead", tone: "ember" },
  transferred: { label: "Transferred to you", tone: "blue" },
  missed: { label: "Missed", tone: "red" },
};

export default function CallsPage() {
  const ws = useWorkspace();
  if (!ws) return null;
  const today = ws.calls.filter((c) => new Date(c.at).toDateString() === new Date().toDateString());
  const active = ws.automations.some((a) => a.serviceId === "voice" && a.status !== "setup");

  return (
    <div>
      <PageHeader eyebrow="AI Voice & Call Assistant" title="Calls" subtitle={`Every call ${ws.assistant?.name} answered, with a short summary.`} />
      {ws.calls.length === 0 ? (
        <EmptyState
          icon={<PhoneCall className="size-5" aria-hidden />}
          title={active ? "No calls yet" : "Let your assistant answer your calls"}
          action={!active && <BtnLink href="/app/services/voice">Get AI Voice Assistant</BtnLink>}
        >
          {active ? "Calls appear here as soon as they're answered." : "It answers 24/7, books appointments, captures leads and transfers to you when needed."}
        </EmptyState>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Calls today" value={today.length} />
            <Stat label="Appointments" value={ws.calls.filter((c) => c.outcome === "appointment").length} />
            <Stat label="Leads from calls" value={ws.calls.filter((c) => c.outcome === "lead").length} />
            <Stat label="Avg. duration" value={`${Math.round(ws.calls.reduce((s, c) => s + c.durationSec, 0) / ws.calls.length / 60)} min`} />
          </div>
          <ul className="space-y-3">
            {ws.calls.map((c) => (
              <li key={c.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{c.caller}</p>
                      <p className="text-xs text-fg-subtle">
                        {c.number} · {fmtDateTime(c.at)} · {Math.floor(c.durationSec / 60)}m {c.durationSec % 60}s
                      </p>
                    </div>
                    <Pill tone={outcome[c.outcome].tone}>{outcome[c.outcome].label}</Pill>
                  </div>
                  <p className="mt-3 text-sm text-fg-muted">{c.summary}</p>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
