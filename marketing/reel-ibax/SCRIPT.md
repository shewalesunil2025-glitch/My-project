# IBAX Instagram reel — bolne ki script

Reel: 1080×1920, ~52 second. Upar motion graphic, neeche aap bolte hue.
Har line ke saath upar ka graphic badalta hai. Video mein yahi lines caption ki tarah aati hain, toh recording ke time video chala ke caption padh sakte ho (teleprompter jaisa).

| Time | Aap bolo | Upar kya dikhega |
|---|---|---|
| 0:00–0:04 | "Business ke saare kaam khud karte-karte thak gaye ho?" | WhatsApp 99+, Instagram DMs, YouTube comments, missed calls ke notification hilte hue |
| 0:04–0:06 | "Toh milo IBAX se — ibaxai ka AI assistant." | ibaxai logo ka reveal |
| 0:06–0:09 | "Just say it. IBAX does it." | Slogan type hota hai |
| 0:09–0:13 | "WhatsApp automation: customer ka message aaya," | Phone par customer ka message |
| 0:13–0:17 | "IBAX turant reply karta hai — 24 ghante, 7 din." | IBAX ka reply, demo booking, "3 sec", "24×7" |
| 0:17–0:20 | "Instagram automation: comment aur DM ka auto-reply," | Post ke comment par auto reply + auto DM |
| 0:20–0:24 | "aur har lead seedha aapki list mein." | Leads list mein naam aate hain, counter 128 tak |
| 0:24–0:27 | "YouTube automation: comments ke reply," | YouTube comments ke auto reply |
| 0:27–0:30 | "aur upload ki planning — sab automatic." | Upload planner (Mon/Wed/Fri/Sun) on hota hai |
| 0:30–0:34 | "Sab kuch ready-made workflows se juda hai." | Workflow: Message → IBAX AI → WhatsApp/Instagram/YouTube → Leads |
| 0:34–0:38 | "Bas ek click — aur service ON." | Switch OFF se ON |
| 0:38–0:42 | "Aur sabse khaas — IBAX ka AI voice agent." | Mic wala glowing orb, awaaz ki lehar |
| 0:42–0:46 | "Aap bolo, IBAX sunta hai, aur kaam kar deta hai." | "IBAX, aaj ke naye leads ko follow-up bhej do" → "Ho gaya! 12 leads ko message chala gaya" |
| 0:46–0:49 | "Abhi try karo — www.ibaxai.com" | Logo + website button |
| 0:49–0:52 | "Link bio mein hai. Just say it. IBAX does it." | "Link bio mein hai" |

Instagram caption idea:
> Business ka kaam ab IBAX karega 🤖 WhatsApp, Instagram, YouTube automation + AI voice agent — sab ek jagah. Just say it. IBAX does it. 👉 www.ibaxai.com (link bio mein)
> #ibaxai #AIautomation #WhatsAppAutomation #InstagramAutomation #SmallBusinessIndia

## Video dobara banana (apni awaaz ke saath)

```
node marketing/reel-ibax/render.mjs --audio meri-awaaz.m4a --out reel.mp4
```

Timings `index.html` ke upar `SCENES` aur `CAPTIONS` mein hain. Recording thodi tez/dheemi ho toh wahan seconds badal ke dobara render karo.
