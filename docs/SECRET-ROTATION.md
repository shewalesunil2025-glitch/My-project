# Rotating the n8n ↔ app secrets (no downtime)

The app now accepts two secrets at once: `N8N_WEBHOOK_SECRET` (current) and `N8N_WEBHOOK_SECRET_NEXT` (new). Nothing has been rotated yet. Never paste secret values in chat.

1. Make a new random value (for example `openssl rand -hex 32`) on your computer.
2. Vercel → Project → Settings → Environment Variables: add `N8N_WEBHOOK_SECRET_NEXT` = the new value → Redeploy. Both old and new now work.
3. n8n → Credentials: create a Header Auth credential (`x-ibax-secret`) with the new value, and switch each HTTP node of the three workflows to it. Save and test one message.
4. When all nodes use the credential: in Vercel set `N8N_WEBHOOK_SECRET` = the new value, delete `N8N_WEBHOOK_SECRET_NEXT`, redeploy.
5. Do the same for the Evolution webhook token (`N8N_EVOLUTION_WEBHOOK_URL`): change the token in the n8n webhook node and the Vercel variable together, then reconnect is not needed for new numbers; existing instances need their webhook URL updated in Evolution.
6. Treat the old values as exposed (they sit in the workflows' history). Rotating them is step 4.
