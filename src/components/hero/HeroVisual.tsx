"use client";

import { motion } from "framer-motion";
import { CalendarCheck, MessageCircle, PhoneCall, UserPlus } from "lucide-react";
import { CoreOrb } from "@/components/3d/CoreOrb";
import { heroCharacterConfig } from "@/config/site";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { FloatingPanel } from "./FloatingPanel";
import { HeroCharacter } from "./HeroCharacter";

/** Connection paths from each panel anchor into the AI core (viewBox 0–100). */
const links = [
  "M16 22 C 30 22, 36 40, 50 50",
  "M86 18 C 72 20, 64 38, 50 50",
  "M12 80 C 28 78, 36 62, 50 50",
  "M88 78 C 74 80, 64 62, 50 50",
];

export function HeroVisual() {
  const pointer = usePointerParallax();
  const hasCharacter = Boolean(heroCharacterConfig.src);

  return (
    <div className="relative mx-auto aspect-[1/1] w-full max-w-[40rem] select-none">
      <div className="grid-backdrop absolute inset-[-10%] opacity-70" aria-hidden />

      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="hero-link" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a8f0dc" stopOpacity="0.05" />
            <stop offset="1" stopColor="#45d6b0" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {links.map((d, i) => (
          <g key={d}>
            <motion.path
              d={d}
              fill="none"
              stroke="url(#hero-link)"
              strokeWidth="0.25"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, delay: 0.9 + i * 0.18, ease: [0.65, 0, 0.35, 1] }}
            />
            <path
              d={d}
              fill="none"
              stroke="#a8f0dc"
              strokeWidth="0.45"
              strokeLinecap="round"
              strokeDasharray="0.6 11.4"
              className="animate-dash opacity-80"
              style={{ animationDelay: `${i * -0.4}s` }}
            />
          </g>
        ))}
      </svg>

      <motion.div
        className="absolute inset-[18%]"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <CoreOrb pointerX={pointer.x} pointerY={pointer.y} className="size-full" />
      </motion.div>

      {hasCharacter && (
        <HeroCharacter
          {...heroCharacterConfig}
          pointer={pointer}
          className="absolute inset-x-[14%] bottom-0 z-10"
        />
      )}

      <FloatingPanel pointer={pointer} depth={26} delay={1.1} className="top-[8%] left-0 w-[46%] sm:w-[40%]">
        <PanelHeader icon={<PhoneCall className="size-3.5" />} label="Incoming call" live />
        <p className="mt-2 text-[0.8rem] text-fg">AI receptionist answering</p>
        <Waveform />
      </FloatingPanel>

      <FloatingPanel pointer={pointer} depth={34} delay={1.35} className="top-[4%] right-0 w-[48%] sm:w-[42%]">
        <PanelHeader icon={<MessageCircle className="size-3.5" />} label="WhatsApp" />
        <p className="mt-2 w-fit rounded-xl rounded-tl-sm bg-white/[0.06] px-2.5 py-1.5 text-[0.75rem] text-fg-muted">
          Can I book for Thursday?
        </p>
        <p className="mt-1.5 ml-auto w-fit rounded-xl rounded-tr-sm bg-flow/20 px-2.5 py-1.5 text-[0.75rem] text-fg">
          Of course — 4:30 PM works?
        </p>
      </FloatingPanel>

      <FloatingPanel
        pointer={pointer}
        depth={18}
        delay={1.6}
        className="bottom-[6%] left-[2%] hidden w-[40%] sm:block"
      >
        <PanelHeader icon={<UserPlus className="size-3.5" />} label="Lead captured" />
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {["Qualified", "Whitening", "This week"].map((t) => (
            <span key={t} className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[0.62rem] text-fg-muted">
              {t}
            </span>
          ))}
        </div>
      </FloatingPanel>

      <FloatingPanel pointer={pointer} depth={30} delay={1.85} className="right-0 bottom-[2%] w-[50%] sm:w-[42%]">
        <PanelHeader icon={<CalendarCheck className="size-3.5" />} label="Booking" />
        <p className="mt-2 text-[0.8rem] text-fg">Appointment confirmed</p>
        <p className="font-mono text-[0.7rem] text-live">Thu · 4:30 PM · reminder set</p>
      </FloatingPanel>
    </div>
  );
}

function PanelHeader({ icon, label, live }: { icon: React.ReactNode; label: string; live?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-fg-muted">
      <span className="grid size-6 place-items-center rounded-lg bg-white/[0.06] text-flow-soft">{icon}</span>
      <span className="font-mono text-[0.62rem] tracking-[0.16em] uppercase">{label}</span>
      {live && <span className="ml-auto size-1.5 animate-pulse-soft rounded-full bg-live" />}
    </div>
  );
}

function Waveform() {
  return (
    <div className="mt-2.5 flex h-5 items-center gap-[3px]" aria-hidden>
      {Array.from({ length: 18 }, (_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-flow-soft/70"
          animate={{ height: ["20%", `${35 + ((i * 37) % 65)}%`, "20%"] }}
          transition={{ duration: 1.1 + (i % 5) * 0.12, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}
