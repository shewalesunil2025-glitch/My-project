# WhatsApp: n8n changes (NOT applied yet — needs owner approval)

The live workflows are untouched. Apply these only after the PR is merged, migration `0005_whatsapp_reliability.sql` is run in Supabase, and Vercel has deployed. Do it in n8n by hand (or ask Claude to do it with approval). Every call sends header `x-ibax-secret` from an **n8n credential** (Header Auth), never typed into a node.

Base URL: one fixed value, `https://www.ibaxai.com` (store as n8n variable/credential, not taken from the webhook payload).

## AI Replies workflow
1. **Right after "Customer message?"**: HTTP POST `/api/whatsapp/gate` with `{instance, phone, customer_name, message, message_id}` (`message_id` = Evolution `data.key.id`).
   - Continue only if the answer has `allow: true`. `duplicate`, `paused`, `limit` → stop quietly.
2. **Send reply on WhatsApp**: use a fixed Evolution URL and an n8n credential for the API key. Ignore `server_url` / `apikey` from the webhook body. Put an extra gate call right before sending to catch an owner reply made while the AI was thinking.
3. **After sending** (success and failure branches): HTTP POST `/api/whatsapp/deliver` with `{instance, phone, customer_name, reply, delivered: true|false, reply_id, intent, needs_human, lead_temp, interest}`. Add `lead_temp` (hot/warm/cold) and `interest` to the AI's JSON reply format.
4. **AI error branch** (replace the canned "AI busy" message): HTTP POST `/api/whatsapp/failure` with `{instance, phone, customer_name, kind: "quota"|"timeout"|"error"}`. Do not send a fake reply to the customer.
5. "Bot on for this customer?" can stay as is; the app now also blocks via the gate.

## Activation workflow
- Owner phone and ignore list: use the full number with country code. Stop adding `91` to every 10-digit number; only add it when the owner's business country is India.

## Both workflows
- Move the webhook token and the `x-ibax-secret` value out of node parameters into credentials.
- Enable "retry on fail" with max 3 tries and a wait (already on for the AI node). No loops.
