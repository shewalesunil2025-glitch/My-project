-- ============================================================================
-- Veer Cinema — schema, row level security and booking RPCs
-- Run in the Supabase SQL editor (or `supabase db push`), then run seed.sql.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type rank_category as enum ('OFFRS', 'JCOS', 'ORS');
  create type verification_status as enum ('verified', 'pending', 'rejected');
  create type movie_status as enum ('now_showing', 'upcoming', 'archived');
  create type show_status as enum ('scheduled', 'cancelled');
  create type booking_status as enum ('held', 'confirmed', 'cancelled', 'expired', 'payment_failed');
  create type payment_method as enum ('counter', 'upi', 'card');
  create type payment_status as enum ('unpaid', 'paid', 'pay_at_counter', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- People
--   users            → Supabase `auth.users` (managed by Supabase Auth)
--   profiles         → one row per auth user
--   admin_users      → who may use the admin console
--   army_verifications → audit trail of every verification decision
--   service_registry_demo → MOCK registry used by the prototype only
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 60),
  rank_title text not null default '',
  service_id text not null unique,
  rank_category rank_category not null,
  unit text,
  mobile text not null unique check (mobile ~ '^[6-9][0-9]{9}$'),
  email text not null unique,
  verification verification_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.service_registry_demo (
  service_id text primary key,
  full_name text not null,
  rank_title text not null,
  rank_category rank_category not null,
  unit text
);

create table if not exists public.army_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  service_id text not null,
  status verification_status not null,
  method text not null default 'demo_registry',
  note text,
  decided_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tagline text,
  description text not null default '',
  genres text[] not null default '{}',
  language text not null default '',
  duration_min int not null check (duration_min between 1 and 400),
  certification text not null default 'UA',
  score numeric(3, 1) check (score between 0 and 10),
  release_date date not null,
  director text not null default '',
  cast_members text[] not null default '{}',
  poster_url text,
  trailer_url text,
  status movie_status not null default 'upcoming',
  featured boolean not null default false,
  palette text[] not null default '{"#1e3a5f","#050b18"}',
  created_at timestamptz not null default now()
);

create table if not exists public.theatres (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  location text not null default '',
  city text not null default '',
  description text not null default '',
  facilities text[] not null default '{}',
  layout_key text not null default 'compact',
  -- {"0":["14:30","18:30"], "1":["18:30"], ... } (0 = Sunday)
  weekly_schedule jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.screens (
  id uuid primary key default gen_random_uuid(),
  theatre_id uuid not null references public.theatres (id) on delete cascade,
  name text not null default 'Main Hall',
  layout_key text not null
);

create table if not exists public.seats (
  screen_id uuid not null references public.screens (id) on delete cascade,
  code text not null,                       -- e.g. ORS-A12
  row_label text not null,
  seat_number int not null,
  category rank_category not null,
  seat_type text check (seat_type in ('family', 'single')),
  blocked_reason text check (blocked_reason in ('reserved', 'media')),
  primary key (screen_id, code)
);

create table if not exists public.shows (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies (id) on delete restrict,
  theatre_id uuid not null references public.theatres (id) on delete restrict,
  screen_id uuid not null references public.screens (id) on delete restrict,
  show_date date not null,
  show_time time not null,
  price_offrs int not null default 150 check (price_offrs between 0 and 5000),
  price_jcos int not null default 100 check (price_jcos between 0 and 5000),
  price_ors int not null default 70 check (price_ors between 0 and 5000),
  status show_status not null default 'scheduled',
  created_at timestamptz not null default now()
);
create unique index if not exists shows_one_per_slot
  on public.shows (screen_id, show_date, show_time) where status = 'scheduled';
create index if not exists shows_by_date on public.shows (show_date, theatre_id);

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
create sequence if not exists public.booking_code_seq start 1000;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  code text unique,                         -- ARM-2026-001234 (set on confirmation)
  user_id uuid references public.profiles (id) on delete set null,
  show_id uuid not null references public.shows (id) on delete restrict,
  category rank_category not null,
  seat_codes text[] not null,               -- snapshot for history
  unit_price int not null,
  subtotal int not null,
  fee int not null default 0,
  total int not null,
  status booking_status not null default 'held',
  payment_method payment_method,
  payment_status payment_status not null default 'unpaid',
  payment_ref text,
  mobile text not null,
  week_start date not null,                 -- Friday of the show's Fri–Thu week
  source text not null default 'online' check (source in ('online', 'counter')),
  guest_name text,
  hold_expires_at timestamptz,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);
create index if not exists bookings_by_user on public.bookings (user_id, created_at desc);
create index if not exists bookings_by_show on public.bookings (show_id);

-- One confirmed booking per mobile number per week — enforced by the database.
create unique index if not exists bookings_one_per_mobile_per_week
  on public.bookings (mobile, week_start) where status = 'confirmed';

-- A row exists only while the seat is held or confirmed. The primary key makes
-- double booking of the same seat for the same show impossible.
create table if not exists public.booking_seats (
  show_id uuid not null references public.shows (id) on delete restrict,
  seat_code text not null,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  primary key (show_id, seat_code)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  method payment_method not null,
  amount int not null,
  status payment_status not null,
  gateway_ref text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

create or replace function public.week_start_of(d date) returns date
language sql immutable as $$
  select d - ((extract(dow from d)::int - 5 + 7) % 7);
$$;

-- Releases seats of holds that have timed out.
create or replace function public.sweep_expired_holds() returns void
language plpgsql security definer set search_path = public as $$
begin
  with expired as (
    update bookings set status = 'expired'
     where status = 'held' and hold_expires_at < now()
    returning id
  )
  delete from booking_seats where booking_id in (select id from expired);
end $$;

-- ---------------------------------------------------------------------------
-- Verification (demo registry — no real military database is connected)
-- ---------------------------------------------------------------------------
create or replace function public.check_service_record(p_service_id text, p_full_name text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  r service_registry_demo;
  sid text := upper(regexp_replace(p_service_id, '\s', '', 'g'));
begin
  if sid !~ '^(IC-[0-9]{5}[A-Z]|JC-[0-9]{6}[A-Z]|[0-9]{8}[A-Z])$' then
    return jsonb_build_object('status', 'rejected', 'message', 'This doesn''t look like a valid Service ID format.');
  end if;
  select * into r from service_registry_demo where service_id = sid;
  if not found then
    return jsonb_build_object('status', 'pending', 'message', 'We couldn''t auto-verify this Service ID. Your account will be reviewed by the station admin.');
  end if;
  if lower(regexp_replace(r.full_name, '[^a-zA-Z]', '', 'g')) <> lower(regexp_replace(p_full_name, '[^a-zA-Z]', '', 'g')) then
    return jsonb_build_object('status', 'rejected', 'message', 'The name doesn''t match the service record for this ID.');
  end if;
  return jsonb_build_object('status', 'verified', 'rankTitle', r.rank_title, 'rankCategory', r.rank_category,
                            'message', 'Service details verified (demo registry).');
end $$;

-- Creates the profile when someone signs up (metadata comes from the sign-up form).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := new.raw_user_meta_data;
  sid text := upper(regexp_replace(coalesce(meta ->> 'service_id', ''), '\s', '', 'g'));
  result jsonb;
  reg service_registry_demo;
begin
  if sid = '' then return new; end if;
  result := check_service_record(sid, meta ->> 'full_name');
  if result ->> 'status' = 'rejected' then
    raise exception 'VERIFICATION_FAILED';
  end if;
  select * into reg from service_registry_demo where service_id = sid;
  insert into profiles (id, full_name, rank_title, service_id, rank_category, unit, mobile, email, verification)
  values (
    new.id, meta ->> 'full_name', coalesce(reg.rank_title, ''), sid,
    coalesce(reg.rank_category, case when sid like 'IC-%' then 'OFFRS' when sid like 'JC-%' then 'JCOS' else 'ORS' end::rank_category),
    reg.unit, meta ->> 'mobile', lower(new.email), (result ->> 'status')::verification_status
  );
  insert into army_verifications (user_id, service_id, status, note)
  values (new.id, sid, (result ->> 'status')::verification_status, result ->> 'message');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets users log in with Service ID or mobile instead of email.
-- NOTE: add rate limiting (e.g. an Edge Function) before production use.
create or replace function public.resolve_login_email(p_identifier text) returns text
language sql stable security definer set search_path = public as $$
  select email from profiles
   where service_id = upper(regexp_replace(p_identifier, '\s', '', 'g'))
      or mobile = right(regexp_replace(p_identifier, '\D', '', 'g'), 10)
      or email = lower(trim(p_identifier))
   limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Booking RPCs (all checks happen inside one transaction)
-- ---------------------------------------------------------------------------
create or replace function public.occupied_seats(p_show_id uuid) returns setof text
language sql stable security definer set search_path = public as $$
  select bs.seat_code from booking_seats bs
    join bookings b on b.id = bs.booking_id
   where bs.show_id = p_show_id
     and (b.status = 'confirmed' or (b.status = 'held' and b.hold_expires_at > now()));
$$;

create or replace function public.show_seat_counts(p_show_ids uuid[])
returns table (show_id uuid, total int, taken int)
language sql stable security definer set search_path = public as $$
  select s.id,
         (select count(*) from seats st where st.screen_id = s.screen_id and st.blocked_reason is null)::int,
         (select count(*) from booking_seats bs join bookings b on b.id = bs.booking_id
           where bs.show_id = s.id and (b.status = 'confirmed' or (b.status = 'held' and b.hold_expires_at > now())))::int
    from shows s where s.id = any (p_show_ids);
$$;

create or replace function public.hold_seats(p_show_id uuid, p_seats text[])
returns bookings language plpgsql security definer set search_path = public as $$
declare
  me profiles;
  s shows;
  cat rank_category;
  n int := coalesce(array_length(p_seats, 1), 0);
  price int;
  b bookings;
begin
  perform sweep_expired_holds();
  select * into me from profiles where id = auth.uid();
  if not found then raise exception 'AUTH_REQUIRED'; end if;
  if me.verification <> 'verified' then raise exception 'NOT_VERIFIED'; end if;

  select * into s from shows where id = p_show_id;
  if not found or s.status <> 'scheduled' or (s.show_date + s.show_time) <= (now() at time zone 'Asia/Kolkata') then
    raise exception 'SHOW_UNAVAILABLE';
  end if;
  if n = 0 then raise exception 'VALIDATION'; end if;
  if n > 4 then raise exception 'MAX_SEATS'; end if;

  -- every seat must exist, be bookable and share one category
  if (select count(*) from seats where screen_id = s.screen_id and code = any (p_seats) and blocked_reason is null) <> n then
    raise exception 'VALIDATION';
  end if;
  select min(category::text)::rank_category into cat from seats where screen_id = s.screen_id and code = any (p_seats);
  if (select count(distinct category) from seats where screen_id = s.screen_id and code = any (p_seats)) > 1 then
    raise exception 'VALIDATION';
  end if;
  if cat <> me.rank_category and not is_admin() then raise exception 'CATEGORY_NOT_ALLOWED'; end if;

  -- drop this user's previous unfinished hold
  update bookings set status = 'cancelled' where user_id = me.id and status = 'held';
  delete from booking_seats where booking_id in (select id from bookings where user_id = me.id and status = 'cancelled' and code is null);

  if exists (select 1 from bookings where mobile = me.mobile and week_start = week_start_of(s.show_date) and status = 'confirmed') then
    raise exception 'WEEKLY_LIMIT';
  end if;

  price := case cat when 'OFFRS' then s.price_offrs when 'JCOS' then s.price_jcos else s.price_ors end;
  insert into bookings (user_id, show_id, category, seat_codes, unit_price, subtotal, fee, total, status,
                        mobile, week_start, hold_expires_at)
  values (me.id, s.id, cat, p_seats, price, price * n, 0, price * n, 'held',
          me.mobile, week_start_of(s.show_date), now() + interval '10 minutes')
  returning * into b;

  begin
    insert into booking_seats (show_id, seat_code, booking_id)
    select s.id, unnest(p_seats), b.id;
  exception when unique_violation then
    raise exception 'SEAT_TAKEN';
  end;
  return b;
end $$;

-- PROTOTYPE: trusts the client's payment result. In production call this only
-- from a server (Edge Function / webhook) after verifying the gateway signature.
create or replace function public.confirm_booking(p_booking_id uuid, p_method payment_method, p_reference text, p_paid boolean)
returns bookings language plpgsql security definer set search_path = public as $$
declare b bookings;
begin
  select * into b from bookings where id = p_booking_id and user_id = auth.uid() for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if b.status = 'confirmed' then return b; end if;
  if b.status <> 'held' or b.hold_expires_at < now() then
    update bookings set status = 'expired' where id = b.id and status = 'held';
    delete from booking_seats where booking_id = b.id;
    raise exception 'HOLD_EXPIRED';
  end if;
  begin
    update bookings set
      status = 'confirmed',
      code = 'ARM-' || extract(year from now())::int || '-' || lpad(nextval('booking_code_seq')::text, 6, '0'),
      payment_method = p_method,
      payment_status = case when p_method = 'counter' then 'pay_at_counter' when p_paid then 'paid' else 'unpaid' end,
      payment_ref = p_reference,
      hold_expires_at = null
    where id = b.id returning * into b;
  exception when unique_violation then
    raise exception 'WEEKLY_LIMIT';
  end;
  insert into payments (booking_id, method, amount, status, gateway_ref)
  values (b.id, p_method, b.total, b.payment_status, p_reference);
  return b;
end $$;

create or replace function public.release_hold(p_booking_id uuid, p_reason booking_status default 'cancelled')
returns void language plpgsql security definer set search_path = public as $$
begin
  update bookings set status = case when p_reason = 'payment_failed' then 'payment_failed'::booking_status else 'cancelled'::booking_status end
   where id = p_booking_id and user_id = auth.uid() and status = 'held';
  delete from booking_seats where booking_id = p_booking_id
     and exists (select 1 from bookings where id = p_booking_id and status <> 'held' and status <> 'confirmed');
end $$;

create or replace function public.cancel_booking(p_booking_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare b bookings; s shows;
begin
  select * into b from bookings where id = p_booking_id for update;
  if not found or (b.user_id is distinct from auth.uid() and not is_admin()) then raise exception 'NOT_FOUND'; end if;
  if b.status <> 'confirmed' then raise exception 'VALIDATION'; end if;
  select * into s from shows where id = b.show_id;
  if (s.show_date + s.show_time) <= (now() at time zone 'Asia/Kolkata') and not is_admin() then
    raise exception 'VALIDATION';
  end if;
  update bookings set status = 'cancelled', cancelled_at = now(),
         payment_status = case when payment_status = 'paid' then 'refunded'::payment_status else payment_status end
   where id = b.id;
  delete from booking_seats where booking_id = b.id;   -- frees the seats
end $$;

-- Cancels a show and all its bookings (admin).
create or replace function public.cancel_show(p_show_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  update shows set status = 'cancelled' where id = p_show_id;
  update bookings set status = 'cancelled', cancelled_at = now(),
         payment_status = case when payment_status = 'paid' then 'refunded'::payment_status else payment_status end
   where show_id = p_show_id and status in ('held', 'confirmed');
  delete from booking_seats where show_id = p_show_id;
end $$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.service_registry_demo enable row level security;
alter table public.army_verifications enable row level security;
alter table public.movies enable row level security;
alter table public.theatres enable row level security;
alter table public.screens enable row level security;
alter table public.seats enable row level security;
alter table public.shows enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_seats enable row level security;
alter table public.payments enable row level security;

-- Profiles: users see and edit their own; admins see all and set verification.
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update using (id = auth.uid() or public.is_admin());

-- Users may only change harmless fields on their own profile.
create or replace function public.protect_profile_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    new.service_id := old.service_id;
    new.rank_category := old.rank_category;
    new.rank_title := old.rank_title;
    new.verification := old.verification;
    new.mobile := old.mobile;
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

drop policy if exists admin_users_read on public.admin_users;
create policy admin_users_read on public.admin_users for select using (user_id = auth.uid() or public.is_admin());

-- Registry: no direct access at all (only via check_service_record).
drop policy if exists verifications_read on public.army_verifications;
create policy verifications_read on public.army_verifications for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists verifications_admin_write on public.army_verifications;
create policy verifications_admin_write on public.army_verifications for insert with check (public.is_admin());

-- Catalogue: public read, admin write.
do $$
declare t text;
begin
  foreach t in array array['movies', 'theatres', 'screens', 'seats', 'shows'] loop
    execute format('drop policy if exists %1$s_public_read on public.%1$s', t);
    execute format('create policy %1$s_public_read on public.%1$s for select using (true)', t);
    execute format('drop policy if exists %1$s_admin_write on public.%1$s', t);
    execute format('create policy %1$s_admin_write on public.%1$s for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Bookings: owners read their own; all writes go through the RPCs above.
drop policy if exists bookings_owner_read on public.bookings;
create policy bookings_owner_read on public.bookings for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists booking_seats_admin_read on public.booking_seats;
create policy booking_seats_admin_read on public.booking_seats for select using (public.is_admin());
drop policy if exists payments_owner_read on public.payments;
create policy payments_owner_read on public.payments for select
  using (public.is_admin() or exists (select 1 from bookings b where b.id = booking_id and b.user_id = auth.uid()));

-- Only the RPCs may be called by the browser roles.
revoke all on function public.sweep_expired_holds() from public, anon, authenticated;
grant execute on function public.check_service_record(text, text) to anon, authenticated;
grant execute on function public.resolve_login_email(text) to anon, authenticated;
grant execute on function public.occupied_seats(uuid) to anon, authenticated;
grant execute on function public.show_seat_counts(uuid[]) to anon, authenticated;
grant execute on function public.hold_seats(uuid, text[]) to authenticated;
grant execute on function public.confirm_booking(uuid, payment_method, text, boolean) to authenticated;
grant execute on function public.release_hold(uuid, booking_status) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.cancel_show(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for posters (public read, admin write)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('posters', 'posters', true)
on conflict (id) do nothing;

drop policy if exists posters_public_read on storage.objects;
create policy posters_public_read on storage.objects for select using (bucket_id = 'posters');
drop policy if exists posters_admin_write on storage.objects;
create policy posters_admin_write on storage.objects for insert with check (bucket_id = 'posters' and public.is_admin());
drop policy if exists posters_admin_delete on storage.objects;
create policy posters_admin_delete on storage.objects for delete using (bucket_id = 'posters' and public.is_admin());
