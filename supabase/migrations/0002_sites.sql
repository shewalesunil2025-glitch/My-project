-- ibaxai — client websites built in the app and their enquiries.
-- Run once in Supabase → SQL Editor (after 0001_init.sql). Safe to re-run.

-- Published websites, public at www.ibaxai.com/s/<slug>. One per owner.
create table if not exists public.sites (
  slug text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  data jsonb not null,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enquiries sent from a published site's form (written only by the server).
create table if not exists public.site_leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  name text not null,
  phone text not null default '',
  message text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists site_leads_owner_idx on public.site_leads (owner_id, created_at desc);

alter table public.sites enable row level security;
alter table public.site_leads enable row level security;

-- Anyone can read a published site; only its owner can publish, change or remove it.
drop policy if exists "sites: public read" on public.sites;
create policy "sites: public read" on public.sites for select to anon, authenticated using (true);
drop policy if exists "sites: owner insert" on public.sites;
create policy "sites: owner insert" on public.sites for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists "sites: owner update" on public.sites;
create policy "sites: owner update" on public.sites for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists "sites: owner delete" on public.sites;
create policy "sites: owner delete" on public.sites for delete to authenticated using (owner_id = (select auth.uid()));

-- Owners read and clear their own enquiries.
drop policy if exists "site leads: owner read" on public.site_leads;
create policy "site leads: owner read" on public.site_leads for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "site leads: owner delete" on public.site_leads;
create policy "site leads: owner delete" on public.site_leads for delete to authenticated using (owner_id = (select auth.uid()));

grant select on public.sites to anon, authenticated;
grant insert, update, delete on public.sites to authenticated;
revoke all on public.site_leads from anon;
grant select, delete on public.site_leads to authenticated;

drop trigger if exists sites_touch on public.sites;
create trigger sites_touch before update on public.sites
  for each row execute function public.touch_updated_at();
