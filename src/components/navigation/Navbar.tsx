"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";
import { BookDemoButton } from "@/components/cta/BookDemoButton";
import { Logo, LogoMark } from "./Logo";
import { useActiveSection } from "./useActiveSection";

const sectionIds = siteConfig.nav.map((n) => n.href.slice(1));

/**
 * Full-width header at the top of the page that morphs into a floating black
 * pill once you scroll (pattern adapted from 21st.dev "Morphing Scroll Navbar").
 */
export function Navbar() {
  const { scrollY } = useScroll();
  const [floating, setFloating] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(sectionIds);

  useMotionValueEvent(scrollY, "change", (v) => setFloating(v > 40));

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
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-10 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-ink-950"
      >
        Skip to content
      </a>

      {/* Announcement bar — collapses once the nav floats. */}
      <div
        className={cn(
          "overflow-hidden border-b border-white/[0.06] bg-ink-900 transition-[height,opacity] duration-500 ease-[var(--ease-out-expo)]",
          floating || open ? "h-0 opacity-0" : "h-9 opacity-100",
        )}
      >
        <div className="container-x flex h-9 items-center justify-between gap-4 text-xs text-fg-muted">
          <a href="#services" className="group flex min-w-0 items-center gap-2 hover:text-fg">
            <span className="size-1.5 shrink-0 rounded-full bg-flow" aria-hidden />
            <span className="truncate">Free 30-minute AI automation call — proposal within 24 hours</span>
            <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </a>
          <a href={`mailto:${siteConfig.email}`} className="hidden shrink-0 hover:text-fg sm:block">
            {siteConfig.email}
          </a>
        </div>
      </div>

      <div className={cn("flex justify-center px-3 transition-[padding] duration-500", floating && !open && "pt-3")}>
        <nav
          aria-label="Primary"
          className={cn(
            "flex w-full items-center justify-between gap-4 transition-[max-width,height,background-color,border-color,border-radius,padding,box-shadow] duration-500 ease-[var(--ease-out-expo)]",
            floating && !open
              ? "h-13 max-w-[54rem] rounded-full border border-white/10 bg-ink-950/85 pr-1.5 pl-2 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl"
              : "h-[4.5rem] max-w-[80rem] rounded-none border border-transparent bg-transparent px-2 md:px-5 xl:px-9",
            open && "bg-ink-950",
          )}
        >
          <div className="shrink-0">
            {floating && !open ? (
              <a href="#top" aria-label={`${siteConfig.name} — home`}>
                <LogoMark className="size-9" />
              </a>
            ) : (
              <Logo />
            )}
          </div>

          <ul className="hidden items-center gap-0.5 lg:flex">
            {siteConfig.nav.map((item) => {
              const isActive = active === item.href.slice(1);
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "relative rounded-full px-3 py-2 text-[0.8rem] font-medium whitespace-nowrap transition-colors",
                      isActive ? "text-fg" : "text-fg-muted hover:text-fg",
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-full bg-white/[0.07]"
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
            {!floating && (
              <a
                href="#contact"
                className="hidden h-9 items-center rounded-full border border-white/12 px-4 text-[0.8rem] font-medium text-fg-muted transition-colors hover:border-white/25 hover:text-fg md:inline-flex"
              >
                Contact us
              </a>
            )}
            <BookDemoButton
              size="sm"
              variant={floating ? "light" : "primary"}
              magnetic={false}
              className="hidden sm:inline-flex"
            />
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full border border-white/10 text-fg lg:hidden"
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
            className="fixed inset-x-0 top-[4.5rem] bottom-0 bg-ink-950/97 backdrop-blur-xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="container-x flex flex-col pt-6">
              {siteConfig.nav.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between border-b border-white/[0.06] py-5 text-2xl font-semibold tracking-tight"
                  >
                    {item.label}
                    <ArrowRight className="size-5 text-flow" aria-hidden />
                  </a>
                </motion.li>
              ))}
            </ul>
            <div className="container-x mt-8" onClickCapture={() => setOpen(false)}>
              <BookDemoButton size="lg" className="w-full" magnetic={false} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
