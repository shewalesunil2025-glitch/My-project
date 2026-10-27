-- ibaxai — AI Voice Calling (incoming calls): assistants, numbers, plans, subscriptions, calls, usage, provider events, audit log.
-- Run once in Supabase → SQL Editor (after 0007_ads.sql). Safe to re-run.
-- Everyone can read only their own rows; only the server writes. Packages (voice_plans) are readable by any signed-in user.

create table if not exists public.voice_plans (
  id text primary key,
  name text not null,
  -- NULL until the owner sets them from real costs: a plan with no minutes cannot be activated
  included_minutes integer check (included_minutes is null or included_minutes > 0),
  overage_inr_per_minute numeric(8, 2) check (overage_inr_per_minute is null or overage_inr_per_minute >= 0),
  -- hard cap on minutes in one month (no unlimited packages)
  hard_cap_minutes integer check (hard_cap_minutes is null or hard_cap_minutes > 0),
  active boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.voice_plans (id, name) values ('standard', 'Standard') on conflict (id) do nothing;

create table if not exists public.voice_assistants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null default 'IBAX',
  language text not null default 'hi' check (language in ('hi', 'en')),
  voice_gender text not null default 'female' check (voice_gender in ('female', 'male')),
  voice_id text not null default '',
  greeting text not null default '',
  style text not null default 'friendly',
  never_say text not null default '',
  transfer_number text not null default '',
  handoff text not null default '',
  -- the business facts the assistant may use: only what the owner typed
  knowledge jsonb not null default '{}'::jsonb,
  -- keep transcripts only when the owner agrees (off by default; no audio is ever kept by us)
  keep_transcripts boolean not null default false,
  -- the provider's assistant id when one is used (the dynamic mode builds the assistant per call)
  provider_assistant_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.voice_phone_numbers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  -- ibaxai sets the number up ('new'), or the client forwards their own number ('forwarding')
  kind text not null default 'new' check (kind in ('new', 'forwarding')),
  existing_number text not null default '',
  carrier text not null default '',
  number text,
  provider text not null default 'vapi',
  provider_number_id text,
  status text not null default 'requested' check (status in (
    'requested', 'awaiting_customer_info', 'awaiting_verification', 'configuration_in_progress', 'ready_for_testing', 'active', 'failed'
  )),
  -- an admin marks this after a real test call; Active needs it
  test_passed_at timestamptz,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists voice_numbers_owner_idx on public.voice_phone_numbers (owner_id);
create unique index if not exists voice_numbers_provider_id_idx on public.voice_phone_numbers (provider_number_id) where provider_number_id is not null;
create unique index if not exists voice_numbers_number_idx on public.voice_phone_numbers (number) where number is not null;

create table if not exists public.voice_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  plan_id text not null references public.voice_plans (id),
  -- the plan's minutes when this started (a later edit of the plan does not change a running month)
  included_minutes integer not null check (included_minutes > 0),
  overage_inr_per_minute numeric(8, 2),
  hard_cap_minutes integer,
  -- monthly windows are counted from here
  started_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'suspended', 'cancelled')),
  -- the owner turned the assistant off
  paused boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.voice_calls (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  number_id uuid references public.voice_phone_numbers (id) on delete set null,
  -- one row per provider call: a repeated webhook cannot make a second one
  provider_call_id text not null unique,
  caller text not null default '',
  started_at timestamptz,
  ended_at timestamptz,
  duration_sec integer not null default 0,
  ended_reason text not null default '',
  outcome text not null default 'answered' check (outcome in ('answered', 'appointment', 'lead', 'transferred', 'missed')),
  summary text not null default '',
  -- only when the owner turned transcripts on
  transcript text,
  cost_usd numeric(10, 4),
  created_at timestamptz not null default now()
);
create index if not exists voice_calls_owner_idx on public.voice_calls (owner_id, created_at desc);

create table if not exists public.voice_usage_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  -- unique per call: the same call can never be counted twice
  call_id uuid not null unique references public.voice_calls (id) on delete cascade,
  duration_sec integer not null default 0,
  -- seconds rounded up to the next full minute (what is taken from the package)
  billable_sec integer not null default 0,
  occurred_at timestamptz not null default now()
);
create index if not exists voice_usage_owner_idx on public.voice_usage_records (owner_id, occurred_at);

create table if not exists public.voice_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'vapi',
  -- provider + call id + event type: a repeat of the same event is ignored
  event_key text not null unique,
  type text not null,
  owner_id uuid references auth.users (id) on delete set null,
  -- a small, redacted summary (no audio, no transcript)
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'received',
  created_at timestamptz not null default now()
);

create table if not exists public.voice_audit (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete set null,
  actor text not null default '',
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists voice_audit_owner_idx on public.voice_audit (owner_id, created_at desc);

alter table public.voice_plans enable row level security;
alter table public.voice_assistants enable row level security;
alter table public.voice_phone_numbers enable row level security;
alter table public.voice_subscriptions enable row level security;
alter table public.voice_calls enable row level security;
alter table public.voice_usage_records enable row level security;
alter table public.voice_provider_events enable row level security;
alter table public.voice_audit enable row level security;

drop policy if exists "voice plans: read" on public.voice_plans;
create policy "voice plans: read" on public.voice_plans for select to authenticated using (active);
drop policy if exists "own voice assistant: read" on public.voice_assistants;
create policy "own voice assistant: read" on public.voice_assistants for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "own voice numbers: read" on public.voice_phone_numbers;
create policy "own voice numbers: read" on public.voice_phone_numbers for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "own voice subscription: read" on public.voice_subscriptions;
create policy "own voice subscription: read" on public.voice_subscriptions for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "own voice calls: read" on public.voice_calls;
create policy "own voice calls: read" on public.voice_calls for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "own voice usage: read" on public.voice_usage_records;
create policy "own voice usage: read" on public.voice_usage_records for select to authenticated using (owner_id = (select auth.uid()));
-- voice_provider_events and voice_audit: no policy at all, so only the server (service key) can read them.

revoke all on public.voice_plans, public.voice_assistants, public.voice_phone_numbers, public.voice_subscriptions, public.voice_calls,
  public.voice_usage_records, public.voice_provider_events, public.voice_audit from anon;
revoke all on public.voice_provider_events, public.voice_audit from authenticated;
grant select on public.voice_plans, public.voice_assistants, public.voice_phone_numbers, public.voice_subscriptions, public.voice_calls, public.voice_usage_records to authenticated;
