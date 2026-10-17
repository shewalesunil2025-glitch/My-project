"use client";

import { useState } from "react";
import { Camera, Clapperboard, ExternalLink, Globe, Mail, MessageCircle, PhoneCall, Star, ThumbsUp, Unplug, type LucideIcon } from "lucide-react";
import { product } from "@/config/product";
import { providerInfo, serviceById } from "@/content/app/services";
import { audit, logActivity, notify, nowIso, updateWorkspace } from "@/lib/app/store";
import type { ProviderId, Workspace } from "@/lib/app/types";
import { unlinkWhatsApp, waAccount, whatsappLinkAvailable } from "@/lib/app/whatsappLink";
import { Btn, Field, Input, fmtDate } from "./ui";
import { cn } from "@/lib/cn";
import { WhatsAppLink } from "./WhatsAppLink";

const providerIcon: Record<ProviderId, LucideIcon> = {
  whatsapp: MessageCircle,
  youtube: Clapperboard,
  instagram: Camera,
  facebook: ThumbsUp,
  google: Star,
  gmail: Mail,
  phone: PhoneCall,
  website: Globe,
};

/**
 * Connect / disconnect one platform account.
 * Production: "Connect" redirects to the platform's OAuth consent screen and the backend
 * stores the encrypted token. Preview mode: the account name is entered here instead.
 */
export function ConnectAccount({ ws, provider, compact }: { ws: Workspace; provider: ProviderId; compact?: boolean }) {
  const conn = ws.connections[provider];
  const info = providerInfo[provider];
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState("");

  function connect(name = account, simulated: boolean = product.previewMode) {
    if (!name.trim()) return;
    updateWorkspace((w) => {
      w.connections[provider] = { provider, account: name.trim(), status: "connected", connectedAt: nowIso(), simulated };
      logActivity(w, { kind: "system", title: `${info.name} connected`, detail: name.trim(), href: "/app/settings#accounts" });
      audit(w, `Connected ${info.name}`);
    });
    setOpen(false);
    setAccount("");
  }

  function disconnect() {
    if (provider === "whatsapp" && conn && !conn.simulated) void unlinkWhatsApp(conn.account);
    updateWorkspace((w) => {
      delete w.connections[provider];
      for (const a of w.automations) {
        if (a.status === "active" && needs(a.serviceId, provider)) {
          a.status = "attention";
          a.note = `${info.name} was disconnected — reconnect it to continue.`;
        }
      }
      notify(w, { kind: "connection", title: `${info.name} disconnected`, detail: "Automations that use it are on hold until you reconnect.", href: "/app/settings#accounts" });
      audit(w, `Disconnected ${info.name}`);
    });
  }

  const PIcon = providerIcon[provider];
  return (
    <div className={compact ? "" : cn("rounded-2xl border p-4 transition-colors", conn ? "border-flow/30 bg-[linear-gradient(135deg,rgb(37_211_102/0.08),transparent_60%),var(--color-ink-900)]" : "border-white/10 bg-ink-900")}>
      <div className="flex items-center gap-3">
        <span className={cn("relative grid size-11 shrink-0 place-items-center rounded-2xl", conn ? "bg-flow/15 text-flow ring-1 ring-flow/40" : "bg-white/[0.05] text-fg-muted ring-1 ring-white/10")}>
          <PIcon className="size-5" aria-hidden />
          {conn && <span aria-hidden className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-ink-900 bg-flow" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{info.name}</p>
          {conn ? (
            <p className="mt-1 flex min-w-0 items-center gap-2 text-xs text-fg-subtle">
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-flow/12 px-2 py-0.5 text-[0.62rem] font-semibold tracking-wide text-flow uppercase ring-1 ring-flow/30">
                <span aria-hidden className="size-1.5 rounded-full bg-flow" /> Connected
              </span>
              <span className="truncate">{conn.account}</span>
            </p>
          ) : (
            <p className="mt-0.5 truncate text-xs text-fg-subtle">{info.help}</p>
          )}
        </div>
        {conn ? (
          <button
            type="button"
            onClick={disconnect}
            aria-label={`Disconnect ${info.name}`}
            title="Disconnect"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 text-fg-muted transition-colors hover:border-red-400/40 hover:text-red-300"
          >
            <Unplug className="size-4" aria-hidden />
          </button>
        ) : (
          !open && (
            <Btn size="sm" onClick={() => setOpen(true)} className="shrink-0">
              Connect
            </Btn>
          )
        )}
      </div>
      {open && !conn && provider === "whatsapp" && whatsappLinkAvailable() && (
        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <WhatsAppLink onLinked={(n) => connect(waAccount(n), false)} onPreview={(n) => connect(waAccount(n))} />
        </div>
      )}
      {open && !conn && !(provider === "whatsapp" && whatsappLinkAvailable()) && (
        <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-4">
          <p className="flex items-start gap-2 text-xs text-fg-muted">
            <ExternalLink className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {product.previewMode
              ? `Preview mode: in the live app you sign in on ${info.name}'s own secure page. Here, just enter the account name to simulate the connection.`
              : `You'll sign in on ${info.name}'s secure page. ${product.name} never sees your password.`}
          </p>
          <Field label={provider === "phone" ? "Business phone number" : provider === "whatsapp" ? "WhatsApp Business number" : "Account / page name"} htmlFor={`acc-${provider}`}>
            <Input id={`acc-${provider}`} value={account} onChange={(e) => setAccount(e.target.value)} placeholder={provider === "phone" || provider === "whatsapp" ? "+1 555 0100" : "@yourbusiness"} />
          </Field>
          <div className="flex gap-2">
            <Btn size="sm" onClick={() => connect()} disabled={!account.trim()}>
              Allow access
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function needs(serviceId: string, provider: ProviderId) {
  return serviceById(serviceId)?.connect.includes(provider) ?? false;
}
