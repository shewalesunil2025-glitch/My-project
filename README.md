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
| `ANTHROPIC_API_KEY` | Powers Shambhu, the voice assistant in the bottom-right corner (`/api/shambhu`, Claude). Without it, Shambhu politely points visitors to the contact form |

**Honest by default:** if `LEAD_WEBHOOK_URL` is not set, `/api/lead` returns `503 not_configured`. The form then tells the visitor that online booking isn't connected yet and shows the contact email. It never fakes a success message.

**Shambhu voice assistant:** speech recognition and the child-like voice run in the visitor's browser (Web Speech API; Chrome and Android work best, Safari has partial support). Shambhu detects the visitor's language (English, Hindi, Marathi and other Indian languages) and replies in it. Its knowledge is built from the site's own content in `src/lib/shambhuAgent.ts`, so prices and FAQs never drift.

## Page structure

The layout, colours and motion follow a reference landing page supplied as a screen recording: a black-green canvas lit by one neon lime accent, light thin display type, "// LABEL //" mono eyebrows, the logo and a "Contact us" pill on top and the section links in a pill floating at the bottom, particle forms made of green dots, and scroll-pinned scenes. All content is Nexa Flow AI's own.

1. **Hero** *(pinned)* — "The business that never sleeps." split around a brain made of ~22k green dots (`PointCloud shape="brain"`). The brain turns toward the cursor and its dots scatter around it. Scrolling makes the headline grow and fly apart while the brain bursts into dust and a green nebula.
2. **The problem** — "Your business shouldn't need five different tools…" beside a glowing light pillar, the answer, then a scan card: the mascot as a green hologram inside face-scan brackets (still watching the cursor) and the eight-step customer journey.
3. **Solutions** *(pinned)* — dust gathers into a turning DNA helix, the heading forms, then the seven solution cards (each with its live mini-demo) float past in 3D. Stacked cards on phones.
4. **Why Nexa Flow AI** — scroll-lit statement and a green bento: two feature tiles and the three principles.
5. **One system** — dotted globe (canvas, adapted from 21st.dev "Interactive Globe") with the six connected systems and their jobs.
6. **Work / Demos** — "Experience it now": pick a demo and watch its sample flow run.
7. **Industries** — ten industries with outcome and flow, plus a custom-industry CTA.
8. **Services** — Build, Automate, Grow, Partner as pricing-style cards (no invented prices) and the three promises.
9. **How it works** — Discover → Design → Automate → Launch.
10. **About · Founder** — Sunil S.'s profile, portrait, focus areas and vision (`founder` in `src/config/site.ts`).
11. **FAQ** — native `<details>` accordion (`src/content/faq.ts`).
12. **Final CTA** — "Ready to build your next flow?" under a particle form that morphs (blob → ring → twin lobes) over a slow green vortex.

## Architecture

```
src/
  app/                  layout (metadata, fonts, MotionConfig), page, sitemap, robots, OG image, /api/lead
  config/site.ts        brand, nav, CTAs, contact, hero character config
  content/              all copy & data (flow, solutions, industries, demos, process)
  hooks/                useMediaQuery / useFinePointer, useSequence
  lib/                  cn(), lead validation + client submit
  components/
    navigation/         Navbar (top logo + contact, floating bottom pill), Logo
    hero/               Hero (pinned brain scene), HeroCharacter (cursor-watching mascot)
    scene/              PointCloud (brain / helix / morph particle forms, canvas 2D)
    scroll/             ConnectSection (light pillar, hologram scan card, customer journey)
    automation/         OneSystem (dotted globe)
    solutions/          Solutions (helix + floating cards), Pillars (services) + previews/* live mini-demos
    industries/         Industries
    demos/              Demos (demo playground)
    process/            Process
    about/              Founder, Faq
    cta/                Philosophy, FinalCta, DemoProvider, DemoDialog, DemoRequestForm, BookDemoButton
    footer/             Footer
    3d/                 DottedGlobe
    effects/            SmoothScroll, IntroLoader, ScrollPanel, Reveal, RevealWords, ScrollWords, Scramble, Spotlight, Magnetic
    ui/                 Button / ButtonLink
```

Content lives in `src/content`, separate from the components, so copy, industries and demos can change without touching layout.

## Design system

Checked against the UI UX Pro Max skill (`.claude/skills/ui-ux-pro-max`): text contrast ≥ 4.5:1, interactive targets ≥ 24px, readable label sizes, visible focus, reduced motion.

- **Canvas:** black-green `#030703` with `ink-*` surfaces; **paper** panels are deep green glass `#050b06`
- **Accent:** neon lime `flow` (`#7dff3a`) for glows, labels and the "switch" knob on the white primary pill
- **Type:** Inter Tight (light, tight display headings), Plus Jakarta Sans body, Geist Mono labels
- **Surfaces:** `.glass` dark cards with a travelling border beam on hover, `.badge` "// LABEL //" eyebrows, `.hologram` + `.scanlines`, `.stars`, `.swirl`
- **Motion:** Framer Motion — pinned scroll scenes, scroll-lit headings (`ScrollWords`), word reveals, cipher-decoding labels (`Scramble`), section panels that grow in and ease away

## The mascot (scan card)

The mascot is **one front-facing image** (upscaled 4× with Real-ESRGAN, background removed) in `public/images/character/front.webp`. It stays exactly where it is and watches the cursor:

- **Body fixed:** the image is split at the neck with CSS masks. The body layer never moves.
- **Eyes:** the irises (`eyes-iris.webp`) sit on their own layer over clean eye whites (`eyes-plate.webp`), clipped to the eyelid opening, and slide toward the cursor. They can never leave the eye.
- **Head:** turns and tilts at most 4° / 3° toward the cursor, trailing slightly behind the eyes.

`<HeroCharacter />` measures the cursor from between the eyes, normalises the direction and eases the eyes (lerp 0.12) and head (0.06) with `requestAnimationFrame`, writing transforms directly to the DOM (no React re-renders). When the mouse stops it keeps looking at the last cursor position. Touch devices and reduced motion show the neutral front pose. An optional soft blink is behind `blink` in `heroCharacterConfig`.

To swap the character, replace the three files and update `face`, `neckY` and the `eyes` box in `heroCharacterConfig` (`src/config/site.ts`). Set `src` to `""` to hide it.

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
