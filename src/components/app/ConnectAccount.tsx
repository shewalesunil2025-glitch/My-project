"use client";

import { useState } from "react";
import { Check, ExternalLink, Unplug } from "lucide-react";
import { product } from "@/config/product";
import { providerInfo, serviceById } from "@/content/app/services";
import { audit, logActivity, notify, nowIso, updateWorkspace } from "@/lib/app/store";
import type { ProviderId, Workspace } from "@/lib/app/types";
import { Btn, Field, Input, Pill, fmtDate } from "./ui";

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

  function connect() {
    if (!account.trim()) return;
    updateWorkspace((w) => {
      w.connections[provider] = { provider, account: account.trim(), status: "connected", connectedAt: nowIso(), simulated: product.previewMode };
      logActivity(w, { kind: "system", title: `${info.name} connected`, detail: account.trim(), href: "/app/settings#accounts" });
      audit(w, `Connected ${info.name}`);
    });
    setOpen(false);
    setAccount("");
  }

  function disconnect() {
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

  return (
    <div className={compact ? "" : "rounded-xl border border-white/10 bg-ink-900 p-4"}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{info.name}</p>
          <p className="truncate text-xs text-fg-subtle">
            {conn ? `${conn.account} · since ${fmtDate(conn.connectedAt)}` : info.help}
          </p>
        </div>
        {conn ? (
          <>
            <Pill tone="green">
              <Check className="size-3" aria-hidden /> Connected
            </Pill>
            <Btn variant="subtle" size="sm" onClick={disconnect} aria-label={`Disconnect ${info.name}`}>
              <Unplug className="size-4" aria-hidden /> Disconnect
            </Btn>
          </>
        ) : (
          !open && (
            <Btn size="sm" onClick={() => setOpen(true)}>
              Connect
            </Btn>
          )
        )}
      </div>
      {open && !conn && (
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
            <Btn size="sm" onClick={connect} disabled={!account.trim()}>
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
