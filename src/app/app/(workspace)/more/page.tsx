"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CirclePlay, Crown, LogOut } from "lucide-react";
import { useIsFounder } from "@/lib/app/founder";
import { logOut, useSession } from "@/lib/app/store";
import { useWorkspace, workspaceNav } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/ui";

export default function MorePage() {
  const ws = useWorkspace();
  const router = useRouter();
  const { user } = useSession();
  const founder = useIsFounder(ws?.sample ? undefined : user?.id);
  if (!ws) return null;
  const items = workspaceNav.filter((n) => !["/app/home", "/app/assistant", "/app/services", "/app/activity"].includes(n.href));
  return (
    <div>
      <PageHeader title="More" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {founder && (
          <li>
            <Link href="/app/founder" className="glass flex h-24 flex-col justify-between rounded-2xl border-flow/40 p-4 hover:border-flow/60">
              <Crown className="size-5 text-flow" aria-hidden />
              <span className="text-sm font-medium">Founder Console</span>
            </Link>
          </li>
        )}
        {items.map((n) => (
          <li key={n.href}>
            <Link href={n.href} className="glass flex h-24 flex-col justify-between rounded-2xl p-4 hover:border-white/20">
              <n.icon className="size-5 text-flow-soft" aria-hidden />
              <span className="text-sm font-medium">{n.label}</span>
            </Link>
          </li>
        ))}
        <li>
          <Link href="/app/demo" className="glass flex h-24 flex-col justify-between rounded-2xl p-4 hover:border-white/20">
            <CirclePlay className="size-5 text-flow-soft" aria-hidden />
            <span className="text-sm font-medium">Watch Demo</span>
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              logOut();
              router.replace("/app");
            }}
            className="glass flex h-24 w-full flex-col justify-between rounded-2xl p-4 text-left hover:border-white/20"
          >
            <LogOut className="size-5 text-fg-muted" aria-hidden />
            <span className="text-sm font-medium">Log out</span>
          </button>
        </li>
      </ul>
    </div>
  );
}
