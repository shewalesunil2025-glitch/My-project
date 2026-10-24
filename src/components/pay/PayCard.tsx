"use client";

import { useState } from "react";
import { Check, Copy, ShieldCheck, Smartphone } from "lucide-react";

/** The pay page card: the business, the amount, a UPI QR code and a button that opens any UPI app. */
export function PayCard({ name, upiId, logo, amount, note, uri, qrSvg }: { name: string; upiId: string; logo?: string; amount?: number; note?: string; uri: string; qrSvg: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- the business's own logo (data URL)
        <img src={logo} alt="" className="mx-auto size-16 rounded-2xl bg-white object-cover" />
      ) : (
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-500/15 text-2xl font-bold text-emerald-400">{name.slice(0, 1).toUpperCase()}</span>
      )}
      <p className="mt-3 text-xs tracking-widest text-white/50 uppercase">Pay to</p>
      <h1 className="text-xl font-bold">{name}</h1>
      {amount && <p className="mt-2 text-3xl font-bold tabular-nums">₹{amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>}
      {note && <p className="mt-1 text-sm text-white/60">{note}</p>}

      <a href={uri} className="mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-500 font-semibold text-black hover:bg-emerald-400">
        <Smartphone className="size-5" aria-hidden /> Pay with any UPI app
      </a>
      <p className="mt-2 text-xs text-white/50">GPay · PhonePe · Paytm · BHIM · any bank app</p>

      <div className="mx-auto mt-5 w-52 rounded-2xl bg-white p-3" role="img" aria-label={`UPI QR code to pay ${name}`} dangerouslySetInnerHTML={{ __html: qrSvg }} />
      <p className="mt-2 text-xs text-white/50">On a computer? Scan this with your phone&apos;s UPI app.</p>

      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(upiId).then(() => setCopied(true));
        }}
        className="mx-auto mt-4 flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
      >
        {copied ? <Check className="size-4 text-emerald-400" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        UPI ID: <span className="font-mono">{upiId}</span>
      </button>

      <p className="mt-5 flex items-start gap-2 text-left text-xs text-white/55">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
        The money goes straight to {name}&apos;s bank account. Check the name in your UPI app before you pay, then send the payment screenshot on WhatsApp.
      </p>
    </div>
  );
}
