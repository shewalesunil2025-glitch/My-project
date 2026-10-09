# IBAX AI — notes for Claude

**The owner's plan lives in `docs/ROADMAP.md`.** When the owner says "road map" / "roadmap" (or asks what's next), read it, start from the **Where we are** table, and take the next pending item — then update that table in the same PR when an item moves.

How the owner likes to work:
- Reply in Hinglish (Hindi in Latin script), simple words, no jargon.
- One task at a time ("aek aek kam"): give one step, wait for "ho gaya", then the next.
- For anything the owner does by hand (Supabase, Vercel, n8n, Google, Meta), give click-by-click steps, and ask for a screenshot if they get stuck.
- Never ask the owner to paste keys, passwords or tokens into chat. They go straight into Vercel environment variables or n8n credentials. Never commit secrets to the repo.
- Prefer free options; say plainly when something costs money.

Project facts:
- Next.js app on Vercel project `my-project-98t4` (https://my-project-98t4.vercel.app/app), auto-deploys `main`. Ship changes as a PR and merge it.
- Services are sold only when their automation is live: `liveServices` in `src/content/app/services.ts`.
- Accounts and workspaces: Supabase (`src/lib/app/cloud.ts`, schema in `supabase/migrations/`). Without the Supabase env vars the app falls back to this-device-only preview mode.
- Automations: n8n Cloud `ibaxai.app.n8n.cloud`; the app sends `service.activated` via `/api/automation/activate`. WhatsApp workflows are described in `docs/ROADMAP.md`.
