-- ibaxai — WhatsApp numbers linked through Meta's official WhatsApp Cloud API (Embedded Signup:
-- the client enters their number, confirms it with an OTP, and it is linked).
-- Run once in Supabase → SQL Editor (after 0005_whatsapp_reliability.sql). Safe to re-run.

-- One row per linked number. `instance` is the same `ibax-<digits>` name the Evolution links use,
-- so the chats, leads and n8n workflows work unchanged. The access token is encrypted by the server.
create table if not exists public.wa_cloud (
  instance text primary key check (instance ~ '^ibax-[0-9]{8,15}$'),
  owner_id uuid not null references auth.users (id) on delete cascade,
  waba_id text not null,
  phone_number_id text not null unique,
  display_phone text not null default '',
  verified_name text not null default '',
  -- true when the client keeps using the WhatsApp Business app on the same number
  coexistence boolean not null default false,
  token_enc text not null,
  pin_enc text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wa_cloud_owner_idx on public.wa_cloud (owner_id);

-- Only the server reads or writes it (the token never reaches the browser).
alter table public.wa_cloud enable row level security;
revoke all on public.wa_cloud from anon, authenticated;
