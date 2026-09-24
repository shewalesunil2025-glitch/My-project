"use client";

import { MessageCircle } from "lucide-react";
import { Bubble, Typing } from "./parts";
import { useSequence } from "@/hooks/useSequence";

const script = [
  { from: "user", text: "Hi! How much is a hair consultation?" },
  { from: "ai", text: "Hi Priya 👋 A consultation is ₹499 and takes 30 min. What would you like help with?" },
  { from: "user", text: "Hair fall, mostly." },
  { from: "ai", text: "Got it. Dr. Mehta specialises in that. Saturday 11:00 or 12:30?" },
  { from: "user", text: "11 works" },
  { from: "ai", text: "Booked ✅ Sat 11:00. I'll remind you the day before." },
] as const;

export function WhatsAppPreview() {
  const step = useSequence(script.length * 2, 650);
  return (
    <div className="mx-auto flex h-full max-w-sm flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-900/80">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <span className="grid size-9 place-items-center rounded-full bg-live/15 text-live">
          <MessageCircle className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-medium">Glow Clinic</p>
          <p className="font-mono text-[0.6rem] text-live">AI assistant · online</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-2 p-4">
        {script.map((m, i) => {
          const shownAt = i * 2 + 1;
          return (
            <div key={i} className="contents">
              {m.from === "ai" && <Typing show={step === shownAt - 1 && step > 0} />}
              <Bubble from={m.from} show={step >= shownAt}>
                {m.text}
              </Bubble>
            </div>
          );
        })}
      </div>
    </div>
  );
}
