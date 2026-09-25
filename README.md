# Nexa Flow AI — Website

The flagship website for **Nexa Flow AI**, an AI automation agency. The site is meant to show what the agency builds: a website, AI conversations and automation working as one system.

> **Design idea:** 2035 technology, today's simplicity.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript | Static prerendering, metadata API, route handlers |
| Styling | Tailwind CSS v4 (tokens in `src/app/globals.css`) | One design system, no runtime CSS |
| Motion | Framer Motion | Scroll-linked storytelling, layout animations, springs |
| Smooth scroll | Lenis | Wheel smoothing only. Touch stays native. Off with reduced motion |
| 3D | CSS 3D transforms + SVG + a small canvas | Depth without WebGL. Three.js was left out on purpose (performance) |
| Fonts | Geist Sans / Geist Mono (self-hosted via `geist`) | No external font requests |

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck
npm run lint
```

Copy `.env.example` to `.env.local` and fill in what you need:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, sitemap and robots |
| `NEXT_PUBLIC_BOOKING_URL` | Optional Calendly / Cal.com link. When set, every "Book a Free Demo" opens it |
| `LEAD_WEBHOOK_URL` | Optional n8n / Make / Zapier / CRM webhook that receives demo requests |

**Honest by default:** if `LEAD_WEBHOOK_URL` is not set, `/api/lead` returns `503 not_configured`. The form then tells the visitor that online booking isn't connected yet and shows the contact email. It never fakes a success message.

## Page structure

The layout, colours and motion follow a reference landing page supplied as a screen recording: a near-black canvas, warm off-white "paper" panels with rounded shoulders, one ember-orange accent, a navbar that morphs into a floating pill, and headings whose words light up as you scroll. All content is Nexa Flow AI's own.

1. **Hero** — "The business that never sleeps." Ember light beam, then a circuit board with the 3D cursor-following character where the AI chip would be. Four fixed channel tiles (call, WhatsApp, lead, booking) are wired into it; each opens a short explainer beside it.
2. **The problem** *(paper)* — "Your business shouldn't need five different tools…", the answer "We connect the flow." and the eight-step customer journey.
3. **Solutions** — bento grid of all seven solutions, each with its looping live mini-demo.
4. **Why Nexa Flow AI** — scroll-lit statement and three principles.
5. **One system** — ember dotted globe (canvas, adapted from 21st.dev "Interactive Globe") with the six connected systems and their jobs.
6. **Work / Demos** *(paper)* — "Experience it now": pick a demo and watch its sample flow run.
7. **Industries** *(paper)* — ten industries with outcome and flow, plus a custom-industry CTA.
8. **Services** — Build, Automate, Grow, Partner as pricing-style cards (no invented prices) and the three promises.
9. **How it works** — Discover → Design → Automate → Launch.
10. **About · Founder** — Sunil S.'s profile, portrait, focus areas and vision (`founder` in `src/config/site.ts`).
11. **FAQ** — native `<details>` accordion (`src/content/faq.ts`).
12. **Final CTA** — "Ready to build your next flow?" over an ember sunrise glow.

## Architecture

```
src/
  app/                  layout (metadata, fonts, MotionConfig), page, sitemap, robots, OG image, /api/lead
  config/site.ts        brand, nav, CTAs, contact, hero character config
  content/              all copy & data (flow, solutions, industries, demos, process)
  hooks/                useMediaQuery / useFinePointer, useSequence
  lib/                  cn(), lead validation + client submit
  components/
    navigation/         Navbar (morphing floating pill, mobile menu), Logo
    hero/               Hero, HeroCircuit, HeroCharacter, SolutionInfo
    scroll/             ConnectSection (problem + customer journey)
    automation/         OneSystem (dotted globe)
    solutions/          Solutions (bento), Pillars (services) + previews/* live mini-demos
    industries/         Industries
    demos/              Demos (demo playground)
    process/            Process
    about/              Founder, Faq
    cta/                Philosophy, FinalCta, DemoProvider, DemoDialog, DemoRequestForm, BookDemoButton
    footer/             Footer
    3d/                 DepthWarp (WebGL head turn), DottedGlobe
    effects/            SmoothScroll, Reveal, ScrollWords, Magnetic
    ui/                 Button / ButtonLink
```

Content lives in `src/content`, separate from the components, so copy, industries and demos can change without touching layout.

## Design system

Checked against the UI UX Pro Max skill (`.claude/skills/ui-ux-pro-max`): text contrast ≥ 4.5:1, interactive targets ≥ 24px, readable label sizes, visible focus, reduced motion.

- **Canvas:** near-black `#0a0a0b` with `ink-*` surfaces; **paper** panels `#f6f4f1` with white cards
- **Accent:** ember orange `flow` (`#ff5a1f`) for CTAs, badges, traces and glows
- **Type:** Plus Jakarta Sans (headings semibold, tight tracking), Geist Mono for small data
- **Surfaces:** `.glass` dark cards, `.badge` pill labels, `.paper` light sections
- **Motion:** Framer Motion — scroll-lit headings (`ScrollWords`), reveals, the morphing navbar, animated circuit traces

## The hero character

The mascot is built from a **turnaround video**: 71 frames (front, left and right profiles, looking up and the angles in between), upscaled 4× with Real-ESRGAN, background removed and edge-defringed, in `public/images/character/`. Frames are picked so each differs only slightly from the next, and every frame with closed or blinking eyelids is left out. Fourteen of them are also used mirrored to fill angles the video never shows. Each frame has a `yaw` / `pitch` in `heroCharacterConfig.frames` (`src/config/site.ts`).

`<HeroCharacter />` measures the cursor from the character's eyes. The eyes move first: a quick spring shifts the irises of the front frame (`eyes-plate.webp` / `eyes-iris.webp`, clipped by the eyelids), while a slower spring turns the head after them. The head is drawn on a canvas from the frame closest to its direction, blended with its neighbour in the video, and frames that can't blend are cross-faded. So the head turns smoothly through the in-between angles. The first frame is a normal `<Image>` for fast first paint; the other frames preload in the background. Touch devices get a slow look-around, and reduced motion shows the front frame. The bottom fades into the page with a CSS mask.

To swap the character, export new frames and update their `yaw` (−1 left … 1 right) and `pitch` (−1 up … 1 down). Set `frames` to `[]` to hide it.

## Demos

Demo cards live in `src/content/demos.ts`. Each system log is a **scripted sample flow** and is labelled that way on the page. Once a demo site is deployed, set its `href` and "Explore a Demo" will link to it. Until then, the button opens the demo-request dialog.

## Accessibility & performance

- Semantic landmarks, one `h1`, one `h2` per section, skip link, visible focus rings
- Solutions use the ARIA tabs pattern (arrow keys, Home and End). Industry chips use `aria-pressed`
- The demo dialog uses native `<dialog>`, so focus trap, Esc and an inert background come built in
- `prefers-reduced-motion`: Lenis is off, cursor parallax and magnetic effects are off, hero scroll parallax is off, looping demos show their final frame, CSS animations are stopped
- Cursor effects run only on fine pointers
- The particle canvas pauses when off-screen or when the tab is hidden, and caps DPR at 2
- The page is statically prerendered, with no WebGL and no video
