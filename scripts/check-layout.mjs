/**
 * Browser check of the built site (run `npm run build` first).
 * For every page and at 390 / 768 / 1024 / 1440 px wide it reports:
 *   - images that failed to load (naturalWidth 0)
 *   - photographs that are still hidden/clipped after the visitor has scrolled to them
 *   - horizontal overflow
 *   - tap targets under 44px in the header and footer
 *   - console errors
 *   - page height in viewport-heights (to keep pages short)
 * With --shots it also writes screenshots to .scratch/shots/.
 *
 *   node scripts/check-layout.mjs [--shots] [--page=/about/]
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { mkdirSync, readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, relative, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PORT = 4399;
const BASE = `http://127.0.0.1:${PORT}`;
const shots = process.argv.includes('--shots');
const only = process.argv.find((a) => a.startsWith('--page='))?.slice(7);
const onlyVp = process.argv.find((a) => a.startsWith('--vp='))?.slice(5);

const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
let pages = walk(DIST)
  .filter((f) => f.endsWith('index.html'))
  .map((f) => '/' + relative(DIST, f).replace(/index\.html$/, ''))
  .sort();
pages.push('/404.html');
if (only) pages = pages.filter((p) => p === only);

const ALL_VIEWPORTS = [
  { w: 390, h: 844, name: 'mobile' },
  { w: 768, h: 1024, name: 'tablet' },
  { w: 1024, h: 768, name: 'laptop-s' },
  { w: 1440, h: 900, name: 'desktop' },
];
const VIEWPORTS = onlyVp ? ALL_VIEWPORTS.filter((v) => v.name === onlyVp) : ALL_VIEWPORTS;
// Page-height budget in viewport heights. The homepage is the showcase, so it gets more; inner pages stay short.
// Phones scroll naturally, so they get a 1.6x allowance.
const budget = (p, vp) => (p === '/' ? 8.5 : p.startsWith('/gallery/') && p !== '/gallery/' ? 7 : 6) * (vp.w < 700 ? 1.6 : 1);

// Tiny static server for dist/, bound to loopback only (no external exposure).
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, BASE).pathname);
  let file = normalize(join(DIST, urlPath));
  if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) { res.writeHead(404, { 'Content-Type': TYPES['.html'] }).end(readFileSync(join(DIST, '404.html'))); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const stop = () => server.close();

if (shots) mkdirSync(join(ROOT, '.scratch/shots'), { recursive: true });
const browser = await chromium.launch();
const problems = [];
const rows = [];

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  for (const path of pages) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(BASE + path, { waitUntil: 'load' });

    // Scroll through like a visitor so lazy images load and reveals fire.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += Math.round(vp.h * 0.7)) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(700);

    const res = await page.evaluate(() => {
      const out = { broken: [], hidden: [], overflow: false, smallTargets: [], height: document.documentElement.scrollHeight };
      for (const img of document.images) {
        if (img.id === 'lightbox-img') continue;
        if (img.complete && img.naturalWidth === 0) out.broken.push(img.currentSrc || img.src);
      }
      // After scrolling past, every revealed photograph must be fully visible.
      document.querySelectorAll('.reveal-img, .reveal').forEach((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (r.width === 0) return;
        const clipped = cs.clipPath !== 'none' && cs.clipPath !== 'inset(0px)' && cs.clipPath !== 'inset(0% 0% 0% 0%)';
        if (!el.classList.contains('is-visible') || clipped || Number(cs.opacity) < 0.99) out.hidden.push(el.className.slice(0, 40));
      });
      out.overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      document.querySelectorAll('header a, header button, footer a').forEach((a) => {
        const r = a.getBoundingClientRect();
        if (r.width && r.height && (r.height < 40 || r.width < 40) && getComputedStyle(a).display !== 'inline') out.smallTargets.push((a.textContent || a.ariaLabel || '').trim().slice(0, 20));
      });
      return out;
    });

    const label = `${vp.name} ${vp.w}px ${path}`;
    const vh = res.height / vp.h;
    rows.push({ label, vh: vh.toFixed(1) });
    if (res.broken.length) problems.push(`${label}: ${res.broken.length} image(s) failed to load: ${res.broken[0]}`);
    if (res.hidden.length) problems.push(`${label}: ${res.hidden.length} element(s) still hidden after scroll`);
    if (res.overflow) problems.push(`${label}: horizontal overflow`);
    if (res.smallTargets.length) problems.push(`${label}: small tap targets: ${[...new Set(res.smallTargets)].join(', ')}`);
    if (errors.length) problems.push(`${label}: console errors: ${errors[0]}`);
    if (vh > budget(path, vp)) problems.push(`${label}: page is ${vh.toFixed(1)} viewports tall (budget ${budget(path, vp).toFixed(1)})`);

    if (shots) {
      const name = `${vp.name}-${path.replace(/\//g, '_') || '_'}`;
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      await page.screenshot({ path: join(ROOT, `.scratch/shots/${name}-fold.png`) });
      await page.screenshot({ path: join(ROOT, `.scratch/shots/${name}-full.png`), fullPage: true });
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
stop();

console.log('Page height (viewport heights):');
for (const vp of VIEWPORTS) {
  const r = rows.filter((x) => x.label.startsWith(vp.name) && ['/', '/services/', '/about/', '/gallery/', '/contact/'].some((p) => x.label.endsWith(' ' + p)));
  console.log(`  ${vp.name.padEnd(8)} ${r.map((x) => `${x.label.split(' ').pop()}=${x.vh}`).join('  ')}`);
}
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n - ` + problems.join('\n - '));
  process.exit(1);
}
console.log(`\nLayout check passed: ${pages.length} pages x ${VIEWPORTS.length} viewports.`);
process.exit(0);
