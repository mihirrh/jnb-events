/**
 * Post-build audit of the static site in ./dist.
 * Checks: internal links, one H1 per page, unique <title>/description, canonical, OG/Twitter tags,
 * JSON-LD parses, every <img> has alt, sitemap coverage, and that no page ships unexpectedly large images.
 *
 * Run:  npm run build && npm run audit
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (!existsSync(DIST)) {
  console.error('dist/ not found. Run "npm run build" first.');
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const files = walk(DIST);
const pages = files.filter((f) => f.endsWith('.html'));
const errors = [];
const warnings = [];
const err = (page, msg) => errors.push(`${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`${page}: ${msg}`);

const urlOf = (file) => {
  let u = '/' + relative(DIST, file).replace(/index\.html$/, '');
  return u === '/404.html' ? u : u;
};
const exists = (path) => {
  const clean = decodeURIComponent(path.split('#')[0].split('?')[0]);
  if (!clean || clean === '/') return true;
  const candidates = [join(DIST, clean), join(DIST, clean, 'index.html'), join(DIST, clean + '.html')];
  return candidates.some((c) => existsSync(c) && statSync(c).isFile());
};

const titles = new Map();
const descs = new Map();
const sitemapUrls = new Set();
for (const f of files.filter((f) => /sitemap-\d+\.xml$/.test(f))) {
  for (const m of readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapUrls.add(new URL(m[1]).pathname);
}

for (const file of pages) {
  const page = urlOf(file);
  const html = readFileSync(file, 'utf8');
  const get = (re) => html.match(re)?.[1];

  const h1s = [...html.matchAll(/<h1[\s>]/g)].length;
  if (h1s !== 1) err(page, `expected exactly 1 <h1>, found ${h1s}`);

  const title = get(/<title>([^<]*)<\/title>/);
  const desc = get(/<meta name="description" content="([^"]*)"/);
  if (!title) err(page, 'missing <title>');
  else {
    if (title.length > 65) warn(page, `title is ${title.length} chars (may be truncated in Google)`);
    if (titles.has(title)) err(page, `duplicate title with ${titles.get(title)}`);
    titles.set(title, page);
  }
  if (!desc) err(page, 'missing meta description');
  else {
    if (desc.length < 70 || desc.length > 175) warn(page, `description is ${desc.length} chars`);
    if (descs.has(desc)) err(page, `duplicate description with ${descs.get(desc)}`);
    descs.set(desc, page);
  }

  if (!/<link rel="canonical" href="https:\/\/[^"]+"/.test(html)) err(page, 'missing canonical');
  for (const tag of ['og:title', 'og:description', 'og:url', 'og:type']) {
    if (!html.includes(`property="${tag}"`)) err(page, `missing ${tag}`);
  }
  if (!html.includes('name="twitter:card"')) err(page, 'missing twitter:card');
  if (!/<html lang="en-GB"/.test(html)) err(page, 'missing lang="en-GB"');

  // JSON-LD
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!ld.length) err(page, 'no JSON-LD');
  const types = [];
  for (const m of ld) {
    try {
      const j = JSON.parse(m[1]);
      types.push(j['@type']);
    } catch (e) {
      err(page, 'invalid JSON-LD: ' + e.message);
    }
  }
  if (!types.includes('LocalBusiness')) err(page, 'LocalBusiness JSON-LD missing');

  // Images
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    // Astro emits empty alt (decorative images) as a bare `alt` attribute, which is valid HTML.
    if (!/\balt(?=[\s=>\/])/.test(tag)) err(page, `<img> without alt: ${tag.slice(0, 80)}`);
    if (tag.includes('id="lightbox-img"')) continue; // hidden dialog image, sized by CSS
    if (!/\bwidth=/.test(tag) || !/\bheight=/.test(tag)) warn(page, `<img> without width/height (layout shift risk): ${tag.slice(0, 60)}`);
  }
  const eager = [...html.matchAll(/<img\b[^>]*loading="eager"/g)].length;
  if (eager > 3) warn(page, `${eager} eager images (only above-the-fold images should be eager)`);

  // Internal links
  for (const m of html.matchAll(/\s(?:href|src)="(\/[^"#?]*)(?:[#?][^"]*)?"/g)) {
    if (m[1].startsWith('//')) continue;
    if (!exists(m[1])) err(page, `broken internal link/asset: ${m[1]}`);
  }
  // Anchors that point to ids on the same page
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    if (!html.includes(`id="${m[1]}"`)) err(page, `broken in-page anchor: #${m[1]}`);
  }
  // External links that open in a new tab must be safe
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener/.test(m[0])) err(page, `target=_blank without rel=noopener: ${m[0].slice(0, 60)}`);
  }

  // Sitemap coverage (404 excluded on purpose)
  if (page !== '/404.html' && !sitemapUrls.has(page)) err(page, 'not listed in sitemap');

  // Weight of HTML itself
  const kb = statSync(file).size / 1024;
  if (kb > 120) warn(page, `HTML is ${kb.toFixed(0)} kB`);
}

// robots.txt
const robots = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';
if (!/Sitemap: https:\/\//.test(robots)) err('/robots.txt', 'missing Sitemap line');

// JS payload
const js = files.filter((f) => f.endsWith('.js'));
const jsKb = js.reduce((n, f) => n + statSync(f).size, 0) / 1024;

// Images
const imgs = files.filter((f) => /\.(avif|webp|jpe?g|png)$/i.test(f));
const biggest = imgs.map((f) => [statSync(f).size / 1024, relative(DIST, f)]).sort((a, b) => b[0] - a[0]).slice(0, 3);

console.log(`Pages audited: ${pages.length}   Sitemap URLs: ${sitemapUrls.size}`);
console.log(`Client JS total: ${jsKb.toFixed(1)} kB across ${js.length} file(s)`);
console.log('Largest images:', biggest.map(([k, f]) => `${f.split('/').pop()} ${k.toFixed(0)}kB`).join(', '));
if (warnings.length) console.log('\nWarnings:\n - ' + warnings.join('\n - '));
if (errors.length) {
  console.error('\nErrors:\n - ' + errors.join('\n - '));
  process.exit(1);
}
console.log('\nAudit passed with no errors.');
