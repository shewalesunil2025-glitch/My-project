# Meta App Review — WhatsApp number + OTP for every client

Until Meta approves the app, only the app's admins, developers and testers can finish the Embedded Signup (number + OTP). After approval every client can. The server only lets the logins in `META_WA_TEST_EMAILS` finish a signup until then; it is switched on for everyone with `NEXT_PUBLIC_META_WA_LIVE=1` (Vercel → Redeploy), and the link code / QR disappears.

App: ibaxai, app ID `1810020233450398`. Business verification: Approved. Tech Provider: Independent. App is Live. Embedded Signup configuration: "ibaxai WhatsApp signup" (Cloud API). Webhook: `https://www.ibaxai.com/api/whatsapp/cloud/webhook` (`messages`, `smb_message_echoes`).

## Before you submit (owner)

1. Make a review login in ibaxai (sign up with an email the owner controls, e.g. `+playreview`). Reviewers use it, so keep it working. Never put its password in this repository.
2. Test the whole flow once yourself on a spare number: `www.ibaxai.com/app/settings` → Connected accounts → WhatsApp → Connect with number + OTP (it shows for the login emails listed in Vercel `META_WA_TEST_EMAILS`) → "WhatsApp linked" → a customer sends a message → IBAX replies → create a template.
3. Record one screen video (2–4 minutes, 1080p, English or Hindi with English captions) of exactly that flow (script below). Upload it to the review request.

## Permissions to request (Advanced access)

| Permission | Why we need it (paste this) |
|---|---|
| `whatsapp_business_management` | ibaxai lets a small business connect its own WhatsApp number through Embedded Signup. We read the account and phone number the business shares, subscribe our app to its webhooks, and create and list message templates for it, so the business can follow up with customers inside WhatsApp's rules. |
| `whatsapp_business_messaging` | After the business connects its number, ibaxai's assistant (IBAX) answers the business's customers who message it on WhatsApp, and the business owner can reply from the ibaxai Inbox. We send only replies to customers who wrote first and approved templates. No bulk or unsolicited messages. |
| `business_management` | Needed by Embedded Signup to access the business account the client chooses to share. Used only to find the client's WhatsApp Business account and phone number. |

## Video script (show each step on screen)

1. www.ibaxai.com/app → log in with the review login.
2. Settings → Connected accounts → WhatsApp → **Connect with number + OTP**.
3. Meta's window opens → enter the number → enter the OTP → finish. Back in the app: "WhatsApp linked".
4. Activate **WhatsApp Automation** (or open the Inbox).
5. From a second phone, send "Hi, what are your timings?" to the linked number. Show IBAX's reply arriving, and the same chat in the ibaxai Inbox.
6. In the Inbox, the owner types a reply and sends it.
7. Message templates → New template → submit → show it listed with its status. Send an approved template to a number.
8. Show **Disconnect** (the client can unlink at any time).

## Instructions for the reviewer (paste into the form)

1. Open https://www.ibaxai.com/app and log in with the credentials given in the form.
2. Open Settings → Connected accounts → WhatsApp → press "Connect with number + OTP" (the review login's email must be in `META_WA_TEST_EMAILS` while the app is in review, so the button shows for the reviewer).
3. Complete Meta's signup window with a phone number you control.
4. Message that number from another phone: the assistant replies, and the chat appears in the Inbox.
5. Message templates: Connected accounts → WhatsApp → "Message templates".

## Data use (for the form)

- Stored: the WhatsApp business account ID, phone number ID, the business's access token (encrypted), and the chat messages shown in the client's Inbox.
- Deleted when the client disconnects or deletes their account: https://www.ibaxai.com/privacy#data-deletion
- Privacy policy: https://www.ibaxai.com/privacy · Terms: https://www.ibaxai.com/terms
