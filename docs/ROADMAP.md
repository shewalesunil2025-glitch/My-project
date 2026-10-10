# ibaxai — Service roadmap

The app, the IBAX bot and the activation flow are built. The automations behind each service are not. A service is sold only when its automation is live: until then it shows **Coming soon** and takes a waitlist (`liveServices` in `src/content/app/services.ts`).

## Where we are (updated 2026-10-10)

**Launch plan (owner's decision):** build 3–4 services fully first — Website (self-service builder), WhatsApp, Lead Follow-up, Customer Support — then add Razorpay and launch.

| Area | Status | Next step |
|---|---|---|
| ibaxai site + app | ✅ Live at www.ibaxai.com (site, app, policy pages; slogan "Just say it. IBAX does it."; IBAX Hub at `/app/ibax`) | — |
| Website service ($299) | 🟡 Self-service builder built: 5 premium templates (Aurora, Prism, Glass, Luxe, Neon) with 3D and scroll animations, filled from the business profile; publish to `/s/<slug>`; enquiry form → Leads | Owner: run `supabase/migrations/0002_sites.sql` in Supabase; then add the custom-domain option later |
| Accounts + database (Supabase) | ✅ Live: sign-up without email wait, workspace syncs across devices | n8n reads client details from Supabase instead of its own tables |
| Google sign-in | 🟡 Button works; Google provider not yet switched on in Supabase | Owner: Google Cloud OAuth client → Supabase → Authentication → Providers → Google |
| Apple sign-in | ⏸ Needs a paid Apple Developer account ($99/year) | Later |
| WhatsApp ($49) | 🟡 Self-service built: the client links their number in the app with a WhatsApp pairing code (`/api/whatsapp` creates the Evolution instance `ibax-<digits>` with the AI Replies webhook); activation is checked against the instance owner. n8n Activation (live) + AI Replies (Gemini, tested) | Owner: VPS with Evolution API; Vercel: `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `N8N_EVOLUTION_WEBHOOK_URL`; publish AI Replies; add `whatsapp` to `liveServices` |
| Privacy Policy + Terms | ✅ Live at `/privacy` and `/terms` (operator Shewale Sunil, sole proprietor, Chhatrapati Sambhajinagar); data-deletion steps at `/privacy#data-deletion` | — |
| Udyam (MSME) registration | ✅ Registered as a proprietorship (Services, NIC 62011/62012/62013/62020) | Download the certificate PDF; use it for Meta Business Verification, Razorpay and a bank current account |
| Payments (Razorpay) | ⏳ Policy pages Razorpay checks are live: /terms, /privacy, /refund-policy, /shipping-policy, /contact | Owner opens a Razorpay account; Claude builds checkout + webhook |
| IBAX bot AI in the app | ⏳ Built-in fallback answers only | Free option: Gemini key in Vercel instead of `ANTHROPIC_API_KEY` |
| Meta / Google / YouTube approvals | ⏳ | Owner applies early (2–4 weeks) |

## Phase 0 — Foundation (1–2 weeks)

| # | Task | Owner |
|---|---|---|
| 1 | "Coming soon" + waitlist for services that aren't built ✅ | Claude |
| 2 | Real database + login (Supabase) ✅ accounts and workspaces (`supabase/migrations/0001_init.sql`). Next: n8n reads client details from it and the app shows their messages and leads | Claude builds; owner created the project and added its keys to Vercel |
| 3 | n8n running (n8n Cloud) ✅ | Owner |
| 4 | AI for the in-app IBAX bot: `ANTHROPIC_API_KEY` in Vercel, or switch the bot to Gemini's free tier | Owner adds the key |
| 4b | Own SMTP in Supabase (Authentication → Emails), then sign-up can go back to email confirmation | Owner |
| 5 | Real payments (Razorpay / Stripe) with a webhook that activates the subscription | Claude builds; owner creates the account |
| 6 | Privacy Policy + Terms pages (needed for Meta and Google reviews) ✅ | Claude |
| 7 | Apply early for slow approvals: Meta Business Verification, Google Business Profile API, YouTube quota increase | Owner |

## Phases

1. **Website ($299) + WhatsApp Automation ($49)**
   - Website needs no third-party approval, so it is live now.
   - WhatsApp needs Meta's WhatsApp Cloud API. Onboard the first clients manually, then add Embedded Signup (Tech Provider).
   - WhatsApp needs four n8n workflows: activation, auto-reply, lead + 24-hour follow-up (approved templates), and handover to a person.
2. **Lead Follow-up ($39) + Customer Support ($49)** — reuse the WhatsApp AI and the database.
3. **Google Review Management ($29)** — after Google Business Profile API access. Review requests after a visit and reply drafts, never fake reviews.
4. **Instagram + Facebook ($39 each)** — the same Meta app plus App Review for messaging, comments and publishing. AI drafts are approved by the owner in the app.
5. **Email Automation ($29)** — start with forwarding to an IBAX inbox and reply drafts, which avoids the Gmail restricted-scope assessment.
6. **YouTube ($39)** — after the quota increase. Comment replies and scheduling first; AI video later.
7. **AI Voice Assistant ($79)** — telephony (Exotel / Twilio or Vapi / Retell), number KYC and call forwarding.
8. **Digital Marketing ($299)** — the bundle, once Instagram, Facebook, YouTube, Lead Follow-up and Reviews are live. Ads are run by people first.

## Adding a service (repeat each time)

1. Get API access or approval for the platform.
2. Build the n8n workflows: activation (`service.activated` from `/api/automation/activate`), the daily work, and an error alert.
3. Replace the preview "Connect" step in the app with the platform's real sign-in.
4. Test on our own business.
5. Pilot with 1–3 clients.
6. Add the service id to `liveServices`. The store, the service page and IBAX start selling it, and the waitlist can be told it has launched.

## WhatsApp Automation — n8n setup (built)

n8n Cloud: `ibaxai.app.n8n.cloud`. Secrets (the webhook secret, the Evolution token, API keys) live only in Vercel and n8n, never in this repository.

| Piece | What it does |
|---|---|
| Workflow **IBAX · WhatsApp · Activation** (published) | `POST /webhook/ibax-activate` ← the app's `/api/automation/activate`. Checks `x-ibax-secret`, then saves the client's business details in the **IBAX WhatsApp Clients** table under the instance name `ibax-<whatsapp number digits>` |
| Workflow **IBAX · WhatsApp · AI Replies (Evolution API)** | `POST /webhook/ibax-evolution?token=…` ← Evolution API `MESSAGES_UPSERT`. Finds the client by instance and skips customers the owner has taken over. Gemini Flash (free tier) writes the reply from the client's facts and the reply is sent through Evolution. The chat is saved to **IBAX WhatsApp Messages**. When a person is needed, the bot pauses for that customer (**IBAX WhatsApp Contacts**) and alerts the owner on WhatsApp |

To go live:
1. Vercel: set `N8N_ACTIVATE_WEBHOOK_URL` = `https://ibaxai.app.n8n.cloud/webhook/ibax-activate` and `N8N_WEBHOOK_SECRET` (the value checked in the Activation workflow), then redeploy.
2. n8n: a Google Gemini credential with our own free API key, selected on the **Gemini Flash** node ✅ (the reply step retries 3 times when Google is busy).
3. Evolution API server (one VPS for all clients). Vercel: `EVOLUTION_API_URL`, `EVOLUTION_API_KEY` (the server's global key) and `N8N_EVOLUTION_WEBHOOK_URL` (AI Replies production URL plus `?token=…`). The app then creates each client's instance `ibax-<number>` with that webhook (`MESSAGES_UPSERT`), and the client links WhatsApp themselves with a pairing code.
4. Publish **AI Replies**, test with one pilot number, then add `whatsapp` to `liveServices`.

Evolution API uses WhatsApp Web, not Meta's official API. Use it for replies only (no bulk or promotional sends), and plan the move to the WhatsApp Cloud API. Only the receive and send nodes change.
