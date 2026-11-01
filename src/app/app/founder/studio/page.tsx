"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, RefreshCw, X } from "lucide-react";
import { cloudAuthHeader } from "@/lib/app/cloud";
import { Btn, Card, Notice, PageHeader, Pill, type PillTone } from "@/components/app/ui";

type Pub = { platform: string; status: string; url: string | null; error: string };
type Job = {
  id: string; day: string; attempt: number; status: string; topic: string; error: string;
  research?: { live?: boolean; sources?: { url: string; title: string }[] };
  script?: { hook?: string; cta?: string; scenes?: { seconds: number; voiceover: string; onScreen: string }[] };
  instagram?: { caption?: string; hashtags?: string[] };
  youtube?: { title?: string; description?: string; tags?: string[]; hashtags?: string[] };
  videoUrl: string | null; thumbnailUrl: string | null; publish: Pub[]; events: { level: string; message: string; created_at: string }[];
};
type Overview = { latest: Job | null; history: { id: string; day: string; attempt: number; status: string; topic: string }[]; connected: Record<string, boolean> };

const STATUS: Record<string, { label: string; tone: PillTone }> = {
  queued: { label: "Finding today's topic", tone: "blue" },
  scripting: { label: "Writing the script", tone: "blue" },
  assets: { label: "Making pictures and voice", tone: "blue" },
  awaiting_render: { label: "Waiting for the video maker", tone: "amber" },
  rendering: { label: "Making the video", tone: "blue" },
  ready_for_review: { label: "Ready — watch and approve", tone: "green" },
  approved: { label: "Approved", tone: "green" },
  publishing: { label: "Publishing…", tone: "blue" },
  published: { label: "Published", tone: "green" },
  partly_published: { label: "Partly published", tone: "amber" },
  rejected: { label: "Rejected", tone: "gray" },
  failed: { label: "Failed", tone: "red" },
};

async function post(body: Record<string, unknown>) {
  const res = await fetch("/api/studio", { method: "POST", headers: { "content-type": "application/json", ...(await cloudAuthHeader()) }, body: JSON.stringify(body) }).catch(() => null);
  return { status: res?.status ?? 0, data: ((await res?.json().catch(() => null)) ?? {}) as Record<string, unknown> };
}

/** Founder only: today's AI Reel / Short. Watch it, then Approve & Publish, Regenerate or Reject. */
export default function ContentStudio() {
  const [o, setO] = useState<Overview | null>(null);
  const [state, setState] = useState<"loading" | "denied" | "error" | "ready">("loading");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = await post({ action: "overview" });
    if (r.status === 403) return setState("denied");
    if (!r.data.ok) {
      setMsg(String(r.data.reason === "not_ready" ? "Run supabase/migrations/0009_studio.sql in Supabase first." : (r.data.message ?? "")));
      return setState("error");
    }
    setO(r.data as unknown as Overview);
    setState("ready");
  }, []);
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    const every = setInterval(() => void load(), 20_000);
    return () => { clearTimeout(t); clearInterval(every); };
  }, [load]);

  const act = async (action: string, id?: string, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(action);
    setMsg("");
    const r = await post({ action, id });
    setBusy("");
    if (!r.data.ok) setMsg(String(r.data.message ?? r.data.reason ?? "Something went wrong."));
    await load();
  };

  const j = o?.latest ?? null;
  const st = j ? (STATUS[j.status] ?? { label: j.status, tone: "gray" as PillTone }) : null;

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 pt-6 pb-16">
      <Link href="/app/founder" className="mb-5 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"><ArrowLeft className="size-4" aria-hidden /> Founder Console</Link>
      <PageHeader eyebrow="Founder" title="Autonomous Content Studio" subtitle="One AI Reel / Short a day. Nothing is published until you approve it." />
      {state === "loading" && <p className="text-sm text-fg-muted">Loading…</p>}
      {state === "denied" && <Notice tone="amber">Only the founder account can open this.</Notice>}
      {state === "error" && <Notice tone="amber">Couldn&apos;t load. {msg}</Notice>}
      {state === "ready" && o && (
        <div className="space-y-6">
          {msg && <Notice tone="amber">{msg}</Notice>}
          <Card className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <span>Accounts:</span>
            <Pill tone={o.connected.instagram ? "green" : "gray"}>Instagram {o.connected.instagram ? "connected" : "not connected"}</Pill>
            <Pill tone={o.connected.youtube ? "green" : "gray"}>YouTube {o.connected.youtube ? "connected" : "not connected"}</Pill>
            {!j && <Btn className="ml-auto" disabled={!!busy} onClick={() => act("start")}>Make today&apos;s video</Btn>}
          </Card>

          {j && st && (
            <Card className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={st.tone}>{st.label}</Pill>
                <span className="text-sm text-fg-muted">{j.day} · try {j.attempt}</span>
                {["queued", "scripting", "assets"].includes(j.status) && <Btn className="ml-auto" disabled={!!busy} onClick={() => act("advance")}>Run next step now</Btn>}
              </div>
              {j.error && <Notice tone="amber">Last problem: {j.error}</Notice>}
              {j.topic && <h2 className="text-xl font-bold">{j.topic}</h2>}
              {j.research && !j.research.live && j.topic && <p className="text-xs text-fg-subtle">Idea from the AI (no live web search today) — not presented as news.</p>}

              {j.videoUrl ? (
                <video src={j.videoUrl} controls playsInline className="mx-auto max-h-[70vh] w-full max-w-xs rounded-2xl bg-black" />
              ) : (
                <p className="text-sm text-fg-muted">The video appears here when it is ready.</p>
              )}

              {j.status === "ready_for_review" && (
                <div className="flex flex-wrap gap-2">
                  <Btn disabled={!!busy} onClick={() => act("approve", j.id, "Publish this video on Instagram and YouTube now?")}><Check className="mr-1.5 inline size-4" aria-hidden />Approve &amp; publish</Btn>
                  <Btn variant="ghost" disabled={!!busy} onClick={() => act("regenerate", j.id, "Make a new video with a different topic?")}><RefreshCw className="mr-1.5 inline size-4" aria-hidden />Regenerate</Btn>
                  <Btn variant="danger" disabled={!!busy} onClick={() => act("reject", j.id, "Reject this video? Nothing will be published.")}><X className="mr-1.5 inline size-4" aria-hidden />Reject</Btn>
                </div>
              )}
              {["failed", "rejected"].includes(j.status) && <Btn variant="ghost" disabled={!!busy} onClick={() => act("regenerate", j.id)}><RefreshCw className="mr-1.5 inline size-4" aria-hidden />Make a new one</Btn>}
              {["partly_published", "failed"].includes(j.status) && j.publish.length > 0 && <Btn disabled={!!busy} onClick={() => act("retry_publish", j.id)}>Retry publishing</Btn>}

              {j.publish.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {j.publish.map((p) => (
                    <li key={p.platform}>
                      <b className="capitalize">{p.platform}</b>: {p.status}
                      {p.url && <> · <a className="text-flow-soft underline" href={p.url} target="_blank" rel="noopener noreferrer">open</a></>}
                      {p.error && <span className="text-fg-subtle"> — {p.error}</span>}
                    </li>
                  ))}
                </ul>
              )}

              {j.thumbnailUrl && (
                <div>
                  <p className="mb-1 text-sm font-semibold">Thumbnail</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={j.thumbnailUrl} alt="Thumbnail" className="w-full max-w-sm rounded-xl" />
                </div>
              )}
              {j.script?.scenes && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-semibold">Script ({j.script.scenes.reduce((a, s) => a + s.seconds, 0)} s)</summary>
                  <ol className="mt-2 list-decimal space-y-1 pl-5">{j.script.scenes.map((s, i) => <li key={i}>{s.voiceover} <span className="text-fg-subtle">[{s.onScreen}]</span></li>)}</ol>
                </details>
              )}
              {j.instagram?.caption && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-semibold">Instagram caption</summary>
                  <p className="mt-2 whitespace-pre-wrap">{j.instagram.caption}</p>
                  <p className="mt-1 text-flow-soft">{(j.instagram.hashtags ?? []).join(" ")}</p>
                </details>
              )}
              {j.youtube?.title && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-semibold">YouTube title, description and tags</summary>
                  <p className="mt-2 font-semibold">{j.youtube.title}</p>
                  <p className="mt-1 whitespace-pre-wrap">{j.youtube.description}</p>
                  <p className="mt-1 text-fg-subtle">{(j.youtube.tags ?? []).join(", ")}</p>
                </details>
              )}
              {j.research?.sources && j.research.sources.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-semibold">Sources used</summary>
                  <ul className="mt-2 list-disc pl-5">{j.research.sources.map((s) => <li key={s.url}><a className="underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.title || s.url}</a></li>)}</ul>
                </details>
              )}
              {j.events.length > 0 && (
                <details className="text-xs text-fg-subtle">
                  <summary className="cursor-pointer">Log</summary>
                  <ul className="mt-1 space-y-0.5">{j.events.map((e, i) => <li key={i}>{new Date(e.created_at).toLocaleTimeString()} · {e.message}</li>)}</ul>
                </details>
              )}
            </Card>
          )}

          {o.history.length > 1 && (
            <Card className="p-5">
              <h2 className="mb-2 font-semibold">History</h2>
              <ul className="space-y-1 text-sm">{o.history.map((h) => <li key={h.id}>{h.day} · try {h.attempt} · <b>{STATUS[h.status]?.label ?? h.status}</b> · {h.topic || "—"}</li>)}</ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
