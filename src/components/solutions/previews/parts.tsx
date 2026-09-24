"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const ease = [0.16, 1, 0.3, 1] as const;

export function Appear({ show, children, className }: { show: boolean; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.5, ease }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Bubble({ from, children, show }: { from: "user" | "ai"; children: ReactNode; show: boolean }) {
  return (
    <Appear show={show} className={cn("flex", from === "ai" ? "justify-start" : "justify-end")}>
      <p
        className={cn(
          "max-w-[82%] rounded-2xl px-3.5 py-2 text-[0.8rem] leading-snug md:text-sm",
          from === "ai" ? "rounded-bl-md bg-white/[0.07] text-fg" : "rounded-br-md bg-flow/25 text-fg",
        )}
      >
        {children}
      </p>
    </Appear>
  );
}

export function Typing({ show }: { show: boolean }) {
  return (
    <Appear show={show} className="flex">
      <span className="flex gap-1 rounded-2xl rounded-bl-md bg-white/[0.07] px-3.5 py-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-fg-muted"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </span>
    </Appear>
  );
}

export function Frame({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900/80", className)}>
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="ml-3 truncate font-mono text-[0.65rem] tracking-wider text-fg-subtle">{title}</span>
      </div>
      <div className="relative flex-1 p-4 md:p-5">{children}</div>
    </div>
  );
}
