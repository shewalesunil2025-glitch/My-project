import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { PayCard } from "@/components/pay/PayCard";
import { adminDb } from "@/lib/server/followup";
import { instanceOk } from "@/lib/server/wa/rules";
import { paymentInfo } from "@/lib/server/wa/service";
import { upiAmount, upiUri } from "@/lib/upi";

/**
 * www.ibaxai.com/pay/<instance>?am=500&n=Order%2012 — the link IBAX shares on WhatsApp when a
 * customer wants to pay. It only works for a business that saved its UPI ID, so nobody can put
 * someone else's UPI ID behind an ibaxai link.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pay by UPI", robots: { index: false, follow: false } };

export default async function PayPage({ params, searchParams }: { params: Promise<{ instance: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { instance } = await params;
  const q = await searchParams;
  const db = adminDb();
  const info = db && instanceOk(instance) ? await paymentInfo(db, instance) : null;
  if (!info) notFound();

  const amount = upiAmount(q.am);
  const note = typeof q.n === "string" ? q.n.replace(/[^\p{L}\p{N} .,#/-]/gu, "").slice(0, 60) : undefined;
  const uri = upiUri({ upiId: info.upiId, name: info.name, amount, note });
  const qrSvg = await QRCode.toString(uri, { type: "svg", margin: 0, errorCorrectionLevel: "M" });

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#030703] px-4 py-10 text-white">
      <PayCard name={info.name} upiId={info.upiId} logo={info.logo} amount={amount} note={note} uri={uri} qrSvg={qrSvg} />
      <p className="mt-6 text-xs text-white/40">Secure UPI link by ibaxai</p>
    </main>
  );
}
