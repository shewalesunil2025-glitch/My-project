-- ibaxai — Autonomous Content Studio (the founder's own daily AI Reel / Short).
-- Run once in Supabase → SQL Editor (after 0008_voice.sql). Safe to re-run.
-- Only the server reads and writes these tables (founder dashboard goes through the server).

create table if not exists public.studio_jobs (
  id uuid primary key default gen_random_uuid(),
  -- India date the video is for; several attempts a day when the founder asks to regenerate
  day date not null,
  attempt integer not null default 1,
  status text not null default 'queued' check (status in (
    'queued', 'scripting', 'assets', 'awaiting_render', 'rendering',
    'ready_for_review', 'approved', 'publishing', 'published', 'partly_published', 'rejected', 'failed'
  )),
  -- what to avoid when regenerating (earlier topics of the day)
  avoid jsonb not null default '[]'::jsonb,
  research jsonb not null default '{}'::jsonb,
  topic text not null default '',
  script jsonb not null default '{}'::jsonb,
  instagram jsonb not null default '{}'::jsonb,
  youtube jsonb not null default '{}'::jsonb,
  -- storage paths in the private "studio" bucket
  thumbnail_path text,
  voice_path text,
  scene_paths jsonb not null default '[]'::jsonb,
  video_path text,
  render_claimed_at timestamptz,
  error text not null default '',
  tries integer not null default 0,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (day, attempt)
);
create index if not exists studio_jobs_day_idx on public.studio_jobs (day desc, attempt desc);

-- One row per job and platform: a second publish of the same job to the same platform is impossible.
create table if not exists public.studio_publish (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.studio_jobs (id) on delete cascade,
  platform text not null check (platform in ('instagram', 'youtube')),
  status text not null default 'pending' check (status in ('pending', 'uploading', 'processing', 'published', 'failed')),
  -- the platform's ids once it has them (container / media / video id), so a retry continues instead of posting again
  external jsonb not null default '{}'::jsonb,
  url text,
  attempts integer not null default 0,
  error text not null default '',
  updated_at timestamptz not null default now(),
  unique (job_id, platform)
);

create table if not exists public.studio_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.studio_jobs (id) on delete cascade,
  level text not null default 'info' check (level in ('info', 'warning', 'error')),
  message text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists studio_events_job_idx on public.studio_events (job_id, created_at desc);

alter table public.studio_jobs enable row level security;
alter table public.studio_publish enable row level security;
alter table public.studio_events enable row level security;
revoke all on public.studio_jobs, public.studio_publish, public.studio_events from anon, authenticated;

-- Private bucket for scripts' assets: images, voice, final video, thumbnail. Read only through short signed links.
insert into storage.buckets (id, name, public) values ('studio', 'studio', false) on conflict (id) do nothing;
