-- ibaxai — Lead Follow-up: the WhatsApp follow-up queue for each owner's new leads.
-- Run once in Supabase → SQL Editor (after 0002_sites.sql). Safe to re-run.

-- One row per lead (per owner and phone number). Written only by the server.
create table if not exists public.followups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  -- The owner's linked WhatsApp (Evolution instance `ibax-<digits>`) the messages go from.
  instance text not null,
  -- The lead's id in the app (e.g. `site-<uuid>`), when known.
  lead_ref text not null default '',
  name text not null default '',
  -- Digits with country code.
  phone text not null check (phone ~ '^[0-9]{8,15}$'),
  interest text not null default '',
  source text not null default '',
  -- waiting: messages still to send · replied: the lead answered · done: every message sent
  -- stopped: the owner marked the lead converted or lost · failed: WhatsApp couldn't deliver
  state text not null default 'waiting' check (state in ('waiting', 'replied', 'done', 'stopped', 'failed')),
  steps_sent int not null default 0,
  next_at timestamptz,
  last_sent_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, phone)
);
create index if not exists followups_due_idx on public.followups (state, next_at);
create index if not exists followups_instance_idx on public.followups (instance, phone);

-- When each owner last got their morning "call these leads today" message.
create table if not exists public.followup_summaries (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  last_sent_on date not null
);

alter table public.followups enable row level security;
alter table public.followup_summaries enable row level security;

-- Owners can see their own follow-ups; only the server writes.
drop policy if exists "followups: owner read" on public.followups;
create policy "followups: owner read" on public.followups for select to authenticated using (owner_id = (select auth.uid()));

revoke all on public.followups from anon;
revoke all on public.followup_summaries from anon, authenticated;
grant select on public.followups to authenticated;

drop trigger if exists followups_touch on public.followups;
create trigger followups_touch before update on public.followups
  for each row execute function public.touch_updated_at();
