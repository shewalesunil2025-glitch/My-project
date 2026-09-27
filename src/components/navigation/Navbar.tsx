"use client";

import { motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";
import { BookDemoButton } from "@/components/cta/BookDemoButton";
import { Logo } from "./Logo";
import { useActiveSection } from "./useActiveSection";

const links = [{ label: "Home", href: "#top" }, ...siteConfig.nav];
const sectionIds = links.map((n) => n.href.slice(1));

/**
 * Reference layout: the logo and a "Contact" pill sit on top of the page, and the
 * section links live in a small glass pill floating at the bottom centre.
 */
export function Navbar() {
  const active = useActiveSection(sectionIds);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <a
          href="#main"
          className="pointer-events-auto sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-10 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-ink-950"
        >
          Skip to content
        </a>
        <div className="flex items-center justify-between px-4 py-4 md:px-8 md:py-6">
          <Logo className="pointer-events-auto" />
          <BookDemoButton
            size="sm"
            label="Contact us"
            magnetic={false}
            className="pointer-events-auto"
          />
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-3 md:bottom-6"
      >
        <motion.ul
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="no-scrollbar flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-white/10 bg-ink-900/70 p-1 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl"
        >
          {links.map((item) => {
            const isActive = active === item.href.slice(1) || (!active && item.href === "#top");
            return (
              <li key={item.href} className="shrink-0">
                <a
                  href={item.href}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "relative block rounded-full px-3 py-1.5 text-[0.75rem] font-medium whitespace-nowrap transition-colors md:px-3.5",
                    isActive ? "text-fg" : "text-fg-muted hover:text-fg",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.08]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </a>
              </li>
            );
          })}
        </motion.ul>
      </nav>
    </>
  );
}
