# AI Voice Calling — what is built (version 1, incoming calls, India)

Plan and reasoning: `docs/AI-VOICE-CALLING-PLAN.md`. This file says what exists in the code, how to switch it on, and what is **not** done.

## What is in the code

| Part | Where |
|---|---|
| Tables + RLS (run once in Supabase) | `supabase/migrations/0008_voice.sql` |
| Rules without a database (voices, languages, number statuses, monthly window, minutes, client status, assistant instructions) | `src/lib/voice/core.ts` |
| Provider interface, Vapi adapter, fake provider for tests | `src/lib/server/voice/provider.ts` |
| Server rules (assistant, number requests, package, entitlement, call events, usage, admin actions) | `src/lib/server/voice/service.ts` |
| Browser practice call (Gemini Live) | `src/lib/server/voice/browserTest.ts`, `/api/live` with `audience: "voice-test"` |
| Client API | `POST /api/voice` (state · save_assistant · request_number · start_plan · pause · calls) |
| Vapi webhook | `POST /api/voice/webhook` |
| Founder API | `POST /api/voice/admin` (overview · save_plan · number) |
| Client page | `/app/voice`; real calls show on `/app/calls` |
| Founder page | `/app/founder/voice` (link on the Founder Console) |
| Tests | `src/lib/voice/core.test.ts`, `src/lib/server/voice/voice.server.test.ts`, `src/app/api/voice/routes.test.ts` |

## Tables (and the two extra ones)

The six asked for: `voice_assistants`, `voice_phone_numbers`, `voice_subscriptions`, `voice_calls`, `voice_usage_records`, `voice_provider_events`. Users, businesses and payments reuse `auth.users`, `workspaces` and the Razorpay `subscriptions` table (a row with `service_id = 'voice'`).

Two extra tables, because the task needs them:
- `voice_plans` — packages the owner edits (minutes, extra-minute price, hard cap). Seeded with **no minutes and switched off**, so nothing can be sold until real numbers are entered.
- `voice_audit` — who changed what (audit log). Readable by the server only.

All tables have RLS: a client reads only their own rows; every write is done by the server. `voice_provider_events` and `voice_audit` have no client access at all.

## How the rules work

- **Payment**: the existing Razorpay flow (`/app/services/voice/checkout`, `/api/pay/verify`) records a `subscriptions` row. Voice reads it (active and not expired). The package (`voice_subscriptions`) is started by the server only when that payment exists **and** the package has minutes set.
- **Status the client sees**: Active only when paid, assistant saved, the number is Active **and** a real test call passed. A number can never be set to *ready for testing* or *active* by hand: *ready for testing* only follows a successful provider setup call; *active* only follows the founder's "real test call passed" on a number that is ready for testing.
- **Number statuses**: requested · awaiting customer information · awaiting verification · configuration in progress · ready for testing · active · failed. A failed provider setup shows *failed* with the reason and can be retried.
- **At every incoming call** (Vapi `assistant-request`) the server looks up the number, checks payment, package, pause, status and minutes, then answers with the client's own assistant built from the database (so changes apply to the next call), or with an error that Vapi speaks to the caller. The 7.5 s Vapi limit is met because this is a few database reads.
- **Minutes**: each call is stored once (`provider_call_id` unique) with one usage row (`call_id` unique); seconds are rounded **up** to whole minutes; the month window runs from the day the package started. At the package limit calls stop, unless an extra-minute price and a hard cap above the package are set. No unlimited package exists.
- **Duplicate events**: events are stored under `provider:call:type`; a repeated one changes nothing; a half-processed one is re-run safely.
- **Privacy**: call audio is never stored (`recordingEnabled: false`); transcripts are stored only if the client turns that on; the assistant says it is an AI if asked; incoming calls only.
- **Keys**: `VAPI_API_KEY` and the webhook secret exist only in server environment variables.

## What is not built or not verified (be honest)

1. **Nothing has been tested against the real Vapi.** All tests use a fake database and a fake provider. The Vapi request shapes come from docs.vapi.ai; these were **not** confirmed there and must be checked on the first real call: the exact `azure` `voiceId` values (`hi-IN-SwaraNeural`, `hi-IN-MadhurNeural`, `en-IN-NeerjaNeural`, `en-IN-PrabhatNeural`), the transcriber `google` / `Multilingual`, the model `google` / `gemini-2.5-flash`, and whether `PATCH /phone-number/{id}` with `server` leaves the number without an `assistantId` (needed for `assistant-request`).
2. **Indian phone numbers**: Vapi's docs do not list India. A number must come from an Indian telephony provider and be connected through a SIP trunk (Vapi "BYO SIP trunk" credential). The team does this by hand (1–2 working days); the founder page then records the number and Vapi's number id. Not automated.
3. **Prices and minutes are not set.** The package table is empty on purpose. The ₹5,999 plan still applies for payment; minutes come from real Vapi + telephony costs.
4. **Voice gender and sound**: the browser test uses Gemini voices (`Sulafat`, `Charon`); the phone uses Azure voices. They sound different. Listen to all four phone voices before launch.
5. **No call transfer** (Vapi transfer tool not used); the assistant takes a message instead.
6. **n8n notifications are not built.** Planned (n8n only for alerts, never for call handling): a daily run calling an authenticated endpoint to list packages at 80 % of minutes and failed number setups, then email/WhatsApp the owner or the founder. Needs a new `x-ibax-secret` endpoint; add when the first real client is live.
7. **Privacy policy** needs a line about call data (summary, caller number, optional transcripts) before launch, and the Play data-safety form too.
8. Existing services (auth, Razorpay, WhatsApp) were not changed except `/api/live` (new `voice-test` branch) and the Calls page (shows real calls first).

## Switch it on

1. Supabase → SQL Editor: run `supabase/migrations/0008_voice.sql`.
2. Founder page → AI Voice: enter the package minutes (from real costs), switch it on.
3. Vapi: create an account; create a **Custom Credential** of type Bearer Token (the token is your choice). Put the token into Vercel as `VAPI_WEBHOOK_SECRET`, the Vapi private key as `VAPI_API_KEY`, and the credential id as `VAPI_WEBHOOK_CREDENTIAL_ID`. Redeploy.
4. Buy/rent an Indian number from a telephony provider, connect it to Vapi (SIP trunk), and note Vapi's phone-number id.

## Test a real incoming call

1. A test client: signs in, saves the assistant on `/app/voice`, pays for the voice service, requests a number.
2. Founder page → AI Voice → enter the number and Vapi's number id → **Save number** → **Set up with provider** (status becomes *ready for testing*; if Vapi refuses, it becomes *failed* with the reason).
3. Call the number from a phone. Listen to the greeting, language and voice; ask something from the business facts and something not in them (it should not invent).
4. Check `/app/calls` shows the call after hang-up, and the minutes on `/app/voice`.
5. Only then press **Real test call passed → Active**.
