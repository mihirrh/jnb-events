/**
 * Renders every page with (a) JavaScript disabled and (b) prefers-reduced-motion, and fails if any photograph,
 * heading or call to action is invisible, or the page overflows horizontally.
 *   node scripts/check-fallbacks.mjs     (run `npm run build` first)
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, relative, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PORT = 4396;
const BASE = `http://127.0.0.1:${PORT}`;
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const pages = walk(DIST).filter((f) => f.endsWith('index.html')).map((f) => '/' + relative(DIST, f).replace(/index\.html$/, '')).sort();

// Tiny static server for dist/, bound to loopback only.
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let file = normalize(join(DIST, decodeURIComponent(new URL(req.url, BASE).pathname)));
  if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch();
const problems = [];
const modes = [
  { name: 'no-JS', opts: { javaScriptEnabled: false } },
  { name: 'reduced-motion', opts: { reducedMotion: 'reduce' } },
];

for (const mode of modes) {
  for (const vp of [{ w: 390, h: 844 }, { w: 1440, h: 900 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, ...mode.opts });
    for (const path of pages) {
      const page = await ctx.newPage();
      await page.goto(BASE + path, { waitUntil: 'load' });
      if (mode.name === 'reduced-motion') {
        const total = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < total; y += vp.h) {
          await page.evaluate((yy) => window.scrollTo(0, yy), y);
          await page.waitForTimeout(60);
        }
      }
      // hero-in is a CSS animation (up to 420ms delay + 1.1s); let it finish before judging visibility.
      await page.waitForTimeout(2000);
      const res = await page.evaluate(() => {
        const hidden = [];
        document.querySelectorAll('.reveal, .reveal-img, .hero-in').forEach((el) => {
          const cs = getComputedStyle(el);
          if (el.getBoundingClientRect().width && (Number(cs.opacity) < 0.99 || cs.visibility === 'hidden')) hidden.push(el.className.slice(0, 40));
        });
        return { hidden, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
      });
      const label = `${mode.name} ${vp.w}px ${path}`;
      if (res.hidden.length) problems.push(`${label}: ${res.hidden.length} element(s) invisible (${res.hidden[0]})`);
      if (res.overflow) problems.push(`${label}: horizontal overflow`);
      await page.close();
    }
    await ctx.close();
  }
}
await browser.close();
server.close();
if (problems.length) {
  console.error(`${problems.length} problem(s):\n - ` + problems.slice(0, 40).join('\n - '));
  process.exit(1);
}
console.log(`Fallback check passed: ${pages.length} pages x 2 viewports x ${modes.length} modes.`);
process.exit(0);
