# AI Voice Calling — analysis of the ChatGPT prompt and the plan for ibaxai (27 Oct 2026)

The owner asked for the AI Voice Assistant (phone calls answered by an AI) and brought a long prompt written with ChatGPT. This file analyses the prompt against the real app, says what to keep, cut or change, and gives the plan. Nothing here is built yet. Provider prices and capabilities below are from memory and **must be checked against the provider's current pricing page before any price is promised**.

## 1. What already exists (reuse)

| Piece | Where | Note |
|---|---|---|
| The service is already defined: "AI Voice Assistant", ₹5,999 / $99 a month, not in the free trial | `src/content/app/services.ts` (`voice`) | Already asks for business info, FAQs, hours, appointment rules, transfer number, human-handoff rule, and a voice (4 options). Text already says "number setup 1–2 working days" and "call forwarding has to be switched on with your phone provider" |
| Calls page + `Call` type (caller, number, duration, outcome, summary) | `src/app/app/(workspace)/calls/page.tsx`, `lib/app/types.ts` | Shows `ws.calls`, which is **not stored on a server** today (workspace JSON). Needs a real table |
| Live AI voice in the browser (Gemini Live, about 1 s replies, interruptible) | `/api/live`, `lib/server/gemini.ts` | A ready **test-call engine**: the owner can talk to their assistant in the browser with no phone number and no telephony cost |
| AI voices (Gemini TTS, many prebuilt male and female voices, Hindi included) | `/api/speak`, `geminiSpeak` | Real **voice previews** without a second paid account |
| Razorpay: monthly / annual, Autopay, renewals, grace days, webhook | `src/app/api/pay/*`, `lib/server/billing.ts` | One payment system; voice becomes another plan |
| Auth + tenant isolation pattern, idempotent payments, state machine, tests with faked services | `lib/server/wa/http.ts` (`ownerCall`), `lib/server/ads/*`, `waCloud.signup.test.ts` | Same pattern as WhatsApp Cloud and AI Ads |
| Admin view | `/app/founder` | Extend, don't build a second admin |
| Email to the owner | `lib/server/mail.ts` | Notifications |

## 2. The prompt: keep, change, cut

**Keep (good ideas):** every tenant sees only its own data; an activation state machine (draft → payment → provisioning → testing → active → suspended); verify payment on the server and never trust the browser; idempotent payment and provider webhooks; dedupe usage so nobody is billed twice; a test mode that makes no real calls; no fake voices or fake previews; consent, opt-out and quiet hours for outgoing calls; cost tracked per client; providers behind an interface; nothing claimed live until tested.

**Change:**
1. **n8n for call handling and minute accounting: no.** The prompt has nine n8n workflows, including live call events and usage. Every call fires several provider webhooks; at 400 clients that is thousands of n8n executions a month (the plan has a monthly limit and each run is another thing that can fail without a test). Call events, usage and billing logic go in **Next.js + Supabase** (tested, like AI Ads). n8n keeps what it is good at: scheduled jobs and notifications (a daily "your minutes are 80% used" run, the weekly summary).
2. **"Provision a new number automatically in any country": not realistic.** In India a business number needs KYC with an Indian telephony provider (Exotel, Ozonetel, Knowlarity, Twilio India with its regulatory bundle) and a SIP connection into the voice platform. As far as I know, the AI voice platforms (Vapi, Retell) do not sell Indian numbers themselves. So version 1 is **numbers set up by the ibaxai team in 1–2 working days**, which is what the service page already promises. Automatic purchase can come per country later.
3. **"Connect my existing number": call forwarding, not entering a mobile number.** The client keeps their number and forwards calls (all, or only when busy / unanswered) to their ibaxai number. The app shows the exact steps for their carrier. A personal mobile cannot be "connected" directly; the prompt itself says so.
4. **Outgoing calls: later, and narrower.** India's telemarketing rules (TRAI, DLT registration, DND scrubbing, calling hours) and foreign numbers calling Indian users being restricted make bulk or promotional AI calling a compliance project of its own. Version 1 is **incoming only**. Version 2 is **callbacks to people who asked for one** (from the website call-back form and Leads), not campaigns.
5. **15 tables, a global country matrix, an admin cost dashboard: too much for a first version.** Start with: `voice_assistants`, `voice_numbers`, `voice_calls`, `voice_call_events` (the provider event id is unique, so a repeat can't be counted twice), `voice_usage` (per month), `voice_plans` (editable by the owner). Everything else when a client needs it. Countries: India first; others through configuration later.
6. **ElevenLabs:** not needed at the start. Gemini TTS already has male and female voices for previews, and the phone platform's own voice list (read from its API at build time, never typed in by me) is what the real calls use.
7. **Marathi:** offer it only after a real test call with the chosen voice. Hindi and English first.
8. **Recording and transcripts:** off by default. The assistant says at the start of the call that it is an AI assistant (and that the call may be noted if summaries are on). Transcripts are kept for a set period and can be deleted. The privacy policy and Play data-safety answers need a line about call data before launch.

## 3. The decision that sets the cost: which engine answers the phone

| | **Option 1: a voice platform (Vapi / Retell)** | **Option 2: our own bridge** |
|---|---|---|
| How | The platform answers, hears, thinks and speaks; our server gives it the assistant's setup and receives events | Indian telephony → a small always-on server (the existing VPS) → Gemini Live |
| Build time | Days | Weeks |
| Cost per minute | Higher: platform fee + speech-to-text + AI model + voice + telephony, all billed per minute (**check current pricing; roughly several to a dozen rupees a minute is typical**) | Lowest: mostly Gemini audio + telephony |
| Risk | Pays a platform margin on every minute | Real-time audio bugs, scaling, support are ours |
| Hindi / Marathi quality | Depends on the chosen speech and voice models | Gemini Live is already good in Hindi in this app |

**Recommendation:** start with Option 1 to find out whether clients pay, behind a provider interface so Option 2 can replace it later without touching the app. Put the real per-minute cost into the package maths *before* promising included minutes: at a cost of ₹10 a minute, 200 included minutes already cost ₹2,000 of a ₹5,999 plan, before number rental and the 2% payment fee. The plan must have an overage price per extra minute and a hard cap.

## 4. Version 1 scope (incoming calls, India)

1. **Wizard** inside the existing service page, reusing the business profile: calling mode (incoming now), number (ibaxai sets it up; or forwarding from your number with the carrier steps), business facts and FAQs (already collected), assistant name, style, greeting, "never say" list, handoff rules, **female / male voice** with a real preview, language (Hindi / English first), package.
2. **Test call in the browser** with the existing Gemini Live engine: greeting, voice, language and business knowledge, no phone and no provider cost. The service is never activated just because the test button was pressed.
3. **Payment** through the existing Razorpay plan flow, verified on the server. States: `draft → pending_payment → payment_confirmed → provisioning → testing → active`, plus `suspended`, `cancelled`, `failed`. A payment that succeeds while setup fails is kept and shown with a recovery action.
4. **Provider integration** behind an interface: create or update the assistant, attach the number, receive signed webhooks (call started, ended, summary). A **fake provider** makes every test possible without paid accounts or real calls.
5. **Calls and minutes:** real `voice_calls` rows per client (replacing the demo list), duration from the provider's report, included minutes, a warning at 80%, a hard stop or overage at the limit, monthly reset on the billing date.
6. **Dashboard:** history with summaries and outcomes (answered / appointment / lead / transferred / missed), minutes left, voice and language, pause and cancel. Leads from calls land in the existing Leads.
7. **Admin (founder page):** who is active, failed setups to retry, minutes and provider cost per client.
8. **Tests:** tenant isolation, activation needs verified payment, duplicate payment and provider events change nothing, minute limits, voice choice saved, provider keys never in a response.

## 5. What is needed from outside (owner)

1. The decisions in section 6.
2. A voice-platform account (an API key goes straight into Vercel, never into chat). Free trial credits exist, enough for the first tests.
3. An Indian telephony provider quote and KYC for the first client numbers.
4. Real per-minute costs from those two, to fix the package minutes and the overage price.
5. Privacy policy line for call data (I write it; the owner approves).

## 6. Decisions for the owner

1. **Engine:** a voice platform first (recommended), or our own bridge from the start?
2. **Version 1 = incoming calls only, India, numbers set up by the ibaxai team?** (Outgoing callbacks in version 2.)
3. **Packages:** after the real costs are known, how many minutes are included and what is the extra-minute price? (The current ₹5,999 stays until then.)
4. **Languages for launch:** Hindi and English; Marathi after a real test.
