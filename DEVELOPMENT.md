# JNB Events — Development Guide

> How this site was built, how to run it, and how to maintain it.

---

## 1. Tech Stack

| Tool | Version | Why |
|---|---|---|
| **Astro** | `^7` | Static-first framework: zero JS shipped by default, excellent image optimisation, typed content collections |
| **Tailwind CSS** | `^4` (Vite plugin) | Utility classes co-located with markup; `@theme` block for design tokens; no config file needed in v4 |
| **TypeScript** | `^6` | Strict mode throughout; all content collections typed via Zod |
| **Bodoni Moda Variable** | `@fontsource-variable` | Self-hosted Didone serif — the editorial face of the brand |
| **Instrument Sans Variable** | `@fontsource-variable` | Self-hosted humanist sans for body text and UI |
| **PDFKit** | `^0.20` | Browser-side PDF generation for the quote tool — no server required |
| **Sharp** | `^0.35` | Build-time image processing (AVIF, WebP, JPEG at multiple widths) |
| **Pages CMS** | `.pages.yml` | Git-backed headless CMS — edits commit to GitHub, Cloudflare Pages rebuilds automatically |
| **Cloudflare Pages** | — | Static hosting with global CDN; auto-deploys from GitHub on push to `main` |

---

## 2. Project Structure

```
jnb-events/
├── astro.config.mjs          # Framework config — domain defined here ONLY
├── package.json
├── tsconfig.json
├── .pages.yml                # Pages CMS schema — defines every editable field
├── PRD.md                    # Product Requirements Document
├── DEVELOPMENT.md            # This file
│
├── src/
│   ├── assets/
│   │   ├── brand/            # Logo files (SVG, PNG) — do not rename or move
│   │   └── media/            # All user-uploaded photos (hero, services, gallery, etc.)
│   │
│   ├── components/           # Reusable Astro components (see §5)
│   ├── content/              # All CMS-editable content
│   │   ├── pages/            # home.yaml, about.md, contact.md, services.md, gallery.md, privacy.md, quote.yaml
│   │   ├── services/         # One .md file per service
│   │   ├── projects/         # One .md file per gallery project
│   │   ├── testimonials/     # One .yaml file per testimonial
│   │   └── settings/         # site.yaml — global settings
│   │
│   ├── content.config.ts     # Zod collection schemas (single source of truth for content structure)
│   ├── layouts/
│   │   └── BaseLayout.astro  # HTML shell, <head>, Header, Footer, JSON-LD, reveal script
│   ├── lib/                  # Shared TypeScript utilities
│   │   ├── brand-paths.ts    # Vector outlines of the logo (generated — do not hand-edit)
│   │   ├── categories.ts     # Enum of project categories (shared by content schema + CMS)
│   │   ├── contact.ts        # WhatsApp URL builder, tel URL builder
│   │   ├── content.ts        # Typed getters for every collection
│   │   ├── motif.ts          # SVG path data for the brand motif
│   │   ├── nav.ts            # NAV array — add/remove pages here
│   │   ├── plates.ts         # Gallery grid layout logic
│   │   ├── quote-pdf.ts      # PDFKit drawing functions for the 4-page quote PDF
│   │   ├── quote.ts          # Quote maths (pence-based, no float drift)
│   │   ├── schema.ts         # JSON-LD builders (LocalBusiness, Service, BreadcrumbList, etc.)
│   │   └── text.ts           # emphasis() / plain() — *italic* in CMS headings
│   │
│   ├── pages/                # File-based routing
│   │   ├── index.astro       # Homepage
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   ├── quote.astro       # Unlisted internal tool
│   │   ├── privacy.astro
│   │   ├── 404.astro
│   │   ├── robots.txt.ts
│   │   ├── gallery/
│   │   │   ├── index.astro
│   │   │   ├── [slug].astro
│   │   │   └── category/[category].astro
│   │   └── services/
│   │       ├── index.astro
│   │       └── [slug].astro
│   │
│   ├── scripts/              # Node.js utility scripts (run via npm)
│   └── styles/
│       └── global.css        # Design tokens (@theme), component classes, motion rules
│
├── brand/                    # Source brand files (SVG logo etc.) — not deployed
├── public/                   # Static files copied as-is (favicon.svg, apple-touch-icon.png)
└── dist/                     # Build output — do not commit
```

---

## 3. Running Locally

### Prerequisites

- Node.js `>=22.23.4` (see `.node-version`)
- npm (comes with Node)

### Setup

```bash
cd jnb-events
npm install
npm run dev
```

The dev server starts at `http://localhost:4321`. Changes to `.astro`, `.ts`, `.yaml`, `.md`, and `.css` files hot-reload automatically.

### Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve `dist/` locally to check the build |
| `npm run check` | TypeScript + Astro diagnostics |
| `npm run verify` | Full pre-deploy check: `astro check` + `astro build` + audit |
| `npm run audit` | Post-build checks (canonical URLs, image alt text, JSON-LD) |

---

## 4. Deploying to Cloudflare Pages

### First-time setup

1. Push the repo to GitHub.
2. In the Cloudflare Pages dashboard: **Create application → Connect to Git → select the repo**.
3. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version env var:** `NODE_VERSION = 22`
4. Save and deploy.

### Ongoing deploys

Every push to `main` (or a merge from a feature branch) triggers an automatic rebuild. Typical build time: 2–3 minutes.

### Domain

Change the domain in `astro.config.mjs` → `const SITE = 'https://your-domain.co.uk'`. This is the only place the domain is defined. It affects canonical URLs, the sitemap, and all JSON-LD structured data.

---

## 5. Content Management (Pages CMS)

### Accessing the CMS

1. Visit `https://app.pagescms.org`.
2. Sign in with GitHub (the account that owns the repo).
3. Select the `jnb-events` repository.

All editable fields are defined in `.pages.yml`. Saving in the CMS creates a Git commit, which triggers a Cloudflare Pages rebuild.

### Media uploads

Photos are uploaded via the Pages CMS media panel. They are saved to `src/assets/media/` and renamed to safe, lowercase, hyphenated filenames automatically. Astro processes them at build time into AVIF/WebP/JPEG at multiple widths.

**Important:** never reference images from `public/`. All photos must live under `src/assets/media/` so they are optimised.

---

## 6. How to Add or Edit Content

### Edit site-wide copy or contact details

CMS → **Site settings** → edit any field → Save.

### Add a new service

1. CMS → **Services** → **New** (or duplicate an existing one).
2. Fill in: title, order number, summary, lead, main photo, key points.
3. Set `order` to control where it appears in navigation and on pages (lower = earlier).
4. Optionally link a gallery category so related projects appear on the service page.
5. Save → site rebuilds automatically.

**Code note:** the first 3 services (by `order`) appear as photo feature cards on the homepage. The rest appear as ruled index rows.

### Add a gallery project

1. CMS → **Gallery projects** → **New**.
2. Fill in: title, category, date, summary, at least one photo with alt text.
3. Toggle **Show on the homepage** to make it a featured project (max 4 featured recommended).
4. Save.

**Code note:** featured projects are sorted by date (newest first). The first featured project becomes the full-bleed opener on the homepage; the next three form the collage.

### Add a testimonial

1. CMS → **Testimonials** → **New**.
2. Enter the quote (use the client's real words only), name, and event type.
3. Toggle **Published** to make it appear on the site.
4. Use `order` (1 = first) to control display sequence.

### Edit the homepage

CMS → **Pages → Homepage** → edit any section → Save.

### Edit the privacy notice

CMS → **Pages → Privacy** → edit the body text → Save.

### Change service areas ("Where we work")

CMS → **Site settings → Areas you cover** → add/remove/reorder entries → Save.  
Also update **Service area sentence** (shown in the mobile menu and service page footnotes).

---

## 7. Design System Quick Reference

### Adding a section

1. Use `<section class="section bg-cream">` or `<section class="on-dark section bg-night text-cream">`.
2. Wrap content in `<div class="wrap">`.
3. Add a `<div class="folio">` for the section number/label.
4. Use `reveal` class on elements that should animate in on scroll.

### Using the motif

```astro
import Motif from '../components/Motif.astro';

<!-- As a centred divider between sections -->
<div class="flex justify-center py-6" aria-hidden="true">
  <Motif variant="botanical" size={46} class="opacity-55" />
</div>

<!-- Flanked by hairlines near a heading -->
<div class="flex items-center gap-4" aria-hidden="true">
  <div class="h-px flex-1 bg-line"></div>
  <Motif variant="floral" size={38} class="opacity-50" />
  <div class="h-px flex-1 bg-line"></div>
</div>
```

Variants: `line` (arch only) | `floral` (arch + lotus) | `botanical` (arch + lotus + leaf sprigs).  
On `.on-dark` sections the motif colour switches to `--color-gold-light` automatically.

### Adding italic emphasis to a heading

In any CMS heading field, wrap a word in asterisks: `Your *perfect* day`.  
In code, pass the string through `emphasis()` and use `set:html`:

```astro
import { emphasis, plain } from '../lib/text';
<h2 set:html={emphasis(heading)} aria-label={plain(heading)} />
```

---

## 8. Quote Builder

The quote builder is at `/quote/`. It is not linked from the public site — share the URL directly with staff.

### How it works

1. Staff fill in client details and edit line items.
2. Clicking **Download PDF** triggers a client-side import of PDFKit.
3. A 4-page A4 PDF is generated in the browser and downloaded immediately.
4. Nothing is uploaded or stored — completely client-side.

### Customising defaults

CMS → **Quote builder defaults**:

- **Starting line items** — pre-populated items that appear each time the tool is opened.
- **Discount** — enable/disable and set the default percentage.
- **VAT** — enable/disable and set the rate.
- **Wording in the PDF** — all text that appears in the About Us, quotation, and notice pages of the PDF.

### PDF structure

| Page | Content |
|---|---|
| 1 | Cover: logo, client name, event date, venue |
| 2 | About JNB Events: editable heading + body paragraphs |
| 3 | Quotation: line items, subtotal, optional discount, optional VAT, final total |
| 4 | Important Notice: optional special-offer box, booking note, contact details, sign-off |

The line items page automatically flows onto additional pages if the list is long.

---

## 9. Design Decisions and Trade-offs

| Decision | Trade-off |
|---|---|
| Fully static output | No server-side personalisation or real-time data; acceptable for a brochure site |
| Git-backed CMS | Requires a GitHub account to edit content; a database-backed CMS would be simpler for less technical owners |
| Browser-side PDF | PDFKit adds ~200KB to the quote page's JS bundle; acceptable as the page is unlisted and internal-only |
| Self-hosted fonts | Slightly larger initial payload vs. Google Fonts CDN cache; better privacy and GDPR compliance |
| No analytics | No insight into traffic; owner preference — can add privacy-respecting analytics (e.g. Plausible) later |
| WhatsApp-first contact | Requires the owner to be responsive on WhatsApp; a form endpoint can be added later via `settings.contact.formEndpoint` |
| `location.locality/region` kept as Leicester/Leicestershire | Required for accurate schema.org `LocalBusiness` markup even though displayed service areas are regional |

---

## 10. Known Limitations and Future Improvements

| Item | Notes |
|---|---|
| **No form email** | `settings.contact.email` is blank. Enquiries go to WhatsApp. Add a [Formspree](https://formspree.io) or [Web3Forms](https://web3forms.com) URL to `formEndpoint` to enable email delivery. |
| **Instagram feed needs a token** | The swipeable "latest posts" row (`InstagramFeed.astro`, `src/lib/instagram.ts`) is hidden until `INSTAGRAM_ACCESS_TOKEN` is set. See section 11. |
| **Placeholder images** | All photos are placeholders. Replace them with real JNB Events photography before launch. |
| **No analytics** | Add [Plausible](https://plausible.io) or [Fathom](https://usefathom.com) for privacy-respecting traffic data — both are GDPR-compliant without a cookie banner. |
| **One testimonial** | The testimonials section requires at least one published testimonial to appear. Add real client reviews in the CMS. |
| **No video support** | The current image components do not support video. Adding a video hero would require a new component. |
| **PDF font subsetting** | The quote PDF loads full Bodoni and Instrument Sans WOFF files (~180KB combined). Could be reduced with a custom Latin-only subset. |

---

## 11. Instagram feed (swipeable posts)

The homepage and `/gallery/` show the latest 12 Instagram posts as a swipeable row. The site is static, so the posts
are fetched **at build time** (`src/lib/instagram.ts`) and the photos are saved into the site as `/instagram/<id>.webp`
(Instagram's own image links expire). With no token, or if Instagram is unreachable, the section is hidden and the build still succeeds.

Full walkthrough (with Google reviews and other open items): [`SOCIAL_AND_REVIEWS_SETUP.md`](SOCIAL_AND_REVIEWS_SETUP.md).

**One-time setup**

1. Instagram app -> Settings -> Account type -> switch to **Professional** (Business or Creator). Free.
2. Go to <https://developers.facebook.com> -> create an app (type: Business) -> add the product **Instagram** -> *API setup with Instagram login*.
3. Add `jnb.sounds.events` as an Instagram tester / sign in with it, then **Generate token** (grant `instagram_business_basic`).
4. Put the token in Cloudflare Pages -> Settings -> Variables and Secrets as `INSTAGRAM_ACCESS_TOKEN` (encrypted, Production).
   For local builds use `.env` (see `.env.example`). The token is only used during the build and never reaches visitors.

**Staying up to date**

- `.github/workflows/daily-rebuild.yml` triggers a Cloudflare Pages build every day at about 05:17 UTC, so new posts appear within a day.
  Create a Cloudflare Pages *Deploy hook* and store its URL as the GitHub secret `CF_PAGES_DEPLOY_HOOK`.
- Each build also refreshes the token's 60-day life, so it never expires while the daily rebuild runs. If the site is not
  rebuilt for 60 days the token lapses: generate a new one (step 3) and update the variable.
- A failed refresh shows as a `[instagram]` warning in the Cloudflare build log.
