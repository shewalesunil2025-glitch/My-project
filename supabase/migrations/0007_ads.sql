-- ibaxai — AI Ads (Facebook + Instagram): campaigns, creatives, payments and an audit log.
-- Run once in Supabase → SQL Editor (after 0006_whatsapp_cloud.sql). Safe to re-run.
-- Everyone can read only their own rows; only the server writes.

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  -- the browser makes this once per "new ad", so a retried request never makes a second campaign
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 64),
  name text not null default '',
  objective text not null,
  platforms text not null check (platforms in ('facebook', 'instagram', 'both')),
  language text not null default 'en' check (language in ('en', 'hi', 'both')),
  offer text not null default '',
  areas jsonb not null default '[]'::jsonb,
  daily_budget_inr integer not null check (daily_budget_inr > 0),
  days integer not null check (days between 1 and 90),
  start_date date not null,
  end_date date not null,
  -- the business details used for the ad text, as they were when the campaign was made
  business jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in (
    'draft', 'creatives_ready', 'awaiting_approval', 'awaiting_payment', 'paid', 'ready_to_launch',
    'submitted', 'active', 'paused', 'completed', 'rejected', 'failed'
  )),
  -- what the client is asked to pay ibaxai (creatives only); the ad spend is paid to Meta by the client
  creative_fee_inr numeric(10, 2) not null default 0,
  tax_inr numeric(10, 2) not null default 0,
  spend_estimate_inr integer not null default 0,
  quote jsonb not null default '{}'::jsonb,
  -- ids the ad platform gave back (campaign, ad set, ad), filled only when it confirms them
  platform_ids jsonb not null default '{}'::jsonb,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, idempotency_key)
);
create index if not exists ad_campaigns_owner_idx on public.ad_campaigns (owner_id, created_at desc);

create table if not exists public.ad_creatives (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('copy', 'image', 'video')),
  language text not null default 'en' check (language in ('en', 'hi')),
  headline text not null default '',
  primary_text text not null default '',
  description text not null default '',
  cta text not null default 'LEARN_MORE',
  -- where the picture or video is stored (our own storage only)
  asset_url text not null default '',
  placement text not null default '',
  prompt text not null default '',
  approved boolean not null default false,
  -- what it cost ibaxai to make (kept apart from the ad spend)
  cost_inr numeric(10, 4) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ad_creatives_campaign_idx on public.ad_creatives (campaign_id);
create index if not exists ad_creatives_owner_day_idx on public.ad_creatives (owner_id, created_at desc);

create table if not exists public.ad_payments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  razorpay_order_id text not null,
  razorpay_payment_id text not null unique,
  amount_inr numeric(10, 2) not null,
  status text not null default 'paid',
  verified_at timestamptz not null default now()
);
create index if not exists ad_payments_owner_idx on public.ad_payments (owner_id, verified_at desc);

create table if not exists public.ad_events (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.ad_campaigns (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ad_events_campaign_idx on public.ad_events (campaign_id, created_at);

alter table public.ad_campaigns enable row level security;
alter table public.ad_creatives enable row level security;
alter table public.ad_payments enable row level security;
alter table public.ad_events enable row level security;

drop policy if exists "ad campaigns: owner read" on public.ad_campaigns;
create policy "ad campaigns: owner read" on public.ad_campaigns for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "ad creatives: owner read" on public.ad_creatives;
create policy "ad creatives: owner read" on public.ad_creatives for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "ad payments: owner read" on public.ad_payments;
create policy "ad payments: owner read" on public.ad_payments for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "ad events: owner read" on public.ad_events;
create policy "ad events: owner read" on public.ad_events for select to authenticated using (owner_id = (select auth.uid()));

revoke all on public.ad_campaigns, public.ad_creatives, public.ad_payments, public.ad_events from anon;
revoke insert, update, delete on public.ad_campaigns, public.ad_creatives, public.ad_payments, public.ad_events from authenticated;
grant select on public.ad_campaigns, public.ad_creatives, public.ad_payments, public.ad_events to authenticated;
