"use client";

import { useState } from "react";
import { CalendarDays, Check, Eye, Pencil, Plus, Send, Trash2, X } from "lucide-react";
import { contentIdea } from "@/lib/app/assistant";
import { audit, logActivity, notify, nowIso, uid, updateWorkspace } from "@/lib/app/store";
import type { ContentItem, ContentType } from "@/lib/app/types";
import { useWorkspace } from "@/components/app/AppShell";
import { contentStatus } from "@/components/app/status";
import { Btn, Card, EmptyState, Field, Input, PageHeader, Pill, Segmented, Select, TextArea, fmtDateTime } from "@/components/app/ui";
import { cn } from "@/lib/cn";

type Tab = "all" | "videos" | "reel" | "short" | "image" | "caption" | "post" | "script" | "calendar";
const tabs: { value: Tab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "videos", label: "AI Videos" },
  { value: "reel", label: "Reels" },
  { value: "short", label: "Shorts" },
  { value: "image", label: "Images" },
  { value: "caption", label: "Captions" },
  { value: "post", label: "Posts" },
  { value: "script", label: "Scripts" },
  { value: "calendar", label: "Calendar" },
];
const typeEmoji: Record<ContentType, string> = { video: "🎬", reel: "🎞️", short: "📱", image: "🖼️", caption: "✍️", post: "📝", script: "📜" };

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function ContentPage() {
  const ws = useWorkspace();
  const [tab, setTab] = useState<Tab>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  if (!ws) return null;

  const filtered = ws.content.filter((c) => {
    if (tab === "all" || tab === "calendar") return true;
    if (tab === "videos") return c.type === "video" || c.type === "short" || c.type === "reel";
    return c.type === tab;
  });

  function mutate(id: string, fn: (c: ContentItem) => void, log?: string) {
    updateWorkspace((w) => {
      const c = w.content.find((x) => x.id === id);
      if (!c) return;
      fn(c);
      if (log) {
        logActivity(w, { kind: c.platform === "youtube" ? "youtube" : c.platform === "facebook" ? "facebook" : c.platform === "instagram" ? "instagram" : "system", title: `${log} — ${c.title}`, href: "/app/content" });
        if (log === "Published") notify(w, { kind: "published", title: "Content published", detail: c.title, href: "/app/content" });
        audit(w, `${log}: ${c.title}`);
      }
    });
  }

  function create() {
    const idea = contentIdea(ws!, "instagram");
    const item: ContentItem = { id: uid(), type: "post", platform: "instagram", title: idea.title, body: idea.body, hashtags: idea.hashtags, status: "draft", createdAt: nowIso() };
    setEditing(item);
  }

  function saveEdit() {
    if (!editing) return;
    updateWorkspace((w) => {
      const i = w.content.findIndex((c) => c.id === editing.id);
      if (i >= 0) w.content[i] = editing;
      else w.content.unshift(editing);
    });
    setEditing(null);
  }

  // Calendar: next 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Content Centre"
        title="Content"
        subtitle="AI videos, reels, shorts, images, captions, posts and scripts — preview, edit, approve, schedule and publish."
        action={
          <Btn size="sm" onClick={create}>
            <Plus className="size-4" aria-hidden /> Create with {ws.assistant?.name}
          </Btn>
        }
      />
      <div className="mb-5">
        <Segmented label="Content type" value={tab} onChange={setTab} options={tabs} />
      </div>

      {editing && (
        <Card className="mb-6 space-y-4 border-flow/30">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{ws.content.some((c) => c.id === editing.id) ? "Edit content" : "New content"}</h2>
            <button type="button" onClick={() => setEditing(null)} aria-label="Close editor" className="text-fg-muted hover:text-fg">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" htmlFor="c-type">
              <Select id="c-type" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as ContentType })}>
                {(Object.keys(typeEmoji) as ContentType[]).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Platform" htmlFor="c-platform">
              <Select id="c-platform" value={editing.platform} onChange={(e) => setEditing({ ...editing, platform: e.target.value as ContentItem["platform"] })}>
                {["instagram", "facebook", "youtube", "website", "email"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Title" htmlFor="c-title">
            <Input id="c-title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          </Field>
          <Field label="Caption / script" htmlFor="c-body">
            <TextArea id="c-body" value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
          </Field>
          <Field label="Hashtags" htmlFor="c-tags">
            <Input id="c-tags" value={editing.hashtags ?? ""} onChange={(e) => setEditing({ ...editing, hashtags: e.target.value })} />
          </Field>
          <div className="flex gap-2">
            <Btn onClick={saveEdit} disabled={!editing.title.trim()}>
              Save
            </Btn>
            <Btn variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Btn>
          </div>
        </Card>
      )}

      {tab === "calendar" ? (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {days.map((d) => {
            const items = ws.content.filter((c) => {
              const at = c.scheduledAt ?? c.publishedAt;
              return at && new Date(at).toDateString() === d.toDateString();
            });
            return (
              <li key={d.toISOString()} className={cn("glass min-h-28 rounded-xl p-3", d.toDateString() === new Date().toDateString() && "border-flow/40")}>
                <p className="text-xs font-semibold text-fg-muted">{d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</p>
                <ul className="mt-2 space-y-1.5">
                  {items.map((c) => (
                    <li key={c.id} className="rounded-lg bg-white/[0.05] px-2 py-1.5 text-[0.72rem] leading-snug">
                      {typeEmoji[c.type]} {c.title}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      ) : filtered.length === 0 ? (
        <EmptyState title="No content here yet" action={<Btn size="sm" onClick={create}>Create something</Btn>}>
          Activate YouTube, Instagram or Facebook automation and new content appears here automatically.
        </EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {filtered.map((c) => {
            const st = contentStatus[c.status];
            const open = openId === c.id;
            return (
              <li key={c.id} className="glass flex flex-col rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-lg" aria-hidden>
                    {typeEmoji[c.type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug">{c.title}</p>
                    <p className="mt-0.5 text-xs text-fg-subtle capitalize">
                      {c.type} · {c.platform}
                      {c.status === "scheduled" && c.scheduledAt && ` · ${fmtDateTime(c.scheduledAt)}`}
                      {c.status === "approval" && c.scheduledAt && ` · planned ${fmtDateTime(c.scheduledAt)}`}
                      {c.status === "published" && c.publishedAt && ` · ${fmtDateTime(c.publishedAt)}`}
                    </p>
                  </div>
                  <Pill tone={st.tone}>{st.label}</Pill>
                </div>
                {open && (
                  <div className="mt-3 rounded-xl bg-ink-900 p-3 text-sm">
                    <p className="whitespace-pre-line text-fg-muted">{c.body}</p>
                    {c.hashtags && <p className="mt-2 text-xs text-sky-300">{c.hashtags}</p>}
                  </div>
                )}
                {c.stats && (
                  <p className="mt-3 text-xs text-fg-muted">
                    {c.stats.views.toLocaleString()} views · {c.stats.likes} likes · {c.stats.comments} comments
                  </p>
                )}
                <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                  <Btn size="sm" variant="subtle" onClick={() => setOpenId(open ? null : c.id)} aria-expanded={open}>
                    <Eye className="size-3.5" aria-hidden /> {open ? "Hide" : "Preview"}
                  </Btn>
                  {c.status !== "published" && (
                    <Btn size="sm" variant="subtle" onClick={() => setEditing({ ...c })}>
                      <Pencil className="size-3.5" aria-hidden /> Edit
                    </Btn>
                  )}
                  {c.status === "approval" && (
                    <Btn size="sm" onClick={() => mutate(c.id, (x) => (x.status = "scheduled"), "Approved")}>
                      <Check className="size-3.5" aria-hidden /> Approve
                    </Btn>
                  )}
                  {c.status !== "published" && (
                    <label className="inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-[0.8rem] text-fg-muted hover:bg-white/[0.06]">
                      <CalendarDays className="size-3.5" aria-hidden />
                      <span className="sr-only">Schedule</span>
                      <input
                        type="datetime-local"
                        value={toLocalInput(c.scheduledAt)}
                        onChange={(e) => e.target.value && mutate(c.id, (x) => ((x.scheduledAt = new Date(e.target.value).toISOString()), (x.status = "scheduled")), "Scheduled")}
                        className="w-[11.5rem] bg-transparent text-xs text-fg focus:outline-none [color-scheme:dark]"
                      />
                    </label>
                  )}
                  {c.status !== "published" && (
                    <Btn size="sm" variant="ghost" onClick={() => mutate(c.id, (x) => ((x.status = "published"), (x.publishedAt = nowIso()), (x.stats = { views: 0, likes: 0, comments: 0 })), "Published")}>
                      <Send className="size-3.5" aria-hidden /> Publish
                    </Btn>
                  )}
                  <Btn
                    size="sm"
                    variant="subtle"
                    className="ml-auto"
                    onClick={() => updateWorkspace((w) => void (w.content = w.content.filter((x) => x.id !== c.id)))}
                    aria-label={`Delete ${c.title}`}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Btn>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
