# Google Play — Data safety, content rating and app content answers

Prepared answers for Play Console → **Policy and programs → App content**. They match
`/privacy` (updated 18 Oct 2026). If the app changes what it collects, update both.

## Data safety

**Does your app collect or share any of the required user data types?** Yes.
**Is all of the user data collected by your app encrypted in transit?** Yes (HTTPS everywhere).
**Do you provide a way for users to request that their data is deleted?** Yes — in the app
(Settings → Privacy & data → Delete account) and at https://www.ibaxai.com/privacy#data-deletion.

"Shared" in Play's sense means given to a *third party for its own use*. Our service providers
(Vercel, Supabase, n8n, Gemini, Razorpay) process data for us, which Play does **not** count as
sharing. So every row below is **Collected: Yes, Shared: No**.

| Data type (Play's names) | Collected | Optional? | Why (Play's purposes) |
|---|---|---|---|
| Personal info → Name | Yes | Required | App functionality, Account management |
| Personal info → Email address | Yes | Required | App functionality, Account management, Developer communications |
| Personal info → User IDs (account ID) | Yes | Required | App functionality, Account management |
| Personal info → Phone number | Yes | Required | App functionality, Account management |
| Personal info → Address | Yes | Optional (business address) | App functionality |
| Personal info → Other info (business details: name, hours, services, prices, FAQs) | Yes | Required | App functionality |
| Financial info → Purchase history | Yes | Optional (only if they buy) | App functionality, Account management |
| Messages → Other in-app messages (IBAX chat, customer WhatsApp messages and replies) | Yes | Optional (only if WhatsApp/Support is on) | App functionality |
| Photos and videos → Photos | Yes | Optional (attached in chat, logo) | App functionality |
| Audio → Voice or sound recordings | Yes | Optional (only when the mic is tapped) | App functionality |
| Files and docs | Yes | Optional (attached in chat) | App functionality |
| Contacts (the business's customers: names and numbers of leads) | Yes | Optional | App functionality |
| App activity → App interactions (the activity history of what the owner did) | Yes | Required | App functionality |
| App activity → Other user-generated content (leads, website text) | Yes | Optional | App functionality |
| App info and performance → Crash logs / Diagnostics | Yes | Required | App functionality, Analytics (Play counts fixing errors as Analytics) |

**Not collected:** precise/approximate location, the phone's contact list, calendar, SMS, call logs, web
browsing history, health, financial account numbers (payments go through Razorpay — we never see
card or bank details), device or advertising IDs.

**Processed ephemerally?** Voice and attached files: Yes (sent to the AI to read and not kept,
except a small preview in the chat).

## Content rating (IARC questionnaire)

- Category: **Utility, Productivity, Communication, or Other**.
- Violence, sexuality, language, controlled substances, gambling: **No** to all.
- Does the app let users interact or exchange content? **Yes** — business owners chat with
  their own customers (WhatsApp replies). Users can't find or message strangers inside the app.
- Shares user location with others? **No**. Digital purchases? **Yes** (services, sold on the website — see B4).
- Expected rating: **Everyone / 3+** (IARC) — the audience is still set to 18+ below.

## Target audience and content

- Target age: **18 and over** only. Not designed for children. No ads to children.
- **Ads:** the app contains no ads.
- **App access:** parts need sign-in — give the reviewer a test login (create a test account
  with the sample business; put the email and password only in the Play Console form, never in
  chat or in the repo).
- **News app:** No. **COVID-19 app:** No. **Government app:** No.
- **Financial features:** No (we don't offer loans, banking or trading).
- **Health:** No.
- **Data deletion:** URL above.

## Permissions the Android app (TWA) asks for

Only what the website already uses: Internet; microphone when the user taps the mic; file
picker when the user attaches a file; notifications (Android 13+) only if the user allows. No
contacts, SMS, location or call-log permissions.
