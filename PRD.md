# JNB Events — Product Requirements Document

> **Status:** Living document. Update this file whenever a decision is made or scope changes.  
> **Last updated:** November 2026

---

## 1. Project Overview

JNB Events is a Leicester-based wedding and events company offering mandaps, DJ, décor, civil ceremony styling, dance floors, special effects, and reception centrepieces. The website is a **marketing and lead-generation site**: every interaction should end with the visitor contacting JNB Events via WhatsApp.

### Goals

1. Convert visitors into WhatsApp enquiries — this is the single north-star metric.
2. Establish JNB Events as a premium, design-led brand competing with larger national companies.
3. Rank in Google for local and national wedding service searches.
4. Give the owner a simple, no-code way to update all content (photos, copy, pricing, testimonials).

### Non-goals

- E-commerce / online booking.
- Customer accounts or portals.
- Real-time availability calendar.

---

## 2. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Astro 7 (`output: static`) | Zero JS by default, ideal for a static brochure site with no dynamic server requirements |
| Styling | Tailwind CSS v4 (Vite plugin) | Utility-first, co-located styles; v4 used for `@theme` tokens and native cascade layers |
| Fonts | Bodoni Moda Variable + Instrument Sans Variable via `@fontsource-variable` | Self-hosted, GDPR-friendly, no third-party requests |
| Images | Astro `<Image>` + Sharp | Build-time optimisation: AVIF/WebP/JPEG at multiple widths, no runtime cost |
| CMS | Pages CMS (`.pages.yml`) | Git-backed, no database, edits commit to GitHub and trigger an automatic rebuild |
| PDF | PDFKit (browser bundle) | Quote PDFs generated client-side; nothing uploaded or stored |
| Hosting | Cloudflare Pages | Automatic deploys from GitHub, global CDN, free tier sufficient |
| Sitemap | `@astrojs/sitemap` | Auto-generated, `/quote/` and `/404` excluded |
| Type checking | TypeScript + `astro check` | Strict mode; content collections are fully typed via Zod |

---

## 3. Architecture

```
GitHub repo
  └─ push / merge to main
       └─ Cloudflare Pages build
            ├─ astro build  (Sharp optimises images, Tailwind purges CSS)
            └─ dist/        (pure static files, served from CDN)
```

- **No server-side rendering.** All pages are pre-rendered at build time.
- **Content lives in `src/content/`** as YAML/Markdown. Images live in `src/assets/media/`. Both are committed to Git.
- **Pages CMS** reads and writes these files through the GitHub API. A save in the CMS = a Git commit = an automatic Cloudflare Pages rebuild (typically 2–3 minutes).
- **The domain** is defined in exactly one place: `astro.config.mjs` → `SITE`. Change it there only.

---

## 4. Page Structure

### 4.1 Public Pages

| Route | File | Purpose |
|---|---|---|
| `/` | `src/pages/index.astro` | Homepage |
| `/about/` | `src/pages/about.astro` | About the business |
| `/services/` | `src/pages/services/index.astro` | Full services listing |
| `/services/[slug]/` | `src/pages/services/[slug].astro` | Individual service detail |
| `/gallery/` | `src/pages/gallery/index.astro` | Full portfolio gallery with category filter |
| `/gallery/[slug]/` | `src/pages/gallery/[slug].astro` | Individual project with lightbox |
| `/gallery/category/[category]/` | `src/pages/gallery/category/[category].astro` | Category-filtered gallery |
| `/contact/` | `src/pages/contact.astro` | Contact / enquiry form |
| `/privacy/` | `src/pages/privacy.astro` | Privacy notice |
| `/404` | `src/pages/404.astro` | Not-found page |
| `/robots.txt` | `src/pages/robots.txt.ts` | Robots file |

### 4.2 Unlisted (Internal) Pages

| Route | Purpose |
|---|---|
| `/quote/` | Internal quote-builder tool. `noindex: true`. Not in sitemap. Not in nav. |

### 4.3 Homepage Sections (in order)

1. **Hero** — full-bleed photo, display headline (bottom-left), subheading + two CTAs below a hairline rule.
2. **Brand Statement** — asymmetric two-column: tall photo (left) + overlapping second photo; standfirst + body copy (right). Section `01`.
3. **Services** — dark (`bg-night`). Feature cards (first 3 services) with staggered vertical offset, then ruled row cards for remaining services. Services inline CTA below. Section `02`.
4. **Night → Cream transition** — botanical motif mark bridging the dark-to-light section break.
5. **Featured Work** — full-bleed opener image (first `featured` project), then 3-up collage below. Section `03`.
6. **Where We Work** — single ruled strip, service areas rendered as dot-separated list. Section `04`.
7. **Testimonials** — pull-quote treatment (first testimonial set large, rest in a grid). Conditionally rendered: hides itself if no testimonials are published.
8. **CtaBand** — closing WhatsApp CTA on `bg-moss`, with optional photo.

---

## 5. Design System

### 5.1 Colour Tokens

| Token | Hex | Usage |
|---|---|---|
| `--color-cream` | `#faf7f2` | Default page background, light sections |
| `--color-cream-deep` | `#f1ebe0` | Alternate light sections (testimonials, areas, about services) |
| `--color-ink` | `#1f1b16` | Body text, headings on light |
| `--color-ink-soft` | `#3a342c` | Secondary body text on light |
| `--color-night` | `#14110e` | Dark sections (hero, services, footer) |
| `--color-moss` | `#1d241e` | Alternate dark sections (CtaBand, about principles) |
| `--color-muted` | `#5f574c` | De-emphasised text on light (6.9:1 contrast) |
| `--color-gold` | `#b8954a` | Brand gold: hairline rules, folio decorations, motif on light |
| `--color-gold-deep` | `#7f6428` | Gold for small text on light (5.2:1 contrast) |
| `--color-gold-light` | `#d6b36a` | Gold on dark sections (9:1 contrast on `night`) |
| `--color-logo-gold` | `#9d6c0c` | The gold from the supplied logo file; wordmark on cream only |
| `--color-line` | `#ddd3c2` | Hairline rules on light backgrounds |

**Rules:**
- Gold is NEVER a button fill. Buttons are ink (dark) or cream (on dark).
- Gold appears as hairline rules, folio numbers, active nav underlines, and motif elements only.
- `.on-dark` parent class remaps several utilities automatically (e.g. `.text-muted`, `.text-gold-deep`, `.eyebrow`).

### 5.2 Typography

| Class | Font | Fluid size | Use |
|---|---|---|---|
| `.display` | Bodoni Moda | `clamp(3.4rem, min(8.6vw + 0.2rem, 11.5svh + 0.5rem), 8rem)` | Hero `h1` only |
| `.h1` | Bodoni Moda | `clamp(2.6rem, 6.2vw + 0.3rem, 6.25rem)` | Page-level headings |
| `.h2` | Bodoni Moda | `clamp(2rem, 3.6vw + 0.5rem, 4.25rem)` | Section headings |
| `.h3` | Bodoni Moda | `clamp(1.45rem, 1.4vw + 1rem, 2.2rem)` | Service card titles |
| `.standfirst` | Bodoni Moda | `clamp(1.25rem, 1.2vw + 1rem, 2.1rem)` | First large paragraph of a section |
| `.lead` | Instrument Sans | `clamp(1.05rem, 0.45vw + 0.95rem, 1.22rem)` | Supporting paragraph |
| `.eyebrow` | Instrument Sans | `0.72rem` | Small-caps section labels |
| Body | Instrument Sans | `1.0625rem` | Default |

- Headings use `line-height: 1.04` and `letter-spacing: -0.02em` to -0.03em.
- `em` inside any heading becomes italic Bodoni via the `emphasis()` helper — wrap a word in `*asterisks*` in CMS content.
- `.display::first-letter` uses `letter-spacing: -0.07em` to compensate for Bodoni's wide W side-bearing.

### 5.3 Spacing

- **Section padding:** `.section` = `clamp(3.5rem, 8vw, 8rem)` block. `.section-tight` = `clamp(3rem, 5vw, 5rem)`.
- **Wrap:** max-width `88rem`, padding `1.25rem` (mobile) → `2rem` (sm) → `3.5rem` (lg).
- **Grid:** 12-column at `lg` (1024px+). Most layouts use `lg:grid-cols-12` with named spans.

### 5.4 Brand Motif

The motif is the ogee mandap arch from the JNB logo, drawn as a 1px hairline SVG in a `120 × 66` viewBox. Three variants:

| Variant | Contents | Minimum size |
|---|---|---|
| `line` | Arch only | Any |
| `floral` | Arch + five-petal lotus + dotted drop line + diamond + teardrop | 38px |
| `botanical` | `floral` + leaf sprigs in lower corners | 46px |

**Usage rules:**
- Colour comes from `currentColor`. Default: `--color-gold`. On `.on-dark`: `--color-gold-light`.
- Always `aria-hidden="true"` unless it carries meaning (no known case where it does).
- Used sparingly: footer entrance divider, PageHero below the hairline, section transitions (dark→light), near headings in the brand statement and service pages, CtaBand eyebrow, Testimonials entrance, footer small-print corner.
- Never as a hero element. Never repeating heavily across every section.
- Use `opacity-30` to `opacity-60` for background accents; full opacity only for motif-as-divider.

---

## 6. Component Inventory

| Component | File | Notes |
|---|---|---|
| `BaseLayout` | `src/layouts/BaseLayout.astro` | Wraps every page: `<head>`, Header, Footer, FloatingWhatsApp, reveal script, JSON-LD |
| `Header` | `src/components/Header.astro` | Fixed, condenses on scroll, hides on scroll-down, returns on scroll-up. Transparent over hero (`overlayHeader`). Mobile full-screen menu. |
| `Footer` | `src/components/Footer.astro` | Botanical motif divider → enquiry copy + phone → services run-in index → wordmark + nav row → copyright |
| `PageHero` | `src/components/PageHero.astro` | Inner-page opener: folio, `h1`, optional lead, hairline, centred floral motif below |
| `ServiceCard` | `src/components/ServiceCard.astro` | `variant="feature"` (photo + title card) or `variant="row"` (ruled index line with thumbnail) |
| `ProjectCard` | `src/components/ProjectCard.astro` | Gallery thumbnail with hover zoom, category label, title |
| `CtaBand` | `src/components/CtaBand.astro` | Dark `bg-moss` CTA section: eyebrow + line motif, heading, text, WhatsApp button + contact link, optional photo |
| `Testimonials` | `src/components/Testimonials.astro` | Lead testimonial set large; additional as a grid. Conditionally rendered. Floral motif above the folio label. |
| `Motif` | `src/components/Motif.astro` | SVG brand motif, three variants, size prop |
| `Logo` | `src/components/Logo.astro` | Renders the wordmark SVG in `tone="dark"` or `tone="light"` |
| `Img` | `src/components/Img.astro` | Wrapper around Astro's `<Image>` with aspect-ratio, reveal animation, and parallax support |
| `WhatsAppButton` | `src/components/WhatsAppButton.astro` | Opens WhatsApp with a pre-filled message. Tracks `source` for analytics. |
| `FloatingWhatsApp` | `src/components/FloatingWhatsApp.astro` | Fixed bottom-right WhatsApp pill, hidden on quote page |
| `GalleryFilter` | `src/components/GalleryFilter.astro` | Category filter tabs for the gallery index page |
| `QuoteRow` | `src/components/QuoteRow.astro` | Single line-item row in the quote builder form |
| `SEO` | `src/components/SEO.astro` | `<title>`, `<meta>`, Open Graph, Twitter Card, canonical, JSON-LD injection |
| `Icon` | `src/components/Icon.astro` | Inline SVG icon: `arrow`, `phone`, `mail`, `pin`, `whatsapp`, `close` |

---

## 7. Content Model

All content is validated by Zod schemas in `src/content.config.ts`. The CMS config (`.pages.yml`) maps each field to a CMS editor control.

### Collections

| Collection | Format | Key fields |
|---|---|---|
| `settings` | `site.yaml` | `siteName`, `contact`, `location`, `serviceAreas`, `serviceAreaNote`, `social` |
| `home` | `home.yaml` | `hero`, `intro`, `services`, `featured`, `testimonials`, `cta` — all section copy + images |
| `about` | `about.md` | `heading`, `lead`, `highlights[]` (numbered principles), `image`, `secondImage` |
| `contact` | `contact.md` | `whatsappHeading`, `formHeading`, `areaHeading` — all form copy |
| `pages` | `{services,gallery,privacy}.md` | `seo`, `heading`, `lead` only |
| `quote` | `quote.yaml` | `items[]`, `discount`, `vat`, `pdf{}` (PDF wording) |
| `services` | `src/content/services/*.md` | `title`, `order`, `summary`, `lead`, `image`, `keyPoints[]`, `relatedCategory`, `whatsappMessage` |
| `projects` | `src/content/projects/*.md` | `title`, `category`, `date`, `featured`, `images[]`, `location` |
| `testimonials` | `src/content/testimonials/*.yaml` | `quote`, `name`, `event`, `order`, `published` |

### Important schema rules

- **Services order:** controlled by the `order` integer field (1 = first on site). The first 3 appear as feature photo cards; the rest as ruled index rows.
- **Featured projects:** set `featured: true` on up to 4 projects. The first becomes the full-bleed opener; the next 3 form the collage.
- **Testimonials:** only items with `published: true` are shown. If none are published, the entire Testimonials section is hidden.
- **Image fields** must resolve to a file under `src/assets/media/`. The CMS enforces this via `options.path`.
- **SEO title:** max 65 characters. **SEO description:** max 170 characters. The Zod schema enforces these.

---

## 8. SEO Requirements

- Every page renders `<title>`, `<meta name="description">`, Open Graph (`og:title`, `og:description`, `og:image`), and a `<link rel="canonical">`.
- Social preview image: the page's own image if it has one, otherwise the homepage hero image (1200×630 JPEG).
- **JSON-LD structured data:**
  - `LocalBusiness` + `WebSite` on every page (emitted by `BaseLayout`).
  - `ServiceList` on homepage and services index.
  - `Service` (individual) on each service detail page.
  - `BreadcrumbList` on all inner pages.
  - `ImageGallery` on gallery project pages.
- **Sitemap:** auto-generated at `/sitemap-index.xml`. `/quote/` and `/404` are excluded.
- **Robots:** `/robots.txt` is generated at build time; `/quote/` is marked `noindex` via the `<meta name="robots">` tag.
- URL structure: all URLs use trailing slashes (`trailingSlash: 'always'`). Links must include the trailing slash.
- **Keywords** should appear naturally in page titles and descriptions. "Leicester" appears in business schema even though displayed service areas are now regional (Midlands, London etc.).

---

## 9. Responsive Behaviour

| Breakpoint | Tailwind | Key layout changes |
|---|---|---|
| `< 640px` | (default) | Single column. Service feature cards become a 2-col grid (image + text side-by-side on small screens). |
| `≥ 640px` | `sm` | Service feature cards: 3-column. Buttons become inline-flex. |
| `≥ 768px` | `md` | PageHero: increased top padding (`pt-48`). Footer spacing increases. |
| `≥ 1024px` | `lg` | 12-column grid activates. Header switches from hamburger to desktop masthead. Most two-column layouts activate. |
| `≥ 1280px` | `xl` | Header tracking increases. |

**Typography:** All heading classes use `clamp()`. The `.display` class also clamps against `11.5svh` so the headline never overflows a short viewport (laptop).

**Motif:** At sizes below `~38px` use `variant="line"` only (the lotus petals and dots become indistinct).

---

## 10. Quote Builder

The quote builder lives at `/quote/` and is **not linked from any public page**. It is an internal tool for JNB Events staff to generate client-ready PDF quotations.

### Behaviour

1. Staff enter: client name, event date, venue.
2. Line items are pre-populated from `quote.yaml` defaults (editable in the CMS). Items can be added, edited, or removed.
3. A discount (%) and VAT toggle are available.
4. The live summary panel updates on every input change.
5. Clicking **Download PDF** triggers a client-side PDF generation:
   - PDFKit is dynamically imported (not in the initial bundle).
   - Fonts are fetched from the Vite-hashed `/_astro/` path.
   - The logo PNG is embedded.
   - The PDF is created entirely in the browser; nothing is sent to a server.
   - The file downloads as `JNB-Events-Quotation-{client}-{date}.pdf`.

### PDF Structure (4 pages)

1. **Cover** — logo centred, client name / date / venue below a hairline.
2. **About** — `wording.aboutHeading` (rich/italic), standfirst, body paragraphs.
3. **Quotation** — line items table with subtotal, optional discount, optional VAT, final total. Flows onto additional pages automatically if the item list is long.
4. **Important Notice** — optional special offer box (shown only when discount is active), booking note, contact details, wordmark sign-off.

### Maths

All money is stored and calculated in **whole pence** to avoid floating-point drift. `calculate()` in `src/lib/quote.ts` is the single source of truth for totals.

### CMS-editable defaults

Discount enabled/percent, VAT enabled/rate, all PDF wording strings, and the starting line items can all be changed in Pages CMS under **Quote builder defaults**.

---

## 11. Known Constraints and Decisions

| Decision | Rationale |
|---|---|
| Static output only | No server required; hosting on Cloudflare Pages free tier. Eliminates a whole class of runtime errors. |
| WhatsApp as the primary CTA | The owner responds fastest on WhatsApp. All primary buttons use `WhatsAppButton`. |
| No analytics script | Owner preference. No cookies, no consent banner needed. |
| No email address at launch | `settings.contact.email` is blank. The contact form falls back to opening WhatsApp with the form data pre-filled. |
| Font subsetting via `@fontsource-variable` | Self-hosted, GDPR-safe, no flash of unstyled text. Only the Latin subset is shipped. |
| PDFKit as a browser bundle | Avoids a serverless function or API call; keeps the quote tool fully offline-capable. |
| `location.locality/region` kept accurate | Used for schema.org `LocalBusiness`. Not shown in the footer UI, but must not be changed to regional names. |
| Motif used sparingly | Rule: it echoes the logo, it does not replace it. Max ~5–6 instances per page, always at low opacity in background roles. |
| Gold is never a button fill | Brand decision: ink/cream fills only. Gold appears as a hover sweep colour and hairline decoration only. |

---

## 12. Out of Scope

- Online payments or deposits.
- A customer-facing booking system or availability calendar.
- A blog or news section.
- Multi-language support.
- Dark mode toggle (the site uses both light and dark sections intentionally; a system dark mode toggle would conflict).
- Admin authentication for the CMS (Pages CMS uses GitHub OAuth).
- Automated email notifications from the enquiry form (requires adding a `formEndpoint` URL to site settings).
