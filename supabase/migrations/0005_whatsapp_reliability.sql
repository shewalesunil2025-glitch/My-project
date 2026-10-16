-- ibaxai — WhatsApp reliability: no duplicate messages, bot on/off per customer, link health.
-- ADDITIVE ONLY (no drops, no deletes, no type changes). Run once in Supabase → SQL Editor
-- (after 0004_whatsapp_chats.sql). Safe to re-run.

-- Provider message id, so a retried workflow can never store (or answer) the same message twice.
alter table public.wa_messages add column if not exists msg_id text;
create unique index if not exists wa_messages_msg_id_uq on public.wa_messages (instance, msg_id) where msg_id is not null;

-- Whether a message really went out (a reply that failed to send is stored as 'failed', never shown as delivered).
alter table public.wa_messages add column if not exists delivery text not null default 'sent';

-- Bot status per customer (per linked number): "on", or "paused" after a hand-over / owner reply.
alter table public.wa_contacts add column if not exists bot_status text not null default 'on';
alter table public.wa_contacts add column if not exists needs_attention boolean not null default false;
alter table public.wa_contacts add column if not exists paused_at timestamptz;
alter table public.wa_contacts add column if not exists last_in_at timestamptz;
alter table public.wa_contacts add column if not exists last_owner_at timestamptz;
do $$ begin
  alter table public.wa_contacts add constraint wa_contacts_bot_status_chk check (bot_status in ('on', 'paused'));
exception when duplicate_object then null; end $$;

-- Link health, written by the hourly monitor (never "open" unless WhatsApp said so).
alter table public.wa_instances add column if not exists connection text not null default 'unknown';
alter table public.wa_instances add column if not exists checked_at timestamptz;
alter table public.wa_instances add column if not exists down_alerted boolean not null default false;
