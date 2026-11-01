/**
 * End-to-end test of the quote builder in a real browser: live totals, discount and VAT switches,
 * add / remove line items, and an actual "Download PDF" (the downloaded file is checked for 4 pages).
 *   node scripts/check-quote.mjs     (run `npm run build` first)
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { statSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PORT = 4397;
const BASE = `http://127.0.0.1:${PORT}`;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = createServer((req, res) => {
  let file = normalize(join(DIST, decodeURIComponent(new URL(req.url, BASE).pathname)));
  if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const problems = [];
const expect = (cond, msg) => { if (!cond) problems.push(msg); };
const browser = await chromium.launch();

for (const vp of [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 900 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const t = (id) => page.locator(`#${id}`).innerText();
  const tag = (m) => `${vp.name}: ${m}`;

  await page.goto(`${BASE}/quote/`);
  expect((await page.locator('[data-row]').count()) === 6, tag('expected 6 starting rows'));
  expect((await t('q-subtotal')) === '£2,625.00', tag('start subtotal'));
  expect((await t('q-total')) === '£2,362.50', tag('start total with 10% discount'));
  expect(await page.locator('#q-vat-row').isHidden(), tag('VAT row hidden at start'));

  // VAT on: 20% of the discounted price
  await page.check('#q-vat-on');
  expect((await t('q-vat')) === '£472.50', tag('VAT amount'));
  expect((await t('q-total')) === '£2,835.00', tag('total with VAT'));

  // Discount percentage live
  await page.fill('#q-discount-pct', '20');
  expect((await t('q-discount')) === '–£525.00', tag('20% discount amount'));
  expect((await t('q-total')) === '£2,520.00', tag('total at 20% + VAT'));
  await page.uncheck('#q-discount-on');
  expect(await page.locator('#q-discount-row').isHidden(), tag('discount row hidden when off'));
  expect(await page.locator('#q-discount-pct').isDisabled(), tag('percent input disabled when off'));
  expect((await t('q-total')) === '£3,150.00', tag('total, discount off + VAT'));
  await page.check('#q-discount-on');
  await page.fill('#q-discount-pct', '10');
  await page.uncheck('#q-vat-on');

  // Edit a price, tick Free, add and remove
  await page.fill('#q-price-1', '1,500');
  expect((await t('q-subtotal')) === '£2,875.00', tag('edited price'));
  await page.check('[data-row]:nth-child(1) [data-free]');
  expect((await t('q-subtotal')) === '£1,375.00', tag('free item counts as zero'));
  await page.click('#q-add');
  expect((await page.locator('[data-row]').count()) === 7, tag('row added'));
  await page.fill('#q-desc-7', 'Extra uplighters');
  await page.fill('#q-price-7', '99.5');
  expect((await t('q-subtotal')) === '£1,474.50', tag('new row counted'));
  await page.click('[data-row]:nth-child(2) [data-remove]');
  expect((await page.locator('[data-row]').count()) === 6, tag('row removed'));
  const ids = await page.locator('[data-desc]').evaluateAll((els) => els.map((e) => e.id));
  expect(ids.join() === 'q-desc-1,q-desc-2,q-desc-3,q-desc-4,q-desc-5,q-desc-6', tag(`ids renumbered (${ids.join()})`));
  const orphan = await page.evaluate(() => [...document.querySelectorAll('label[for]')].filter((l) => !document.getElementById(l.htmlFor)).length);
  expect(orphan === 0, tag('every label points at a field'));

  // Real download, using the client's details
  await page.fill('#q-client', 'Priya & Raj Patel');
  await page.fill('#q-date', '2027-06-14');
  await page.fill('#q-venue', 'The Grand Hall, Leicester');
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('#q-download')]);
  const name = download.suggestedFilename();
  expect(name === 'JNB-Events-Quotation-priya-raj-patel-2027-06-14.pdf', tag(`filename (${name})`));
  const path = await download.path();
  const bytes = readFileSync(path);
  expect(bytes.subarray(0, 5).toString() === '%PDF-', tag('file is a PDF'));
  const pageCount = (bytes.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length;
  expect(pageCount === 4, tag(`PDF has 4 pages (found ${pageCount})`));
  expect(bytes.length > 20000 && bytes.length < 400000, tag(`PDF size ${bytes.length}`));
  expect((await t('q-status')).includes('downloaded'), tag('status message'));
  expect(!(await page.locator('#q-download').isDisabled()), tag('button re-enabled'));

  // No horizontal overflow, tap targets
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow <= 0, tag(`horizontal overflow ${overflow}px`));
  // Tap targets: buttons and the label that wraps each checkbox must be at least 44px tall (the caption labels above fields are not tapped).
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('#quote-form button, #quote-form label:has(input[type=checkbox])')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height && (r.height < 43 || r.width < 43); }).length,
  );
  expect(small === 0, tag(`${small} tap targets under 44px`));
  expect(errors.length === 0, tag(`console/page errors: ${errors.join(' | ')}`));
  await ctx.close();
}

// Without JavaScript the page must still read sensibly (server-rendered defaults)
{
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/quote/`);
  expect((await page.locator('#q-total').innerText()) === '£2,362.50', 'no-JS: default total is rendered');
  expect((await page.locator('noscript').count()) >= 1, 'no-JS: explanatory notice present');
  await ctx.close();
}

await browser.close();
server.close();
if (problems.length) {
  console.error('\nQuote builder problems:\n - ' + problems.join('\n - '));
  process.exit(1);
}
console.log('Quote builder check passed: totals, toggles, add/remove, real PDF download (phone + desktop), no-JS fallback.');
