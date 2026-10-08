# IBAX AI — Service roadmap

The app, the IBAX bot and the activation flow are built. The automations behind each service are not. A service is sold only when its automation is live: until then it shows **Coming soon** and takes a waitlist (`liveServices` in `src/content/app/services.ts`).

## Phase 0 — Foundation (1–2 weeks)

| # | Task | Owner |
|---|---|---|
| 1 | "Coming soon" + waitlist for services that aren't built ✅ | Claude |
| 2 | Real database + login (Supabase) instead of browser storage ✅ accounts and workspaces (`supabase/migrations/0001_init.sql`). Next: n8n reads client details from it and the app shows their messages and leads | Claude builds; owner creates the Supabase project and adds its keys to Vercel |
| 3 | n8n running (n8n Cloud to start) and the n8n connector working in Claude | Owner |
| 4 | `ANTHROPIC_API_KEY` in Vercel (smart IBAX answers) | Owner |
| 4b | Supabase sends confirmation emails from its own low-limit mailer. Add our own SMTP (Authentication → Emails) before turning "Confirm email" on | Owner |
| 5 | Real payments (Razorpay / Stripe) with a webhook that activates the subscription | Claude builds; owner creates the account |
| 6 | Privacy Policy + Terms pages (needed for Meta and Google reviews) | Claude |
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
3. Evolution API server: for each client, create an instance named `ibax-<number>` and scan its QR code with the client's WhatsApp. Set its webhook to the AI Replies production URL plus `?token=…`, events `MESSAGES_UPSERT`, webhookByEvents off.
4. Publish **AI Replies**, test with one pilot number, then add `whatsapp` to `liveServices`.

Evolution API uses WhatsApp Web, not Meta's official API. Use it for replies only (no bulk or promotional sends), and plan the move to the WhatsApp Cloud API. Only the receive and send nodes change.
