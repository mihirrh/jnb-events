// Builds the JNB Events business card: brand/business-card/{card.html, print-with-bleed.pdf, trim-size.pdf, front.png, back.png}
// Run: node scripts/build-business-card.mjs
// Details come from src/content/settings/site.yaml so the card never drifts from the website.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'brand', 'business-card');
mkdirSync(out, { recursive: true });

const yaml = readFileSync(join(root, 'src/content/settings/site.yaml'), 'utf8');
const pick = (re) => (yaml.match(re) || [])[1]?.trim().replace(/^["']|["']$/g, '');
const phone = pick(/whatsappNumber:\s*(.+)/);
const email = pick(/^\s*email:\s*(.+)/m);
const insta = pick(/instagram\.com\/([^\s"']+)/);
if (!phone || !email || !insta) throw new Error('Could not read contact details from site.yaml');

const lockup = readFileSync(join(root, 'src/assets/brand/jnb-lockup.svg'), 'utf8');
const wordmark = readFileSync(join(root, 'src/assets/brand/jnb-wordmark.svg'), 'utf8');
const font = (pkg, file) => `data:font/woff2;base64,${readFileSync(join(root, 'node_modules/@fontsource', pkg, 'files', file)).toString('base64')}`;
const bodoni = font('bodoni-moda', 'bodoni-moda-latin-500-normal.woff2');
const bodoniItalic = font('bodoni-moda', 'bodoni-moda-latin-400-italic.woff2');
const sans = font('instrument-sans', 'instrument-sans-latin-400-normal.woff2');
const sansBold = font('instrument-sans', 'instrument-sans-latin-600-normal.woff2');

// Trim 85 x 55 mm. Bleed 3 mm each side => 91 x 61 mm. Frame 3.2 mm and text 5.6 mm inside trim.
const html = (bleed) => `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>JNB Events business card</title><style>
@font-face{font-family:Bodoni;font-weight:500;src:url(${bodoni})}
@font-face{font-family:Bodoni;font-style:italic;font-weight:400;src:url(${bodoniItalic})}
@font-face{font-family:Sans;font-weight:400;src:url(${sans})}
@font-face{font-family:Sans;font-weight:600;src:url(${sansBold})}
@page{size:${85 + 2 * bleed}mm ${55 + 2 * bleed}mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fff}
.card{position:relative;width:${85 + 2 * bleed}mm;height:${55 + 2 * bleed}mm;overflow:hidden;page-break-after:always;break-after:page;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.card:last-child{page-break-after:auto;break-after:auto}
.safe{position:absolute;inset:${bleed + 5.6}mm}
.front{background:#14110e;color:#d6b36a}
.front .frame{position:absolute;inset:${bleed + 3.2}mm;border:0.25mm solid rgba(214,179,106,.55)}
.front .frame::after{content:"";position:absolute;inset:0.9mm;border:0.15mm solid rgba(214,179,106,.28)}
.front .safe{display:flex;align-items:center;justify-content:center}
.front svg{width:60mm;height:auto;display:block}
.back{background:#faf7f2;color:#1f1b16;font-family:Sans}
.back .safe{display:flex;flex-direction:column;justify-content:space-between}
.back .top{display:flex;flex-direction:column;gap:1.4mm}
.back .mark{width:34mm;color:#9d6c0c}
.back .mark svg{width:100%;height:auto;display:block}
.back .tag{font-family:Bodoni,serif;font-style:italic;font-size:8.5pt;line-height:1.25;color:#3a342c}
.rule{height:0.25mm;background:#b8954a;width:12mm;margin:0.4mm 0}
.rows{display:grid;grid-template-columns:auto 1fr;column-gap:3mm;row-gap:1.25mm;align-items:baseline}
.rows dt{font-size:6pt;letter-spacing:.16em;text-transform:uppercase;color:#7f6428;font-weight:600}
.rows dd{font-size:8pt;color:#1f1b16;letter-spacing:.01em}
.area{font-size:6pt;letter-spacing:.08em;color:#5f574c}
.back .frame{position:absolute;inset:${bleed + 3.2}mm;border:0.2mm solid rgba(184,149,74,.5)}
</style></head><body>
<section class="card front"><div class="frame"></div><div class="safe">${lockup}</div></section>
<section class="card back"><div class="frame"></div><div class="safe">
  <div class="top"><div class="mark">${wordmark}</div>
  <div class="rule"></div>
  <p class="tag">Wedding &amp; event d&eacute;cor,<br>mandaps and DJ</p></div>
  <div>
    <dl class="rows">
      <dt>WhatsApp</dt><dd>${phone}</dd>
      <dt>Email</dt><dd>${email}</dd>
      <dt>Web</dt><dd>jnbevents.co.uk</dd>
      <dt>Instagram</dt><dd>@${insta}</dd>
    </dl>
    <p class="area" style="margin-top:2mm">LEICESTER &middot; MIDLANDS &middot; LONDON &middot; UK-WIDE</p>
  </div>
</div></section></body></html>`;

writeFileSync(join(out, 'card.html'), html(3));
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 4 });
for (const [name, bleed] of [['print-with-bleed', 3], ['trim-size', 0]]) {
  await page.setContent(html(bleed), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: join(out, `${name}.pdf`), preferCSSPageSize: true, printBackground: true });
  if (bleed === 0) {
    const w = 85 * 3.7795, h = 55 * 3.7795; // CSS px at 96dpi
    await page.setViewportSize({ width: Math.ceil(w), height: Math.ceil(h) });
    for (const [i, side] of ['front', 'back'].entries()) {
      await page.locator('.card').nth(i).screenshot({ path: join(out, `${side}.png`) });
    }
  }
}
await browser.close();
console.log('Business card written to brand/business-card/');
