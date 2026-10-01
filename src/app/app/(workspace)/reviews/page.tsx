"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { product } from "@/config/product";
import { audit, updateWorkspace } from "@/lib/app/store";
import type { Review } from "@/lib/app/types";
import { useWorkspace } from "@/components/app/AppShell";
import { Btn, BtnLink, Card, EmptyState, Notice, PageHeader, Stat, TextArea, relTime, withinDays } from "@/components/app/ui";

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
      <Notice tone="blue" className="mb-6">
        {product.name} only works with genuine reviews from real customers. It never writes fake reviews or manipulates ratings.
      </Notice>
      {ws.reviews.length === 0 ? (
        <EmptyState title={active ? "No reviews yet" : "Watch and answer your Google reviews"} action={!active && <BtnLink href="/app/services/reviews">Get Google Review Assistant</BtnLink>}>
          {active ? "You'll be notified the moment a new review arrives." : "Get alerts, suggested replies and review requests to happy customers."}
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
