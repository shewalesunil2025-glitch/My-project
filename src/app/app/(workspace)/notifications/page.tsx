"use client";

import Link from "next/link";
import { BellOff } from "lucide-react";
import { updateWorkspace } from "@/lib/app/store";
import type { ActivityKind, NotificationKind } from "@/lib/app/types";
import { useWorkspace } from "@/components/app/AppShell";
import { KindIcon } from "@/components/app/kinds";
import { Btn, EmptyState, PageHeader, relTime } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const kindIcon: Record<NotificationKind, ActivityKind> = {
  lead: "lead",
  review: "review",
  message: "whatsapp",
  automation_failed: "automation",
  published: "youtube",
  upcoming: "youtube",
  payment: "payment",
  expiry: "payment",
  connection: "system",
};

export default function NotificationsPage() {
  const ws = useWorkspace();
  if (!ws) return null;
  const unread = ws.notifications.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="New leads, reviews, important messages, failed automations, published content, payments and connection issues."
        action={
          <>
            {unread > 0 && (
              <Btn size="sm" variant="ghost" onClick={() => updateWorkspace((w) => w.notifications.forEach((n) => (n.read = true)))}>
                Mark all read
              </Btn>
            )}
            <Link href="/app/settings#notifications" className="inline-flex h-9 items-center px-3 text-[0.8rem] text-fg-muted hover:text-fg">
              Preferences
            </Link>
          </>
        }
      />
      {ws.notifications.length === 0 ? (
        <EmptyState icon={<BellOff className="size-5" aria-hidden />} title="You're all caught up" />
      ) : (
        <ul className="space-y-2">
          {ws.notifications.map((n) => (
            <li key={n.id}>
              <Link
                href={n.href ?? "/app/home"}
                onClick={() => updateWorkspace((w) => void (w.notifications.find((x) => x.id === n.id)!.read = true))}
                className={cn("glass flex items-start gap-3 rounded-2xl p-4 hover:border-white/20", !n.read && "border-flow/30")}
              >
                <KindIcon kind={kindIcon[n.kind]} />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</p>
                  <p className="text-xs text-fg-muted">{n.detail}</p>
                </div>
                <span className="shrink-0 text-xs text-fg-subtle">{relTime(n.at)}</span>
                {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-flow" aria-label="Unread" />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
