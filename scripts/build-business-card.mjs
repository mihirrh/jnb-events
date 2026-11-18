// Builds the JNB Events business card: brand/business-card/{card.html, print-with-bleed.pdf, trim-size.pdf, front.png, back.png}
// Run: node scripts/build-business-card.mjs
// Contact details come from src/content/settings/site.yaml so the card never drifts from the website.
// The full logo comes from brand/jnb_logo.png and is trimmed to its visible artwork at build time.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'brand', 'business-card');
mkdirSync(out, { recursive: true });

const NAME = 'Bhav';
const SERVICES = [
  'Mandaps & Stages',
  'Wedding & Reception D\u00e9cor',
  'Haldi & Mehndi',
  'DJ & Entertainment',
  'Dance Floor & Lighting',
  'Sparklers & Special Effects',
];

const yaml = readFileSync(join(root, 'src/content/settings/site.yaml'), 'utf8');
const pick = (re) => (yaml.match(re) || [])[1]?.trim().replace(/^["']|["']$/g, '');
const phone = pick(/whatsappNumber:\s*(.+)/);
const email = pick(/^\s*email:\s*(.+)/m);
const insta = pick(/instagram\.com\/([^\s"']+)/);
if (!phone || !email || !insta) throw new Error('Could not read contact details from site.yaml');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const font = (pkg, file) => `data:font/woff2;base64,${readFileSync(join(root, 'node_modules/@fontsource', pkg, 'files', file)).toString('base64')}`;
const bodoni = font('bodoni-moda', 'bodoni-moda-latin-500-normal.woff2');
const bodoniItalic = font('bodoni-moda', 'bodoni-moda-latin-400-italic.woff2');
const sans = font('instrument-sans', 'instrument-sans-latin-400-normal.woff2');
const sansBold = font('instrument-sans', 'instrument-sans-latin-600-normal.woff2');
const logoSrc = `data:image/png;base64,${readFileSync(join(root, 'brand/jnb_logo.png')).toString('base64')}`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 4 });

// Trim the transparent margin around the logo artwork (alpha > 6) so it can be centred and sized precisely.
const logo = await page.evaluate(async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
  let x0 = width, y0 = height, x1 = 0, y1 = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 6) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const o = document.createElement('canvas');
  o.width = w; o.height = h;
  o.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, w, h);
  return { url: o.toDataURL('image/png'), w, h };
}, logoSrc);

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
.frame{position:absolute;inset:${bleed + 3.2}mm}
.safe{position:absolute;inset:${bleed + 5.6}mm}

.front{background:#faf7f2}
.front .frame{border:0.25mm solid rgba(184,149,74,.65)}
.front .frame::after{content:"";position:absolute;inset:0.9mm;border:0.15mm solid rgba(184,149,74,.35)}
.front .safe{display:flex;align-items:center;justify-content:center}
.front img{width:64mm;height:auto;display:block}

.back{background:#14110e;color:#faf7f2;font-family:Sans}
.back .frame{border:0.2mm solid rgba(214,179,106,.55)}
.back .safe{display:flex;flex-direction:column;justify-content:space-between}
.head{display:flex;justify-content:space-between;align-items:center}
.area{font-size:5.2pt;letter-spacing:.18em;text-transform:uppercase;line-height:1.7;color:#d9d0c1;text-align:right}
.title{font-family:Bodoni,serif;font-weight:500;font-size:15pt;line-height:1;color:#d6b36a;letter-spacing:.14em;text-transform:uppercase}
.person{position:absolute;right:0;bottom:0;font-family:Bodoni,serif;font-style:italic;font-size:13pt;line-height:1;color:#d6b36a}
.rule{height:0.25mm;width:100%;background:rgba(214,179,106,.45);margin:1.6mm 0 1.6mm}
.svc{list-style:none;display:grid;grid-template-columns:1fr 1fr;column-gap:4mm;row-gap:0.9mm;font-family:Bodoni,serif;font-style:italic;font-size:7.4pt;line-height:1.3;color:#e9dfcc}
.svc li{white-space:nowrap;position:relative;padding-left:2.6mm}
.svc li::before{content:"";position:absolute;left:0;top:0.72em;width:0.9mm;height:0.9mm;background:#d6b36a;transform:translateY(-50%) rotate(45deg)}
.rows{display:grid;grid-template-columns:auto 1fr;column-gap:3mm;row-gap:1.1mm;align-items:baseline}
.rows dt{font-size:5.5pt;letter-spacing:.16em;text-transform:uppercase;color:#d6b36a;font-weight:600}
.rows dd{font-size:7.8pt;color:#faf7f2;letter-spacing:.01em}
</style></head><body>
<section class="card front"><div class="frame"></div><div class="safe"><img src="${logo.url}" alt="JNB Events, Decor, DJ, Mandaps" width="${logo.w}" height="${logo.h}"></div></section>
<section class="card back"><div class="frame"></div><div class="safe">
  <div>
    <div class="head"><div class="title">JNB Events</div><div class="area">Leicester &middot; Midlands<br>London &middot; UK-wide</div></div>
    <div class="rule"></div>
    <ul class="svc">${SERVICES.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
  </div>
  <p class="person">${NAME}</p>
  <dl class="rows">
    <dt>Contact number</dt><dd>${phone}</dd>
    <dt>Email</dt><dd>${email}</dd>
    <dt>Website</dt><dd>jnbevents.co.uk</dd>
    <dt>Instagram</dt><dd>@${insta}</dd>
  </dl>
</div></section></body></html>`;

writeFileSync(join(out, 'card.html'), html(3));
for (const [name, bleed] of [['print-with-bleed', 3], ['trim-size', 0]]) {
  await page.setContent(html(bleed), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: join(out, `${name}.pdf`), preferCSSPageSize: true, printBackground: true });
  if (bleed === 0) {
    await page.setViewportSize({ width: Math.ceil(85 * 3.7795), height: Math.ceil(55 * 3.7795) });
    for (const [i, side] of ['front', 'back'].entries()) {
      await page.locator('.card').nth(i).screenshot({ path: join(out, `${side}.png`) });
    }
  }
}
await browser.close();
console.log('Business card written to brand/business-card/');
