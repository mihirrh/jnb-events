// ============================================================================
// Luxury Editorial Print-Ready Flyer Generator for JNB Events
// Tailored to: https://jnbevents.co.uk/
// Palette: Espresso Night (#14110e), Warm Cream Cotton (#faf7f2),
//          Heritage Moss (#1d241e), Antique Gold (#b8954a / #d6b36a)
// Typography: Bodoni Moda (Editorial Serif) + Instrument Sans / Clean Sans
// Generates:
//   - brand/flyer/flyer-dark.html (Interactive standalone luxury flyer, dark edition)
//   - brand/flyer/flyer-ivory.html (Warm Cream Cotton edition)
//   - brand/flyer/print-with-bleed-dark.pdf (A5 with 3mm printer bleed)
//   - brand/flyer/trim-size-dark.pdf (A5 exact 148mm x 210mm trim)
//   - brand/flyer/front-dark.png (High-res 300+ DPI front page)
//   - brand/flyer/back-dark.png (High-res 300+ DPI back page)
//   - Ivory editions of the PDFs and PNGs, suffixed "-ivory"
//     (print-with-bleed-ivory.pdf, trim-size-ivory.pdf, front-ivory.png, back-ivory.png)
// Run: node scripts/build-flyer.mjs
// ============================================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';
import { renderSVG } from 'uqr';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'brand', 'flyer');
mkdirSync(out, { recursive: true });

// Read contact info from site.yaml
const yaml = readFileSync(join(root, 'src/content/settings/site.yaml'), 'utf8');
const pick = (re) => (yaml.match(re) || [])[1]?.trim().replace(/^["']|["']$/g, '');
const phone = pick(/whatsappNumber:\s*(.+)/) || '07872 340258';
const email = pick(/^\s*email:\s*(.+)/m) || 'contact@jnbevents.co.uk';
const insta = pick(/instagram\.com\/([^\s"']+)/) || 'jnb.sounds.events';

const SITE_URL = 'https://jnbevents.co.uk/';

// High-contrast clean QR codes
const qrDark = renderSVG(SITE_URL, { ecc: 'M', border: 1, blackColor: '#d6b36a', whiteColor: '#14110e' });
const qrIvory = renderSVG(SITE_URL, { ecc: 'M', border: 1, blackColor: '#14110e', whiteColor: '#faf7f2' });

// Encode fonts as base64
const font = (pkg, file) => `data:font/woff2;base64,${readFileSync(join(root, 'node_modules/@fontsource', pkg, 'files', file)).toString('base64')}`;
const bodoni400 = font('bodoni-moda', 'bodoni-moda-latin-400-normal.woff2');
const bodoni500 = font('bodoni-moda', 'bodoni-moda-latin-500-normal.woff2');
const bodoni600 = font('bodoni-moda', 'bodoni-moda-latin-600-normal.woff2');
const bodoni700 = font('bodoni-moda', 'bodoni-moda-latin-700-normal.woff2');
const bodoniItalic = font('bodoni-moda', 'bodoni-moda-latin-400-italic.woff2');
const bodoni600Italic = font('bodoni-moda', 'bodoni-moda-latin-600-italic.woff2');
const sans400 = font('instrument-sans', 'instrument-sans-latin-400-normal.woff2');
const sans500 = font('instrument-sans', 'instrument-sans-latin-500-normal.woff2');
const sans600 = font('instrument-sans', 'instrument-sans-latin-600-normal.woff2');
const sans700 = font('instrument-sans', 'instrument-sans-latin-700-normal.woff2');

// Read & trim authentic full logo images
const logoLightBuf = await sharp(join(root, 'src/assets/brand/jnb-logo-full-light.png'))
  .trim()
  .png()
  .toBuffer();
const logoFullLight = `data:image/png;base64,${logoLightBuf.toString('base64')}`;

// Ivory edition: the deep-gold logo is thin and semi-transparent, so it looks faint on cream.
// Darken the colour and strengthen the alpha so the wordmark, arch and tagline stay legible.
const logoDarkRaw = await sharp(join(root, 'src/assets/brand/jnb-logo-full.png'))
  .trim()
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const logoDarkPixels = Buffer.from(logoDarkRaw.data);
for (let i = 0; i < logoDarkPixels.length; i += 4) {
  logoDarkPixels[i] = Math.round(logoDarkPixels[i] * 0.72);
  logoDarkPixels[i + 1] = Math.round(logoDarkPixels[i + 1] * 0.72);
  logoDarkPixels[i + 2] = Math.round(logoDarkPixels[i + 2] * 0.72);
  logoDarkPixels[i + 3] = Math.min(255, Math.round(logoDarkPixels[i + 3] * 2));
}
const logoDarkBuf = await sharp(logoDarkPixels, {
  raw: { width: logoDarkRaw.info.width, height: logoDarkRaw.info.height, channels: 4 }
})
  .png()
  .toBuffer();
const logoFullDark = `data:image/png;base64,${logoDarkBuf.toString('base64')}`;

// Function to generate authentic JNB Motif SVG
function getMotifSvg(color = '#d6b36a', width = 64) {
  const petals = [0, -38, 38, -72, 72].map(angle => 
    `<path d="M60 8.5C63.5 12.5 63.5 17 60 21C56.5 17 56.5 12.5 60 8.5Z" fill="${color}" transform="rotate(${angle} 60 21)" />`
  ).join('');

  const height = Math.round((width * 66) / 120);
  return `<svg viewBox="0 0 120 66" width="${width}" height="${height}" fill="none" xmlns="http://www.w3.org/2000/svg" class="jnb-motif">
    <path d="M.5 64C3 43 11 34 24 32.3C26 32 27.5 31.5 28 29C30 21 38 16 48 11C54 8 58 5 60 0C62 5 66 8 72 11C82 16 90 21 92 29C92.5 31.5 94 32 96 32.3C109 34 117 43 119.5 64" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/>
    ${petals}
    <circle cx="60" cy="24" r="1" fill="${color}"/>
    <circle cx="60" cy="27" r="0.75" fill="${color}"/>
    <circle cx="60" cy="29.3" r="0.5" fill="${color}"/>
    <circle cx="60" cy="31.4" r="0.75" fill="${color}"/>
    <path d="M60 34l1.6 2.5L60 39l-1.6-2.5Z" fill="${color}"/>
    <path d="M60 41c1.7 2.1 1.7 3.9 0 3.9s-1.7-1.8 0-3.9Z" fill="${color}"/>
  </svg>`;
}

// Prepare high-res base64 images with Sharp
async function getBase64Image(filePath, maxWidth = 1600, quality = 96) {
  const buf = await sharp(join(root, filePath))
    .resize({ width: maxWidth, withoutEnlargement: true })
    .jpeg({ quality, progressive: true })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

console.log('Optimizing high-res imagery for 300+ DPI print quality...');
// Swapped images as requested:
// Front Hero: Carved wooden mandap close
// Front Secondary: Gold mandap ceremony seating
const imgCarvedMandapClose = await getBase64Image('src/assets/media/gallery/carved_wooden_mandap_close.jpg', 1600, 96);
const imgGoldMandapSeating = await getBase64Image('src/assets/media/gallery/gold_mandap_carved_seating.jpg', 1200, 96);
const imgBackVisual = await getBase64Image('src/assets/media/gallery/floral_aisle_stand_mandap_backdrop.jpg', 1000, 96);

const generateHtml = (bleed = 3, theme = 'dark') => {
  const isDark = theme === 'dark';
  const qr = isDark ? qrDark : qrIvory;
  const logoImg = isDark ? logoFullLight : logoFullDark;
  // Ivory edition uses deeper golds so small text stays readable on cream
  const gold = isDark ? '#d6b36a' : '#8a6414';
  const goldMuted = isDark ? '#b8954a' : '#7a5710';
  const goldLight = isDark ? '#e8cf8d' : '#7a5710';
  const goldRgb = isDark ? '214, 179, 106' : '138, 100, 20';
  const heroScrim = isDark
    ? 'linear-gradient(180deg, rgba(20, 17, 14, 0.15) 0%, rgba(20, 17, 14, 0) 35%, rgba(20, 17, 14, 0.65) 75%, #14110e 100%)'
    : 'none';

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<title>JNB Events — Bespoke Asian Wedding Décor &amp; Entertainment</title>
<style>
@font-face { font-family: 'Bodoni'; font-weight: 400; src: url(${bodoni400}); }
@font-face { font-family: 'Bodoni'; font-weight: 500; src: url(${bodoni500}); }
@font-face { font-family: 'Bodoni'; font-weight: 600; src: url(${bodoni600}); }
@font-face { font-family: 'Bodoni'; font-weight: 700; src: url(${bodoni700}); }
@font-face { font-family: 'Bodoni'; font-style: italic; font-weight: 400; src: url(${bodoniItalic}); }
@font-face { font-family: 'Bodoni'; font-style: italic; font-weight: 600; src: url(${bodoni600Italic}); }
@font-face { font-family: 'Sans'; font-weight: 400; src: url(${sans400}); }
@font-face { font-family: 'Sans'; font-weight: 500; src: url(${sans500}); }
@font-face { font-family: 'Sans'; font-weight: 600; src: url(${sans600}); }
@font-face { font-family: 'Sans'; font-weight: 700; src: url(${sans700}); }

@page {
  size: ${148 + 2 * bleed}mm ${210 + 2 * bleed}mm;
  margin: 0;
}

:root {
  --bg-color: ${isDark ? '#14110e' : '#faf7f2'};
  --bg-card: ${isDark ? '#1a1613' : '#ffffff'};
  --text-main: ${isDark ? '#faf7f2' : '#14110e'};
  --text-muted: ${isDark ? '#c8c2b9' : '#3f3a34'};
  --text-dim: ${isDark ? '#968f84' : '#5f584f'};
  --gold: ${gold};
  --gold-muted: ${goldMuted};
  --gold-light: ${goldLight};
  --gold-border: rgba(${goldRgb}, ${isDark ? 0.38 : 0.5});
  --gold-border-subtle: rgba(${goldRgb}, ${isDark ? 0.18 : 0.28});
  --gold-hairline: 0.5px solid rgba(${goldRgb}, ${isDark ? 0.3 : 0.4});
  --moss: #1d241e;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  width: ${148 + 2 * bleed}mm;
  height: ${210 + 2 * bleed}mm;
  background-color: var(--bg-color);
  color: var(--text-main);
  font-family: 'Sans', system-ui, -apple-system, sans-serif;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.page {
  position: relative;
  width: ${148 + 2 * bleed}mm;
  height: ${210 + 2 * bleed}mm;
  padding: ${bleed + 5}mm ${bleed + 6}mm ${bleed + 5}mm ${bleed + 6}mm;
  background-color: var(--bg-color);
  page-break-after: always;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

/* Subtle cotton paper grain texture */
.page::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background-image: radial-gradient(rgba(${goldRgb}, ${isDark ? 0.04 : 0.06}) 1px, transparent 1px);
  background-size: 16px 16px;
  z-index: 1;
}

/* Inset fine gold stationery frame */
.stationery-frame {
  position: absolute;
  top: ${bleed + 3.5}mm;
  left: ${bleed + 3.5}mm;
  right: ${bleed + 3.5}mm;
  bottom: ${bleed + 3.5}mm;
  border: 0.5px solid var(--gold-border);
  pointer-events: none;
  z-index: 2;
}

.stationery-frame::before {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  border: 0.5px solid var(--gold-border-subtle);
}

.content-wrap {
  position: relative;
  z-index: 3;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* Typography utilities */
.serif { font-family: 'Bodoni', serif; }
.gold-text { color: var(--gold); }
.gold-italic { font-family: 'Bodoni', serif; font-style: italic; color: var(--gold); }

/* Header Strip */
.header-strip {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding-bottom: 1.6mm;
  border-bottom: 0.5px solid var(--gold-border);
}

.header-meta {
  font-size: 6.8pt;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gold-light);
  font-weight: 500;
}

.header-logo-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-brand-logo {
  height: 13mm;
  width: auto;
  display: block;
  object-fit: contain;
}

/* Front Cover Layout */
.front-hero-wrap {
  margin-top: 2mm;
  position: relative;
  border-radius: 95px 95px 0 0;
  border: 0.5px solid var(--gold-border);
  overflow: hidden;
  height: 64mm;
  background-color: #0b0908;
}

.front-hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 38%;
  display: block;
}

.hero-overlay-scrim {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${heroScrim};
  pointer-events: none;
}

.hero-motif-badge {
  position: absolute;
  top: 3.2mm;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
  filter: ${isDark ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.85))' : 'drop-shadow(0 0 4px rgba(255,255,255,0.9))'};
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Editorial Headline */
.headline-block {
  margin-top: 1.2mm;
  text-align: center;
  padding: 0 1.5mm;
}

.editorial-headline {
  font-family: 'Bodoni', serif;
  font-size: 16.5pt;
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: var(--text-main);
}

.editorial-tagline {
  margin-top: 0.8mm;
  font-size: 6.8pt;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gold-muted);
  font-weight: 500;
}

/* Front Asymmetric Lower Split */
.front-split-grid {
  margin-top: 2mm;
  display: grid;
  grid-template-columns: 1.32fr 1fr;
  gap: 3.5mm;
  align-items: stretch;
}

.pillars-col {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.intro-editorial-text {
  font-size: 7.2pt;
  line-height: 1.35;
  color: var(--text-muted);
  margin-bottom: 1.2mm;
}

.pillar-item {
  padding: 1.6mm 0;
  border-top: 0.5px solid var(--gold-border-subtle);
}

.pillar-header {
  display: flex;
  align-items: baseline;
  gap: 1.8mm;
}

.pillar-num {
  font-family: 'Bodoni', serif;
  font-style: italic;
  font-size: 8.5pt;
  color: var(--gold);
  font-weight: 600;
}

.pillar-title {
  font-family: 'Sans', sans-serif;
  font-size: 7.5pt;
  font-weight: 600;
  color: var(--text-main);
  letter-spacing: 0.01em;
}

.pillar-desc {
  font-size: 6.6pt;
  line-height: 1.28;
  color: var(--text-dim);
  margin-top: 0.3mm;
  padding-left: 4.8mm;
}

.visual-col {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.secondary-photo-wrap {
  width: 100%;
  height: 25.5mm;
  border: 0.5px solid var(--gold-border);
  overflow: hidden;
  background-color: #0b0908;
}

.secondary-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 35%;
  display: block;
}

.consult-card {
  margin-top: 1.6mm;
  padding: 2mm 2.2mm;
  background: ${isDark ? 'rgba(29, 36, 30, 0.45)' : '#f2ede4'};
  border: 0.5px solid var(--gold-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2mm;
}

.consult-info {
  display: flex;
  flex-direction: column;
  gap: 0.5mm;
}

.consult-badge {
  font-size: 5.8pt;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gold);
  font-weight: 600;
}

.consult-phone {
  font-family: 'Bodoni', serif;
  font-size: 9pt;
  font-weight: 600;
  color: var(--text-main);
  letter-spacing: 0.02em;
}

.consult-site {
  font-size: 6.2pt;
  color: var(--text-dim);
}

.qr-box {
  width: 14mm;
  height: 14mm;
  border: 0.5px solid var(--gold-border);
  background: ${isDark ? '#14110e' : '#ffffff'};
  padding: 0.8mm;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.qr-box svg {
  width: 100%;
  height: 100%;
}

/* Bottom Footer Bar */
.footer-bar {
  margin-top: 1.8mm;
  padding-top: 1.6mm;
  border-top: 0.5px solid var(--gold-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 6.8pt;
  color: var(--text-muted);
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 1.2mm;
}

.footer-icon {
  width: 3.2mm;
  height: 3.2mm;
  fill: none;
  stroke: var(--gold);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.footer-bullet {
  color: var(--gold);
  margin: 0 1mm;
}

/* ========================================================================= */
/* BACK PAGE STYLING (Services & Mandap Specification Guide)                 */
/* ========================================================================= */
.back-header {
  text-align: center;
  padding-bottom: 1.8mm;
  border-bottom: 0.5px solid var(--gold-border);
}

.back-header-brand-logo-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.2mm;
}

.back-brand-logo {
  height: 14.5mm;
  width: auto;
  display: block;
  object-fit: contain;
}

.back-headline {
  font-family: 'Bodoni', serif;
  font-size: 14pt;
  font-weight: 400;
  color: var(--text-main);
  letter-spacing: -0.01em;
}

.back-subhead {
  font-size: 6.5pt;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gold);
  margin-top: 0.8mm;
  font-weight: 500;
}

/* 10 Services Numbered Directory */
.services-directory-wrap {
  margin-top: 2mm;
}

.directory-title-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.4mm;
}

.directory-label {
  font-size: 6.5pt;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gold);
  font-weight: 600;
}

.directory-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 4mm;
  row-gap: 1.5mm;
}

.dir-item {
  display: flex;
  flex-direction: column;
  padding-bottom: 1.1mm;
  border-bottom: 0.5px solid var(--gold-border-subtle);
}

.dir-header {
  display: flex;
  align-items: baseline;
  gap: 1.6mm;
}

.dir-num {
  font-family: 'Bodoni', serif;
  font-style: italic;
  font-size: 7.8pt;
  color: var(--gold);
  font-weight: 600;
}

.dir-name {
  font-family: 'Sans', sans-serif;
  font-size: 7.2pt;
  font-weight: 600;
  color: var(--text-main);
}

.dir-desc {
  font-size: 6.1pt;
  line-height: 1.26;
  color: var(--text-dim);
  padding-left: 4.4mm;
  margin-top: 0.2mm;
}

/* Signature Mandap Inclusions Box */
.mandap-inclusions-box {
  margin-top: 2mm;
  padding: 2.2mm 2.8mm;
  background: ${isDark ? 'rgba(29, 36, 30, 0.45)' : '#f2ede4'};
  border: 0.5px solid var(--gold-border);
  position: relative;
}

.inclusions-title {
  text-align: center;
  font-size: 6.8pt;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gold-light);
  font-weight: 600;
  margin-bottom: 1.6mm;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2mm;
}

.inclusions-title::before, .inclusions-title::after {
  content: "";
  display: inline-block;
  width: 12mm;
  height: 0.5px;
  background-color: var(--gold-border);
}

.inclusions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 3.5mm;
  row-gap: 1mm;
}

.inclusion-item {
  display: flex;
  align-items: center;
  gap: 1.5mm;
  font-size: 6.3pt;
  color: var(--text-muted);
}

.inclusion-diamond {
  color: var(--gold);
  font-size: 6pt;
  flex-shrink: 0;
}

/* Back Lower Strip: Visual + Booking Call to Action */
.back-lower-split {
  margin-top: 2mm;
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 3.5mm;
  align-items: center;
}

.back-visual-wrap {
  width: 100%;
  height: 36mm;
  border: 0.5px solid var(--gold-border);
  overflow: hidden;
}

.back-visual-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  display: block;
}

.back-cta-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2mm 2.5mm;
  border: 0.5px solid var(--gold-border);
  background: ${isDark ? '#1a1613' : '#ffffff'};
  gap: 2mm;
}

.back-cta-text {
  display: flex;
  flex-direction: column;
  gap: 0.6mm;
}

.back-cta-tagline {
  font-family: 'Bodoni', serif;
  font-style: italic;
  font-size: 8.2pt;
  color: var(--gold);
  line-height: 1.2;
}

.back-cta-sub {
  font-size: 6.2pt;
  color: var(--text-dim);
  margin-top: 0.3mm;
}

.back-cta-phone {
  font-family: 'Sans', sans-serif;
  font-size: 7.4pt;
  font-weight: 700;
  color: var(--text-main);
  margin-top: 0.5mm;
}

/* Back Footer */
.back-footer-bar {
  margin-top: 1.6mm;
  padding-top: 1.4mm;
  border-top: 0.5px solid var(--gold-border);
  display: flex;
  flex-direction: column;
  gap: 0.8mm;
  text-align: center;
  font-size: 6.3pt;
  color: var(--text-dim);
}

.back-coverage-text {
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gold-light);
  font-weight: 500;
}

.back-contacts-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3mm;
  color: var(--text-muted);
}
</style>
</head>
<body>

<!-- ======================================================================= -->
<!-- FRONT PAGE: COVER & SIGNATURE PILLARS                                   -->
<!-- ======================================================================= -->
<div class="page">
  <div class="stationery-frame"></div>
  <div class="content-wrap">
    
    <!-- Header Strip -->
    <header class="header-strip">
      <div class="header-meta">Leicester · UK-Wide</div>
      <div class="header-logo-wrap">
        <img src="${logoImg}" alt="JNB Events Logo" class="header-brand-logo" />
      </div>
      <div class="header-meta" style="text-align:right;">Book Now</div>
    </header>

    <!-- Hero Arch Focal Visual: Swapped to Carved Wooden Mandap Close-up -->
    <div class="front-hero-wrap">
      <div class="hero-motif-badge">
        ${getMotifSvg(isDark ? goldLight : '#8a6414', 38)}
      </div>
      <img src="${imgCarvedMandapClose}" alt="JNB Events Intricate Carved Wooden Mandap &amp; Florals" class="front-hero-img" />
      <div class="hero-overlay-scrim"></div>
    </div>

    <!-- Editorial Headline -->
    <div class="headline-block">
      <h1 class="editorial-headline">Weddings &amp; events, <span class="gold-italic">styled with intent.</span></h1>
      <p class="editorial-tagline">"Your date, your venue — our attention to detail."</p>
    </div>

    <!-- Asymmetric Lower Split -->
    <div class="front-split-grid">
      <!-- Left Column: Intro + 3 Signature Pillars -->
      <div class="pillars-col">
        <p class="intro-editorial-text">
          Bespoke Asian wedding production and ceremonial staging, crafted with architectural elegance across Leicester, the Midlands, and UK-wide.
        </p>

        <!-- 01 -->
        <div class="pillar-item">
          <div class="pillar-header">
            <span class="pillar-num">01.</span>
            <span class="pillar-title">Mandaps &amp; Ceremonial Stages</span>
          </div>
          <p class="pillar-desc">Royal carved timber, modern gold geometric frames &amp; grand fresh floral canopies.</p>
        </div>

        <!-- 02 -->
        <div class="pillar-item">
          <div class="pillar-header">
            <span class="pillar-num">02.</span>
            <span class="pillar-title">Haldi, Mehndi &amp; Civil Styling</span>
          </div>
          <p class="pillar-desc">Vibrant floral swings, ceremonial aisle walkways, entrance arches &amp; luxury draping.</p>
        </div>

        <!-- 03 -->
        <div class="pillar-item">
          <div class="pillar-header">
            <span class="pillar-num">03.</span>
            <span class="pillar-title">DJ, Dancefloors &amp; Effects</span>
          </div>
          <p class="pillar-desc">Glossy starlit dancefloors, indoor cold sparks, dry-ice fog &amp; concert production.</p>
        </div>
      </div>

      <!-- Right Column: Secondary Photo (Swapped to Gold Mandap Ceremony) + Consultation Call & QR -->
      <div class="visual-col">
        <div class="secondary-photo-wrap">
          <img src="${imgGoldMandapSeating}" alt="Gold Mandap Ceremony Seating &amp; Aisle Runner" class="secondary-photo-img" />
        </div>

        <div class="consult-card">
          <div class="consult-info">
            <span class="consult-badge">Bespoke Packages</span>
            <span class="consult-phone">${phone}</span>
            <span class="consult-site">jnbevents.co.uk</span>
          </div>
          <div class="qr-box">
            ${qr}
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Bar -->
    <footer class="footer-bar">
      <div class="footer-item">
        <svg class="footer-icon" viewBox="0 0 24 24" aria-label="Phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        <strong style="color:var(--text-main); font-weight:600;">${phone}</strong>
      </div>
      <span class="footer-bullet">•</span>
      <div class="footer-item">
        <svg class="footer-icon" viewBox="0 0 24 24" aria-label="Email"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        <span>${email}</span>
      </div>
      <span class="footer-bullet">•</span>
      <div class="footer-item">
        <svg class="footer-icon" viewBox="0 0 24 24" aria-label="Instagram"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
        <span>@${insta}</span>
      </div>
    </footer>

  </div>
</div>

<!-- ======================================================================= -->
<!-- BACK PAGE: SERVICES DIRECTORY & MANDAP SPECIFICATION GUIDE             -->
<!-- ======================================================================= -->
<div class="page">
  <div class="stationery-frame"></div>
  <div class="content-wrap">
    
    <!-- Back Header -->
    <header class="back-header">
      <div class="back-header-brand-logo-wrap">
        <img src="${logoImg}" alt="JNB Events Logo" class="back-brand-logo" />
      </div>
      <h2 class="back-headline">One team, the whole celebration.</h2>
      <p class="back-subhead">Mandaps, décor, DJ and dance floors for your wedding day</p>
    </header>

    <!-- 10 Services Numbered Directory -->
    <section class="services-directory-wrap">
      <div class="directory-title-strip">
        <span class="directory-label">Services We Offer</span>
      </div>

      <div class="directory-grid">
        <!-- 01 -->
        <div class="dir-item">
          <div class="dir-header">
            <span class="dir-num">01.</span>
            <span class="dir-name">Mandaps &amp; Sacred Stages</span>
          </div>
          <p class="dir-desc">Royal carved timber, modern gold geometric &amp; floral canopies.</p>
        </div>

        <!-- 06 -->
        <div class="dir-item">
          <div class="dir-header">
            <span class="dir-num">06.</span>
            <span class="dir-name">Outdoor &amp; Home Lighting</span>
          </div>
          <p class="dir-desc">Architectural house floods, festoon canopies &amp; marquee trees.</p>
        </div>

        <!-- 02 -->
        <div class="dir-item">
          <div class="dir-header">
            <span class="dir-num">02.</span>
            <span class="dir-name">Full Venue Décor &amp; Draping</span>
          </div>
          <p class="dir-desc">Pleated ceiling drapes, chiavari seating &amp; foyer styling.</p>
        </div>

        <!-- 07 -->
        <div class="dir-item">
          <div class="dir-header">
            <span class="dir-num">07.</span>
            <span class="dir-name">DJ &amp; Sound Production</span>
          </div>
          <p class="dir-desc">Pioneer &amp; D&amp;B sound, live dhol players &amp; event hosting.</p>
        </div>

        <!-- 03 -->
        <div class="dir-item">
          <div class="dir-header">
            <span class="dir-num">03.</span>
            <span class="dir-name">Haldi &amp; Mehndi Styling</span>
          </div>
          <p class="dir-desc">Vibrant backdrops, floral swings &amp; festive floor seating.</p>
        </div>

        <!-- 08 -->
        <div class="dir-item">
          <div class="dir-header">
            <span class="dir-num">08.</span>
            <span class="dir-name">Sparklers &amp; Low Fog Effects</span>
          </div>
          <p class="dir-desc">Indoor cold spark fountains, dry-ice clouds &amp; confetti.</p>
        </div>

        <!-- 04 -->
        <div class="dir-item">
          <div class="dir-header">
            <span class="dir-num">04.</span>
            <span class="dir-name">Civil Ceremony Décor</span>
          </div>
          <p class="dir-desc">Minimalist floral arches, aisle runners &amp; registrar styling.</p>
        </div>

        <!-- 09 -->
        <div class="dir-item">
          <div class="dir-header">
            <span class="dir-num">09.</span>
            <span class="dir-name">Dance Floors &amp; Mood Lighting</span>
          </div>
          <p class="dir-desc">Glossy seamless white LED starlit floors &amp; beam lighting.</p>
        </div>

        <!-- 05 -->
        <div class="dir-item">
          <div class="dir-header">
            <span class="dir-num">05.</span>
            <span class="dir-name">Reception &amp; Centrepieces</span>
          </div>
          <p class="dir-desc">Crystal candelabras, floral stands &amp; banquet tablescapes.</p>
        </div>

        <!-- 10 -->
        <div class="dir-item">
          <div class="dir-header">
            <span class="dir-num">10.</span>
            <span class="dir-name">Bespoke Wedding Packages</span>
          </div>
          <p class="dir-desc">End-to-end seamless all-inclusive celebration management.</p>
        </div>
      </div>
    </section>

    <!-- Signature Mandap Inclusions Box -->
    <section class="mandap-inclusions-box">
      <div class="inclusions-title">What is Included with Our Signature Mandaps</div>
      <div class="inclusions-grid">
        <div class="inclusion-item">
          <span class="inclusion-diamond">✦</span>
          <span>4 × Carved Choris Pillars &amp; Canopy</span>
        </div>
        <div class="inclusion-item">
          <span class="inclusion-diamond">✦</span>
          <span>Foyer Ganesh Welcome Display</span>
        </div>
        <div class="inclusion-item">
          <span class="inclusion-diamond">✦</span>
          <span>2 × Ceremonial Bajots &amp; Patlas</span>
        </div>
        <div class="inclusion-item">
          <span class="inclusion-diamond">✦</span>
          <span>Decorative Ceremony Entrance Arch</span>
        </div>
        <div class="inclusion-item">
          <span class="inclusion-diamond">✦</span>
          <span>6 × Ornate Bridal &amp; Family Chairs</span>
        </div>
        <div class="inclusion-item">
          <span class="inclusion-diamond">✦</span>
          <span>Pleated Stage Backdrop Drapery</span>
        </div>
        <div class="inclusion-item">
          <span class="inclusion-diamond">✦</span>
          <span>1 × Traditional Copper Havan Kund</span>
        </div>
        <div class="inclusion-item">
          <span class="inclusion-diamond">✦</span>
          <span>Pristine Stage &amp; Aisle Carpet Runner</span>
        </div>
      </div>
    </section>

    <!-- Lower Split: Secondary Mandap Photo + Call to Action Card -->
    <div class="back-lower-split">
      <div class="back-visual-wrap">
        <img src="${imgBackVisual}" alt="Floral Aisle Stands & Mandap Backdrop" class="back-visual-img" />
      </div>

      <div class="back-cta-box">
        <div class="back-cta-text">
          <div class="back-cta-tagline">"Your date, your venue — our attention to detail."</div>
          <div class="back-cta-sub">Free consultation &amp; bespoke quote</div>
          <div class="back-cta-phone">Contact: ${phone}</div>
          <div class="back-cta-phone">${email}</div>
        </div>
        <div class="qr-box">
          ${qr}
        </div>
      </div>
    </div>

    <!-- Back Footer Bar -->
    <footer class="back-footer-bar">
      <div class="back-coverage-text">Leicester · Leicestershire · East &amp; West Midlands · London · UK-Wide</div>
      <div class="back-contacts-row">
        <span>${phone}</span>
        <span>•</span>
        <span>${email}</span>
        <span>•</span>
        <span>jnbevents.co.uk</span>
        <span>•</span>
        <span>@${insta}</span>
      </div>
    </footer>

  </div>
</div>

</body>
</html>`;
};

// Write HTML outputs
console.log('Writing standalone HTML editions...');
writeFileSync(join(out, 'flyer-dark.html'), generateHtml(0, 'dark'), 'utf8');
writeFileSync(join(out, 'flyer-ivory.html'), generateHtml(0, 'light'), 'utf8');

// Launch Playwright for 300+ DPI PDF and PNG exports
console.log('Rendering print-ready PDFs (with bleed & exact trim)...');
const browser = await chromium.launch();
const page = await browser.newPage();

// Each edition gets its own suffix: "-dark" and "-ivory"
const editions = [
  { theme: 'dark', suffix: '-dark' },
  { theme: 'light', suffix: '-ivory' }
];

for (const { theme, suffix } of editions) {
  // 1. PDF with 3mm bleed (154mm x 216mm)
  await page.setContent(generateHtml(3, theme), { waitUntil: 'load' });
  await page.pdf({
    path: join(out, `print-with-bleed${suffix}.pdf`),
    width: '154mm',
    height: '216mm',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  // 2. PDF exact trim (148mm x 210mm)
  await page.setContent(generateHtml(0, theme), { waitUntil: 'load' });
  await page.pdf({
    path: join(out, `trim-size${suffix}.pdf`),
    width: '148mm',
    height: '210mm',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  // 3. High-res 300+ DPI PNG Previews
  console.log(`Rendering 300+ DPI ${theme} front/back PNG previews...`);
  await page.setViewportSize({ width: 1748, height: 2480 });
  const pages = await page.$$('.page');

  if (pages.length >= 2) {
    await pages[0].screenshot({ path: join(out, `front${suffix}.png`), type: 'png' });
    await pages[1].screenshot({ path: join(out, `back${suffix}.png`), type: 'png' });
  }
}

await browser.close();
console.log('✨ Luxury JNB Events Flyer updated successfully in brand/flyer/!');
