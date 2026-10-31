# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Farmers**: Zimbabwean smallholder livestock farmers (cattle first; also goats, sheep, poultry). They report sickness, births and routine care, and get triage guidance and reminders back. They are the primary users and the main adoption risk. The system is WhatsApp-first (SMS as fallback), but farmers can also use the web app to manage farms, animals, health records and vet requests.
- **Vets**: review escalated cases and direct assessment requests in the web portal, with the full animal and event history in front of them. They submit diagnoses, treatment plans and follow-up dates.
- **Admins**: manage users and vet assignments, and monitor platform activity and rollout KPIs by province and district.
- **Field agents**: onboard farmers in person and do first animal registrations with them. This role is in the spec; it is not yet a separate role in the web app.
- **Landing page audience**: partners and funders (NGOs, programmes, government, investors) who would back a rollout. Farmers and vets are secondary audiences there.

## Product Purpose

V-Vet is livestock decision support for Zimbabwean smallholder farmers. It helps them cut avoidable livestock losses, improve herd productivity and decide faster, with minimal typing, minimal training and no need for a smartphone app. The wider aim is food security and lower poverty.

Success means farmers save animals and income, and vets reach more farmers with better context. Records are the means, not the goal: "V-Vet is not a record-keeping system. Records are the means. Better decisions are the end."

## Positioning

- Works inside WhatsApp in local languages (Shona, Ndebele, English). Farmers can send voice notes, photos or text, and their phone number is their login.
- Triage built around consequence and confidence: an AI-assisted flow decides whether a case is low risk (recommend and monitor), moderate (ask more questions) or high (send to a vet with context). It then follows up on whether the animal recovered.
- Supports vets rather than replacing them: each case reaches the vet already sorted by priority and with the animal's full history.
- Treats routine care (vaccination, dipping, deworming, weaning, bull soundness, breeding calendars) as just as important as responding to sickness. Reminders go out before things are due.

## Operating Context

- Rural Zimbabwe. Farmers are organised by province, district (each with its own district code) and ward, and production calendars follow Zimbabwe's natural regions and seasons.
- Many farmers don't know exact birth dates, so the system works with estimated ages.
- Field agents onboard farmers in person before each province launch.
- Web app roles: farmer (farms, livestock, animal profiles, vet requests), vet (case queue, case detail, follow-up tracker), admin (farmers, vets, farms, livestock, requests, email broadcast).

## Capabilities and Constraints

- Stack: React + Vite + TypeScript, Tailwind, shadcn/Radix UI. The backend is FastAPI + PostgreSQL. AI services: OpenAI, Gemma, ElevenLabs. Messaging: WhatsApp Business API with interactive messages.
- Built: user registration, animal registration and viewing, birth recording, sickness reporting, triage, and the vet request and review workflow.
- Landing page, by founder decision on 2026-10-31: presents reminders, breeding management, calving preparation and herd insights as available now, with no "Coming next" label.
- Planned (from notes and the spec): logging vaccination, dipping and deworming; bull soundness and weaning; weekly summaries; disease outbreak alerts to nearby farmers; district benchmarking (only once the data is statistically sufficient).
- Spec principles that apply to every surface: decision-first, minimum input, transparent intelligence (every alert says why it fired and how confident the system is), prevention over reaction.
- Current focus: polishing the public landing page.

## Brand Commitments

- Name: **V-Vet** (also written V-VET). Existing logo at `public/logo.png` (livestock icons with a map of Africa) and favicon at `public/favicon.ico`.
- Current tagline in the site metadata: "Livestock Health Intelligence".
- Positioning statement in the README: "Report symptoms through WhatsApp or web, get triage guidance quickly, and connect farmers to vets with full case context."
- Public site register (chosen by the founder, 2026-10-24): a clean, polished contemporary startup site, "just like what other startups websites look like". It is also seen by recruiters. Updated 2026-10-31: the founder judged the hero too close to home.medvi.org. It is no longer a reference; V-Vet must not resemble it.
- Public contact: info@vvet.org. Farmer WhatsApp entry: https://wa.me/447519132951

## Evidence on Hand

Awards (confirmed by the founder):
1. **NVIDIA AI Day Competition**, winner. Prize: an NVIDIA DGX Spark AI supercomputer. Sponsored by NVIDIA, Henley Business School, SCG and Softcat.
2. **Henley Business School Student Business Idea Competition**, 1st place, £2,000. Source: https://live.henley.ac.uk/news/13206940
3. **Just Imagine If (University of Reading) 2026**, winner, £5,000 to run a pilot programme. Source: https://www.reading.ac.uk/just-imagine-if/2026-winners

Assets: `src/assets/landing-hero.jpg`, `src/assets/whatsapp-screenshot.jpg`, `public/vvet-workflow.png`, `public/readme.svg`.

Not available. Future work must not invent any of these:
- The pilot is **funded but not yet started**. Don't say it is live or underway, and don't quote pilot results or user numbers.
- No farmer or vet testimonials.
- No partner, customer or deployment logos. The award sponsors are sponsors of the competitions, not V-Vet partners.
- No impact metrics (losses prevented, farmers served, response times).

## Product Principles

1. Decisions over records. Every surface should help someone save an animal or protect income.
2. Meet farmers where they already are: WhatsApp, their own language, minimum typing.
3. Explain the reasoning. Say why something is flagged and how confident the system is.
4. Prevention matters as much as reaction.
5. Make vets more effective; never present V-Vet as a replacement for them.

## Accessibility & Inclusion

- Farmers may have limited literacy, low-end phones and patchy connectivity, so pages must stay light and plain-language.
- Outbound farmer messages support Shona, Ndebele and English. The web app is currently English only.
