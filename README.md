# JNB Events website

Static website for **JNB Events** (décor, DJ and mandaps - Leicester, covering Leicestershire and the UK).

- **Astro 7** (static output, no adapter, no SSR) + **Tailwind CSS 4** + a small design-system stylesheet
- **Pages CMS** (Git-backed) edits all content - no code needed for day-to-day changes
- Deploys to **Cloudflare Pages**
- No paid services required

> **Placeholder content:** all photos are generated illustrations labelled "PLACEHOLDER IMAGE", and the three project descriptions say they are samples. Replace them from the CMS (see below) before launch. No testimonials are published, no reviews/awards/years-in-business are claimed anywhere.

---

## 1. Run locally

Requires Node 22.23.4 or newer (see `.node-version`).

```bash
npm install
npm run dev        # http://localhost:4321
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Builds the static site into `dist/` |
| `npm run preview` | Serves `dist/` locally |
| `npm run check` | Type-checks Astro, TypeScript and content |
| `npm run audit` | After a build: checks links, H1s, titles/descriptions, canonical/OG tags, JSON-LD, alt text, sitemap |
| `npm run verify` | `check` + `build` + `audit` in one go (no browser needed, safe for CI) |
| `npm run check:layout` | After a build: opens every page in headless Chromium at 390 / 768 / 1024 / 1440 px and reports failed or hidden images, horizontal overflow, small tap targets, console errors and page height. Add `--shots` to save screenshots to `.scratch/shots/`, `--page=/about/` or `--vp=mobile` to narrow it. One-time setup: `npx playwright install chromium`. |
| `npm run check:fallbacks` | After a build: renders every page with JavaScript off and with reduced motion, and fails if any image or text is hidden. Same Playwright setup as `check:layout`. |
| `npm run images:generate` | Re-creates the placeholder images (not needed once real photos are in) |

---

## 2. Deploy to Cloudflare Pages

1. Push this repository to GitHub (`https://github.com/mihirrh/jnb-events`).
2. In Cloudflare: **Workers & Pages -> Create -> Pages -> Connect to Git**, and pick the repository.
3. Build settings:

   | Setting | Value |
   | --- | --- |
   | Framework preset | Astro |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Environment variable | `NODE_VERSION` = `22.23.4` (also read from `.node-version`) |

4. Deploy. Every commit to the production branch (including commits made by Pages CMS) triggers a rebuild automatically.
5. **Custom domain:** Pages project -> *Custom domains*. Then update the `SITE` constant at the top of [`astro.config.mjs`](astro.config.mjs) to the real domain. It drives canonical URLs, the sitemap, `robots.txt`, Open Graph URLs and structured data - there is nowhere else to change.

   > The project currently assumes `https://jnbevents.co.uk`. **Confirm or change this before launch.**

`public/_headers` already sets security headers and long-term caching for built assets on Cloudflare Pages.

---

## 3. Set up Pages CMS

The CMS configuration lives in [`.pages.yml`](.pages.yml). It is already written - you only need to connect it.

1. Go to **https://app.pagescms.org** and sign in with GitHub.
2. Install the Pages CMS GitHub App on the account/organisation that owns the repository and grant it access to `jnb-events`.
3. Open the repository in Pages CMS. It reads `.pages.yml` and shows these sections:

   | CMS section | What it controls | File(s) |
   | --- | --- | --- |
   | **Site settings** | Business name, WhatsApp number & default message, email, form URL, service areas, social links, logo | `src/content/settings/site.yaml` |
   | **Pages -> Homepage** | Hero, brand statement, services intro, featured work text, closing banner | `src/content/pages/home.yaml` |
   | **Pages -> About / Contact / Services intro / Gallery intro / Privacy** | Page text and SEO fields | `src/content/pages/*.md` |
   | **Services** | One entry per service: title, summary, intro, photos, key points, WhatsApp message, SEO | `src/content/services/*.md` |
   | **Gallery projects** | Portfolio projects with multiple photos and categories | `src/content/projects/*.md` |
   | **Testimonials** | Client quotes (only shown when *Published* is ticked) | `src/content/testimonials/*.yaml` |

4. Saving in the CMS makes a Git commit; Cloudflare Pages rebuilds and the change is live in about a minute.

Uploaded images go to `src/assets/media/` (subfolder per type: `hero`, `gallery`, `services`, `about`, `home`, `brand`). Astro optimises every image at build time (AVIF + WebP + JPEG, several sizes, lazy-loaded), so owners can upload ordinary photos - but **keep originals under about 5 MB and at least 1600px wide** for best results.

---

## 4. Everyday tasks

### Add a new gallery project

1. Pages CMS -> **Gallery projects** -> **Add an entry**.
2. Fill in:
   - **Project title** (e.g. "Emerald & Gold Mandap")
   - **Category** (drop-down)
   - **Short description** (shown on cards and in search results)
   - **Area** (optional - only add what is true)
   - **Event date** (newest first)
   - **Show on the homepage** - tick for the featured section
3. Under **Photos**, add each photo: upload the file and write its **description (alt text)**, e.g. "Ivory and gold mandap with hanging lights". The **first photo is the cover**.
4. Save. The project appears in `/gallery/`, in its category page, and (if featured) on the homepage.

### Add or edit a service

1. Pages CMS -> **Services** -> **Add an entry** (or open an existing one).
2. Set **Order on site** (1 appears first), title, short summary, intro paragraph, main photo + alt text, key points, and the search-engine title/description.
3. Choose **Show gallery projects from this category** to display matching projects on that service page.
4. Optionally write extra page text in **Page text**.
5. Services appear automatically on the homepage, the Services page, the footer and in structured data.

### Change the WhatsApp number or message

Pages CMS -> **Site settings** -> **Contact details**. Enter the number as normal (e.g. `07872 340258`); the site converts it to international format for WhatsApp links automatically. Every WhatsApp button on the site updates.

### Add an email address (when you have one)

Pages CMS -> **Site settings** -> **Business email**. Until then the contact form opens WhatsApp with the enquiry pre-filled. Once an email is set the form uses the visitor's email app (`mailto:`).
For a form that delivers straight to the inbox without opening an email app, create a free form endpoint (for example Formspree or Web3Forms) and paste its URL into **Form service URL**. The form then submits in the background.

### Publish a testimonial

Pages CMS -> **Testimonials** -> add or open one -> paste a **real** client quote -> tick **Published**. The homepage section stays hidden while nothing is published.

### Add a new gallery category

Categories are a fixed list so URLs and filters stay tidy. To add one, edit **both**:
1. `src/lib/categories.ts` (`PROJECT_CATEGORIES`)
2. the two `values:` lists in `.pages.yml` (service `relatedCategory` and project `category`)

If they ever disagree, `npm run build` stops with a clear error naming the file - nothing broken goes live.

---

## 5. Project structure

```
.pages.yml                  Pages CMS configuration
astro.config.mjs            Site URL, sitemap, image service
public/                     favicon, _headers (Cloudflare)
scripts/
  generate-placeholders.mjs Creates the placeholder images
  audit-dist.mjs            Post-build SEO/link/accessibility audit
src/
  assets/media/             CMS-managed photos (optimised at build)
  content/                  CMS-managed text: settings, pages, services, projects, testimonials
  content.config.ts         Content schemas (validates everything the CMS saves)
  components/               Header, footer, WhatsApp buttons, image wrapper, cards, SEO head
  layouts/BaseLayout.astro  Page shell
  lib/                      Content helpers, WhatsApp URL builder, JSON-LD builders, categories
  pages/                    Routes (home, services, gallery, about, contact, privacy, 404, robots.txt)
  styles/global.css         Design tokens and component styles
```

### Design system in brief

- **Colour:** cream `#FAF7F2` base, near-black `#1F1B16` text. Antique gold `#B8954A` is used for fine rules, selected buttons and details. Small gold *text* on light backgrounds uses a deeper gold (`#7F6428`) so it passes contrast; on dark sections it switches to a lighter gold.
- **Type:** Cormorant (display serif) + Inter (body), both self-hosted via Fontsource - no third-party font requests.
- **Layout:** asymmetric grids, arch-cropped image echoing the logo, overlapping photos, fine gold borders; light/dark sections alternate on purpose.
- **Motion:** gentle fades and image reveals only; disabled automatically for visitors who prefer reduced motion.
- **Breakpoints:** fluid type and spacing, with layout changes at 640 / 768 / 1024 / 1280px. The desktop navigation appears from 1024px; tablets in portrait get the full-screen menu.

### SEO notes

- Every page has a unique title and description, one `<h1>`, canonical URL, Open Graph and Twitter tags.
- JSON-LD: `LocalBusiness` and `WebSite` on every page, plus `Service`, `ItemList`, `ImageGallery` and `BreadcrumbList` where relevant. Only facts supplied by the owner are included (name, number, area served, location). There are no ratings, review counts, awards or years in business.
- `sitemap-index.xml` and `robots.txt` are generated automatically from the configured site URL.
- `/sitemap.xml` is served as a rewrite to the generated sitemap via `public/_redirects`, so crawlers that try that URL first still find it.
- All content is static and identical for every visitor - nothing is personalised by cookies.
- **After launch:** add the site to Google Search Console and submit `https://<your-domain>/sitemap-index.xml`; create or claim a Google Business Profile for the Leicester business and keep name/phone consistent with the site.

---

## 6. Things the owner still needs to supply

- Real photography (replace every "PLACEHOLDER IMAGE") and a logo file (optional: *Site settings -> Logo image*)
- Business email address
- Final domain name (see section 2)
- Real testimonials (only if genuine and permitted)
- A read-through of the Privacy page wording

---

## Design notes (phase 3)

- **Gold is an accent.** Buttons are ink (cream on dark); gold is used for the "JNB" wordmark, hairlines, small running numbers and hover sweeps. Large numerals are a tint of the text colour.
- **Brand motif:** `src/components/Motif.astro` draws a mandap arch in three variants (`line`, `floral`, `monogram`). It is used sparingly: the footer divider, the 404 page and the favicon. Don't add it to photographs or headings.
- **Photographs never hide.** Reveals use opacity, not `clip-path` (a clipped element has no area, so the observer never fires and the photo stays blank).
- **Page length budgets** are enforced by `check:layout`: homepage 8.5 viewport heights, inner pages 6, project pages 7 (phones get 1.6x). Nothing is collapsed or hidden behind a click; pages are shortened by composition (three-across features, ruled lists, fewer plates).
- Photos are generated placeholders until real photography is supplied through the CMS.
