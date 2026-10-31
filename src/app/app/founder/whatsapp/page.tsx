"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { cloudAuthHeader } from "@/lib/app/cloud";
import { Btn, Card, Input, Notice, PageHeader } from "@/components/app/ui";

/** Founder only: frees a WhatsApp number that is stuck as "linked to another ibaxai account". */
export default function FounderWhatsApp() {
  const [number, setNumber] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function release() {
    if (!window.confirm(`Free ${number.trim()}? Its link on the WhatsApp server is removed and whoever owns it must link it again.`)) return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/whatsapp/release", { method: "POST", headers: { "content-type": "application/json", ...(await cloudAuthHeader()) }, body: JSON.stringify({ number }) }).catch(() => null);
    const d = (await res?.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
    setBusy(false);
    setMsg(res?.status === 403 ? "Only the founder account can do this." : d?.ok ? "Done. The number is free: link it again from the account that should own it." : (d?.message ?? "Couldn't do it. Try again."));
  }

  return (
    <div className="mx-auto min-h-dvh max-w-xl px-4 pt-6 pb-16">
      <Link href="/app/founder" className="mb-5 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"><ArrowLeft className="size-4" aria-hidden /> Founder Console</Link>
      <PageHeader eyebrow="Founder" title="Free a WhatsApp number" subtitle="For a number that says “already linked to another ibaxai account”." />
      <Card className="space-y-3 p-5">
        <label className="block text-sm">Number with country code, digits only (e.g. 917499414443)
          <Input inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value)} />
        </label>
        <Btn disabled={busy || number.replace(/\D/g, "").length < 8} onClick={release}>Free this number</Btn>
        {msg && <Notice tone="blue">{msg}</Notice>}
      </Card>
    </div>
  );
}
