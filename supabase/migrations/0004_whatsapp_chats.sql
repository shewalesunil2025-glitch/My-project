-- ibaxai — WhatsApp chats in the app: who owns each linked number, every message, and each customer.
-- Run once in Supabase → SQL Editor (after 0003_followups.sql). Safe to re-run.

-- Which account linked which WhatsApp (Evolution instance `ibax-<digits>`). Written by the server.
create table if not exists public.wa_instances (
  instance text primary key check (instance ~ '^ibax-[0-9]{8,15}$'),
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists wa_instances_owner_idx on public.wa_instances (owner_id);

-- Every WhatsApp message: from the customer (in), IBAX's reply (out) or the owner from the app (owner).
create table if not exists public.wa_messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  instance text not null,
  phone text not null,
  name text not null default '',
  direction text not null check (direction in ('in', 'out', 'owner')),
  text text not null default '',
  intent text not null default '',
  needs_human boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists wa_messages_owner_idx on public.wa_messages (owner_id, created_at desc);

-- One row per customer who wrote: IBAX's read on how ready they are to buy.
create table if not exists public.wa_contacts (
  owner_id uuid not null references auth.users (id) on delete cascade,
  instance text not null,
  phone text not null,
  name text not null default '',
  -- hot: ready to buy · warm: interested · cold: just asking
  lead_temp text not null default 'warm' check (lead_temp in ('hot', 'warm', 'cold')),
  interest text not null default '',
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  primary key (instance, phone)
);
create index if not exists wa_contacts_owner_idx on public.wa_contacts (owner_id, last_at desc);

alter table public.wa_instances enable row level security;
alter table public.wa_messages enable row level security;
alter table public.wa_contacts enable row level security;

-- Owners read their own; only the server writes.
drop policy if exists "wa messages: owner read" on public.wa_messages;
create policy "wa messages: owner read" on public.wa_messages for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "wa contacts: owner read" on public.wa_contacts;
create policy "wa contacts: owner read" on public.wa_contacts for select to authenticated using (owner_id = (select auth.uid()));

revoke all on public.wa_instances from anon, authenticated;
revoke all on public.wa_messages from anon;
revoke all on public.wa_contacts from anon;
grant select on public.wa_messages to authenticated;
grant select on public.wa_contacts to authenticated;
