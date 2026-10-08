-- IBAX AI — first database schema.
-- Run once in Supabase → SQL Editor. Safe to re-run.

-- 1. Profile: one row per signed-up user (filled from the sign-up form).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  country text not null default '',
  created_at timestamptz not null default now()
);

-- 2. Workspace: the client's business, automations, leads and settings.
--    Stored as one JSON document per owner, the same shape the app already uses.
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Subscriptions: written only by the server after a verified payment,
--    so a client can read theirs but never create or change one.
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  service_id text not null,
  period text not null check (period in ('monthly', 'annual', 'one-time')),
  price numeric(10, 2) not null,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  started_at timestamptz not null default now(),
  renews_at timestamptz,
  payment_ref text
);
create index if not exists subscriptions_owner_idx on public.subscriptions (owner_id);

-- Row Level Security: every client sees only their own rows.
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "own profile: read" on public.profiles;
create policy "own profile: read" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
drop policy if exists "own profile: update" on public.profiles;
create policy "own profile: update" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "own workspace: read" on public.workspaces;
create policy "own workspace: read" on public.workspaces
  for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "own workspace: create" on public.workspaces;
create policy "own workspace: create" on public.workspaces
  for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists "own workspace: update" on public.workspaces;
create policy "own workspace: update" on public.workspaces
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists "own subscriptions: read" on public.subscriptions;
create policy "own subscriptions: read" on public.subscriptions
  for select to authenticated using (owner_id = (select auth.uid()));

revoke all on public.profiles, public.workspaces, public.subscriptions from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.workspaces to authenticated;
grant select on public.subscriptions to authenticated;

-- Keep workspaces.updated_at current.
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists workspaces_touch on public.workspaces;
create trigger workspaces_touch before update on public.workspaces
  for each row execute function public.touch_updated_at();

-- On sign-up, create the profile and an empty workspace.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name, phone, country)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'country', '')
  )
  on conflict (id) do nothing;
  insert into public.workspaces (owner_id) values (new.id)
  on conflict (owner_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
