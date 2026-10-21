# Kerketta Auditorium — movie ticket booking

A mobile-first movie ticket booking site for **Kerketta Auditorium**, for serving Army personnel and their families.

> **Prototype notice.** Service verification uses a **mock registry**. There is no online payment — bookings are confirmed directly, like the reference site's offline confirmation. The platform is independent and is not affiliated with, or endorsed by, the Indian Army, the Ministry of Defence or any government body. It uses no official logos.

The booking rules and the Kerketta Auditorium data follow the reference site (`kerkettabooking.netlify.app`). That includes the exact seat chart (OFFRs rows L–N, JCO family/single blocks, OR rows A–K with offline-reserved and media seats, and 11 VIP sofas that can't be booked), the weekly schedule (Thursday closed, two shows on Sunday), the 4-seat cap, the Friday-to-Thursday screening week, **one booking per mobile number per week**, and the current movie and screening history. None of the reference site's code or assets was copied.

## Booking flow

Everything starts on one page, like the reference: the Kerketta Auditorium heading and the movie now showing → choose a day → show time → enclosure (OFFRs / JCOs / ORs) → seats (held for 10 minutes) → confirm → e-ticket with QR code. No prices or online payment are shown. Login and service verification are required to confirm.

## Project structure

```
army-cinema/
├─ index.html                 SEO + Open Graph defaults
├─ public/                    favicon, og-image, _redirects (Netlify SPA), robots.txt
├─ scripts/generate-seed.ts   builds supabase/seed.sql from the same layouts the UI uses
├─ supabase/
│  ├─ migrations/0001_schema.sql   tables, RLS, booking RPCs, storage bucket
│  └─ seed.sql                     demo registry, movies, theatres, seats, shows
└─ src/
   ├─ App.tsx                 routes (lazy-loaded pages), providers
   ├─ types.ts                domain model
   ├─ data/                   layouts.ts (seat charts), seed.ts (demo data)
   ├─ services/
   │  ├─ api/                 Api interface + demoApi (browser storage) + supabaseApi
      │  └─ errors.ts            error codes → friendly messages
   ├─ context/                Auth (session expiry), Toast, Booking draft
   ├─ hooks/                  useAsync (live reload), useCountdown, useMediaQuery
   ├─ lib/                    dates (Fri–Thu week), formatting, validation, sanitising, SEO
   ├─ components/
   │  ├─ ui/                  Button, Field, Modal, Badge, States, Poster, Stepper, Logo, KerkettaSign
   │  ├─ layout/              Navbar + mobile tab bar, Footer, DemoBanner, Guards, AppLayout
   │  ├─ home/                Hero (Kerketta heading), WavingFlag (animated tricolour), WavingFlag (animated tricolour)
   │  ├─ movies/              TrailerModal
   │  ├─ booking/             DateSelector, ShowTimeSelector, SeatMap/Seat, BookingSummary, HoldTimer
   │  ├─ ticket/              TicketCard, QRCode, ticketImage (PNG download)
   │  └─ admin/               AdminLayout/Sidebar, DashboardCard, Charts, DataTable, ConfirmDialog
   └─ pages/                  Home (booking), SeatSelection, CheckoutSummary (confirm), BookingConfirmation,
                              Login, Register, ForgotPassword, MyBookings, Profile, NotFound, admin/*
```

## Technologies

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Framer Motion · Lucide icons · React Router 7 · Supabase (Auth, PostgreSQL, Storage, RLS) · `qrcode`. Fonts (Inter, Barlow Condensed) are self-hosted through Fontsource. No other runtime libraries are used.

## Environment variables

Copy `.env.example` to `.env.local`. All values are public and end up in the browser, so **never** put a `service_role` key or payment secrets here.

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL. Leave empty to run in **demo mode** |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `VITE_SUPABASE_POSTER_BUCKET` | Storage bucket for posters (default `posters`) |
| `VITE_SITE_URL` | Canonical site URL |

## Run locally

```bash
cd army-cinema
npm install
npm run dev        # http://localhost:5173 — demo mode, seeded automatically
npm run build      # typecheck + production build into dist/
npm run lint
```

Demo data lives in the browser's localStorage. To reset it, clear site data for the page.

## Demo login credentials (demo mode)

| Who | Login (mobile / Service ID / email) | Password | Notes |
| --- | --- | --- | --- |
| Maj Arjun Mehta — Officer | `9876500001` / `IC-78231K` | `Demo@1234` | Past bookings only; can book |
| Sub Rakesh Yadav — JCO | `9876500002` / `JC-452190P` | `Demo@1234` | **Already booked this week** → shows the weekly limit |
| Hav Manoj Singh — OR | `9876500003` / `15478231F` | `Demo@1234` | Can book |
| Nk Suresh Patil — OR | `9876500004` | `Demo@1234` | Verification *pending*; can't book until an admin approves |
| Station Admin | `admin@kerketta.demo` | `Admin@1234` | `/admin` |

Registration test records (mock registry): `IC-80112M` Neha Sharma, `IC-69954P` Vikram Rathore, `JC-461122L` Gurpreet Singh, `15522871W` Anil Kumar, `15610044H` Pooja Rawat. Any other correctly formatted ID registers as *pending*.

OTP codes are shown on screen in demo mode because no SMS is sent.

## Supabase setup

1. Create a Supabase project.
2. In the SQL editor, run `supabase/migrations/0001_schema.sql`, then `supabase/seed.sql`. To regenerate the seed after changing layouts, run `node --experimental-strip-types scripts/generate-seed.ts`.
3. In **Authentication → Providers**, enable Email. For one-time-code login and password reset, add `{{ .Token }}` to the *Magic Link* and *Reset Password* email templates.
4. Put the project URL and anon key in `.env.local`, then restart `npm run dev`.
5. Register your own account in the app, then promote it to admin:
   `insert into admin_users (user_id) select id from profiles where email = 'you@example.com';`

How the database protects bookings:
- `booking_seats` has primary key `(show_id, seat_code)`, so the same seat can't be double-booked.
- A partial unique index on `bookings (mobile, week_start) where status = 'confirmed'` enforces one booking per mobile number per week.
- `hold_seats` / `confirm_booking` / `cancel_booking` are `SECURITY DEFINER` RPCs that run every check inside a single transaction. Row Level Security limits users to their own profile and bookings, catalogue writes are admin-only, and the verification registry can't be read directly.

## Deploy

- **Netlify:** base directory `army-cinema`, build command `npm run build`, publish directory `army-cinema/dist`. `public/_redirects` handles SPA routes.
- **Vercel:** root directory `army-cinema`. `vercel.json` rewrites all routes to `index.html`.
- Set the `VITE_*` variables in the host's dashboard.

## Implemented features

- **Home = booking page:** large Kerketta Auditorium heading with an animated waving tricolour (canvas, Flag-Code-correct proportions and 24-spoke Ashoka Chakra; static for reduced motion), the Kerketta sign in the header corner, now-showing movie card (genre, duration, language, director, cast, trailer), day strip (Thursday shows *Closed*), show times with live seats left, enclosure cards with free seats, booking rules, recently screened movies, tribute band.
- **Booking:** date strip → show-time cards with live availability; enclosure picker; seat map with screen indicator, VIP row, family/single markers, booked / reserved / media / selected states, arrow-key navigation, touch-sized seats with "fit hall" overview on phones; 4-seat cap; live occupancy refresh; 10-minute seat hold with countdown; summary with Confirm Booking (no payment step); confirmation with QR ticket (`BOOKING-ID: ARM-2026-000123`, no personal data), PNG download and print.
- **Rules:** one booking per mobile number per Fri–Thu week, enforced at hold and again at confirmation, with an early warning on show selection. Rank-category enclosures (Officers / JCOs / Other Ranks). Cancelling a booking releases the seats and frees the weekly slot.
- **Accounts:** login with password or one-time code (by Service ID, mobile or email); two-step registration with demo service verification (verified / pending / rejected); forgot password; profile (edit, masked Service ID, this week's status, history); My Bookings (upcoming / previous, view ticket, cancel); 2-hour sliding session with expiry notice.
- **Admin:** dashboard (bookings, today, users, tickets issued, movies, busiest day, most popular movie, bookings-per-day chart with a table view, tickets by enclosure, upcoming-show occupancy); movie CRUD with poster upload (resized to WebP); auditorium settings with the weekly-schedule editor; show create / edit / cancel plus "generate from schedule"; bookings search / filter / cancel; user verification approvals.
- **Quality:** friendly error, empty, loading and skeleton states; offline detection; protected routes; input validation and sanitising; accessible labels, focus rings, skip link, focus-trapped modals, reduced-motion support; per-page titles, descriptions and Open Graph tags; route-level code splitting.

## Remaining limitations

- **Verification is mock only.** Connecting a real, authorised service-record API needs a server-side integration (for example a Supabase Edge Function) and an authority's approval.
- **No payment.** Bookings are confirmed without payment, as on the reference site. The database still stores per-enclosure prices (hidden in the UI) in case paid tickets are needed later.
- **Demo mode stores data in the browser** (per device). It exists for demonstration, not production.
- **The Supabase adapter hasn't been run against a live project** in this build. The SQL and client were written and type-checked against the schema, but no live project was connected.
- `resolve_login_email` (login by Service ID or mobile) should be rate-limited before production. Phone OTP needs an SMS provider in Supabase Auth; this build sends email codes.
- **Posters are generated placeholders** until real artwork is uploaded.
- **The Kerketta sign is an original placeholder badge** (`src/components/ui/KerkettaSign.tsx`); replace it with the auditorium's own sign if one is available.
