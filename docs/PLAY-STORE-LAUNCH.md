# ibaxai — Play Store launch checklist

The owner's list of everything before ibaxai goes on the **Google Play Store** (Android).
The **Apple App Store** comes later ($99/year). Work one item at a time, tick it here and in the
**Where we are** table of `docs/ROADMAP.md` in the same PR.

Legend: 👤 the owner does it by hand · 🤖 Claude does it · ✅ done · ⏳ in progress · ⬜ not started

**Next:** owner creates the app in Play Console and uploads the `.aab` (B2) → B3 fingerprints → B4 (payments decision) → B10 (support email).

Plan: **Part A + B in about a week → Part C (14 days of testing) → Part D launch.**

## Part A — Finish what's already started

| # | Task | Who | Status | Notes |
|---|---|---|---|---|
| A1 | Run `supabase/migrations/0005_whatsapp_reliability.sql` in Supabase → SQL Editor | 👤 | ✅ | Run on 18 Oct. Enables the Inbox's real WhatsApp chats, "Turn Bot Back On" and the link-health checks |
| A2 | Real ₹499 payment test (a friend pays), then refund it from Razorpay | 👤 | ✅ | 18 Oct: a friend paid ₹499 for Google Reviews; captured, settles 21 Oct. Verify now also captures "authorized" payments |
| A7 | Forgot password (email or mobile number) with Gmail SMTP in Supabase | 👤 + 🤖 | ✅ | 19 Oct: owner tested, works. Move to Brevo if volume grows |
| A3 | Autopay: Razorpay webhook to `/api/pay/webhook` + `RAZORPAY_WEBHOOK_SECRET` in Vercel | 👤 + 🤖 | ⬜ | Claude gives click-by-click steps; the secret goes straight into Vercel |
| A4 | Hindi + Marathi voice for "ibaxai in 2 minutes" with "आइबैक्स" said right | 🤖 | ✅ | Live since 18 Oct (en, hi, mr) |
| A5 | Security: move the n8n secrets into n8n credentials, then rotate them (`docs/SECRET-ROTATION.md`) | 👤 + 🤖 | ⬜ | Before more clients join |
| A6 | Customer Support tested end to end on a real client website | 👤 + 🤖 | ⬜ | Live since 17 Oct |

## Part B — Play Store preparation

| # | Task | Who | Status | Notes |
|---|---|---|---|---|
| B1 | Google Play **developer account** ($25 one-time ≈ ₹2,100) + identity check (PAN/Aadhaar) | 👤 | ✅ Personal account: paid 19 Oct, ID uploaded, Android-device check done 20 Oct | Personal account → 12 testers × 14 days rule (C1). Organization account needs a D-U-N-S number and skips that rule |
| B2 | Android app: wrap the live app (`/app`) as a Trusted Web Activity (Bubblewrap), package `com.ibaxai.app`, signed `.aab` | 🤖 + 👤 | ⏳ | ✅ Built and signed 20 Oct (`ibaxai-1.0.0.aab`, version 1.0.0 / code 1, minSdk 24); the owner has the file and the upload key (kept private, not in the repo). Next: owner creates the app in Play Console and uploads it to Internal/Closed testing. The app keeps updating from the website — no store update for most changes |
| B3 | `/.well-known/assetlinks.json` so Android trusts www.ibaxai.com (no browser bar) | 🤖 + 👤 | ⏳ | Live at www.ibaxai.com/.well-known/assetlinks.json (empty `[]` for now). After B1: copy the SHA-256 fingerprints from Play Console → App integrity into Vercel env `ANDROID_SHA256_FINGERPRINTS` (comma-separated) and redeploy |
| B4 | **Payments rule:** inside the Play app, digital subscriptions must use Google Play Billing (fee ~15%) — decide: send buying to the website, or add Play Billing | 👤 decides, 🤖 builds | ⬜ | Most important policy item; get it right before review |
| B5 | Account deletion: in-app (Settings → Delete account ✅) **and** a public web page explaining how (`/privacy#data-deletion` ✅) | 🤖 | ✅ | Play requires both |
| B6 | Store listing: name "ibaxai", short description (80 chars), full description (4000), in English + Hindi | 🤖 writes, 👤 approves | ✅ | `docs/play-store/listing.md` — name "ibaxai: AI Business Assistant", English + Hindi, release notes. Owner reads once before pasting |
| B7 | Graphics: icon 512×512 ✅ (`/icons/`), feature graphic 1024×500, 4–8 phone screenshots, optional promo video (YouTube) | 🤖 | ✅ | `docs/play-store/assets/`: 8 phone screenshots (1080×1920, sample clinic "CareWell Clinic", no prices) + feature graphic 1024×500. Promo video: the "ibaxai in 2 minutes" tour once on YouTube |
| B8 | Data safety form + content rating (IARC) + target audience 18+ + category "Business" | 🤖 prepares, 👤 submits | ✅ (prepared) | `docs/play-store/data-safety.md` — every answer to copy into Play Console; matches `/privacy` |
| B9 | Privacy Policy / Terms updated for the Android app and WhatsApp linking (what data, why, how to unlink) | 🤖 | ✅ | `/privacy` (WhatsApp linking, Android app sections) and `/terms` (WhatsApp section), dated 18 Oct 2026 |
| B10 | Support email + website on the listing (`siteConfig.email`, www.ibaxai.com) | 👤 | ⬜ | Must be monitored |
| B11 | Meta Business Verification (Udyam certificate, business email/website) | 👤 | ⏳ Submitted 21 Oct: business portfolio "Ibaxai" (legal name IBAXAI, sole proprietorship), Meta app "ibaxai" (WhatsApp use case, unpublished), Udyam certificate uploaded. Waiting for Meta (2–14 days) | Opens the official WhatsApp API (no ban risk, "Connect with Facebook" + coexistence) **and** Instagram/Facebook. 2–6 weeks — start early. Not needed for the Play launch itself |
| B12 | **Remind the owner:** after launch, switch the personal Play account to an **organization** account ("IBAXAI" shown on the store): get a free D-U-N-S number first | 👤 + 🤖 reminds | ⬜ | Owner chose personal first (19 Oct) and asked to be reminded. Reminder scheduled for 16 Nov. **D-U-N-S requested 20 Oct** (free, via Apple's D-U-N-S lookup; D&B emails the number in ~5 working days — never pay for D&B add-ons) |

## Part C — Testing (about 14 days)

| # | Task | Who | Status | Notes |
|---|---|---|---|---|
| C1 | Closed test with **12+ testers for 14 days** (their Gmail addresses; they install from the Play test link and keep it installed) | 👤 invites, 🤖 sets up | ⬜ | Required for new personal accounts before production |
| C2 | Testers try: sign up (email + Google), free trial, WhatsApp link, Customer Support, website builder, payment | 👤 | ⬜ | Collect issues with screenshots |
| C3 | Fix everything testers report; re-check on a small (5") and a large phone | 🤖 | ⬜ | |

## Part D — Launch

| # | Task | Who | Status | Notes |
|---|---|---|---|---|
| D1 | Apply for production access (Play asks a few questions about the test) | 👤 | ⬜ | |
| D2 | Production release with staged rollout (20% → 100%) | 👤 + 🤖 | ⬜ | |
| D3 | Announce: website "Get it on Google Play" badge, WhatsApp status, Instagram (logo video with the ting-ting-TING sound) | 🤖 + 👤 | ⬜ | |

## Later (after Play Store)

- Apple App Store (Apple Developer, $99/year) and Apple sign-in.
- Official WhatsApp Cloud API for all clients once Meta approves (B11).
- Instagram / Facebook / YouTube automations (need Meta / Google approvals).
- Email Automation (needs the owner's domain registrar).
- AI Voice (phone numbers and call minutes cost money).
