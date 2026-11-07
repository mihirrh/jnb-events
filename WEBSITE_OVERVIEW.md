# JNB Events - Master Website & Architecture Overview

> **Purpose**: This document serves as the single source of truth for the **JNB Events** website. Any future developer or AI agent should read this file first to understand the architecture, design system, edge security, dynamic quote generator, asset pipeline, SEO strategy, and deployment configuration.

---

## 1. Executive Summary & Tech Stack

**JNB Events** (`https://jnbevents.co.uk`) is a luxury Asian wedding décor, bespoke mandap hire, civil ceremony styling, DJ entertainment, and full venue styling brand based in Leicester, UK, operating across Leicestershire, the Midlands, and nationwide.

### Core Technology Stack
- **Framework**: [Astro 5](https://astro.build/) (Static Site Generation / SSG with Cloudflare Pages Functions adapter).
- **Styling**: Native CSS modern variables, vanilla responsive layout tokens, container queries, and `@layer` scoping in [`src/styles/global.css`](src/styles/global.css).
- **Typography**: `@fontsource-variable/bodoni-moda` (Luxury Editorial Headlines) and `@fontsource-variable/instrument-sans` (Clean Body Copy & UI), scoped strictly to Latin character subsets for near-instant rendering.
- **Image Pipeline**: Sharp / Astro Assets Pipeline generating responsive `avif` and `webp` images with custom focal crops and density variants.
- **Client-Side PDF Engine**: Custom [PDFKit](https://pdfkit.org/) integration (`src/lib/quote-pdf.ts`) generating 4-page branded, print-ready client quotation PDFs directly in the browser.
- **Edge Functions**: Cloudflare Pages Functions (`functions/quote/[[path]].ts`) providing HMAC-SHA256 authenticated cookie sessions for internal staff tooling.
- **Live Social Feeds**: Meta Graph API (`src/lib/instagram.ts`) with long-lived token auto-refreshing during static build.
- **Hosting & CI/CD**: Cloudflare Pages + GitHub Actions scheduled rebuild workflow (`.github/workflows/daily-rebuild.yml`).

---

## 2. Directory & File Structure

```text
jnb-events/
├── .github/
│   └── workflows/
│       └── daily-rebuild.yml           # Daily rebuild trigger (05:17 UTC) to refresh Instagram
├── functions/
│   └── quote/
│       └── [[path]].ts                 # Cloudflare Pages Function: password gating & cookie signing
├── public/
│   ├── _redirects                      # Cloudflare redirect rules & SPA fallbacks
│   ├── favicon.svg                     # Lotus & ogee-arch brand favicon
│   └── robots.txt                      # Search engine crawl directives & sitemap reference
├── scripts/
│   ├── audit-dist.mjs                  # HTML & broken link auditor
│   ├── build-brand.mjs                 # Brand asset & vector geometry processor
│   ├── check-fallbacks.mjs             # Checks all image fallbacks and placeholders
│   ├── check-layout.mjs                # Layout overflow and contrast validator
│   └── check-quote.mjs                 # Headless PDFKit render test suite
├── src/
│   ├── assets/
│   │   ├── brand/                      # Full light/dark logos, wordmarks, motifs
│   │   └── media/                      # High-res production photography organized by section
│   │       ├── about/
│   │       ├── gallery/
│   │       ├── hero/
│   │       ├── home/
│   │       └── services/
│   ├── components/
│   │   ├── CtaBand.astro               # Bottom-of-page luxury CTA conversion banner
│   │   ├── FloatingEnquire.astro       # Floating enquiry drawer with live reply status
│   │   ├── Footer.astro                # Luxury editorial brochure footer with brand motif
│   │   ├── GalleryFilter.astro         # Real-time category selector for portfolio work
│   │   ├── Header.astro                # Sticky glassmorphic masthead navigation
│   │   ├── InstagramFeed.astro         # Live Instagram grid (gracefully hides if no token)
│   │   ├── Logo.astro                  # Vector brand lockup with gold lotus & ogee arch
│   │   ├── Motif.astro                 # Reusable vector mandap arch motif
│   │   ├── PageHero.astro              # Hero headers for sub-pages
│   │   ├── ProjectCard.astro           # Portfolio project card with hover zoom effect
│   │   ├── QuoteRow.astro              # Dynamic row generator for quotation item builder
│   │   ├── ServiceCard.astro           # Editorial service tier presentation card
│   │   └── Testimonials.astro          # Google reviews & client feedback carousel
│   ├── content/
│   │   ├── pages/                      # Page content definitions (home.yaml, about.md, quote.yaml)
│   │   ├── projects/                   # Markdown files for 10 portfolio projects
│   │   ├── services/                   # Markdown files for 8 core service tiers
│   │   └── settings/                   # Site-wide business info (site.yaml, reviews.yaml)
│   ├── layouts/
│   │   └── BaseLayout.astro            # Master document shell with SEO schemas & OpenGraph
│   ├── lib/
│   │   ├── brand-paths.ts              # Mathematical SVG path data for brand motifs
│   │   ├── instagram.ts                # Meta Graph API client & token auto-refresher
│   │   ├── motif.ts                    # Motif size & style variants
│   │   ├── plates.ts                   # Layout grid definitions for PDF photo plates
│   │   ├── quote-pdf.ts                # PDFKit 4-page quotation document builder
│   │   ├── quote.ts                    # Quotation math, discounts, VAT & deposit logic
│   │   ├── schema.ts                   # Schema.org JSON-LD structured data generators
│   │   └── text.ts                     # Typography & editorial string utilities
│   ├── pages/
│   │   ├── index.astro                 # Homepage
│   │   ├── about.astro                 # About page
│   │   ├── contact.astro               # Contact & WhatsApp booking page
│   │   ├── gallery/                    # Gallery index, category filter, and [slug] project views
│   │   ├── services/                   # Services index and [slug] individual service views
│   │   ├── quote.astro                 # Interactive quotation builder & PDF download UI
│   │   ├── privacy.astro               # Privacy policy
│   │   └── 404.astro                   # Branded not-found error page
│   └── styles/
│       └── global.css                  # Master CSS custom properties & utility classes
├── DEVELOPMENT.md                      # Developer runbook & local testing procedures
├── PHOTO_AND_SEO_INTEGRATION.md        # Master 10-photo mapping & regional SEO keywords
├── PRD.md                              # Product requirements document & luxury design guidelines
├── SOCIAL_AND_REVIEWS_SETUP.md         # Guide for Meta Instagram & Google Reviews API
└── WEBSITE_OVERVIEW.md                 # THIS FILE (Master Architectural Reference)
```

---

## 3. Brand Architecture & Design Tokens

### 1. Visual Identity & Motifs
- **Ogee Arch & Lotus**: Inspired by royal Indian architecture and classical Hindu mandap geometry. Hand-vectorised into mathematical SVG paths in [`src/lib/brand-paths.ts`](src/lib/brand-paths.ts) and rendered via [`src/components/Motif.astro`](src/components/Motif.astro).
- **Colour Palette**:
  - Gold Accent: `#c5a059` / `#d4af37` (Muted antique gold, avoiding harsh yellow saturation).
  - Backgrounds: `#0e0d0b` (Rich obsidian black), `#161411` (Deep charcoal surface), `#1c1915` (Elevated card border).
  - Typography: `#f5f2eb` (Warm ivory primary text), `#a69f91` (Champagne muted secondary text).

### 2. Typography
- **Headlines**: *Bodoni Moda Variable* — Editorial serif for luxury elegance with italicised punch words (`*styled with intent.*`).
- **Body & Controls**: *Instrument Sans Variable* — Clean geometric grotesque with high legibility on mobile screens.

---

## 4. Key Systems & Features

### System A: Interactive Quote Builder & 4-Page PDF (`/quote/`)

1. **Password Authentication via Cloudflare Pages Function (`functions/quote/[[path]].ts`)**:
   - The `/quote/` route is protected at Cloudflare's edge.
   - When requested without a valid session, it intercepts and presents a password gate.
   - Verifies against the encrypted secret `QUOTE_PASSWORD` using constant-time string comparison.
   - Issues a cryptographic HMAC-SHA256 signed `HttpOnly`, `SameSite=Strict` cookie (`__Host-jnb_quote`) valid for 7 days.
   - If `QUOTE_PASSWORD` is not configured, it fails closed (HTTP 503) to prevent unauthorized access.

2. **Quotation Math & Dynamic Line-Items (`src/lib/quote.ts`)**:
   - Manages service selections across Mandaps, Civil Ceremony, Reception Décor, DJ/AV, Lighting, Dancefloors, and Special Effects.
   - Supports line-item discounts, overall percentage discounts, optional 20% VAT toggle, and custom deposit schedules (default 25%).

3. **PDF Generation Engine (`src/lib/quote-pdf.ts`)**:
   - Renders entirely client-side using PDFKit in under 800ms.
   - **Page 1 (Cover)**: Luxury gold JNB logo, quotation reference, 14-day validity notice, client name, event date, and venue.
   - **Page 2 (Itemised Breakdown)**: Structured financial ledger with category groupings, detailed line items, and payment schedule.
   - **Page 3 (Moodboard & Staging Showcase)**: Editorial photographic plates showcasing mandap styling and reception ambiance.
   - **Page 4 (Booking Terms & Next Steps)**: 14-day validity notice, simple 3-step booking flow (Confirm & Deposit, Consultation, Delivery), contact card, and JNB Events footer.

---

### System B: Photographic Inventory & Asset Pipeline

All photography is located under `src/assets/media/` and processed by Astro Sharp during build into multi-resolution WebP and AVIF formats.

| Production Filename | Primary Slot | Placements |
| :--- | :--- | :--- |
| `grand_mandap_modern_venue.jpg` | 16:9 Landscape | Homepage Hero (`home.yaml`), Modern Gold Aisle Project |
| `modern_hall_gold_aisle_mandap.jpg` | 4:5 Portrait | Homepage Intro Card (`home.yaml`), Modern Gold Aisle Project |
| `carved_wooden_mandap_close.jpg` | 4:3 Landscape | Homepage Intro Detail Card (`home.yaml`), Carved Mandap Project |
| `rustic_festoon_mandap.jpg` | 4:5 Portrait | About Page Main Feature (`about.md`), Carved Mandap Project |
| `carved_mandap_white_aisle.jpg` | 4:3 Landscape | About Page Detail Card (`about.md`), Carved Mandap Project |
| `historic_archway_mandap_setup.jpg` | 16:9 Landscape | Homepage CTA Banner (`home.yaml`), Historic Archway Project |
| `floral_aisle_gold_runner.jpg` | 3:2 Landscape | Mandaps Service Cover (`mandaps-and-stages.md`) |
| `grand_brick_venue_wedding.jpg` | 3:2 Landscape | Packages Service Cover (`packages.md`) |
| `luxury_asian_wedding_ceremony.jpg` | 3:2 Landscape | Modern Gold Aisle Mandap Gallery Project |
| `luxury_chiavari_seating_mandap.jpg` | 4:3 Landscape | Historic Archway Mandap Gallery Project |

---

### System C: Regional SEO & Accessibility Architecture

1. **Target Geographies**:
   - Primary: **Leicester** & **Leicestershire** (Oadby, Wigston, Loughborough, Melton Mowbray, Hinckley).
   - Secondary: **East & West Midlands** (Nottingham, Derby, Birmingham, Coventry, Wolverhampton).
   - Tertiary: **UK-wide Asian & Hindu Wedding Markets** (London, Manchester, Yorkshire).

2. **Schema.org Structured Data (`src/lib/schema.ts`)**:
   - `LocalBusiness` / `EventVenue` schema with geographical coordinates, opening hours, and service areas.
   - `Service` & `OfferCatalog` schema on all service markdown files.
   - `ImageGallery` schema with full captions, localized descriptions, and high-density image URLs on gallery projects.
   - `BreadcrumbList` schema across all sub-pages.

---

### System D: Live Instagram Integration & Daily Rebuilds

1. **Meta Graph API (`src/lib/instagram.ts`)**:
   - Fetches recent media posts from the connected Instagram Business account during static build.
   - Automatically refreshes the long-lived user access token (60-day lifespan) on each build.
   - If `INSTAGRAM_ACCESS_TOKEN` is unset, the Instagram section automatically hides without failing the build.

2. **Automated Daily Rebuild (`.github/workflows/daily-rebuild.yml`)**:
   - Executes at `05:17 UTC` daily via GitHub Actions.
   - Triggers the Cloudflare Pages Deploy Hook (`CF_PAGES_DEPLOY_HOOK`) to ensure fresh Instagram posts are baked into static HTML.

---

## 5. Environment Variables & Secrets Reference

### 1. Cloudflare Pages Settings (Dashboard -> Settings -> Environment Variables)
| Variable Name | Required? | Encrypted / Secret? | Purpose |
| :--- | :--- | :--- | :--- |
| `QUOTE_PASSWORD` | **Yes (for `/quote/`)** | **Yes** | Protects the internal quote builder against unauthorized access |
| `INSTAGRAM_ACCESS_TOKEN` | Optional | **Yes** | Long-lived Meta Graph token to render live Instagram posts |

### 2. GitHub Actions Secrets (Repository -> Settings -> Secrets & Variables -> Actions)
| Secret Name | Required? | Purpose |
| :--- | :--- | :--- |
| `CF_PAGES_DEPLOY_HOOK` | Optional | Webhook URL to trigger daily automated site rebuilds |

### 3. Local Development (`.dev.vars`)
For local edge function testing with Wrangler, create a `.dev.vars` file (git-ignored):
```bash
QUOTE_PASSWORD="your-secure-dev-password"
INSTAGRAM_ACCESS_TOKEN="your-optional-instagram-token"
```

---

## 6. Cloudflare Deployment Configuration

- **Framework Preset**: None (or Astro)
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Deploy command** *(if prompted in Workers & Pages dashboard)*: `npx wrangler pages deploy dist`
- **Root directory**: `/`
- **Node.js Compatibility**: `nodejs_compat` enabled

---

## 7. Developer & Agent Runbook

### Everyday Commands
```bash
# Install dependencies
npm install

# Start local Astro development server
npm run dev

# Run local development with Cloudflare Pages Functions support
npx wrangler pages dev dist --binding QUOTE_PASSWORD=testpass

# Build static production bundle (33 routes, 1000+ responsive images)
npm run build

# Run automated audit and verification scripts
npm run audit
node scripts/check-layout.mjs
node scripts/check-quote.mjs
```

### Key Conventions to Maintain
1. **UK English Spelling**: Use UK spelling throughout all copy (`décor`, `centrepieces`, `personalised`, `favour`).
2. **Strict Zero-Error Builds**: Never bypass type errors or allow broken image references.
3. **No Hardcoded Secrets**: Never commit passwords or access tokens.
4. **Mobile First Responsive Design**: Test all layouts at 360px, 768px, 1024px, and 1440px widths.
