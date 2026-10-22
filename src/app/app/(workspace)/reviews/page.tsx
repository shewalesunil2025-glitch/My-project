"use client";

import { useState } from "react";
import { Check, Copy, MessageSquareReply, Send, Star } from "lucide-react";
import { product } from "@/config/product";
import { audit, updateWorkspace } from "@/lib/app/store";
import { askForReview, askMessages, reviewsOn } from "@/lib/app/reviewRequests";
import type { Review, Workspace } from "@/lib/app/types";
import { cloudAuthHeader } from "@/lib/app/cloud";
import { useWorkspace } from "@/components/app/AppShell";
import { Btn, BtnLink, Card, EmptyState, Field, Input, Notice, PageHeader, Pill, SectionTitle, Spinner, Stat, TextArea, relTime, withinDays } from "@/components/app/ui";

/** Ask a customer for a Google review on WhatsApp, and the requests sent so far. */
function AskForReview({ ws }: { ws: Workspace }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const sent = (ws.reviewRequests ?? []).filter((r) => r.status === "sent");

  async function ask() {
    setBusy(true);
    setMsg(null);
    const result = await askForReview(name, phone, "manual");
    setBusy(false);
    setMsg({ ok: result === "sent", text: askMessages[result] });
    if (result === "sent") {
      setName("");
      setPhone("");
    }
  }

  return (
    <section className="mb-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
      <Card className="border-flow/30">
        <h2 className="flex items-center gap-2 font-semibold">
          <Send className="size-4 text-flow" aria-hidden /> Ask a customer for a review
        </h2>
        <p className="mt-1 text-sm text-fg-muted">IBAX sends a thank-you with your Google review link on your WhatsApp. Ask only real customers.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Customer name" htmlFor="rv-name">
            <Input id="rv-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya" maxLength={80} />
          </Field>
          <Field label="WhatsApp number" htmlFor="rv-phone">
            <Input id="rv-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Customer's mobile number" inputMode="tel" maxLength={20} />
          </Field>
        </div>
        {msg && (
          <Notice tone={msg.ok ? "ember" : "amber"} className="mt-3">
            {msg.text}
          </Notice>
        )}
        <Btn className="mt-4 w-full sm:w-auto" onClick={ask} disabled={busy || phone.replace(/\D/g, "").length < 10}>
          {busy ? <Spinner /> : <Send className="size-4" aria-hidden />} Send review request
        </Btn>
      </Card>
      <Card>
        <SectionTitle action={<Pill tone="green">{sent.filter((r) => withinDays(r.at, 30)).length} this month</Pill>}>Review requests</SectionTitle>
        {sent.length === 0 ? (
          <p className="text-sm text-fg-muted">None yet. Send one here, or mark a lead as Converted — IBAX asks them automatically.</p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
            {(ws.reviewRequests ?? []).slice(0, 30).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
                <span className="min-w-0 truncate">
                  {r.name} <span className="text-fg-subtle">· {r.phone}</span>
                </span>
                <span className="shrink-0 text-xs text-fg-subtle">{r.status === "sent" ? relTime(r.at) : "Not sent"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}

/** Paste a Google review, get a reply IBAX has written for it (copy it into Google). */
function ReplyHelper({ ws }: { ws: Workspace }) {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function write() {
    setBusy(true);
    setError("");
    setReply("");
    setCopied(false);
    const res = await fetch("/api/reviews/reply", {
      method: "POST",
      headers: { "content-type": "application/json", ...(await cloudAuthHeader()) },
      body: JSON.stringify({ review: text, rating, author, business: ws.business?.name }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { ok?: boolean; reply?: string; reason?: string } | null;
    setBusy(false);
    if (data?.ok && data.reply) setReply(data.reply);
    else setError(data?.reason === "limit" ? "Thodi der baad dobara try kariye (ek ghante me 30 replies tak)." : "Reply nahi ban paya. Thodi der baad dobara try kariye.");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(reply);
      setCopied(true);
    } catch {
      setError("Copy nahi hua — reply ko dabakar rakhkar copy kariye.");
    }
  }

  return (
    <Card className="mb-8">
      <h2 className="flex items-center gap-2 font-semibold">
        <MessageSquareReply className="size-4 text-flow" aria-hidden /> Reply to a Google review
      </h2>
      <p className="mt-1 text-sm text-fg-muted">Copy a review from Google, paste it here, and IBAX writes the reply — in the customer&apos;s language. Then copy it back into Google.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field label="Customer name (optional)" htmlFor="rr-author">
          <Input id="rr-author" value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={60} />
        </Field>
        <Field label="Stars" htmlFor="rr-stars">
          <div id="rr-stars" role="radiogroup" aria-label="Stars" className="flex h-[2.6rem] items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="grid size-9 place-items-center rounded-lg text-amber-300 hover:bg-white/10">
                <Star className="size-5" fill={n <= rating ? "currentColor" : "none"} aria-hidden />
              </button>
            ))}
          </div>
        </Field>
      </div>
      <div className="mt-3">
        <Field label="The review" htmlFor="rr-text">
          <TextArea id="rr-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the review here…" maxLength={1500} className="min-h-24" />
        </Field>
      </div>
      <Btn className="mt-4 w-full sm:w-auto" onClick={write} disabled={busy || (!text.trim() && rating < 4)}>
        {busy ? <Spinner /> : <MessageSquareReply className="size-4" aria-hidden />} Write reply
      </Btn>
      {error && (
        <Notice tone="amber" className="mt-3">
          {error}
        </Notice>
      )}
      {reply && (
        <div className="mt-4 space-y-2">
          <label htmlFor="rr-reply" className="text-xs text-fg-subtle">
            Your reply — edit if you like, then copy it into Google
          </label>
          <TextArea id="rr-reply" value={reply} onChange={(e) => setReply(e.target.value)} className="min-h-24" />
          <Btn size="sm" onClick={copy}>
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />} {copied ? "Copied" : "Copy reply"}
          </Btn>
        </div>
      )}
    </Card>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="flex text-amber-300" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className="size-3.5" fill={i < n ? "currentColor" : "none"} aria-hidden />
      ))}
    </span>
  );
}

function ReviewCard({ r, businessName }: { r: Review; businessName: string }) {
  const [draft, setDraft] = useState(r.suggestedReply ?? "");
  const [open, setOpen] = useState(false);
  const save = () =>
    updateWorkspace((w) => {
      const x = w.reviews.find((y) => y.id === r.id);
      if (!x) return;
      x.reply = draft.trim();
      audit(w, `Replied to review from ${r.author}`);
    });
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{r.author}</p>
        <span className="text-xs text-fg-subtle">{relTime(r.at)}</span>
      </div>
      <div className="mt-1">
        <Stars n={r.rating} />
      </div>
      <p className="mt-2 text-sm text-fg-muted">{r.text}</p>
      {r.reply ? (
        <div className="mt-3 rounded-xl bg-white/[0.04] p-3 text-sm">
          <p className="text-xs font-semibold text-fg-subtle">Reply from {businessName}</p>
          <p className="mt-1 text-fg-muted">{r.reply}</p>
        </div>
      ) : open ? (
        <div className="mt-3 space-y-2">
          <label htmlFor={`rep-${r.id}`} className="text-xs text-fg-subtle">
            Suggested reply — edit before posting
          </label>
          <TextArea id={`rep-${r.id}`} value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-20" />
          <div className="flex gap-2">
            <Btn size="sm" onClick={save} disabled={!draft.trim()}>
              Post reply
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Btn>
          </div>
        </div>
      ) : (
        <Btn size="sm" variant="ghost" className="mt-3" onClick={() => setOpen(true)}>
          {r.suggestedReply ? "Review suggested reply" : "Write a reply"}
        </Btn>
      )}
    </Card>
  );
}

export default function ReviewsPage() {
  const ws = useWorkspace();
  if (!ws?.business) return null;
  const avg = ws.reviews.length ? ws.reviews.reduce((s, r) => s + r.rating, 0) / ws.reviews.length : 0;
  const active = ws.automations.some((a) => a.serviceId === "reviews" && a.status !== "setup");

  return (
    <div>
      <PageHeader eyebrow="Google Review Assistant" title="Reviews" subtitle="New reviews, suggested replies and your rating over time." />
      {reviewsOn(ws) ? (
        <AskForReview ws={ws} />
      ) : (
        <Card className="mb-6 flex flex-wrap items-center gap-4 border-flow/30">
          <div className="min-w-[14rem] flex-1">
            <p className="font-semibold">Get more real Google reviews</p>
            <p className="mt-1 text-sm text-fg-muted">IBAX asks your customers for a review on your WhatsApp — automatically after a sale, or with one tap.</p>
          </div>
          <BtnLink href="/app/services/reviews" className="w-full sm:w-auto">
            {active ? "Finish setup" : "Get Google Review Management"}
          </BtnLink>
        </Card>
      )}
      {reviewsOn(ws) && <ReplyHelper ws={ws} />}
      <Notice tone="blue" className="mb-6">
        {product.name} only works with genuine reviews from real customers. It never writes fake reviews or manipulates ratings.
      </Notice>
      {ws.reviews.length === 0 ? (
        <EmptyState title="New-review alerts are coming soon">
          Soon IBAX will also show your new Google reviews here automatically — once Google approves our connection. Until then, paste any review above and IBAX writes the reply.
        </EmptyState>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Average rating" value={`${avg.toFixed(1)} ★`} />
            <Stat label="Total reviews" value={ws.reviews.length} />
            <Stat label="Waiting for reply" value={ws.reviews.filter((r) => !r.reply).length} />
            <Stat label="This week" value={ws.reviews.filter((r) => withinDays(r.at, 7)).length} />
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {ws.reviews.map((r) => (
              <li key={r.id}>
                <ReviewCard r={r} businessName={ws.business!.name} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
