"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";
import { BookDemoButton } from "@/components/cta/BookDemoButton";
import { Logo } from "./Logo";
import { useActiveSection } from "./useActiveSection";

const sectionIds = siteConfig.nav.map((n) => n.href.slice(1));

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(sectionIds);

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-ink-950"
      >
        Skip to content
      </a>
      <div
        className={cn(
          "transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled || open
            ? "border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-xl"
            : "border-b border-transparent",
        )}
      >
        <nav aria-label="Primary" className="container-x flex h-[var(--header-h)] items-center justify-between gap-6">
          <Logo className="shrink-0" />

          <ul className="hidden items-center gap-1 lg:flex">
            {siteConfig.nav.map((item) => {
              const isActive = active === item.href.slice(1);
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "relative rounded-full px-4 py-2 text-sm transition-colors",
                      isActive ? "text-fg" : "text-fg-muted hover:text-fg",
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-full bg-white/[0.06]"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <BookDemoButton className="hidden sm:inline-flex" magnetic={false} />
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full border border-white/10 text-fg lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-x-0 top-[var(--header-h)] bottom-0 bg-ink-950/95 backdrop-blur-xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="container-x flex flex-col pt-8">
              {siteConfig.nav.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between border-b border-white/[0.06] py-5 text-3xl font-medium tracking-tight"
                  >
                    {item.label}
                    <span className="font-mono text-xs text-fg-subtle">0{i + 1}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <div className="container-x mt-10" onClickCapture={() => setOpen(false)}>
              <BookDemoButton size="lg" className="w-full" magnetic={false} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
