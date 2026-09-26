# Veer Cinema — movie tickets for Army personnel

A mobile-first movie ticket booking platform for serving Army personnel and their families at station / garrison theatres.

> **Prototype notice.** Service verification uses a **mock registry** and payments are **simulated**. The platform is independent and is not affiliated with, or endorsed by, the Indian Army, the Ministry of Defence or any government body. It uses no official logos.

The booking rules and the Kerketta Auditorium data follow the reference site (`kerkettabooking.netlify.app`). That includes the exact seat chart (OFFRs rows L–N, JCO family/single blocks, OR rows A–K with offline-reserved and media seats, and 11 VIP sofas that can't be booked), the weekly schedule (Thursday closed, two shows on Sunday), the 4-seat cap, the Friday-to-Thursday screening week, **one booking per mobile number per week**, and the current movie and screening history. None of the reference site's code or assets was copied.

## Booking flow

Login / registration → service verification → browse movies → movie → date → theatre → show time → seats (held for 10 minutes) → booking summary → payment → e-ticket with QR code.

## Project structure

```
army-cinema/
├─ index.html                 SEO + Open Graph defaults
├─ public/                    favicon, og-image, _redirects (Netlify SPA), robots.txt
│  └─ images/hero/hero.jpg    ← hero photograph (add this file)
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
   │  ├─ payments/            PaymentGateway interface + simulated gateway
   │  └─ errors.ts            error codes → friendly messages
   ├─ context/                Auth (session expiry), Toast, Booking draft
   ├─ hooks/                  useAsync (live reload), useCountdown, useMediaQuery
   ├─ lib/                    dates (Fri–Thu week), formatting, validation, sanitising, SEO
   ├─ components/
   │  ├─ ui/                  Button, Field (Input/Select/Textarea), Modal, Badge, States, Poster, Stepper, Logo
   │  ├─ layout/              Navbar + mobile tab bar, Footer, DemoBanner, Guards, AppLayout
   │  ├─ home/                Hero, QuickBook
   │  ├─ movies/              MovieCard, MovieGrid, SearchBar, FilterPanel, TrailerModal
   │  ├─ booking/             DateSelector, ShowTimeSelector, TheatreCard, SeatMap/Seat, BookingSummary, HoldTimer
   │  ├─ ticket/              TicketCard, QRCode, ticketImage (PNG download)
   │  └─ admin/               AdminLayout/Sidebar, DashboardCard, Charts, DataTable, ConfirmDialog
   └─ pages/                  Home, Movies, MovieDetails, Theatres, TheatreDetails, SelectShow,
                              SeatSelection, CheckoutSummary, Payment, BookingConfirmation,
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
| Station Admin | `admin@veercinema.demo` | `Admin@1234` | `/admin` |

Registration test records (mock registry): `IC-80112M` Neha Sharma, `IC-69954P` Vikram Rathore, `JC-461122L` Gurpreet Singh, `15522871W` Anil Kumar, `15610044H` Pooja Rawat. Any other correctly formatted ID registers as *pending*.

Payment test values: UPI `fail@upi` or card `4000 0000 0000 0002` simulate a decline. Any other value succeeds. OTP codes are shown on screen in demo mode because no SMS is sent.

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

- **Public:** premium home (hero, now showing, featured spotlight, coming soon, theatres, how it works, booking rules, tribute band); movie search, genre and language filters, sorting and category tabs; movie details (trailer modal, cast, theatres, dates, timings); theatres list and details with weekly schedule and enclosure capacities.
- **Booking:** date strip → theatre → show-time cards with live availability; enclosure picker; seat map with screen indicator, VIP row, family/single markers, booked / reserved / media / selected states, arrow-key navigation, touch-sized seats with "fit hall" overview on phones; 4-seat cap; live occupancy refresh; 10-minute seat hold with countdown; summary; UPI / card / pay-at-counter; failed-payment retry; confirmation with QR ticket (`BOOKING-ID: ARM-2026-000123`, no personal data), PNG download and print.
- **Rules:** one booking per mobile number per Fri–Thu week, enforced at hold and again at confirmation, with an early warning on show selection. Rank-category enclosures (Officers / JCOs / Other Ranks). Cancelling a booking releases the seats and frees the weekly slot.
- **Accounts:** login with password or one-time code (by Service ID, mobile or email); two-step registration with demo service verification (verified / pending / rejected); forgot password; profile (edit, masked Service ID, this week's status, history); My Bookings (upcoming / previous, view ticket, cancel); 2-hour sliding session with expiry notice.
- **Admin:** dashboard (bookings, today, users, revenue, movies, theatres, busiest day, most popular movie, bookings-per-day chart with a table view, tickets by enclosure, upcoming-show occupancy); movie CRUD with poster upload (resized to WebP); theatre CRUD with layout and weekly-schedule editor; show create / edit / cancel plus "generate from schedule"; bookings search / filter / cancel; user verification approvals.
- **Quality:** friendly error, empty, loading and skeleton states; offline detection; protected routes; input validation and sanitising; accessible labels, focus rings, skip link, focus-trapped modals, reduced-motion support; per-page titles, descriptions and Open Graph tags; route-level code splitting.

## Remaining limitations

- **Verification is mock only.** Connecting a real, authorised service-record API needs a server-side integration (for example a Supabase Edge Function) and an authority's approval.
- **Payments are simulated.** A real gateway (Razorpay, PayU, …) must create orders server-side and verify signatures in a webhook that calls `confirm_booking`. The prototype RPC trusts the client's payment result.
- **Demo mode stores data in the browser** (per device). It exists for demonstration, not production.
- **The Supabase adapter hasn't been run against a live project** in this build. The SQL and client were written and type-checked against the schema, but no live project was connected.
- `resolve_login_email` (login by Service ID or mobile) should be rate-limited before production. Phone OTP needs an SMS provider in Supabase Auth; this build sends email codes.
- **Posters are generated placeholders** until real artwork is uploaded. The hero photograph must be added at `public/images/hero/hero.jpg`.
