"use client";

import { Bot, Database, FileSpreadsheet, Mail, MessageCircle, Webhook } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSequence } from "@/hooks/useSequence";

const nodes = [
  { label: "New form entry", icon: Webhook, x: 12, y: 50 },
  { label: "AI classifies", icon: Bot, x: 40, y: 50 },
  { label: "CRM", icon: Database, x: 72, y: 18 },
  { label: "Google Sheets", icon: FileSpreadsheet, x: 78, y: 50 },
  { label: "WhatsApp team", icon: MessageCircle, x: 72, y: 82 },
  { label: "Email", icon: Mail, x: 40, y: 86 },
];
const edges: [number, number][] = [
  [0, 1],
  [1, 2],
  [1, 3],
  [1, 4],
  [1, 5],
];

export function WorkflowPreview() {
  const step = useSequence(edges.length + 1, 700);
  return (
    <div className="relative h-full min-h-[18rem] rounded-2xl border border-white/10 bg-ink-900/80">
      <div className="grid-backdrop absolute inset-0 rounded-2xl opacity-60" aria-hidden />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke={step > i ? "#45d6b0" : "rgba(255,255,255,0.1)"}
            strokeWidth={1.2}
            vectorEffect="non-scaling-stroke"
            className="transition-[stroke] duration-500"
          />
        ))}
      </svg>
      {nodes.map((n, i) => {
        const on = i === 0 ? step >= 1 : edges.findIndex(([, b]) => b === i) < step;
        return (
          <div
            key={n.label}
            className="absolute -translate-1/2"
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
          >
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-all duration-500",
                on ? "border-flow/50 bg-ink-800 shadow-[0_0_24px_-6px_rgb(69_214_176/0.7)]" : "border-white/10 bg-ink-900",
              )}
            >
              <n.icon className={cn("size-3.5 transition-colors", on ? "text-flow-soft" : "text-fg-subtle")} aria-hidden />
              <span className="hidden text-[0.7rem] whitespace-nowrap sm:inline">{n.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
