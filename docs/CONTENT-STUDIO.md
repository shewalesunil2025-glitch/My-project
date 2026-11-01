# Autonomous Content Studio — founder's daily AI Reel / Short (1 Nov 2026)

One video a day for ibaxai's own Instagram and YouTube. The system finds the topic, writes the script, makes the pictures, voice, subtitles, video, thumbnail, caption and SEO, and asks the founder. **Nothing is published before "Approve & publish".**

## Facts that changed the ChatGPT prompt
| Prompt said | Reality (checked 1 Nov 2026) | What we do |
|---|---|---|
| App on Cloudways | The app runs on **Vercel** (project my-project-98t4); the WhatsApp server is the Bluehost VPS | Server steps on Vercel; the video is made on the **VPS** (Vercel can't run ffmpeg for minutes) |
| Google Veo API | The Veo preview models in the Gemini API were **shut down on 22 Oct 2026**; the replacement there, Gemini Omni Flash, is **paid only** (Google's page: about **$0.10 a second**, so a 30 s video ≈ $3 ≈ ₹255, daily ≈ ₹7,700 a month, more with regenerates). Our Gemini billing is not active | **Free default:** AI pictures (Gemini image → free Cloudflare FLUX → Pollinations) with a slow zoom, Gemini voice, subtitles, made with ffmpeg. AI-generated video clips can be added later as a paid option, only with the owner's yes |
| Trending audio | No official API gives trending Instagram audio | No trending audio. Optional background music only from a file the owner has the rights to (`STUDIO_MUSIC`) |
| Trend research | Gemini with Google Search (grounding) when the key allows it | If search isn't available, the topic is marked "idea, not news" on the dashboard, never "trending" |

## What is built (code)
- Tables: `supabase/migrations/0009_studio.sql` — `studio_jobs` (one per day and attempt), `studio_publish` (one per job **and platform**: a second post is impossible), `studio_events` (log), private bucket `studio` (assets only through signed links).
- Rules: `src/lib/studio/core.ts` (statuses, what may follow what, cleaning hashtags/tags/plan).
- AI steps: `src/lib/server/studio/generate.ts` (research, plan JSON, pictures, voice per scene, thumbnail background).
- Job runner: `src/lib/server/studio/jobs.ts` (one step per call, 3 tries per step, render hand-off, approve / regenerate / reject / retry publish, notifications).
- Publishing: `src/lib/server/studio/publish.ts` — Instagram Reels (container → wait → publish) and YouTube (resumable upload + thumbnail), written from the official docs, **never run against the real accounts yet**.
- APIs: `/api/studio` (founder dashboard), `/api/studio/run` (n8n / cron: `start`, `advance`), `/api/studio/render` (video worker: `claim`, `finish`).
- Dashboard: `/app/founder/studio` (video preview, script, captions, SEO, thumbnail, sources, log, history; Approve & publish / Regenerate / Reject; retry).
- Video worker: `scripts/studio-worker.mjs` (ffmpeg; tested here with test pictures and tones: 1080×1920 MP4 with Hindi subtitles and a 1280×720 thumbnail).
- Tests: `src/lib/server/studio/studio.test.ts` (16 tests: once a day, step order, retries, render timeout, approval needed, one post per platform, partial failure retry, processing wait, not-connected, reject, regenerate, cleaning).

## Not done / not tested (honest)
1. **No real run yet**: the migration is not run, the worker is not on the VPS, no real Instagram or YouTube post was made.
2. **Instagram**: needs an Instagram professional account and a token with content-publish permission for the ibaxai Meta app (our app has WhatsApp permissions only today). For our own account the app's own roles may be enough; for anything beyond that Meta App Review is needed.
3. **YouTube**: needs a Google Cloud OAuth client with the YouTube Data API on, and a refresh token for the ibaxai channel. Custom thumbnails need a verified channel (phone verification). Upload quota: 100 uploads a day.
4. Browser push and Telegram notifications are not built (in-app notification + email are).
5. The n8n daily trigger is optional: the VPS cron below does the same for free.

## Switch it on (owner, one step at a time)
1. Supabase → SQL Editor: run `0009_studio.sql`.
2. VPS: `apt install ffmpeg fonts-noto-core nodejs` (if missing), copy `scripts/studio-worker.mjs`, then cron: `*/10 * * * *` worker, and `0 2 * * *` worker with `--start` (7:30 India time). `IBAX_SECRET` = the same value as Vercel's `N8N_WEBHOOK_SECRET` (typed on the VPS, never in chat).
3. Open `/app/founder/studio` → "Make today's video" to test without the cron.
4. Later: Instagram and YouTube keys in Vercel (`.env.example`), then the first real "Approve & publish".
