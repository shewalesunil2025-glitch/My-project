"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  Activity,
  Bell,
  Bot,
  ChartColumn,
  Clapperboard,
  CreditCard,
  Ellipsis,
  Globe,
  House,
  Inbox,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  PhoneCall,
  Settings,
  Star,
  Users,
  Workflow,
} from "lucide-react";
import { product } from "@/config/product";
import { cn } from "@/lib/cn";
import { logOut, useSession } from "@/lib/app/store";
import type { Workspace } from "@/lib/app/types";
import { BrandLogo, BrandMark, FullScreenLoader, LumiMark } from "./ui";
import { IbaxLauncher } from "./IbaxLauncher";

export const workspaceNav = [
  { href: "/app/home", label: "Home", icon: House },
  { href: "/app/ibax", label: "IBAX", icon: Bot },
  { href: "/app/services", label: "Services", icon: LayoutGrid },
  { href: "/app/automations", label: "Automations", icon: Workflow },
  { href: "/app/inbox", label: "Inbox", icon: Inbox },
  { href: "/app/calls", label: "Calls", icon: PhoneCall },
  { href: "/app/content", label: "Content", icon: Clapperboard },
  { href: "/app/activity", label: "Activity", icon: Activity },
  { href: "/app/leads", label: "Leads & Customers", icon: Users },
  { href: "/app/reviews", label: "Reviews", icon: Star },
  { href: "/app/analytics", label: "Analytics", icon: ChartColumn },
  { href: "/app/website", label: "Website", icon: Globe },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
  { href: "/app/settings", label: "Settings", icon: Settings },
  { href: "/app/help", label: "Help & Support", icon: LifeBuoy },
];

/** Guards the workspace (signed in + business set up) and hands it to the page. */
export function useWorkspace(): Workspace | null {
  const { workspace } = useSession();
  return workspace;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { ready, user, workspace } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/app/login");
    else if (!workspace?.business || !workspace.assistant) router.replace("/app/setup");
  }, [ready, user, workspace, router]);

  if (!ready || !user || !workspace?.business || !workspace.assistant) return <FullScreenLoader />;

  const unread = workspace.notifications.filter((n) => !n.read).length;
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const bottom = [
    { href: "/app/home", label: "Home", icon: House },
    { href: "/app/ibax", label: product.assistantName, icon: Bot, lumi: true },
    { href: "/app/services", label: "Services", icon: LayoutGrid },
    { href: "/app/activity", label: "Activity", icon: Activity },
    { href: "/app/more", label: "More", icon: Ellipsis },
  ];

  return (
    <div className="min-h-dvh lg:pl-64">
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_at_50%_-20%,rgb(102_211_76/0.14),transparent_70%)]" />
      <a href="#app-main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-ink-950">
        Skip to content
      </a>

      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/[0.06] bg-ink-900/80 backdrop-blur lg:flex">
        <Link href="/app/home" className="flex items-center gap-2.5 px-5 pt-5 pb-4">
          <BrandLogo tagline />
        </Link>
        <nav aria-label="Workspace" className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-0.5">
            {workspaceNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
                    isActive(item.href) ? "bg-white/[0.08] font-semibold text-fg" : "text-fg-muted hover:bg-white/[0.04] hover:text-fg",
                  )}
                >
                  <item.icon className={cn("size-[1.05rem]", isActive(item.href) && "text-flow")} aria-hidden />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/[0.08] text-sm font-semibold">{user.name.charAt(0).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{workspace.business.name}</p>
              <p className="truncate text-xs text-fg-subtle">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                logOut();
                router.replace("/app");
              }}
              className="grid size-9 place-items-center rounded-full text-fg-muted hover:bg-white/[0.06] hover:text-fg"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/app/home" className="flex min-w-0 items-center gap-2 lg:hidden">
            <BrandMark className="size-7" />
            <span className="truncate text-[0.95rem] font-semibold">{workspace.business.name}</span>
          </Link>
          <p className="hidden truncate text-sm text-fg-muted lg:block">
            {workspace.business.name} <span className="text-fg-subtle">· {workspace.business.category}</span>
          </p>
          <div className="ml-auto flex items-center gap-2">
            {workspace.sample ? (
              <span className="hidden rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[0.7rem] font-medium text-amber-200 sm:inline">Sample workspace</span>
            ) : (
              product.previewMode && (
                <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.7rem] font-medium text-fg-muted sm:inline" title="Payments and account connections are simulated on this device">
                  Preview mode
                </span>
              )
            )}
            <Link
              href="/app/notifications"
              className="relative grid size-10 place-items-center rounded-full text-fg-muted hover:bg-white/[0.06] hover:text-fg"
              aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
            >
              <Bell className="size-[1.15rem]" aria-hidden />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-flow px-1 text-[0.6rem] leading-4 font-bold text-ink-950">{unread > 9 ? "9+" : unread}</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {workspace.sample && (
        <div className="border-b border-amber-400/15 bg-amber-400/[0.06] px-4 py-2 text-center text-xs text-amber-100 sm:px-6">
          You&apos;re exploring a sample business with sample data.{" "}
          <Link href="/app/signup" className="font-semibold underline underline-offset-2" onClick={() => logOut()}>
            Create your own account
          </Link>
        </div>
      )}

      <main id="app-main" className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:pb-12">
        {children}
      </main>

      <IbaxLauncher ws={workspace} />

      {/* Bottom navigation (mobile): one floating glass bar; the open page's tab gets a green pill and a lit edge */}
      <nav aria-label="Main" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.6rem+env(safe-area-inset-bottom))] lg:hidden">
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950 via-ink-950/80 to-transparent" />
        <ul className="pointer-events-auto relative mx-auto grid max-w-md grid-cols-5 rounded-[1.6rem] border border-white/10 bg-ink-900/85 p-1.5 shadow-[0_24px_60px_-18px_rgb(0_0_0/0.95),inset_0_1px_0_rgb(255_255_255/0.07)] backdrop-blur-xl">
          {bottom.map((item) => {
            const active = isActive(item.href) || (item.href === "/app/more" && ["/app/more", "/app/settings", "/app/billing", "/app/help", "/app/analytics", "/app/leads", "/app/reviews", "/app/website", "/app/notifications", "/app/content", "/app/automations", "/app/inbox", "/app/calls"].some((p) => isActive(p))) || (item.lumi && isActive("/app/assistant"));
            return (
              <li key={item.href} className="relative">
                {active && (
                  <>
                    <motion.span
                      layoutId="nav-edge"
                      aria-hidden
                      className="absolute -top-[0.4rem] left-1/2 h-[3px] w-9 -translate-x-1/2 rounded-full bg-flow shadow-[0_0_14px_2px_rgb(102_211_76/0.75)]"
                      transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    />
                    <motion.span
                      layoutId="nav-pill"
                      aria-hidden
                      className="absolute inset-0 rounded-[1.15rem] bg-[linear-gradient(180deg,rgb(102_211_76/0.22),rgb(102_211_76/0.06))] ring-1 ring-flow/35 shadow-[0_8px_24px_-10px_rgb(102_211_76/0.7)]"
                      transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    />
                  </>
                )}
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-14 flex-col items-center justify-center gap-1 rounded-[1.15rem] text-[0.66rem] font-medium transition-colors",
                    active ? "text-fg" : "text-fg-subtle hover:text-fg-muted",
                  )}
                >
                  {item.lumi ? (
                    <LumiMark className={cn("size-[1.35rem] transition-transform", active && "scale-110")} glow={active} />
                  ) : (
                    <item.icon className={cn("size-5 transition-transform", active && "scale-110 text-flow")} aria-hidden />
                  )}
                  <span className={cn("max-w-full truncate px-1", active && "font-semibold")}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
