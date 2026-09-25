"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, MessageCircle, PhoneCall, Plus, UserPlus, type LucideIcon } from "lucide-react";
import { heroCharacterConfig } from "@/config/site";
import type { SolutionId } from "@/content/solutions";
import { cn } from "@/lib/cn";
import { HeroCharacter } from "./HeroCharacter";
import { SolutionInfo } from "./SolutionInfo";

type NodeDef = {
  id: SolutionId;
  label: string;
  /** Label for the compact mobile chip. */
  short: string;
  sub: string;
  icon: LucideIcon;
  /** Tile centre in % of the circuit box. */
  x: number;
  y: number;
  /** Circuit trace from the tile to the character (viewBox 0–100 × 0–42). */
  path: string;
  placement: "below" | "above";
  align: "start" | "end";
};

const nodes: NodeDef[] = [
  {
    id: "voice",
    label: "Incoming call",
    short: "AI calls",
    sub: "AI receptionist answering",
    icon: PhoneCall,
    x: 9,
    y: 18,
    path: "M13 7.6 H24 Q26 7.6 26 9.6 V19 Q26 21 28 21 H40",
    placement: "below",
    align: "start",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    short: "WhatsApp",
    sub: "Replying in seconds",
    icon: MessageCircle,
    x: 91,
    y: 18,
    path: "M87 7.6 H76 Q74 7.6 74 9.6 V19 Q74 21 72 21 H60",
    placement: "below",
    align: "end",
  },
  {
    id: "websites",
    label: "Lead captured",
    short: "Leads",
    sub: "Qualified · this week",
    icon: UserPlus,
    x: 14,
    y: 78,
    path: "M18 32.8 H30 Q32 32.8 32 30.8 V29 Q32 27 34 27 H41",
    placement: "above",
    align: "start",
  },
  {
    id: "booking",
    label: "Booking",
    short: "Booking",
    sub: "Thu · 4:30 PM confirmed",
    icon: CalendarCheck,
    x: 86,
    y: 78,
    path: "M82 32.8 H70 Q68 32.8 68 30.8 V29 Q68 27 66 27 H59",
    placement: "above",
    align: "end",
  },
];

/**
 * Hero centrepiece in the reference's "circuit board" style: the character sits
 * where the AI chip would be, with four fixed channel tiles wired into it.
 * Each tile opens a short explainer right beside it.
 */
export function HeroCircuit({ delay = 0 }: { delay?: number }) {
  const [openId, setOpenId] = useState<SolutionId | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggle = (id: SolutionId) => setOpenId((cur) => (cur === id ? null : id));
  const hasCharacter = Boolean(heroCharacterConfig.src);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [openId]);

  return (
    <div ref={rootRef} className="container-x relative mt-10 md:mt-6">
      <div className="relative mx-auto aspect-[100/42] w-full max-w-6xl max-sm:aspect-[100/80]">
        {/* Circuit traces */}
        <svg
          viewBox="0 0 100 42"
          preserveAspectRatio="none"
          className="absolute inset-0 hidden size-full sm:block"
          aria-hidden
        >
          {nodes.map((n, i) => (
            <g key={n.id}>
              {/* Traces draw themselves from the tile toward the character. */}
              <motion.path
                d={n.path}
                fill="none"
                stroke="rgb(255 255 255 / 0.12)"
                strokeWidth={1.2}
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.3, delay: delay + 0.8 + i * 0.1, ease: [0.65, 0, 0.35, 1] }}
              />
              <path
                d={n.path}
                fill="none"
                stroke="#ff5a1f"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="3 60"
                vectorEffect="non-scaling-stroke"
                className="animate-dash"
                style={{ animationDuration: `${2.4 + i * 0.3}s`, filter: "drop-shadow(0 0 4px #ff5a1f)" }}
              />
            </g>
          ))}
        </svg>

        {/* Ember glow behind the character — the "chip" */}
        <div
          aria-hidden
          className="absolute bottom-0 left-1/2 h-[90%] w-[46%] -translate-x-1/2 bg-[radial-gradient(50%_50%_at_50%_45%,rgb(255_90_31/0.32),rgb(255_90_31/0.08)_55%,transparent_75%)] max-sm:w-[95%]"
        />

        {hasCharacter && (
          <motion.div
            className="absolute bottom-0 left-1/2 h-[96%] -translate-x-1/2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: delay + 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <HeroCharacter {...heroCharacterConfig} className="h-full" />
          </motion.div>
        )}

        {nodes.map((n, i) => (
          <NodeTile
            key={n.id}
            node={n}
            delay={delay + 0.9 + i * 0.12}
            open={openId === n.id}
            onToggle={() => toggle(n.id)}
          />
        ))}
      </div>

      <MobileChips openId={openId} onToggle={toggle} onClose={() => setOpenId(null)} />
    </div>
  );
}

function NodeTile({ node, open, onToggle, delay }: { node: NodeDef; open: boolean; onToggle: () => void; delay: number }) {
  const id = useId();
  const infoId = `${id}-info`;
  const right = node.align === "end";

  return (
    <div
      className={cn("absolute hidden -translate-1/2 sm:block", open ? "z-40" : "z-20")}
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
    >
      <motion.button
        type="button"
        aria-label={`About ${node.label.toLowerCase()} — ${node.sub}`}
        aria-expanded={open}
        aria-controls={infoId}
        onClick={onToggle}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "group flex items-center gap-3 rounded-2xl border bg-ink-850/95 p-2 pr-4 text-left shadow-[0_20px_40px_-20px_rgb(0_0_0/0.9)] backdrop-blur transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5",
          right && "flex-row-reverse pr-2 pl-4 text-right",
          open
            ? "border-flow/60 shadow-[0_0_40px_-10px_rgb(255_90_31/0.6)]"
            : "border-white/10 hover:border-flow/40",
        )}
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-b from-ink-700 to-ink-850 text-fg lg:size-14">
          <node.icon className="size-5 lg:size-6" aria-hidden />
        </span>
        <span className="hidden whitespace-nowrap md:block">
          <span className="block text-sm font-semibold">{node.label}</span>
          <span className="block text-xs text-fg-muted">{node.sub}</span>
          <span className={cn("mt-1 flex items-center gap-1 text-xs font-semibold text-flow", right && "justify-end")}>
            {open ? "Close" : "Know more"}
            <Plus className={cn("size-3 transition-transform duration-300", open && "rotate-45")} aria-hidden />
          </span>
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={infoId}
            role="region"
            aria-labelledby={`${infoId}-title`}
            initial={{ opacity: 0, y: node.placement === "below" ? -8 : 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute w-[min(20rem,80vw)]",
              node.placement === "below" ? "top-full mt-3" : "bottom-full mb-3",
              right ? "right-0" : "left-0",
            )}
          >
            <SolutionInfo id={node.id} onClose={onToggle} headingId={`${infoId}-title`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileChips({
  openId,
  onToggle,
  onClose,
}: {
  openId: SolutionId | null;
  onToggle: (id: SolutionId) => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-5 sm:hidden">
      <ul className="grid grid-cols-2 gap-2" aria-label="What the AI handles">
        {nodes.map((n) => {
          const open = openId === n.id;
          return (
            <li key={n.id}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => onToggle(n.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-2xl border bg-ink-850 px-2.5 py-2.5 text-left text-sm font-semibold transition-colors active:scale-[0.98]",
                  open ? "border-flow/60" : "border-white/10",
                )}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/[0.06]">
                  <n.icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate">{n.short}</span>
                <Plus className={cn("size-4 shrink-0 text-flow transition-transform", open && "rotate-45")} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      <AnimatePresence mode="wait">
        {openId && (
          <motion.div
            key={openId}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-3"
          >
            <SolutionInfo id={openId} onClose={onClose} headingId="mobile-solution-info" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

