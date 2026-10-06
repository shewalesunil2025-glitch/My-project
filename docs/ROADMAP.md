# IBAX AI — Service roadmap

The app, the IBAX bot and the activation flow are built. The automations behind each service are not. A service is sold only when its automation is live: until then it shows **Coming soon** and takes a waitlist (`liveServices` in `src/content/app/services.ts`).

## Phase 0 — Foundation (1–2 weeks)

| # | Task | Owner |
|---|---|---|
| 1 | "Coming soon" + waitlist for services that aren't built ✅ | Claude |
| 2 | Real database + login (Supabase) instead of browser storage, so n8n can read each client's details and the app can show their messages and leads | Claude builds; owner creates the Supabase project and adds its keys to Vercel |
| 3 | n8n running (n8n Cloud to start) and the n8n connector working in Claude | Owner |
| 4 | `ANTHROPIC_API_KEY` in Vercel (smart IBAX answers) | Owner |
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
