# IBAXAI — Architecture

**IBAXAI** is the AI Business Operating System built by Nexa Flow AI. Business owners run their website, AI assistants, WhatsApp, calls, social media, reviews, content, leads and automations from one app. They never touch n8n, APIs, webhooks or video tools: IBAXAI handles those in the background.

> The brand name lives in one place: `src/config/product.ts`. The app and the assistant inside it are both called **IBAXAI**; customers choose its language, tone and personality. The `/app` routes use the live Nexa Flow AI look (deep green-black, neon lime `#7dff3a`, Inter Tight), set under `.theme-lumi` in `src/app/globals.css`. On iPhone, Safari → Share → "Add to Home Screen" installs it full-screen (`public/lumi.webmanifest`, icons in `public/lumi/`).

## What is in this repository today

The complete customer-facing app runs under `/app` (Next.js App Router). It is in **preview mode** (`product.previewMode = true`):

| Piece | Preview mode (now) | Production (replace with) |
| --- | --- | --- |
| Accounts & sessions | `localStorage` on the device, SHA-256 password hash | Auth service (e.g. Auth.js / Clerk / Supabase Auth) with httpOnly session cookies, Google & Apple OAuth, 2FA |
| Workspace data | One JSON workspace per user in `localStorage` (`src/lib/app/store.ts`) | Postgres, tenant-scoped (schema below) |
| Payments | "Confirm test payment"; invoices marked *test* | Stripe Checkout / Razorpay. The subscription is created by the payment webhook, not the browser |
| Account connections | Account name typed in, marked `simulated` | OAuth per platform. Tokens encrypted at rest |
| Automations | Status machine + logs in the workspace | n8n workflows (one template per service, one instance per workspace) triggered by the backend |
| Assistant | IBAX chat with action cards: Claude with tools via `/api/assistant` when `ANTHROPIC_API_KEY` is set, built-in activation conversation otherwise | Same, with the workspace context loaded server-side from the database |
| Sample workspace | "Sunrise Bistro", labelled *Sample workspace* on every screen | Keep as the public demo |

Nothing in preview mode pretends to be real. Test payments, simulated connections and sample data are labelled where they appear.

## Screens (blueprint → route)

| Blueprint section | Route |
| --- | --- |
| 01 Welcome / landing | `/app` |
| 02 Sign up / login | `/app/signup`, `/app/login` |
| 03 Business setup, 04 Create assistant | `/app/setup` (4 steps) |
| 05 Dashboard + "Ask … anything" | `/app/home` |
| 06 AI Assistant (chat) | `/app/assistant` |
| 07–13 Voice, WhatsApp, Instagram, Facebook, YouTube, Email, Reviews | `/app/services/[id]`, data in `/app/calls`, `/app/inbox`, `/app/content`, `/app/reviews` |
| 14 Website service | `/app/website` |
| 15 Digital Marketing (premium) | `/app/services/digital-marketing` |
| 16 Automation Store | `/app/services` |
| 17 Purchase flow | service → plan → `/checkout` → payment → setup wizard |
| 18 Service activation | `/app/automations/[id]` (connect → info → configure → test → approve & activate) |
| 19 Automation Control Centre | `/app/automations` |
| 20 Content Centre | `/app/content` (types + 14-day calendar) |
| 21 Activity Centre | `/app/activity` |
| 22 Leads & Customers | `/app/leads` |
| 23 Analytics | `/app/analytics` (Today / 7 / 30 days / custom, chart + table) |
| 24 Notifications | `/app/notifications` (+ preferences in Settings) |
| 25 Billing | `/app/billing` |
| 26 Settings | `/app/settings` (business, assistant, accounts, notifications, security, team roles, privacy, audit log) |
| 27 Help / support | `/app/help` (ask, guides, tickets) |
| 28 Demo | `/app/demo` (11-step walkthrough, always visible on mobile) |
| 29 Mobile navigation | Bottom bar: Home · *assistant name* · Services · Activity · More |

Services, prices, setup questions and connection requirements are data in `src/content/app/services.ts`. Prices are USD "starting at" amounts and match the website Automation Store (`src/content/shambhu.ts`): Website $299 one-time; AI Voice $79/mo; WhatsApp and Customer Support $49/mo; Lead Follow-up, Instagram, Facebook and YouTube $39/mo; Email and Google Reviews $29/mo; Digital Marketing $299/mo. Change both files together.

## Production backend

```
Customer (web / mobile)
        │  HTTPS, session cookie
        ▼
Next.js app + API routes  ──►  Postgres (tenant-scoped)      ──► audit log
        │                       Redis (queues, rate limits)
        │                       Object storage (logos, media, generated videos)
        ├──► Claude API (assistant, captions, scripts, review replies)
        ├──► Payment provider (Stripe / Razorpay) ◄── webhooks
        ├──► Secrets vault / KMS (encrypted OAuth tokens)
        └──► Automation runner (n8n, self-hosted, queue mode)
                 ├── WhatsApp Cloud API · Meta Graph (Instagram, Facebook)
                 ├── YouTube Data API · Gmail API · Google Business Profile API
                 ├── Voice provider (Twilio / Vapi-style SIP + LLM)
                 └── Video / image generation services
```

Activation is never instant by promise. It is **payment + account authorisation + business information + third-party approval** (rule 33). The wizard already models this. `approvalNote` on each service tells the owner what the platform still has to approve.

### Multi-tenancy

One customer → one workspace → one business → many services, integrations and automations.

- Every table carries `workspace_id`. Postgres **row-level security** enforces `workspace_id = current_setting('app.workspace_id')`, so a missed `WHERE` can never leak another customer's data.
- n8n workflows are created from per-service templates. Each instance gets the workspace id and only a short-lived token for that workspace. Customers never get n8n access.
- Webhooks from platforms (WhatsApp, Meta, Stripe) are verified by signature, mapped to a workspace through the connected account id, and then queued.

```sql
create table workspaces   (id uuid primary key, owner_id uuid not null, created_at timestamptz default now());
create table members      (workspace_id uuid references workspaces, user_id uuid, role text check (role in ('owner','manager','viewer')), primary key (workspace_id, user_id));
create table businesses   (workspace_id uuid primary key references workspaces, category text, name text, profile jsonb);
create table assistants   (workspace_id uuid primary key references workspaces, name text, language text, tone text, personality text, welcome text);
create table subscriptions(id uuid primary key, workspace_id uuid not null, service_id text, period text, price_cents int, status text, provider_ref text, renews_at timestamptz);
create table connections  (id uuid primary key, workspace_id uuid not null, provider text, account_ref text, token_ciphertext bytea, scopes text[], status text, connected_at timestamptz);
create table automations  (id uuid primary key, workspace_id uuid not null, service_id text, subscription_id uuid, status text, config jsonb, workflow_ref text);
create table automation_logs(id bigserial primary key, workspace_id uuid not null, automation_id uuid, level text, message text, at timestamptz default now());
create table activity     (id bigserial primary key, workspace_id uuid not null, kind text, title text, detail text, href text, at timestamptz default now());
create table leads        (id uuid primary key, workspace_id uuid not null, name text, phone text, email text, source text, interest text, status text, created_at timestamptz);
create table conversations(id uuid primary key, workspace_id uuid not null, channel text, contact text, last_at timestamptz);
create table messages     (id bigserial primary key, workspace_id uuid not null, conversation_id uuid, sender text, body text, at timestamptz);
create table calls        (id uuid primary key, workspace_id uuid not null, caller text, number text, duration_sec int, outcome text, summary text, at timestamptz);
create table reviews      (id uuid primary key, workspace_id uuid not null, author text, rating int, body text, reply text, at timestamptz);
create table content      (id uuid primary key, workspace_id uuid not null, type text, platform text, title text, body text, status text, scheduled_at timestamptz, published_at timestamptz, stats jsonb);
create table notifications(id bigserial primary key, workspace_id uuid not null, kind text, title text, detail text, href text, read boolean default false, at timestamptz);
create table invoices     (id uuid primary key, workspace_id uuid not null, number text, amount_cents int, provider_ref text, at timestamptz);
create table audit_log    (id bigserial primary key, workspace_id uuid not null, actor uuid, action text, at timestamptz default now());
-- + alter table … enable row level security; create policy tenant_isolation … using (workspace_id = current_setting('app.workspace_id')::uuid);
```

The TypeScript shapes in `src/lib/app/types.ts` map one-to-one onto these tables, so the UI can move from `localStorage` to API calls without changing screens.

### Security

- Passwords: Argon2id on the server (the preview's SHA-256 is device-only and must not be reused).
- OAuth tokens: envelope-encrypted with a KMS key per environment. They are never sent to the browser and are revoked on disconnect.
- Roles: owner (everything), manager (no billing / deletion), viewer (read-only), checked on every API route.
- Payments: card data only ever touches the payment provider's hosted checkout.
- Audit log for sign-ins, purchases, connections, settings changes and deletions.
- Privacy: export (JSON) and full deletion are already in Settings; the backend must cascade both to n8n and object storage.
- AI: Claude gets only the current workspace's context. The system prompt forbids inventing numbers and fake reviews.

### Scaling 10 → 100 → 1,000+ customers

- Stateless Next.js on serverless or containers. All state lives in Postgres, Redis and object storage.
- n8n in **queue mode** (main + workers on Redis). Add workers as automation volume grows. Heavy jobs such as video generation go to a separate queue with concurrency limits per workspace.
- Per-workspace rate limits and fair scheduling, so one busy customer can't starve the rest.
- Read replicas and `(workspace_id, at)` indexes on activity, messages and logs. Partition by month when those tables get large.
- Per-provider quota tracking (YouTube upload quota, WhatsApp messaging tiers), surfaced as "Needs attention" in the Control Centre.

## Assistant (IBAX) — talks and takes action

IBAX is on every workspace screen as a round robot button (`IbaxLauncher`), like on the website, and full screen at `/app/assistant`. Both show the same conversation (`IbaxChat`): typing or the mic (browser speech), answers read aloud when the question was spoken, and **action cards** inside the chat.

The owner can buy and switch on any service just by chatting — "Mujhe WhatsApp automation chahiye":

1. IBAX names the service and price and shows a **payment card** (preview mode: test payment; production: the payment provider's checkout).
2. After payment, IBAX asks only for the details the service still needs (business-profile values are pre-filled) and saves them.
3. It shows a **connect card** for the account the service needs (WhatsApp Business number; production: Meta Embedded Signup).
4. It tests and activates the service and hands it to the automation backend (`POST /api/automation/activate`).

How it runs:

- `src/lib/app/agentActions.ts` — the actions (buy, save details, connect, activate, pause/resume). The Services checkout uses the same `buyService`, so chat and screens stay identical.
- `POST /api/assistant` — one turn of Claude (`claude-opus-5-5`, low effort, server-side refusal fallback) with IBAX's instructions, the service catalogue and its tools (`src/lib/app/agentSpec.ts`). The app (`src/lib/app/agentClient.ts`) sends the conversation plus a workspace snapshot, carries out the tool calls on the owner's workspace and sends the results back until IBAX has answered. Requires `ANTHROPIC_API_KEY`.
- Without the key (route returns `503`), `src/lib/app/agentLocal.ts` runs the same activation conversation built in (English, Hindi, Hinglish) and the built-in workspace answers (`src/lib/app/assistant.ts`).

### Automation backend hook

`POST /api/automation/activate` forwards every activation to the master n8n workflow when these environment variables are set (Vercel → Project → Settings → Environment Variables):

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Turns on Claude for IBAX (all-rounder answers + actions) |
| `N8N_ACTIVATE_WEBHOOK_URL` | n8n Webhook node URL that receives `service.activated` events |
| `N8N_WEBHOOK_SECRET` | Shared secret, sent as the `x-ibax-secret` header; check it in n8n |

Payload: `{ event: "service.activated", at, workspaceId, serviceId, business, config, accounts }` — `config` holds the details the owner gave (about, services, prices, hours, faqs, tone…), `accounts` the connected account per platform (for WhatsApp, the business number). Without the URL the app runs in preview mode and IBAX tells the owner the setup is saved.

