"use client";

import Link from "next/link";
import { useState } from "react";
import type { ActivityKind, ChatMessage, ContentItem } from "@/lib/app/types";
import { useWorkspace } from "@/components/app/AppShell";
import { KindIcon, kindLabel } from "@/components/app/kinds";
import { EmptyState, PageHeader, Pill, Segmented, fmtDateTime, fmtTime, yesterday, type PillTone } from "@/components/app/ui";

/*
 * Activity: the history of every photo and video IBAX made or posted (Instagram, Facebook, YouTube),
 * every image IBAX made in the chat, and — under "Everything" — the full timeline of the business.
 */

type Tab = "posts" | "images" | "all";
const tabs: { value: Tab; label: string }[] = [
  { value: "posts", label: "Posts & videos" },
  { value: "images", label: "AI images" },
  { value: "all", label: "Everything" },
];

type Platform = "all" | "instagram" | "facebook" | "youtube";
const platforms: { value: Platform; label: string }[] = [
  { value: "all", label: "All" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
];

type Filter = "all" | ActivityKind | "social";
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "call", label: "Calls" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Emails" },
  { value: "social", label: "Social posts" },
  { value: "youtube", label: "YouTube" },
  { value: "review", label: "Reviews" },
  { value: "lead", label: "Leads" },
  { value: "automation", label: "Automations" },
];

const typeLabel: Record<ContentItem["type"], string> = { video: "Video", reel: "Reel", short: "Short", image: "Photo", caption: "Caption", post: "Post", script: "Script" };
const status: Record<ContentItem["status"], { label: string; tone: PillTone }> = {
  draft: { label: "Draft", tone: "gray" },
  approval: { label: "Waiting for your OK", tone: "amber" },
  scheduled: { label: "Scheduled", tone: "blue" },
  published: { label: "Posted", tone: "green" },
};
/** The moment that matters most for a post: when it went out, is planned to, or was made. */
const when = (c: ContentItem) => c.publishedAt ?? c.scheduledAt ?? c.createdAt;

function dayKey(iso: string) {
  const d = new Date(iso);
  if (d.toDateString() === new Date().toDateString()) return "Today";
  if (d.toDateString() === yesterday().toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}
function byDay<T>(list: T[], at: (x: T) => string) {
  const groups = new Map<string, T[]>();
  for (const x of list) groups.set(dayKey(at(x)), [...(groups.get(dayKey(at(x))) ?? []), x]);
  return [...groups.entries()];
}

function PostsHistory({ content }: { content: ContentItem[] }) {
  const [platform, setPlatform] = useState<Platform>("all");
  const posts = content
    .filter((c) => c.platform === "instagram" || c.platform === "facebook" || c.platform === "youtube")
    .filter((c) => platform === "all" || c.platform === platform)
    .sort((a, b) => when(b).localeCompare(when(a)));
  const posted = posts.filter((c) => c.status === "published");
  const views = posted.reduce((t, c) => t + (c.stats?.views ?? 0), 0);

  return (
    <div>
      <div className="mb-4">
        <Segmented label="Platform" value={platform} onChange={setPlatform} options={platforms} />
      </div>
      <div className="mb-6 grid grid-cols-3 gap-2.5">
        {[
          [posts.length, "made by IBAX"],
          [posted.length, "posted"],
          [views.toLocaleString(), "views"],
        ].map(([v, l]) => (
          <div key={l} className="glass rounded-2xl p-3">
            <p className="text-xl font-bold tabular-nums">{v}</p>
            <p className="text-[0.7rem] text-fg-muted">{l}</p>
          </div>
        ))}
      </div>
      {posts.length === 0 ? (
        <EmptyState title="No posts or videos yet">
          When the Instagram, Facebook or YouTube automation makes a photo, reel or video, it shows up here — made, approved, scheduled and posted.
        </EmptyState>
      ) : (
        <div className="space-y-7">
          {byDay(posts, when).map(([day, items]) => (
            <section key={day} aria-label={day}>
              <h2 className="eyebrow mb-3">{day}</h2>
              <ul className="space-y-2.5">
                {items.map((c) => (
                  <li key={c.id}>
                    <Link href="/app/content" className="glass flex gap-3 rounded-2xl p-3 hover:border-white/20">
                      <KindIcon kind={c.platform as ActivityKind} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[0.7rem] font-semibold text-fg-subtle uppercase">
                            {kindLabel(c.platform as ActivityKind)} · {typeLabel[c.type]}
                          </span>
                          <Pill tone={status[c.status].tone}>{status[c.status].label}</Pill>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold">{c.title}</p>
                        <p className="mt-1 text-xs text-fg-subtle">
                          Made {fmtDateTime(c.createdAt)}
                          {c.scheduledAt && c.status !== "published" && ` · goes out ${fmtDateTime(c.scheduledAt)}`}
                          {c.publishedAt && ` · posted ${fmtDateTime(c.publishedAt)}`}
                        </p>
                        {c.stats && (
                          <p className="mt-1 text-xs text-fg-muted">
                            👁 {c.stats.views.toLocaleString()} · ❤️ {c.stats.likes} · 💬 {c.stats.comments}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ImagesHistory({ chat }: { chat: ChatMessage[] }) {
  // Each image with what the owner asked for just before it.
  const images = chat
    .map((m, i) => ({
      m,
      ask: chat
        .slice(0, i)
        .reverse()
        .find((x) => x.role === "user")?.text,
    }))
    .filter(({ m }) => m.role === "assistant" && m.image)
    .reverse();
  if (!images.length)
    return (
      <EmptyState
        title="No AI images yet"
        action={
          <Link href="/app/ibax" className="text-sm font-semibold text-flow-soft">
            Ask IBAX for a poster →
          </Link>
        }
      >
        Ask IBAX for an offer poster, a post or a banner — every image it makes is kept here.
      </EmptyState>
    );
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map(({ m, ask }) => (
        <a key={m.id} href={m.image} target="_blank" rel="noreferrer" className="glass group overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- an image IBAX made (URL or data URL) */}
          <img src={m.image} alt={ask ?? "Image made by IBAX"} className="aspect-square w-full object-cover transition-transform group-hover:scale-[1.03]" loading="lazy" />
          <div className="p-2.5">
            {ask && <p className="line-clamp-2 text-xs">{ask}</p>}
            <p className="mt-1 text-[0.68rem] text-fg-subtle">{fmtDateTime(m.at)}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

function Timeline({ activity }: { activity: { id: string; at: string; kind: ActivityKind; title: string; detail?: string; href?: string }[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const list = activity.filter((e) => filter === "all" || e.kind === filter || (filter === "social" && (e.kind === "instagram" || e.kind === "facebook")));
  return (
    <div>
      <div className="mb-6">
        <Segmented label="Filter activity" value={filter} onChange={setFilter} options={filters} />
      </div>
      {list.length === 0 ? (
        <EmptyState title="No activity yet">Once a service is active, everything it does is recorded here.</EmptyState>
      ) : (
        <div className="space-y-8">
          {byDay(list, (e) => e.at).map(([day, events]) => (
            <section key={day} aria-label={day}>
              <h2 className="eyebrow mb-3">{day}</h2>
              <ol className="relative space-y-1 border-l border-white/[0.08] pl-5">
                {events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute top-5 -left-[1.4rem] size-2 rounded-full bg-white/20" aria-hidden />
                    <Link href={e.href ?? "#"} className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-white/[0.04]">
                      <KindIcon kind={e.kind} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="text-fg-subtle">{fmtTime(e.at)} — </span>
                          {e.title}
                        </p>
                        {e.detail && <p className="mt-0.5 text-xs text-fg-subtle">{e.detail}</p>}
                      </div>
                      <span className="hidden text-[0.7rem] text-fg-subtle sm:block">{kindLabel(e.kind)}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ActivityPage() {
  const ws = useWorkspace();
  const [tab, setTab] = useState<Tab>("posts");
  if (!ws) return null;

  return (
    <div>
      <PageHeader eyebrow="Activity Centre" title="Activity" subtitle="Every photo, reel and video IBAX made or posted on Instagram, Facebook and YouTube — and the full history of your business." />
      <div className="mb-5">
        <Segmented label="Show" value={tab} onChange={setTab} options={tabs} />
      </div>
      {tab === "posts" && <PostsHistory content={ws.content} />}
      {tab === "images" && <ImagesHistory chat={ws.chat} />}
      {tab === "all" && <Timeline activity={ws.activity} />}
    </div>
  );
}
