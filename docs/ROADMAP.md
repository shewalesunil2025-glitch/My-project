# ibaxai — Service roadmap

The app, the IBAX bot and the activation flow are built. The automations behind each service are not. A service is sold only when its automation is live: until then it shows **Coming soon** and takes a waitlist (`liveServices` in `src/content/app/services.ts`).

## Where we are (updated 2026-10-26)

**Launch plan (owner's decision):** build 3–4 services fully first — Website (self-service builder), WhatsApp, Lead Follow-up, Customer Support — then add Razorpay and launch.

| Area | Status | Next step |
|---|---|---|
| ibaxai site + app | ✅ Live at www.ibaxai.com (site, app, policy pages; slogan "Just say it. IBAX does it."; IBAX Hub at `/app/ibax`) | — |
| Website service ($299) | 🟡 Self-service builder built: 24 premium templates (`src/lib/sites/themes.ts`) with 3D hero scenes, custom cursor, cursor-tilt cards, marquee and scroll animations, plus the IBAX customer chat on every site; filled from the business profile; publish to `/s/<slug>`; enquiry form → Leads | SQL done. Later: custom-domain option |
| Accounts + database (Supabase) | ✅ Live: sign-up without email wait, workspace syncs across devices | n8n reads client details from Supabase instead of its own tables |
| Google sign-in | ✅ Live: Google Cloud project `ibaxai` (OAuth client "ibaxai web", app published), Supabase Google provider on, Site URL `https://www.ibaxai.com`; the vercel.app address redirects to www.ibaxai.com | — |
| Apple sign-in | ⏸ Needs a paid Apple Developer account ($99/year) | Later |
| AI Voice Assistant ($99) | 🟡 Version 1 code built (incoming calls, Hindi/English, woman/man voice, browser practice call, number request + founder setup, packages, Razorpay check, call history, minutes). **Not tested with real Vapi or a real phone number.** See `docs/AI-VOICE-CALLING-IMPLEMENTATION.md` | Owner: run `0008_voice.sql`; Vapi account + keys in Vercel; Indian number + SIP; set real package minutes |
| WhatsApp ($49) | ✅ Live: Bluehost VPS (Mumbai, `129-121-169-80.sslip.io`) runs Evolution API; Vercel env vars set; AI Replies published; owner linked their own number. Link code and QR refresh on screen while linking | Owner: activate the service from IBAX chat and test a reply from another phone; later move to the WhatsApp Cloud API |
| WhatsApp official (Meta Cloud API) | 🟡 Built and live in the code (PRs #200–#205). Done by the owner on 26 Oct: Meta app basics, Independent Tech Provider, Embedded Signup configuration, app **Live**, Supabase `0006_whatsapp_cloud.sql`, Vercel `META_APP_SECRET` + `META_WEBHOOK_VERIFY_TOKEN` (the value lives only in Vercel and Meta), webhook verified, fields subscribed, JS SDK domain set. Not yet tested with a real number. Clients still see the link code until Meta approves (the server only lets `META_WA_TEST_EMAILS` accounts finish an OTP signup; audit fixes: a number linked by link code is never moved to Meta, Follow-up/Reviews stay off on Cloud numbers until template sending exists) | **Done 27 Oct:** audit fixes merged (#208); the OTP option now shows by itself for the logins in `META_WA_TEST_EMAILS` (owner added it in Vercel). **Next:** owner tests Settings → Connected accounts → WhatsApp with a spare number (not their main WhatsApp) → fix what breaks → record the video and submit App Review (`docs/META-APP-REVIEW.md`, ~1–3 weeks) → then `NEXT_PUBLIC_META_WA_LIVE=1`. Also open: ask whether "OTP login" also means SMS OTP login to the app (costs money); Gemini tier; testers' opt-ins (Play C1); Email Automation can be built without approval |
| Lead Follow-up ($39) | ✅ Live: website enquiries and leads added in the app get a WhatsApp thank-you from the owner's number, then up to 2 reminders (after 1 hour / 1 day / 2 days, 9 am–9 pm India time); stops when the lead replies or is marked converted/lost; 9 am "call these today" list on WhatsApp. SQL `0003_followups.sql` run; n8n **IBAX · Lead Follow-up · Hourly** published | Owner: test by adding a lead with a second number |
| Customer Support ($49) | ✅ **Live.** Answers customers' common questions (FAQs, prices, timings, policies) on the client's ibaxai website chat (`/api/site-chat`) and, when their WhatsApp is linked and WhatsApp Automation isn't on, on WhatsApp too (n8n **Activation** saves it like WhatsApp; policies go into the FAQs); complaints alert the owner on WhatsApp | Instagram, Facebook and email answers come with those services |
| Google Review Management (₹499) | ✅ Part 1 live: review requests on the owner's WhatsApp with a one-tap Google review link (g.page/r/…/review or writereview?placeid=…; `src/lib/reviewMessage.ts` fixes pasted links) — "Ask review" on each lead, the Reviews page, from IBAX chat (`ask_review`), or automatically when a lead is marked Converted; once per customer per 30 days, 40 a day (`/api/reviews`, `src/lib/server/reviews.ts`). In the free trial | **Reply drafts live:** paste a Google review on the Reviews page → IBAX writes the reply in the customer's language (`/api/reviews/reply`). Part 2: Google Business Profile API (owner applies: Google Cloud project `ibaxai` → request Business Profile API access) → new-review alerts and posting replies automatically |
| Privacy Policy + Terms | ✅ Live at `/privacy` and `/terms` (operator Shewale Sunil, sole proprietor, Chhatrapati Sambhajinagar); data-deletion steps at `/privacy#data-deletion` | — |
| Udyam (MSME) registration | ✅ Registered as a proprietorship (Services, NIC 62011/62012/62013/62020) | Download the certificate PDF; use it for Meta Business Verification, Razorpay and a bank current account |
| Payments (Razorpay) | ✅ Live keys (`rzp_live`) in Vercel; account activated (Unregistered). `/api/pay/order` works out the price on the server (₹ in India, $ elsewhere charged in ₹) and `/api/pay/verify` checks Razorpay's signature before the service is switched on. **Renewals:** paying again for a monthly/yearly plan adds a month/year after the current end date; Billing has "Renew now", Home shows a banner 3 days before the end; WhatsApp reminder from ibaxai's number at 10 am, 3 days before and on the day (`src/lib/server/renewals.ts`, from the hourly n8n run); 3 grace days after the end, then the service pauses (`Automation.paidUntil`) | **Autopay** built (Razorpay Subscriptions — UPI AutoPay or card, up to ₹15,000 a charge): a tick box on checkout (on by default); for a plan that's still running it only sets up the mandate and the first charge happens on the end date; "Turn on/off Autopay" in Billing; `/api/pay/autopay`, `/api/pay/webhook` (`subscription.charged` extends the plan, updates the workspace and re-sends the end date to n8n; cancelled/halted/completed turn Autopay off); the app pulls server-side renewals on open (`syncPaidPlans`); reminders skip Autopay plans. **Hidden until `RAZORPAY_WEBHOOK_SECRET` is set** (owner postponed the webhook) | Owner: Razorpay webhook `https://www.ibaxai.com/api/pay/webhook` (events subscription.charged, .cancelled, .halted, .completed) with a secret they make up → same secret in Vercel `RAZORPAY_WEBHOOK_SECRET` → Redeploy. Then a friend does one real ₹499 UPI payment with Autopay |
| 3-day free trial + INR/USD prices | ✅ Live: India sees ₹, other countries see round-figure $ (`usd` in `services.ts`: the original dollar prices — Website $299, Voice $79, WhatsApp $49, Support $49, Lead Follow-up $39, Instagram/Facebook/YouTube $39, Social Pack $99, Email $29, Reviews $29, Digital Marketing $299; website by visitor country via `/api/geo` with a ₹/$ switch, app by the business country picked with the phone code). Every payment is taken in rupees ($ × `USD_TO_INR` = 85). Prices in ₹ (min ₹499/mo, yearly = 2 months free; Instagram ₹1,999 and Facebook ₹1,999 with 12 AI posts + 4 reels/videos, YouTube ₹2,999 with 8 Shorts, Social Pack ₹5,999, Digital Marketing ₹9,999 — AI images and video cost us money). Once per account, 3 days free of the messaging automations (WhatsApp, Lead Follow-up, Support, Email, Reviews) and the website builder (preview only; publishing needs the paid Website). Not in the trial: Instagram, Facebook, YouTube, AI Voice, Digital Marketing. When it ends, trial services pause (app, server checks, and n8n **Client active?** checks `trial_ends_at`) | Razorpay checkout turns "Pay & keep it running" into a real payment |
| IBAX bot AI (app + website) | ✅ Live on Gemini (free): answers in any language and activates services in the app; natural woman's voice (Gemini TTS); live voice calls like a phone call (Gemini Live, ~1 s replies, stops when the caller talks); the website bot works the same way for visitors | — |
| Chat files + AI images | ✅ "+" in the IBAX chats: photo / PDF (≤3 MB) / text file read by Gemini (app and website, `src/lib/attachments.ts`, `src/components/chat/Attach.tsx`). App only: "Create image" + `create_image` tool → `/api/image` (Gemini image model if billing is on; else Gemini (free) writes a detailed prompt and Cloudflare Workers AI FLUX makes it — `CF_ACCOUNT_ID` + `CF_AI_TOKEN`, ~100 free a day — with Pollinations as the last resort; free for everyone, 20 a day, counted in the user's app_metadata; saved in the public `ai-images` bucket) | Owner: free Cloudflare account → `CF_ACCOUNT_ID` and `CF_AI_TOKEN` in Vercel for high-quality images. AI video is not free (Google Veo ≈ ₹30–40 a second) |
| Demo videos | ✅ `/app/demo` (open without an account): the app tour plus MP4 demo videos for every service (`/app/demo/<id>`), in English, Hindi and Marathi. Two videos per service, both opening with the tagline: **Just say it** (switch it on by talking to IBAX) and **Manually** (tap through it yourself). The app's own screens are drawn as motion graphics (`src/components/demo/Film.tsx`), narrated in IBAX's Gemini voice, never mentioning prices. Under the video only three choices: Just say it · Manually · Language. Made with `node scripts/demo-videos.mjs` (scripts in `src/content/demoScripts.ts`; output `public/demo/`) | More languages: scripts for Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Spanish and Arabic are written — run the script with `--langs` to add them |
| App icon | ✅ New icons (`/icons/`, `/ibaxai.webmanifest`) match the iPhone App Store icon on Android too | Owner: remove the old home-screen icon, clear Chrome's site data for ibaxai.com, add it again |
| Meta / Google / YouTube approvals | ⏳ | Owner applies early (2–4 weeks) |
| Play Store launch (Android) | ⏳ Checklist: **`docs/PLAY-STORE-LAUNCH.md`**. Done: B1 (Play account), B2 (app created, `.aab` in Internal testing, 22 Oct), B3 (assetlinks with the app signing key), B5–B9 (listing en+hi, screenshots, data safety, privacy/terms). App Store later ($99/yr) | Owner: add testers, install from the test link; then C1 — closed test with 12+ testers for 14 days; B4 payments decision before production |

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

## WhatsApp official — Meta Cloud API (Embedded Signup)

The client presses **Connect with number + OTP**, Meta's window opens, they type their number and the OTP, and it is linked. Same `ibax-<digits>` instance name as the Evolution links, so the chats, leads, follow-ups and n8n workflows don't change.

| Piece | What it does |
|---|---|
| `src/lib/app/metaSignup.ts` | Loads Meta's JS SDK, opens Embedded Signup (`config_id`, `featureType: whatsapp_business_app_onboarding` when the client keeps the WhatsApp Business app), sends the one-time code + ids to the server |
| `/api/whatsapp/cloud` | `finish`: swaps the code for the business token (`META_APP_SECRET`), subscribes the app to the account's webhooks, registers the number (not with the app kept), saves it encrypted in `wa_cloud` (`0006_whatsapp_cloud.sql`). Also `status`, `disconnect` |
| `/api/whatsapp/cloud/webhook` | Meta's callback (verify token `META_WEBHOOK_VERIFY_TOKEN`, signature checked). Customer messages and the owner's own app messages (`smb_message_echoes`) go to the n8n AI Replies webhook in Evolution's format |
| `/api/whatsapp/cloud/evo/message/sendText/<instance>` | n8n's "send" for Cloud numbers lands here (per-number key) and goes out through Meta. The app's own sends (`evo()` in `src/lib/server/whatsapp.ts`) switch to Meta the same way |
| `/api/whatsapp/cloud/templates` | Create / list / send message templates (needed for App Review and for messages after the 24-hour window) |

Meta setup (owner, once):
1. App settings → Basic done; Tech Provider (Independent) started; Embedded Signup configuration created ✅
2. Supabase → SQL Editor: run `supabase/migrations/0006_whatsapp_cloud.sql`
3. Vercel: `META_APP_SECRET` (Meta → App settings → Basic → App secret) and `META_WEBHOOK_VERIFY_TOKEN` (any long random text) → Redeploy
4. Meta → WhatsApp → Configuration: Callback URL `https://www.ibaxai.com/api/whatsapp/cloud/webhook`, the same verify token; subscribe `messages` and `smb_message_echoes`
5. Facebook Login for Business → Settings: Login with the JavaScript SDK **Yes**; Allowed domains `https://www.ibaxai.com`
6. Test: add the owner login email to `META_WA_TEST_EMAILS` (Vercel) → Redeploy → Settings → Connected accounts → WhatsApp → Connect with number + OTP
7. App Review: advanced access for `whatsapp_business_messaging` and `whatsapp_business_management`, with a screen recording (connect a number, send a message from the Inbox, create a template). After approval: Vercel `NEXT_PUBLIC_META_WA_LIVE=1` → Redeploy, and every client sees the button

Limits: free-text replies only within 24 hours of the customer's last message; after that, an approved template (Meta charges for business-started template messages, about ₹0.15–0.80 each, billed to the client's own WhatsApp account).

Evolution API uses WhatsApp Web, not Meta's official API. Use it for replies only (no bulk or promotional sends), and plan the move to the WhatsApp Cloud API. Only the receive and send nodes change.
