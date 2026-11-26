/**
 * Route-level SEO audit for the built Astro site.
 * Run after `astro build` (or through `npm run seo:verify`). It serves generated dist/ files over a
 * short-lived local HTTP server, so checks do not depend on DNS, Cloudflare, or external access.
 */
import { readdirSync, readFileSync, statSync, existsSync, createReadStream } from 'node:fs';
import { join, relative, dirname, extname } from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { SITE } from '../site.config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
if (!existsSync(DIST)) {
  console.error('dist/ not found. Run "npm run build" first.');
  process.exit(1);
}

const errors = [];
const warnings = [];
const error = (where, message) => errors.push(`${where}: ${message}`);
const warn = (where, message) => warnings.push(`${where}: ${message}`);
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
const files = walk(DIST);
const htmlFiles = files.filter((path) => path.endsWith('.html'));

function routeFor(file) {
  const rel = relative(DIST, file).replaceAll('\\', '/');
  if (rel === 'index.html') return '/';
  if (rel === '404.html') return '/404.html';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel.replace(/\.html$/, '')}`;
}

const pages = new Map(htmlFiles.map((file) => [routeFor(file), { file, html: readFileSync(file, 'utf8') }]));
const publicPages = new Map([...pages].filter(([route]) => route !== '/404.html'));
const base = new URL('/', SITE).toString();
const origin = new URL(SITE).origin;
const sitemapFile = join(DIST, 'sitemap.xml');
const robotsFile = join(DIST, 'robots.txt');
const robots = existsSync(robotsFile) ? readFileSync(robotsFile, 'utf8') : '';
const headersFile = join(ROOT, 'public/_headers');
const headersText = existsSync(headersFile) ? readFileSync(headersFile, 'utf8') : '';

if (!existsSync(sitemapFile)) error('/sitemap.xml', 'missing from build output');
if (!/Sitemap:\s*https:\/\//i.test(robots)) error('/robots.txt', 'missing absolute HTTPS sitemap reference');
if (!robots.includes(`Sitemap: ${base}sitemap.xml`)) error('/robots.txt', `sitemap reference must be ${base}sitemap.xml`);
if (/^\s*Disallow:\s*\/\s*$/im.test(robots)) error('/robots.txt', 'a crawler group disallows the entire site');
if (!/^User-agent:\s*\*/im.test(robots) || !/^Allow:\s*\//im.test(robots)) {
  error('/robots.txt', 'wildcard crawler group must permit the public site');
}
const globalHeaderBlock = headersText.split(/\n\s*\n/).find((block) => /^\/\*/.test(block.trim()));
if (/X-Robots-Tag:\s*noindex/i.test(globalHeaderBlock ?? '')) {
  error('public/_headers', 'a global rule applies X-Robots-Tag: noindex');
}

const sitemapText = existsSync(sitemapFile) ? readFileSync(sitemapFile, 'utf8') : '';
if (!/<urlset\b[\s\S]*<\/urlset>/.test(sitemapText)) error('/sitemap.xml', 'missing or malformed urlset');
if ((sitemapText.match(/<url>/g) ?? []).length !== (sitemapText.match(/<loc>/g) ?? []).length) {
  error('/sitemap.xml', 'URL entries and location elements do not match');
}
const sitemapUrls = [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
for (const match of sitemapText.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
  const date = new Date(match[1]);
  if (Number.isNaN(date.getTime()) || date.getTime() > Date.now() + 86_400_000) {
    error('/sitemap.xml', `invalid or future lastmod value: ${match[1]}`);
  }
}
const sitemapRoutes = new Set();
for (const value of sitemapUrls) {
  let url;
  try {
    url = new URL(value);
  } catch {
    error('/sitemap.xml', `invalid URL: ${value}`);
    continue;
  }
  if (url.protocol !== 'https:' || url.origin !== origin || url.hostname.startsWith('www.')) {
    error('/sitemap.xml', `URL is not on the preferred HTTPS host: ${value}`);
  }
  if (url.search || url.hash) error('/sitemap.xml', `URL contains query or fragment: ${value}`);
  if (sitemapRoutes.has(url.pathname)) error('/sitemap.xml', `duplicate URL: ${value}`);
  sitemapRoutes.add(url.pathname);
  if (!publicPages.has(url.pathname)) error('/sitemap.xml', `URL has no generated HTML page: ${value}`);
}

const titles = new Map();
const canonicals = new Map();
const incoming = new Map();
const noindexRoutes = new Set();
const affectedGalleryRoutes = [
  '/gallery/modern-gold-aisle-mandap/',
  '/gallery/archway-mandap/',
  '/gallery/blush-civil-ceremony/',
  '/gallery/blush-stage-and-backdrop/',
  '/gallery/evening-dancefloor-and-lighting/',
  '/gallery/magenta-floral-carved-mandap/',
  '/gallery/modern-gold-geometric-mandap/',
  '/gallery/sparkler-exit-and-smoke/',
  '/gallery/vibrant-haldi-and-mehndi-decor/',
  '/gallery/category/civil-ceremony/',
  '/gallery/category/dance-floor-and-lighting/',
  '/gallery/category/decor/',
  '/gallery/category/reception-and-centrepieces/',
  '/gallery/category/special-effects/',
];

const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1];
const unescapeHtml = (text) => text.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const routeForUrl = (url) => (url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`);

function localPathExists(pathname) {
  let clean;
  try {
    clean = decodeURIComponent(pathname.split('#')[0].split('?')[0]);
  } catch {
    return false;
  }
  if (clean.startsWith('//')) return true;
  const candidates = [
    join(DIST, clean.replace(/^\//, '')),
    join(DIST, clean.replace(/^\//, ''), 'index.html'),
    join(DIST, `${clean.replace(/^\//, '')}.html`),
  ];
  return candidates.some((candidate) => existsSync(candidate) && statSync(candidate).isFile());
}

for (const [route, { html }] of publicPages) {
  const title = unescapeHtml(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '');
  const description = attr(html.match(/<meta\s+name="description"[^>]*>/i)?.[0] ?? '', 'content');
  const canonicalValue = attr(html.match(/<link\s+rel="canonical"[^>]*>/i)?.[0] ?? '', 'href');
  const robotsTag = html.match(/<meta\s+name="robots"[^>]*>/i)?.[0] ?? '';
  const noindex = /noindex/i.test(attr(robotsTag, 'content') ?? '');
  const expectedCanonical = new URL(route, base).toString();

  if (!title.trim()) error(route, 'missing title');
  if (title.length > 65) warn(route, `title is ${title.length} characters`);
  if (titles.has(title)) error(route, `duplicate title with ${titles.get(title)}`);
  else if (title) titles.set(title, route);
  if (!description?.trim()) error(route, 'missing meta description');
  if (!canonicalValue) error(route, 'missing canonical URL');
  else {
    let canonical;
    try {
      canonical = new URL(unescapeHtml(canonicalValue));
      if (canonical.toString() !== expectedCanonical) error(route, `canonical is ${canonical}, expected self-canonical ${expectedCanonical}`);
      if (canonicals.has(canonical.toString())) error(route, `duplicate canonical with ${canonicals.get(canonical.toString())}`);
      else canonicals.set(canonical.toString(), route);
    } catch {
      error(route, `invalid canonical URL: ${canonicalValue}`);
    }
  }
  if ([...html.matchAll(/<h1\b/gi)].length !== 1) error(route, 'expected exactly one H1');
  if (noindex) noindexRoutes.add(route);
  if (noindex && sitemapRoutes.has(route)) error(route, 'noindex page is included in sitemap');
  if (!noindex && !sitemapRoutes.has(route)) error(route, 'indexable page is missing from sitemap');

  for (const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch (e) {
      error(route, `invalid JSON-LD: ${e.message}`);
    }
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const imageTag = match[0];
    // Empty alt is intentional for images nested inside an already-labelled project link.
    if (!/\balt(?=[\s=>/])/i.test(imageTag)) error(route, `image is missing alt text: ${imageTag.slice(0, 90)}`);
    const src = attr(imageTag, 'src');
    if (src?.startsWith('/') && !localPathExists(src)) error(route, `image source is missing: ${src}`);
    if (attr(imageTag, 'srcset') && !attr(imageTag, 'sizes')) warn(route, 'responsive image has srcset but no sizes hint');
  }

  for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = attr(match[0], 'href');
    if (!href) continue;
    const value = unescapeHtml(href);
    if (value.startsWith('#')) {
      if (!html.includes(`id="${value.slice(1)}"`)) error(route, `broken in-page link ${value}`);
      continue;
    }
    let target;
    try {
      target = new URL(value, base);
    } catch {
      error(route, `invalid link URL: ${value}`);
      continue;
    }
    if (target.origin === origin) {
      if (target.protocol !== 'https:') error(route, `internal link uses HTTP: ${value}`);
      const targetRoute = routeForUrl(target);
      if (!localPathExists(target.pathname)) error(route, `broken internal link: ${value}`);
      incoming.set(targetRoute, (incoming.get(targetRoute) ?? 0) + 1);
      if (target.search) warn(route, `internal link has query string: ${value}`);
    } else if (['jnbevents.co.uk', 'www.jnbevents.co.uk'].includes(target.hostname)) {
      error(route, `internal link uses non-canonical host: ${value}`);
    }
  }
}

for (const route of publicPages.keys()) {
  if (!noindexRoutes.has(route) && (incoming.get(route) ?? 0) === 0) warn(route, 'indexable page has no incoming internal links');
}
for (const route of affectedGalleryRoutes) {
  if (!publicPages.has(route)) error(route, 'affected gallery URL is not generated');
  else if (!noindexRoutes.has(route) && (incoming.get(route) ?? 0) === 0) error(route, 'indexable affected gallery URL has no internal link');
}

// Serve files from the actual Astro build output over a short-lived local HTTP server. This avoids
// relying on Cloudflare or network access while still checking route status and content-type.
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
};
const server = createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }
  let candidate = join(DIST, pathname.replace(/^\/+/, ''));
  if (!candidate.startsWith(`${DIST}/`) && candidate !== DIST) {
    response.writeHead(400).end();
    return;
  }
  if (existsSync(candidate) && statSync(candidate).isDirectory()) candidate = join(candidate, 'index.html');
  if (!existsSync(candidate) || !statSync(candidate).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'Content-Type': mime[extname(candidate).toLowerCase()] ?? 'application/octet-stream' });
  createReadStream(candidate).pipe(response);
});

await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Could not determine local audit server port');
const previewBase = `http://127.0.0.1:${address.port}`;

try {
  for (const route of publicPages.keys()) {
    try {
      const response = await fetch(new URL(route, previewBase), { redirect: 'manual' });
      if (response.status !== 200) error(route, `built route returned HTTP ${response.status}`);
      if (!response.headers.get('content-type')?.toLowerCase().includes('text/html')) {
        error(route, `expected HTML content-type, got ${response.headers.get('content-type') ?? 'none'}`);
      }
      if (/noindex/i.test(response.headers.get('x-robots-tag') ?? '') && !noindexRoutes.has(route)) {
        error(route, 'response X-Robots-Tag unexpectedly blocks indexing');
      }
    } catch (e) {
      error(route, `HTTP check failed: ${e.message}`);
    }
  }

  for (const [route, expectedTypes] of [['/sitemap.xml', ['application/xml', 'text/xml']], ['/robots.txt', ['text/plain']]]) {
    try {
      const response = await fetch(new URL(route, previewBase));
      if (response.status !== 200) error(route, `built resource returned HTTP ${response.status}`);
      const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
      if (!expectedTypes.some((expectedType) => contentType.includes(expectedType))) {
        error(route, `expected ${expectedTypes.join(' or ')} content-type, got ${response.headers.get('content-type') ?? 'none'}`);
      }
    } catch (e) {
      error(route, `HTTP check failed: ${e.message}`);
    }
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}

console.log(`SEO route audit: ${publicPages.size} HTML routes, ${sitemapRoutes.size} sitemap URLs, ${noindexRoutes.size} intentional noindex routes.`);
console.log(`Affected gallery URLs with internal links: ${affectedGalleryRoutes.filter((route) => publicPages.has(route) && !noindexRoutes.has(route) && (incoming.get(route) ?? 0) > 0).length} indexable; intentionally excluded draft/thin routes: ${affectedGalleryRoutes.filter((route) => noindexRoutes.has(route)).length}.`);
if (warnings.length) console.log('\nWarnings:\n - ' + warnings.join('\n - '));
if (errors.length) {
  console.error('\nErrors:\n - ' + errors.join('\n - '));
  process.exit(1);
}
console.log('SEO route audit passed.');
