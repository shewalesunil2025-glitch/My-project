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

## Scroll story

Each section carries one idea:

1. **Hero** — "BUILD THE BUSINESS OF 2035." A 3D AI core, floating glass UI panels that react to the cursor, and a slot for the future character.
2. **Problem** *(pinned)* — six scattered tools, each with a broken status (Missed call, 12 unread…). As you scroll they snap into one line, a pulse runs through them, and the headline changes to **WE CONNECT THE FLOW.**
3. **What We Build** — the customer journey (Website → AI Conversation → … → Google Review). The line fills as you scroll and a sticky panel describes the current stage.
4. **Solutions** — seven accessible tabs, each with a looping live mini-demo (website, WhatsApp chat, voice call, chatbot, booking, reviews, workflow graph).
5. **One System** — the hub: eight systems fan out of the central AI layer as the section scrolls in.
6. **Industries** — pick an industry and its example automation flow animates in.
7. **Work / Demos** — case-study cards with a sample system log that streams events when in view.
8. **How It Works** *(pinned on desktop)* — Discover → Design → Automate → Launch.
9. **Why Nexa Flow AI** — the statement lights up word by word as you scroll, followed by three principles.
10. **Final CTA** — a glowing horizon with "READY TO BUILD YOUR NEXT FLOW?"

## Architecture

```
src/
  app/                  layout (metadata, fonts, MotionConfig), page, sitemap, robots, OG image, /api/lead
  config/site.ts        brand, nav, CTAs, contact, hero character config
  content/              all copy & data (flow, solutions, industries, demos, process)
  hooks/                useMediaQuery / useFinePointer, usePointerParallax, useSequence
  lib/                  cn(), lead validation + client submit
  components/
    navigation/         Navbar (active-section pill, mobile menu), Logo
    hero/               Hero, HeroVisual, FloatingPanel, HeroCharacter
    scroll/             ProblemSection (pinned)
    automation/         SystemFlow, OneSystem
    solutions/          Solutions (tabs) + previews/* live mini-demos
    industries/         Industries
    demos/              Demos, EventConsole
    process/            Process
    cta/                Philosophy, FinalCta, DemoProvider, DemoDialog, DemoRequestForm, BookDemoButton
    footer/             Footer
    3d/                 CoreOrb (CSS 3D sphere + orbit rings)
    effects/            SmoothScroll, ParticleField, Reveal, Magnetic, TiltCard
    ui/                 Button / ButtonLink, SectionHeading
```

Content lives in `src/content`, separate from the components, so copy, industries and demos can change without touching layout.

## Design system

- **Canvas:** near-black `#04060b` / midnight navy surfaces (`ink-*` tokens)
- **Type:** soft white `fg`, muted `fg-muted`. Oversized headlines (`.display`, tight tracking) with a subtle metallic fill (`.text-metal`)
- **Accent:** one electric "flow" blue (`flow`) plus a mint "live" signal (`live`) for success and live states. No neon, and gradients only on key words
- **Surfaces:** `.glass` — thin light edge, blur, soft shadow
- **Motion:** expo-out easing (`--ease-out-expo`). One idea animates at a time

## The hero character (to add later)

`<HeroCharacter />` is already in place. To turn it on:

1. Add a transparent PNG/WebP cutout to `public/images/`, e.g. `hero-character.webp`.
2. Set it in `src/config/site.ts`:

```ts
export const heroCharacterConfig = {
  src: "/images/hero-character.webp",
  headSrc: "",            // optional separate head layer → stronger head-follow + tilt
  alt: "…",
  width: 720,
  height: 900,
  intensity: 18,          // px of travel at the viewport edge
  mobileBehavior: "hidden", // or "static"
};
```

The body drifts with the cursor and rotates slightly in 3D. An optional head layer follows further and tilts. On touch devices and with reduced motion it stays still, or is hidden if `mobileBehavior` is `"hidden"`. The AI core orb stays behind it as a halo.

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
