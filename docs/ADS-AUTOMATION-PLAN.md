# AI Ads Automation — plan (27 Oct 2026)

Feature: IBAX AI → Digital Marketing → **AI Ads Automation**. A guided wizard where a business owner describes the goal, picks Facebook/Instagram, a location, a budget and duration; IBAX makes the creatives and copy; the owner approves; the campaign is launched through the official Meta Marketing API and tracked on a dashboard.

This file is the "inspect first, then plan" step. Nothing here is built yet. Decisions the owner must make are marked **DECISION**.

## 1. What already exists (reuse, don't duplicate)

| Need | Already in the app | Where |
|---|---|---|
| Login, tenant isolation | Supabase auth; every table keyed by `owner_id` with RLS "owner reads own, server writes" | `supabase/migrations/0001…0006`, `src/lib/server/followup.ts` (`adminDb`), `whatsapp.ts` (`userFromRequest`) |
| Payments | Razorpay live: server-side price, order, signature verify, webhook, renewals, Autopay | `src/app/api/pay/*`, `src/lib/server/razorpay.ts`, `billing.ts` |
| Services catalogue | `digital-marketing` (₹9,999/mo, "run by ibaxai, guided by people", **"ad spend is paid separately, straight to Meta or Google"**), `instagram`, `facebook`, `youtube`, `social-pack` | `src/content/app/services.ts` |
| Connected accounts | Provider ids `facebook`, `instagram`, `google` exist but are **"Coming soon"** (no live service uses them yet) | `ConnectAccount.tsx`, `providerReady` |
| AI images | `/api/image`: Gemini image → Cloudflare FLUX → Pollinations fallback, 20/day, saved in public `ai-images` bucket | `src/app/api/image/route.ts`, `lib/server/gemini.ts`, `freeImage.ts` |
| AI text, EN + Hindi | Gemini JSON helper; Hinglish already used across the app | `lib/server/gemini.ts` |
| AI voice | Gemini TTS (`/api/speak`) | used by the demo videos |
| Video | Template videos rendered from React scenes (`Film.tsx`, `scripts/demo-videos.mjs`) | cheap, no generative-video cost |
| Leads + follow-up | `leads` page, Lead Follow-up (WhatsApp, hourly n8n run) | `lib/server/followup.ts` |
| Content calendar | `ContentItem` (platform, status, schedule) | `lib/app/types.ts` |
| Background jobs | n8n Cloud: Activation, AI Replies, Lead Follow-up Hourly (authenticated with `x-ibax-secret`) | `docs/ROADMAP.md` |
| Meta app | App `1810020233450398`, Business verified, Live, Embedded Signup config for WhatsApp only | Meta dashboard |

## 2. What is missing

1. **No Meta Ads permissions.** The Meta app only has WhatsApp permissions. Managing a client's ad account needs `ads_management`, `ads_read`, `business_management`, `pages_show_list`, `pages_read_engagement`, `pages_manage_ads` (and `leads_retrieval` for lead forms, an Instagram permission for Instagram placements) with **Advanced Access through App Review**, plus a screen-recording per permission. Meta may also want a history of successful API calls before it grants Marketing API access. Expect 1–3 weeks per round, and rejections are common. This cannot be skipped or simulated.
2. No Facebook / Instagram / ad-account connection flow (Facebook Login for Business for the Page + ad account, token storage encrypted like `wa_cloud`).
3. No campaign tables, state machine, creative pipeline, insights ingestion or dashboard.
4. Gemini image generation still runs on the free path (billing tier 1 was pending); a paid key and a video provider key are not set.
5. Google Ads is a separate programme (developer token + approval, usually weeks). Out of scope until Meta works.

## 3. Constraints worth knowing before promising anything

- **Location targeting** is supported by the Marketing API (`geo_locations`: `custom_locations` with latitude, longitude and radius in km; `cities`; `regions` for states; `countries` for All India). 5 / 10 / 15 km radius is fine; location search goes through the official location-search endpoint. Meta also reports an estimated audience (`delivery_estimate`). We show it only when Meta returns it, and never promise reach.
- **Minimum budgets** differ by currency and optimisation goal; read them from the API at validation time instead of hard-coding ₹100/₹200.
- **Special ad categories** (credit, housing, employment, social issues) need declarations. The wizard must ask.
- **Lead-form leads** arrive by Meta webhook / `leads_retrieval` (needs the permission above).
- **Lead follow-up on WhatsApp** only works on link-code numbers today; official Cloud numbers need approved templates (not built).
- **Video:** generative video costs real money (Veo ≈ ₹30–40 per second per `docs/ROADMAP.md`). Template videos (client photo + animated text + Gemini voice-over + subtitles, rendered like the demo videos) cost almost nothing. Make template video the default, generative video an optional paid add-on.
- **No invented claims:** the copy prompt must only use facts the owner typed (prices, offers). Creatives get a "facts used" list the owner approves.

## 4. DECISIONS for the owner

1. **Who pays Meta for the ads?**
   - **A (recommended): the client's own Meta ad account pays Meta directly.** IBAX charges only a service fee. Matches today's service text ("ad spend is paid separately, straight to Meta"). No holding of client money, no refund problem for unused ad budget, a ban on one client's ad account doesn't hit the others.
   - **B: IBAX collects the ad budget and pays Meta from IBAX's own ad account.** Makes "total payable = spend + fee + tax" literally true, but it makes IBAX a reseller: float, GST invoicing on pass-through spend, chargebacks, and every client's ads under one account that Meta can restrict. Not recommended.
   The wizard shows the estimated ad spend and the service fee separately either way; with A the spend line says "paid to Meta from your ad account".
2. **Scope of version 1 (no Meta approval needed):** wizard, creatives, price, payment, dashboard, and an honest "IBAX team launches this for you" step (matches the existing "guided by people" Digital Marketing promise). The official API launch is version 2, after Meta approves.
3. **Pricing of the service fee** (per campaign vs monthly, what creative volume is included, GST: Razorpay shows the account as unregistered, so confirm what "applicable taxes" means).
4. **Is this a new self-serve service (`ai-ads`) or part of Digital Marketing ₹9,999?** Suggest a new service id so it can be sold alone; Digital Marketing includes it.

## 5. Design

**Tables** (new migration, all with `owner_id` and RLS read-own / server-write; no existing table is changed):
`ad_accounts` (Page id, ad account id, IG id, encrypted token, permissions seen) · `ad_campaigns` (objective, platforms, targeting JSON, budget, dates, status, platform ids, `idempotency_key` unique) · `ad_creatives` (variants, copy, asset URLs, sizes, approved flag, cost) · `ad_payments` (Razorpay order/payment ids, service fee, tax, verified_at) · `ad_metrics` (daily spend, impressions, reach, clicks, leads) · `ad_events` (audit log of every state change and API call) · `ad_usage` (AI generation cost per owner).

**Status machine** (a campaign is never "Active" until Meta says so):
`draft → creatives_ready → awaiting_approval → awaiting_payment → paid → ready_to_launch → submitted → active | rejected | failed`, with `paused` and `completed`. Launch creates the campaign **PAUSED** through the API, reads it back, and only then activates; the unique `idempotency_key` plus a stored platform id means a retry can't create a second campaign.

**Providers behind interfaces** (swap without rebuilding): `ImageProvider`, `VideoProvider`, `CopyProvider`, `AdPlatform` (Meta now, Google later). Configured by env/DB, with a per-owner daily cost cap and a cost estimate shown before generating. Approved assets are stored and reused; identical prompts are cached.

**Payment:** extend the existing Razorpay order/verify with a new one-time product (the amount is computed on the server from the campaign row, never from the browser); only `verify`/webhook can move a campaign to `paid`. Failed payment never reaches `submitted`.

**n8n:** one new workflow "IBAX · Ads · Performance (Hourly)" that calls an authenticated `/api/ads/insights/run` (same `x-ibax-secret` pattern as follow-up) to pull Meta insights, store `ad_metrics` and flag recommendations. If n8n isn't configured the dashboard says so; nothing is faked.

**Leads:** campaign leads write into the existing `leads` model with source `ads:<campaign>`, so lead status, assignment and follow-up reuse what's there; cost per lead = spend ÷ leads.

**AI agent:** a Gemini-driven interview that adapts questions to the objective and returns structured JSON (same tool-call style as IBAX chat); recommendations only suggest, and any change to budget/audience needs the owner's tap. Auto-optimise is a later, opt-in setting.

**UI:** a new Digital Marketing → AI Ads page in the existing design (mobile first): steps goal → platform → location → budget/duration → creatives → review & approve → pay → status. Dashboard tabs: Draft, Pending approval, Active, Paused, Completed, Rejected, Payments, Leads, Recommendations.

## 6. Phases

| Phase | What | Needs outside approval? |
|---|---|---|
| 1 | Wizard, AI interview, image + copy + template-video creatives (EN/HI, variants, resizing), price, Razorpay payment, tables, dashboard, "IBAX team launches" with honest statuses | No (Gemini billing for best image quality) |
| 2 | Connect Facebook Page + ad account, permission checks, official campaign creation (paused → active), status sync | **Yes: Meta App Review (ads permissions)** |
| 3 | Insights ingestion, AI performance agent, recommendations, lead forms into Leads | Same review + `leads_retrieval` |
| 4 | Generative video add-on, opt-in auto-optimisation, Google Ads | Video provider key; Google developer-token approval |

## 7. External checklist (owner)

1. Decisions in section 4.
2. Gemini paid key/tier for image quality; choose a video provider if wanted (key goes straight into Vercel).
3. Meta: add the ads permissions to the app, record the review videos (script follows once Phase 2 UI exists), submit App Review. Keep the privacy policy and data-deletion page current for ad data.
4. Razorpay: confirm GST status for the invoice line.
5. Google Ads (later): developer token, Google Cloud OAuth verification.

Rules that stay in force: no secrets in the repo or chat, no fake campaign data in production, no claim that an integration works until it is tested against the real service, no guarantee of sales, leads or reach.
