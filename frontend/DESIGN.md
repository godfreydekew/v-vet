---
name: V-Vet Public Site
description: The public marketing world for V-Vet (route "/"), a clean contemporary startup site in deep green, white and pastel tiles.
colors:
  ink: "#242220"
  muted: "#5C5A56"
  line: "#E7E4DF"
  paper: "#F7F5F2"
  white: "#FFFFFF"
  forest: "#112111"
  pine: "#1B6549"
  button: "#1F7A5A"
  accent: "#2E936F"
  leaf: "#8FD19E"
  mint: "#DEEDE0"
  sky: "#E4ECF2"
  sand: "#F2EBE1"
  rose: "#F2E6EC"
  risk-high: "#DC2626"
  risk-high-tint: "#FEF2F2"
  risk-high-text: "#B91C1C"
  risk-moderate: "#F59E0B"
  risk-moderate-tint: "#FFFBEB"
  risk-moderate-text: "#92400E"
typography:
  display:
    fontFamily: "Figtree, Inter, sans-serif"
    fontSize: "clamp(2.6rem, 6vw, 4.25rem)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Figtree, Inter, sans-serif"
    fontSize: "clamp(2.125rem, 4.5vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline-sm:
    fontFamily: "Figtree, Inter, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline-band:
    fontFamily: "Figtree, Inter, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  title-lg:
    fontFamily: "Figtree, Inter, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Figtree, Inter, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "normal"
  body-lead:
    fontFamily: "Figtree, Inter, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.625
    fontFeature: "tnum"
  body:
    fontFamily: "Figtree, Inter, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
    fontFeature: "tnum"
  label:
    fontFamily: "Figtree, Inter, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "0.14em"
  fragment-micro:
    fontFamily: "Figtree, Inter, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.375
  fragment-micro-sm:
    fontFamily: "Figtree, Inter, sans-serif"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.375
  watermark:
    fontFamily: "Figtree, Inter, sans-serif"
    fontSize: "15rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.04em"
  wordmark:
    fontFamily: "Figtree, Inter, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.025em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  card-hero: "20px"
  tile: "24px"
  panel: "28px"
  band: "32px"
  pill: "9999px"
spacing:
  gutter: "16px"
  gutter-sm: "24px"
  tile-gap: "16px"
  column-gap: "64px"
  section: "96px"
  section-md: "128px"
  header: "72px"
  container: "1100px"
  container-wide: "1160px"
components:
  button-primary:
    backgroundColor: "{colors.button}"
    textColor: "{colors.white}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "{colors.pine}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
  button-secondary-hover:
    backgroundColor: "{colors.paper}"
  button-on-dark:
    backgroundColor: "{colors.white}"
    textColor: "{colors.forest}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
  button-on-dark-hover:
    backgroundColor: "{colors.mint}"
  button-ghost-on-dark:
    backgroundColor: "transparent"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
  chip-example:
    backgroundColor: "{colors.white}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  chip-link:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
  chip-link-hover:
    backgroundColor: "{colors.mint}"
  tile-content:
    backgroundColor: "{colors.mint}"
    rounded: "{rounded.tile}"
    padding: "28px"
  panel-section:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.panel}"
    padding: "40px"
  fragment-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  status-high:
    backgroundColor: "{colors.risk-high-tint}"
    textColor: "{colors.risk-high-text}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  status-moderate:
    backgroundColor: "{colors.risk-moderate-tint}"
    textColor: "{colors.risk-moderate-text}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  status-low:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.pine}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  nav-header:
    backgroundColor: "{colors.white}"
    textColor: "{colors.muted}"
    height: "72px"
---

# Design System: V-Vet Public Site

## Overview

**Creative North Star: "The Green Room with Pastel Tiles"**

This is the visual world for V-Vet's public marketing surface: the landing page at route "/", the sign-in and sign-up screens (`/login`, `/signup`, framed by `src/components/landing/AuthShell.tsx`), and any future public page (about, partners, press, legal). It does **not** apply to the authenticated web app. The farmer, vet and admin dashboards under `src/pages/farmer`, `src/pages/vet` and `src/pages/admin` keep their own shadcn token system (the `:root` and `.dark` HSL variables in `src/index.css`). Work on app screens must not pull in the `landing` palette, Figtree, or the rules below; new public pages must use them, inside a `.landing` wrapper.

The register, chosen by the founder, is a clean contemporary startup site with a deep green gradient opening, a white ground below, and product shown on soft pastel tiles in generous rounded cards. The page persuades by demonstration. Each section carries a real asset or a code-drawn product fragment (a WhatsApp message, a triage tier list, a vet case card), never a grid of generic feature icons.

Density is relaxed and editorial: centred or two-column sections with 96 to 128px between them, one heading idea per section, and short lead paragraphs. Colour is spent sparingly; green carries the brand, pastels carry the product, and status red and amber appear only inside product fragments where they mean risk.

**Key Characteristics:**
- Deep green gradient (pine to forest) only at the opening hero and the closing partner band; white everywhere between.
- One accent-coloured phrase per headline, no labels above headings.
- Product fragments as white cards on pastel tiles, always labelled as an example.
- Pill buttons, 20 to 32px rounded containers, soft forest-tinted shadows.
- Figtree throughout, semibold headlines with tight negative tracking, tabular numerals.
- Wordmark-only brand mark in the header and footer.

## Colors

A green-and-white palette: two deep greens for the brand ground, two working greens for actions and accents, warm neutrals for text and surfaces, and four pastel tints that hold product fragments.

### Primary
- **Forest Night** (forest): the darkest green, end stop of the brand gradient, text colour on white pill buttons over dark grounds, ::selection text, and QR code foreground.
- **Pine** (pine): start stop of the brand gradient (`linear-gradient(166deg, pine 0%, forest 100%)`), hover state of primary buttons, link text on tinted tiles, "low risk" status text.
- **Action Green** (button): the fill of every primary pill on a light ground, checklist bullets, active step numbers, the voice-note play button. White text on it is about 5.3:1.

### Secondary
- **Headline Green** (accent): the one accent phrase in headlines on light grounds, the focus outline, the triage progress bar, the "low risk" tier dot. About 3.8:1 on white, so it is for headline-sized text only (22px semibold and up), never body copy.
- **Leaf** (leaf): the accent phrase in headlines on the green gradient. It replaces Headline Green on dark grounds.

### Tertiary
- **Mint** (mint): the default product tile, ::selection background, hover fill of white and paper pills, "low risk" status background.
- **Sky** (sky), **Sand** (sand), **Rose** (rose): sibling pastel tiles. Rotate mint, sky, sand, rose across a set of tiles never put two adjacent tiles in the same tint.

### Neutral
- **Ink** (ink): all headings and primary text on light grounds; the `.landing` default text colour.
- **Muted Stone** (muted): lead paragraphs, secondary text, chip text, nav links once the header is solid.
- **Hairline** (line): borders, dividers, rings on secondary pills and chips.
- **Paper** (paper): large section panels (triage demo, start, groundwork cards), form-field fills inside fragments, hover fill of secondary pills.
- **White** (white): the page ground, product fragment cards, the hero case panel.

### Status (product fragments only)
- **Risk High** (risk-high, risk-high-tint, risk-high-text), **Risk Moderate** (risk-moderate, risk-moderate-tint, risk-moderate-text): taken from Tailwind's red and amber scales. They appear only inside example product UI (tier dots, "Vet review needed" banner, urgency chips) and the pre-pilot status dot. Low risk uses accent, mint and pine.

### Named Rules
**The Two Grounds Rule.** The brand gradient appears exactly twice on a page: the opening hero and the closing call-to-action band. Every other section sits on white, with paper or pastel panels inside it.

**The One Phrase Rule.** Each headline colours one phrase, and only one: Headline Green on light grounds, Leaf on the gradient. No other text on the page is green except links and status.

**The Tinted Tile Rule.** Product is shown on pastel tiles. Status red and amber live inside fragments and never become tile, section or button colours.

## Typography

**Display Font:** Figtree (with Inter, sans-serif)
**Body Font:** Figtree (with Inter, sans-serif), set on the `.landing` wrapper
**Label/Mono Font:** none distinct; numerals are tabular across the whole surface (`font-variant-numeric: tabular-nums`)

**Character:** One friendly geometric sans in four weights (400, 500, 600, 700, loaded from Google Fonts in `index.html`). Headlines are semibold with tight negative tracking and balanced wrapping; body is regular at a comfortable 1.625 line height.

### Hierarchy
- **Display** (600, 2.6rem rising to 3.75rem at 640px and 4.25rem at 768px, 1.04, -0.03em): the hero headline only, centred, max 24ch, `text-wrap: balance`, two lines on desktop.
- **Headline** (600, 2.125rem, 2.75rem from 640px (headline-sm), 3rem from 768px, 1.1, -0.02em): every section h2.
- **Headline Band** (600, 2.125rem, 3rem from 640px, 3.5rem from 768px, 1.08, -0.02em): the closing call-to-action band headline only, max 18ch.
- **Title Large** (600, 1.75rem, tight, -0.01em): a secondary heading that opens a new idea inside a section ("Registering an animal takes one message").
- **Title** (600, 1.25rem to 1.375rem, snug): h3s inside tiles and cards (award names, groundwork cards, "What a farmer can send").
- **Body Lead** (400, 17px, 18px at 768px on the hero, 1.625): the paragraph under each heading, muted, 52 to 60ch.
- **Body** (400, 15px, 1.625): checklists, tile copy, secondary paragraphs. Fragment text runs smaller (12 to 14px) because it quotes UI.
- **Fragment Micro** (400, 11px, with a 10px step below 640px): only inside illustrative product fragments, where it quotes small UI text (the WhatsApp replica, district code chips, the compact vet card's "Example case" line). Never used for page text.
- **Label** (600, 12px, 0.14em, uppercase): the trust marquee only.
- **Watermark** (700, 22vw capped at 15rem from 768px, closing band only; line height 1, -0.04em): the decorative "V-VET" on the closing band (see The Watermark Rule).
- **Wordmark** (700, 1.25rem, tight): the "V-Vet" brand mark in header and footer.

### Named Rules
**The No Kicker Rule.** Nothing sits above a heading: no eyebrow, no category label, no small uppercase tag. If context is needed, it goes in the headline or the line below it (the hero's award link sits under the buttons, not over the headline).

**The Watermark Rule.** The closing band carries an oversized "V-VET" in Figtree 700 (22vw capped at 15rem), -0.04em, white at 4.5% opacity, bleeding off the bottom edge, `aria-hidden`. It is the only decorative type.

**The Fragment Micro Rule.** The 10px and 11px steps exist only inside code-drawn product fragments, where they quote real UI at reduced scale. Page copy, captions and chips never go below 12px.

## Layout

Content sits in a 1100px column (1160px for the header and the closing-points strip), with 16px side gutters rising to 24px from 640px. Sections stack with bottom padding only (96px, 128px from 768px), except the first content section, which also has top padding. Breakpoints are Tailwind's defaults; the layout changes at sm (640px) and md (768px).

Sections take one of three shapes: centred heading and lead (max 720px) over a full-width panel (triage, awards); two asymmetric columns (5fr/7fr or 6fr/5fr, 56 to 64px gap) with text on one side and a tile on the other (farmers, vets, start); or a two-up row of paper cards (groundwork). Tile grids use 16px gaps.

The hero is full-bleed, text centred, with the white case panel fully inside the gradient (72px below it from 768px, 32px on phones). The header is fixed, 72px tall, transparent over the hero, and turns white at 90% with a backdrop blur and a hairline border after 24px of scroll. Below 768px the nav links hide and columns stack; tiles become a 2-up grid.

Motion is quiet: the hero's elements fade up 18px in sequence (0.8s, `cubic-bezier(0.16, 1, 0.3, 1)`, 0.08s stagger), the trust marquee scrolls in 48s linear loops and pauses on hover, and the triage demo cross-fades its panel. Everything that moves stops under `prefers-reduced-motion`. The entrance fade-up is hero-only: every other section renders visible, with no scroll-triggered reveals.

## Elevation & Depth

Mostly flat with tonal layering: white page, paper and pastel panels, white fragment cards on top. Shadows are used only on white objects that sit on a tinted ground (product fragments, the active triage tab, the hero case panel, the phone frame), and they are always soft, diffuse, negative-spread and tinted with Forest Night, never neutral black and never hard-offset. Fragment cards also carry a 1px ring at 5% black to hold their edge on pale tiles.

### Shadow Vocabulary
- **Chip lift** (`box-shadow: 0 6px 18px -10px rgba(17,33,17,0.35)`): the active tier pill, chat bubbles.
- **Fragment lift** (`box-shadow: 0 10px 30px -14px rgba(17,33,17,0.3)`): case cards, the registration form, the WhatsApp replica in the hero card.
- **Panel lift** (`box-shadow: 0 16px 40px -18px rgba(17,33,17,0.35)`): the vet case queue.
- **Panel float** (`box-shadow: 0 30px 60px -30px rgba(17,33,17,0.45)`): the hero case panel on the gradient.
- **Device lift** (`box-shadow: 0 30px 50px -24px rgba(17,33,17,0.6)`): the phone frame around the WhatsApp screenshot.

### Named Rules
**The Forest Shadow Rule.** A shadow is always tinted rgba(17,33,17) with a negative spread, and only ever falls under a white object on a coloured ground. Section tiles and panels themselves are never shadowed.

## Shapes

Everything is rounded, and the radius grows with the size of the container: 8px for banners inside fragments, 12px for small list rows, 16px for fragment cards and tabs, 24px for content tiles and award cards, 24 to 28px for the hero case panel, 28px for section panels, 32px for the closing band. Buttons, chips, status pills, tier pills and avatar dots are full pills. Chat bubbles use 16px with one tight corner (6px) on the speaker's side. There are no square corners and no visible borders on tiles; edges come from tint changes, hairline rings and soft shadows.

## Components

### Buttons
Confident full pills in one size, with a leading or trailing 16px icon where it helps.
- **Shape:** full pill (9999px), 14px by 24px padding, 15px semibold text; the header version is 10px by 16px at 14px.
- **Primary (light ground):** Action Green fill, white text; hover to Pine.
- **Primary (dark ground):** white fill, Forest Night text; hover to Mint.
- **Secondary (light ground):** transparent with an inset Hairline ring, Ink text; hover fills Paper.
- **Ghost (dark ground):** transparent with an inset white ring at 35%, white text; hover fills white at 10%.
- **Focus:** a 2px Headline Green outline offset 3px on every link and button in `.landing`.
- **Pairing:** one primary and one secondary side by side, stacked on mobile; never two primaries in one group.

### Chips
- **Example chip:** white at 85%, Muted Stone 12px medium text, 5% black ring, pill, pinned to a top corner of any tile showing product UI. Text is "Example", "Example case" or "Illustrative photo".
- **Link chips (footer):** Paper fill, Ink 14px medium text, leading icon, hover to Mint.
- **Status chips:** pill, 12px semibold; High (risk-high tint and text), Moderate (risk-moderate tint and text), Low (Mint and Pine).
- **Notice chips:** white pill with a Hairline ring and a small coloured dot or icon, for stage notes ("V-Vet is in its pre-pilot stage") and roadmap labels ("Coming next", Pine text).

### Cards / Containers
- **Corner Style:** by size, per Shapes (24px tiles, 28px panels).
- **Background:** pastel tile (mint, sky, sand, rose) for product and awards; Paper for section panels; white for fragments and the hero case panel.
- **Shadow Strategy:** tiles and panels flat; white fragments lifted (see Elevation & Depth).
- **Border:** none on tiles; 5% black ring on fragments.
- **Internal Padding:** 24px on mobile, 28 to 40px on tiles, up to 56px on the start panel.

### Navigation
Fixed 72px header with the wordmark at left, four 15px medium anchor links centred (white at 80% over the hero, Muted Stone once solid, hover to full white or Ink), and Sign in plus a compact "Partner with us" pill at right. The pill inverts with the ground: white over the gradient, Action Green once solid. Below 768px only the wordmark and the pill (plus Sign in from 640px) remain.

### Hero Case Panel (signature)
One white panel following a single example case through three steps: Farmer (waveform and quote), V-Vet (High risk chip and next step), Vet (the case received), joined by Headline Green arrows. Steps sit in a row with labels above Paper cards from 768px. On phones they stack with arrows pointing down, the labels move inside the cards, and the waveform and animal name drop out to keep the hero short. It is captioned "Example case" below, in white at 70%, and contains no photo.

### Triage Stepper (signature)
A Paper panel with a vertical tab list (numbered pill, semibold title, muted description; the active tab is a white lifted card with a 3px Headline Green progress bar along its bottom) beside a Mint panel showing the step's fragment, labelled "Example case". It auto-advances every 4.5s until the visitor picks a tab, and never auto-advances under reduced motion.

### Product Fragments
Code-drawn, legible replicas of real V-Vet UI (voice note bubble, tier pills, vet case card, case queue, registration form, follow-up thread). White cards, 12 to 14px type, fragment lift shadow. WhatsApp replicas quote WhatsApp's own dark chat colours (#0B141A ground, #202C33 incoming, #144D37 outgoing, #D9FDD3 light outgoing) and use them nowhere else.

### Auth Shell
Sign in and sign up share one frame: from 1024px a two-column split (5fr/6fr) with the brand gradient panel on the left (wordmark, a headline with one Leaf phrase, a muted lead, one labelled product fragment, the watermark) and a white form column on the right. Below 1024px the panel is dropped and the white column carries the wordmark. Fields are 48px tall, 12px rounded, white with an inset Hairline ring that turns into a 2px Headline Green ring on focus; labels are 14px medium Ink; the submit is a full-width Action Green pill. The auth panel is a third use of the gradient, allowed because it is a separate screen, not a section of the landing page. The shell forces `color-scheme: light`, because the app theme defaults to dark.

### Trust Marquee and Closing Points
A full-width strip of six capability statements in the uppercase Label style with 18px line icons, looping horizontally between hairlines and pausing on hover; it is a capability strip, not a heading label. The closing-points strip is a static 2-up/4-up row of 14px semibold statements with 20px icons, divided by hairlines.

## Do's and Don'ts

### Do:
- **Do** wrap every public page in `.landing` and use the `landing-*` colours, Figtree, and these rules; keep app screens on their own shadcn tokens.
- **Do** colour exactly one phrase per headline: Headline Green on light grounds, Leaf on the gradient.
- **Do** show the product doing its job on every section: a real asset or a code-drawn fragment on a pastel tile.
- **Do** label every piece of example product UI with an "Example" or "Example case" chip.
- **Do** caption the AI-generated farmer photo "Illustrative photo" wherever it appears.
- **Do** use the "V-Vet" wordmark (Figtree 700) as the brand mark at small sizes; `/logo.png` is only for uses about 64px and larger.
- **Do** use full-pill buttons, 15px semibold, with Action Green as the light-ground primary and white as the dark-ground primary.
- **Do** tint every shadow with Forest Night (rgba(17,33,17)) and keep it soft with a negative spread.
- **Do** stop all motion under `prefers-reduced-motion`.

### Don't:
- **Don't** put a kicker, eyebrow or small label above any heading.
- **Don't** use the landing palette, Figtree or the gradient on farmer, vet or admin app screens.
- **Don't** resemble home.medvi.org: no ghost wordmark in the hero, and no overlapping tray of category cards.
- **Don't** build feature-card grids of generic icons with titles and blurbs.
- **Don't** use the gradient for more than the opening hero and the closing call-to-action band.
- **Don't** set body copy in Headline Green; it is a headline-size colour.
- **Don't** use status red or amber outside product fragments and status dots.
- **Don't** use hard offset shadows, neutral black shadows, or square corners.
- **Don't** shrink the `/logo.png` illustration below about 64px on public pages.
