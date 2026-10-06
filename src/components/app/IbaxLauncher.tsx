"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, X } from "lucide-react";
import Link from "next/link";
import { product } from "@/config/product";
import { useAgentBusy } from "@/lib/app/agentClient";
import type { Workspace } from "@/lib/app/types";
import { cn } from "@/lib/cn";
import { ShambhuBot } from "@/components/shambhu/ShambhuBot";
import { IbaxChat } from "./IbaxChat";

/**
 * IBAX on every workspace screen, like on the website: a round robot button in the
 * corner that opens the conversation in a sheet. Hidden on the Assistant page, which
 * shows the same conversation full size.
 */
export function IbaxLauncher({ ws }: { ws: Workspace }) {
  const [open, setOpen] = useState(false);
  const busy = useAgentBusy();
  const pathname = usePathname();
  const onAssistant = pathname.startsWith("/app/assistant");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Navigating (e.g. a "Manage it" link in the chat) closes the sheet.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  if (onAssistant) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="ibax-sheet"
        aria-label={open ? `Close ${product.assistantName}` : `Ask ${product.assistantName}`}
        className={cn("group fixed right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[45] grid size-14 place-items-center rounded-full lg:right-6 lg:bottom-6 lg:size-16", open && "max-lg:hidden")}
      >
        {!open && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-flow/25 [animation-duration:2.6s]" />}
        <span
          aria-hidden
          className={cn("absolute -inset-0.5 rounded-full bg-[conic-gradient(from_0deg,#66d34c,#c9f4b2,#4cb83d,#66d34c)]", busy ? "animate-spin opacity-100 [animation-duration:2s]" : "opacity-85")}
        />
        <span className="relative grid size-full place-items-center overflow-hidden rounded-full border-2 border-ink-950 bg-ink-800 shadow-[0_12px_40px_-8px_rgb(102_211_76/0.7)] transition-transform duration-300 group-hover:scale-105">
          {open ? <X className="size-6 text-fg" aria-hidden /> : <ShambhuBot mood={busy ? "thinking" : "idle"} className="size-full" />}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              aria-hidden
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[46] bg-black/60 backdrop-blur-[2px] lg:hidden"
            />
            <motion.section
              key="sheet"
              id="ibax-sheet"
              role="dialog"
              aria-label={`${product.assistantName} assistant`}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-[47] flex h-[88dvh] flex-col overflow-hidden rounded-t-[1.6rem] border border-b-0 border-flow/25 pb-[env(safe-area-inset-bottom)] shadow-[0_40px_100px_-30px_rgb(0_0_0/0.95),0_0_60px_-30px_rgb(102_211_76/0.6)] [background:linear-gradient(180deg,rgb(102_211_76/0.1),transparent_30%),var(--color-ink-900)] lg:inset-x-auto lg:right-6 lg:bottom-[6.5rem] lg:h-[min(40rem,calc(100dvh-9rem))] lg:w-[26rem] lg:rounded-[1.6rem] lg:border-b lg:pb-0"
            >
              <header className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
                <span className="grid size-10 place-items-center overflow-hidden rounded-full border border-flow/40 bg-ink-950">
                  <ShambhuBot mood={busy ? "thinking" : "idle"} className="size-full" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{product.assistantName}</p>
                  <p className="text-xs text-fg-muted">{busy ? "Working on it…" : "Online · ask anything or activate a service"}</p>
                </div>
                <Link href="/app/assistant" className="grid size-9 place-items-center rounded-full text-fg-muted hover:bg-white/[0.06] hover:text-fg" aria-label="Open full screen" title="Open full screen">
                  <Maximize2 className="size-4" aria-hidden />
                </Link>
                <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full text-fg-muted hover:bg-white/[0.06] hover:text-fg" aria-label="Close">
                  <X className="size-5" aria-hidden />
                </button>
              </header>
              <div className="min-h-0 flex-1">
                <IbaxChat ws={ws} compact />
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
