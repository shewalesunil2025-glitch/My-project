import { Bell, Bot, Camera, CreditCard, Globe, Mail, MessageCircle, MonitorPlay, PhoneCall, Star, ThumbsUp, UserPlus } from "lucide-react";
import type { ActivityKind } from "@/lib/app/types";
import { cn } from "@/lib/cn";

const map: Record<ActivityKind, { icon: typeof Bell; label: string; tone: string }> = {
  call: { icon: PhoneCall, label: "Call", tone: "text-sky-300 bg-sky-400/10" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp", tone: "text-emerald-300 bg-emerald-400/10" },
  email: { icon: Mail, label: "Email", tone: "text-indigo-300 bg-indigo-400/10" },
  instagram: { icon: Camera, label: "Instagram", tone: "text-pink-300 bg-pink-400/10" },
  facebook: { icon: ThumbsUp, label: "Facebook", tone: "text-blue-300 bg-blue-400/10" },
  youtube: { icon: MonitorPlay, label: "YouTube", tone: "text-red-300 bg-red-400/10" },
  review: { icon: Star, label: "Review", tone: "text-amber-200 bg-amber-400/10" },
  lead: { icon: UserPlus, label: "Lead", tone: "text-flow-soft bg-flow/10" },
  automation: { icon: Bot, label: "Automation", tone: "text-violet-300 bg-violet-400/10" },
  payment: { icon: CreditCard, label: "Payment", tone: "text-emerald-300 bg-emerald-400/10" },
  website: { icon: Globe, label: "Website", tone: "text-cyan-300 bg-cyan-400/10" },
  system: { icon: Bell, label: "Lumi", tone: "text-fg-muted bg-white/[0.06]" },
};

export const kindLabel = (k: ActivityKind) => map[k].label;
export const activityKinds = Object.keys(map) as ActivityKind[];

export function KindIcon({ kind, className }: { kind: ActivityKind; className?: string }) {
  const { icon: I, tone } = map[kind];
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", tone, className)}>
      <I className="size-4" aria-hidden />
    </span>
  );
}
