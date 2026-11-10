# Master System Prompt: Recreating the JNB Events Luxury Website

> Use this comprehensive specification and system prompt in any LLM or AI coding agent to recreate the **JNB Events** luxury decor, mandap, and event production website from scratch.

---

## 1. Project Overview & Brand Identity

### 1.1 Brand Profile
- **Brand Name**: JNB Events (JNB Decor & Events Ltd)
- **Industry**: Luxury Asian & Hindu Wedding Decor, Mandap Design, Event Production, Staging, DJ & Entertainment.
- **Primary Location**: Leicester, Leicestershire, East Midlands, United Kingdom.
- **Coverage**: Leicestershire, Nottinghamshire, Derbyshire, West Midlands (Birmingham, Coventry, Wolverhampton), London, and UK-wide bespoke destination setups.
- **Target Audience**: Discerning couples, high-net-worth families, and luxury event planners seeking bespoke, turnkey wedding decor, architectural mandaps, and seamless ceremonial production.
- **Tone & Voice**: Regal, refined, editorial, understated British-Indian luxury. High attention to detail, respectful of sacred traditions while commanding modern architectural grandeur.

### 1.2 Visual Identity & Design System
- **Color Palette**:
  - `Night / Obsidian` (`#0a0908` / `#121110`): Deep dark surfaces, regal contrast bands, and hero backgrounds.
  - `Royal Gold / Antique Brass` (`#b9975b`, `#d4af37`, `#8a6d3b`): Subtle accents, borders, numerals, links, and decorative hairline dividers.
  - `Alabaster Cream / Silk` (`#fbf8f2`, `#f4ede2`, `#ede4d4`): Warm, soft background canvases avoiding harsh stark white.
  - `Ink / Charcoal` (`#1a1918`, `#2b2927`): High-legibility editorial typography for body copy and headings.
- **Typography Scale**:
  - **Headings / Editorial Display**: Elegant high-contrast serif (e.g. *Playfair Display* / *Cormorant Garamond* / *Cinzel* style).
  - **Body / Navigation / UI**: Clean geometric sans-serif (e.g. *Plus Jakarta Sans* / *Inter* / *Outfit*).
  - **Numerals**: Monospaced tabular serif numbers for list markers (`01`, `02`, `03`).
- **Brand Motif**:
  - Custom SVG vector echoing traditional Indian ogee mandap arches and delicate lotus petals.
  - Used sparingly at low opacity (30–50%) as quiet section accents or hairline bridges, never competing with photography.

---

## 2. Technical Stack & Architecture

- **Core Framework**: **Astro** (Static Site Generation mode, `output: 'static'`, zero client-side JavaScript overhead on static content).
- **Styling**: **Tailwind CSS** (v4) with extended luxury color tokens, fluid typography clamps (`clamp(...)`), and responsive layout containers.
- **Content Management**: **Pages CMS** (Git-backed open-source CMS configured via `.pages.yml`), enabling non-technical client updates without database servers.
- **Hosting / Deployment**: **Cloudflare Pages** (static edge deployment, custom security headers in `public/_headers`, asset caching).
- **Responsive Media Engine**:
  - Sharp-powered responsive image component (`Img.astro`) outputting modern AVIF and WebP formats.
  - Dynamic `srcset` calculation preserving native photo dimensions (`src.width`), preventing pixelation on high-DPI/Retina screens.
  - Fixed aspect ratio containers to completely eliminate Cumulative Layout Shift (CLS = 0).
- **Interactive Features**:
  - Client-side interactive Quote Builder with dynamic live pricing, deposit calculation, and instant vector/canvas PDF download.
  - Floating WhatsApp / Inquiry button drawer with URL-encoded contextual messages for each service and gallery project.
  - Static fallback Instagram feed grid.

---

## 3. Complete File Structure

```text
jnb-events/
├── .pages.yml                          # Pages CMS schema configuration
├── astro.config.mjs                    # Astro configuration (site URL, sitemap, sharp image service)
├── package.json                        # Scripts and dependencies
├── tailwind.config.mjs                 # Tailwind CSS 4 configuration
├── tsconfig.json                       # TypeScript configuration
├── public/
│   ├── _headers                        # Cloudflare Pages security & caching headers
│   ├── favicon.svg                     # Brand vector favicon
│   └── robots.txt                      # Search engine crawl directives
├── src/
│   ├── assets/
│   │   ├── brand/                      # SVG logos (dark, light, horizontal, emblem)
│   │   └── media/                      # Curated high-res setup photography
│   │       ├── hero/
│   │       ├── services/
│   │       ├── gallery/
│   │       ├── home/
│   │       └── about/
│   ├── components/
│   │   ├── BaseLayout.astro            # Core HTML shell (meta, Open Graph, fonts, schema)
│   │   ├── Header.astro                # Luxury fixed/sticky navigation with mobile drawer
│   │   ├── Footer.astro                # Regal multi-column footer with contact and legal links
│   │   ├── PageHero.astro              # Standardized inner page header banner
│   │   ├── Img.astro                   # High-fidelity responsive image component
│   │   ├── ServiceCard.astro           # Card for service grids (feature and row variants)
│   │   ├── ProjectCard.astro           # Portfolio project card with category tag & zoom effect
│   │   ├── CtaBand.astro               # Full-width closing call-to-action banner
│   │   ├── WhatsAppButton.astro        # Frictionless WhatsApp direct-action button
│   │   ├── FloatingEnquire.astro       # Sticky floating mobile & desktop quick-inquiry drawer
│   │   ├── InstagramFeed.astro         # Visual social proof grid
│   │   ├── Motif.astro                 # SVG ogee arch mandap emblem component
│   │   └── Testimonials.astro          # Verified client review quotes
│   ├── content.config.ts               # Astro 5/7 Content Collections schemas
│   ├── content/
│   │   ├── settings/
│   │   │   └── site.yaml               # Global brand, phone, WhatsApp, email, areas, social
│   │   ├── pages/
│   │   │   ├── home.yaml               # Homepage copy and section configurations
│   │   │   ├── about.md                # About page narrative & values
│   │   │   ├── services.md             # Services index hero copy
│   │   │   ├── gallery.md              # Gallery index copy
│   │   │   ├── contact.md              # Contact page metadata & directions
│   │   │   ├── privacy.md              # GDPR-compliant Privacy Policy
│   │   │   └── terms.md                # Terms of Service & Booking Conditions
│   │   ├── services/
│   │   │   ├── mandaps-and-stages.md   # Mandap designs, ceremony inclusions, setups
│   │   │   ├── decor.md                # Foyer, aisle, entrance, and bespoke draping
│   │   │   ├── haldi-and-mehndi-decor.md # Traditional pre-wedding vibrancy & seating
│   │   │   ├── civil-ceremony-decor.md # Western, registry, and fusion ceremony styling
│   │   │   ├── reception-decor-centrepieces.md # Tablescapes, stage backdrops, Chiavari seating
│   │   │   ├── dj-and-entertainment.md # Sound, Dhol players, live hosting, mixing
│   │   │   ├── sparklers-smoke-effects.md # Cold-fall pyrotechnics, dry ice low fog
│   │   │   ├── dance-floor-and-lighting.md # Seamless LED dancefloors, mood uplighting
│   │   │   └── packages.md             # Turnkey ceremony & reception bundles
│   │   ├── projects/                   # Portfolio case studies with image galleries
│   │   └── testimonials/               # Verified client review entries
│   ├── lib/
│   │   ├── content.ts                  # Type-safe content collection helper functions
│   │   ├── schema.ts                   # Structured Data (JSON-LD) generators
│   │   └── motif.ts                    # SVG brand path definitions
│   └── pages/
│       ├── index.astro                 # Homepage
│       ├── about.astro                 # About page
│       ├── contact.astro               # Contact & consultation page
│       ├── quote.astro                 # Interactive live Quote Builder & PDF Generator
│       ├── services/
│       │   ├── index.astro             # All services directory
│       │   └── [slug].astro            # Dynamic service detail pages
│       ├── gallery/
│       │   ├── index.astro             # Filterable portfolio gallery
│       │   ├── [slug].astro            # Dynamic project gallery detail page
│       │   └── category/[category].astro # Filtered gallery category archives
│       ├── privacy.astro               # Privacy Policy
│       ├── terms.astro                 # Terms of Service
│       └── 404.astro                   # Custom 404 error page
```

---

## 4. Key Page Specifications

### 4.1 Homepage (`src/pages/index.astro`)
1. **Hero Section**:
   - Full-bleed high-impact luxury wedding stage photograph.
   - Editorial headline: *"Artistry in Mandap Design & Turnkey Event Production."*
   - Clear primary CTA (*"Check Availability on WhatsApp"*) + secondary CTA (*"Explore Services"*).
2. **Brand Philosophy / Ethos**:
   - Clean cream background with subtle serif typography emphasizing bespoke craftsmanship, Midlands heritage, and precision execution.
3. **Services Section (Dark / Obsidian `bg-night`)**:
   - Dark luxury aesthetic with gold accents.
   - 3 Feature Service Cards with varying aspect ratios (3:4, 1:1, 4:5) for visual rhythm.
   - Numbered index list for remaining services with instant WhatsApp consultation CTA.
4. **Featured Work (Full-Bleed Venue Opener)**:
   - Clean, flush transition directly into a full-width high-resolution venue photograph.
   - Offset, staggered collage of recent weddings linking directly to gallery case studies.
5. **Where We Work (Local SEO Strip)**:
   - Plain-sight listing of target service areas: Leicester, Leicestershire, Nottingham, Derby, Birmingham, Coventry, Northampton, London, and nationwide UK.
6. **Social Proof & Testimonials**:
   - Curated client quotes and dynamic Instagram visual grid.
7. **Closing CTA Band**:
   - Full-width dark gold/night card with date check prompt and direct WhatsApp link.

### 4.2 Mandaps & Stages Service Page (`src/content/services/mandaps-and-stages.md`)
- Detailed breakdown of mandap design styles (Hand-carved wooden, Modern gold geometric, Floral canopy, Contemporary acrylic).
- **Mandap Setup Inclusions List**:
  - 4 × Choris (corner pillars)
  - 2 × Bajots & Patlas (ceremonial low seating stools)
  - 6 × Carved / Luxury Mandap Chairs (Bride, Groom, Parents)
  - 1 × Sacred Havan Kund (fire vessel & plate)
  - 1 × Ganesh Pedestal / Foyer Statue
  - 1 × Walkway Entrance Gate / Floral Arch
  - Premium pleated backdrop with ambient uplighting
  - Aisle and mandap carpet runner (red, ivory, or white)

### 4.3 Interactive Quote Builder (`src/pages/quote.astro`)
- Step-by-step ceremony and reception decor estimator:
  - Event type selection (Hindu Ceremony, Civil Wedding, Reception, Pre-wedding).
  - Mandap / Stage tier selection.
  - Aisle styling (Carpet runner, Chiavari chairs, Ganesh pillars, Walkway arches).
  - Reception tables (Centerpieces, floral arrangements, backdrop drapery).
  - Special effects (Low-lying dry ice fog, cold spark machines, LED dancefloor).
- Dynamic live calculation displaying estimated subtotal, optional VAT toggle, and deposit requirement.
- **Client PDF Generation**: One-click download generating a clean, professionally formatted quote estimate PDF.

---

## 5. SEO & Structured Data Strategy

### 5.1 Local SEO Keywords
- Head terms: *Luxury Asian Wedding Decor Leicester*, *Hindu Wedding Mandap Hire Leicestershire*, *Bespoke Indian Event Decor Midlands*, *Asian Wedding Stage Hire UK*.
- Area targeting: Leicester, Oadby, Loughborough, Melton Mowbray, Nottingham, Derby, Birmingham, Solihull, Coventry, Wolverhampton, London.

### 5.2 Structured Data (JSON-LD)
All pages must embed valid Schema.org JSON-LD:
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://jnbevents.co.uk/#business",
      "name": "JNB Events",
      "description": "Luxury Asian wedding decor, traditional carved mandaps, modern stages, and turnkey event production in Leicester, the Midlands, and across the UK.",
      "url": "https://jnbevents.co.uk",
      "telephone": "+447446890353",
      "areaServed": ["Leicester", "Leicestershire", "East Midlands", "West Midlands", "United Kingdom"],
      "priceRange": "££££"
    }
  ]
}
```

---

## 6. Image Optimization & Quality Rules

1. **Retina & High-DPI Guarantee**: Never hardcode maximum image widths lower than the source photo's native resolution. Always generate responsive widths up to `src.width` (e.g. 640px, 1100px, 1600px, 2400px).
2. **Sharp Quality**: Set Astro Sharp build quality to at least `86` to avoid compression banding on dark gradients and gold florals.
3. **Aspect Ratio Containers**: Always define explicit CSS aspect ratios (`ratio={3/2}`, `ratio={4/5}`, `ratio={16/9}`) to prevent layout shifts.
4. **Descriptive SEO Alt Text**: Every image must carry rich descriptive alt text detailing the venue style, decor materials, floral palette, and Midlands/UK location.

---

## 7. Build, Verification & Deployment Commands

```bash
# 1. Install dependencies
npm install

# 2. Local development server
npm run dev

# 3. Typecheck Astro and TypeScript
npx astro check

# 4. Production static build
npm run build

# 5. Local preview of static output
npm run preview
```

---

## 8. Master Prompt for AI Coding Agent

To regenerate or rebuild this website from scratch, paste the following prompt into your AI assistant:

```markdown
Create a high-end luxury website for "JNB Events" (Asian wedding decor, traditional carved mandaps, modern stages, and event production in Leicester and the UK) using Astro (static output), Tailwind CSS 4, and Pages CMS.

Follow these strict requirements:
1. DESIGN & PALETTE:
   - Palette: Night Obsidian (#0a0908), Royal Antique Gold (#b9975b, #d4af37), Warm Alabaster Cream (#fbf8f2), Ink text (#1a1918).
   - Typography: Elegant serif for display headings, clean geometric sans-serif for UI/body, monospaced tabular numerals.
   - Luxury aesthetic: Hairline gold borders, subtle ogee arch vector motifs (used sparingly), zero harsh stark whites.

2. ARCHITECTURE & PAGES:
   - Astro Content Collections for pages, services, projects, settings, and testimonials.
   - Pages: Homepage (/), About (/about/), Services (/services/ and /services/[slug]/), Gallery (/gallery/ and /gallery/[slug]/), Interactive Quote Builder (/quote/), Contact (/contact/), Privacy, Terms, and 404.
   - Include complete ceremonial package inclusions on the Mandaps & Stages page (Choris, Bajots, Patlas, Chairs, Havan Kund, Ganesh, Walkway, Backdrop, Carpet).

3. INTERACTIVE & CONVERSION:
   - Live Quote Builder on /quote/ with instant PDF download.
   - Floating WhatsApp / Inquiry button drawer with context-aware message URLs.
   - Sharp-powered responsive Img component outputting AVIF/WebP with retina srcset widths.

4. SEO & ACCESSIBILITY:
   - Full JSON-LD structured data (LocalBusiness, BreadcrumbList, Service).
   - Targeted local SEO for Leicester, Leicestershire, Midlands, and UK.
   - Zero layout shifts (CLS = 0) and 100% clean astro check & build.
```
