"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { product } from "@/config/product";
import { sendToAgent, useAgentBusy } from "@/lib/app/agentClient";
import type { Workspace } from "@/lib/app/types";
import { cn } from "@/lib/cn";
import { ShambhuBot } from "@/components/shambhu/ShambhuBot";
import { IbaxChat } from "./IbaxChat";

/**
 * IBAX on every workspace screen, exactly like the chatbot on the website: the living
 * orb in the corner opens the chat panel. Hidden on the Assistant page, which shows
 * the same conversation full size.
 */
export function IbaxLauncher({ ws }: { ws: Workspace }) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(false);
  const busy = useAgentBusy();
  const pathname = usePathname();
  const onAssistant = pathname.startsWith("/app/assistant");

  useEffect(() => {
    const show = setTimeout(() => setHint(true), 2500);
    const hide = setTimeout(() => setHint(false), 9000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  // openIbaxChat() from the IBAX Hub and other pages
  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      const message = (e as CustomEvent<{ message?: string }>).detail?.message;
      if (message) void sendToAgent(message);
    };
    window.addEventListener("ibax:open", onOpen);
    return () => window.removeEventListener("ibax:open", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Navigating (e.g. a "Manage it" link in the chat) closes the panel.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  if (onAssistant) return null;

  return (
    <>
      {/* Launcher */}
      <div className={cn("fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[45] lg:right-6 lg:bottom-6", open && "max-lg:hidden")}>
        <AnimatePresence>
          {hint && !open && (
            <motion.button
              type="button"
              onClick={() => setOpen(true)}
              initial={{ opacity: 0, x: 10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute top-1/2 right-[calc(100%+0.75rem)] hidden -translate-y-1/2 rounded-2xl rounded-br-sm border border-flow/30 bg-ink-900/95 px-3.5 py-2 text-left text-sm whitespace-nowrap shadow-[0_10px_40px_-10px_rgb(102_211_76/0.5)] backdrop-blur lg:block"
            >
              <span className="block font-semibold">Ask {product.assistantName}</span>
              <span className="block text-xs text-fg-muted">Any doubt? Just ask</span>
            </motion.button>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="ibax-sheet"
          aria-label={open ? `Close ${product.assistantName}` : `Ask ${product.assistantName}`}
          className="group relative grid size-[3.25rem] place-items-center rounded-full lg:size-16"
        >
          {open ? (
            <span className="grid size-full place-items-center rounded-full border border-flow/30 bg-ink-800 shadow-[0_12px_40px_-8px_rgb(102_211_76/0.6)]">
              <X className="size-6 text-fg" aria-hidden />
            </span>
          ) : (
            <ShambhuBot
              mood={busy ? "thinking" : "idle"}
              bleed={0.84}
              className="pointer-events-none absolute -top-[28%] -left-[28%] size-[156%] max-w-none transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </button>
      </div>

      {/* Phones: dim the page behind the chat sheet; tapping it closes the chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            aria-hidden
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[46] bg-black/60 backdrop-blur-[2px] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.section
            id="ibax-sheet"
            role="dialog"
            aria-label={`${product.assistantName} assistant`}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 z-[47] flex h-[85dvh] origin-bottom flex-col overflow-hidden rounded-t-[1.6rem] border border-b-0 border-flow/25 pb-[env(safe-area-inset-bottom)] shadow-[0_40px_100px_-30px_rgb(0_0_0/0.95),0_0_60px_-30px_rgb(102_211_76/0.6)] [background:linear-gradient(180deg,rgb(102_211_76/0.1),transparent_30%),var(--color-ink-900)] lg:inset-x-auto lg:right-6 lg:bottom-[6.5rem] lg:h-[min(38rem,calc(100dvh-9rem))] lg:w-[26rem] lg:origin-bottom-right lg:rounded-[1.6rem] lg:border-b lg:pb-0"
          >
            <IbaxChat ws={ws} onClose={() => setOpen(false)} />
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
