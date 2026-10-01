# Lumi — Architecture

**Lumi** is the AI Business Operating System built by Nexa Flow AI. Business owners run their website, AI assistants, WhatsApp, calls, social media, reviews, content, leads and automations from one app. They never touch n8n, APIs, webhooks or video tools: Lumi handles those in the background.

> The brand name lives in one place: `src/config/product.ts`. Every customer can still rename their own assistant (Riya, Alex, Emma…) during setup.

## What is in this repository today

The complete customer-facing app runs under `/app` (Next.js App Router). It is in **preview mode** (`product.previewMode = true`):

| Piece | Preview mode (now) | Production (replace with) |
| --- | --- | --- |
| Accounts & sessions | `localStorage` on the device, SHA-256 password hash | Auth service (e.g. Auth.js / Clerk / Supabase Auth) with httpOnly session cookies, Google & Apple OAuth, 2FA |
| Workspace data | One JSON workspace per user in `localStorage` (`src/lib/app/store.ts`) | Postgres, tenant-scoped (schema below) |
| Payments | "Confirm test payment"; invoices marked *test* | Stripe Checkout / Razorpay. The subscription is created by the payment webhook, not the browser |
| Account connections | Account name typed in, marked `simulated` | OAuth per platform. Tokens encrypted at rest |
| Automations | Status machine + logs in the workspace | n8n workflows (one template per service, one instance per workspace) triggered by the backend |
| Assistant | Built-in answers from workspace data (`src/lib/app/assistant.ts`) + Claude via `/api/assistant` when `ANTHROPIC_API_KEY` is set | Same, with the workspace context loaded server-side from the database |
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

Services, prices, setup questions and connection requirements are data in `src/content/app/services.ts`. Prices are **placeholders in USD**: set your own there.

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

## Assistant

`useAsk` (client) answers workspace questions locally ("What happened today?", leads, calls, WhatsApp, YouTube, reviews, analytics, how-to and help questions) and performs actions ("Create tomorrow's Instagram post" adds a draft for approval). Anything else goes to `POST /api/assistant`, which calls Claude (`claude-opus-5-5`, low effort, server-side refusal fallback) with a compact workspace summary. Without `ANTHROPIC_API_KEY` the route returns `503 not_configured` and the built-in answer is shown.
