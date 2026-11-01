/**
 * Draws the JNB Events quotation onto a PDFKit document: cover, about, event details (flows onto extra
 * pages if the list is long) and the important notice.
 *
 * The drawing code is environment-neutral: the caller creates the document with `PDF_OPTIONS`, hands in the
 * font bytes, and collects the output (the browser uses `toBlob`, the review harness uses `toBytes`).
 * The brand mandap-arch motif is drawn from the same geometry as the website (`motif.ts`).
 */
import type { PDFDocument } from 'pdfkit';
import { MOTIF } from './motif';
import { calculate, formatDate, formatPence, formatPercent, type QuoteItem, type QuoteSwitches } from './quote';

export const PDF_OPTIONS = { size: 'A4', margin: 0, font: null, autoFirstPage: false } as const;

export interface PdfWording {
  tagline: string;
  aboutHeading: string;
  aboutBody: string;
  quoteHeading: string;
  quoteSubheading: string;
  packageLabel: string;
  noticeHeading: string;
  /** May contain {percent}. */
  offerText: string;
  bookingNote: string;
  invitation: string;
  thanks: string;
}

export interface QuotePdfData {
  clientName: string;
  /** ISO date (yyyy-mm-dd) or empty. */
  eventDate: string;
  venue: string;
  items: QuoteItem[];
  switches: QuoteSwitches;
  wording: PdfWording;
  contact: { phone: string; email: string; website: string };
  fonts: { serif: Uint8Array; serifItalic: Uint8Array; sans: Uint8Array; sansBold: Uint8Array };
}

/* ------------------------------------------------------------------ palette (same tokens as the site) */
const C = {
  cream: '#faf7f2',
  creamDeep: '#f1ebe0',
  ink: '#1f1b16',
  inkSoft: '#3a342c',
  muted: '#5f574c',
  gold: '#b8954a',
  goldDeep: '#7f6428',
  line: '#ddd3c2',
} as const;

const F = { serif: 'Serif', serifItalic: 'SerifItalic', sans: 'Sans', sansBold: 'SansBold' } as const;
type FontKey = (typeof F)[keyof typeof F];

const W = 595.28;
const H = 841.89;
const M = 64; // side margin on content pages
const CW = W - M * 2;

/* ------------------------------------------------------------------ text helpers */

/** The embedded fonts are Latin subsets: keep what they can draw, fold accents to ASCII, drop the rest. */
export function clean(input: string): string {
  const ok = /[\u0020-\u007E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC]/;
  let out = '';
  for (const ch of input.replace(/[\r\t]+/g, ' ')) {
    if (ch === '\n' || ok.test(ch)) out += ch;
    else {
      const base = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (base !== ch && /^[\u0020-\u007E]+$/.test(base)) out += base;
    }
  }
  return out.replace(/ {2,}/g, ' ').trim();
}

function font(doc: PDFDocument, f: FontKey, size: number, color: string) {
  doc.font(f).fontSize(size).fillColor(color);
}

/** One line of upper-case, letter-spaced text. Centre alignment is corrected for the trailing space. */
function caps(
  doc: PDFDocument,
  text: string,
  x: number,
  y: number,
  o: { f?: FontKey; size: number; color: string; spacing: number; align?: 'left' | 'center' | 'right'; width?: number },
) {
  font(doc, o.f ?? F.sansBold, o.size, o.color);
  const align = o.align ?? 'left';
  const width = o.width ?? W;
  const shift = align === 'center' ? o.spacing / 2 : align === 'right' ? o.spacing : 0;
  doc.text(text.toUpperCase(), x + shift, y, { width, align, characterSpacing: o.spacing, lineBreak: false });
}

/** Paragraph helper that returns the height it used. */
function para(
  doc: PDFDocument,
  text: string,
  x: number,
  y: number,
  o: { f: FontKey; size: number; color: string; width: number; align?: 'left' | 'center' | 'right'; lineGap?: number },
): number {
  font(doc, o.f, o.size, o.color);
  const opts = { width: o.width, align: o.align ?? 'left', lineGap: o.lineGap ?? 0 };
  const h = doc.heightOfString(text, opts);
  doc.text(text, x, y, opts);
  return h;
}

/** A heading where *word* is set in italic. Wraps by word; returns the y after the last line. */
function rich(
  doc: PDFDocument,
  src: string,
  x: number,
  y: number,
  width: number,
  o: { size: number; lineHeight: number; color: string; align?: 'left' | 'center' },
): number {
  type Tok = { w: string; f: FontKey };
  const toks: Tok[] = [];
  for (const part of src.split(/(\*[^*]+\*)/)) {
    if (!part) continue;
    const italic = part.startsWith('*') && part.endsWith('*') && part.length > 2;
    const text = italic ? part.slice(1, -1) : part;
    for (const w of text.split(/\s+/)) if (w) toks.push({ w, f: italic ? F.serifItalic : F.serif });
  }
  const measure = (t: Tok) => {
    doc.font(t.f).fontSize(o.size);
    return doc.widthOfString(t.w);
  };
  doc.font(F.serif).fontSize(o.size);
  const space = doc.widthOfString(' ');
  const lines: { toks: Tok[]; w: number }[] = [];
  let cur: Tok[] = [];
  let curW = 0;
  for (const t of toks) {
    const w = measure(t);
    if (cur.length && curW + space + w > width) {
      lines.push({ toks: cur, w: curW });
      cur = [];
      curW = 0;
    }
    curW += (cur.length ? space : 0) + w;
    cur.push(t);
  }
  if (cur.length) lines.push({ toks: cur, w: curW });
  let ly = y;
  for (const ln of lines) {
    let lx = o.align === 'center' ? x + (width - ln.w) / 2 : x;
    for (const t of ln.toks) {
      font(doc, t.f, o.size, o.color);
      doc.text(t.w, lx, ly, { lineBreak: false });
      lx += measure(t) + space;
    }
    ly += o.lineHeight;
  }
  return ly;
}

const hairline = (doc: PDFDocument, x1: number, y: number, x2: number, color: string = C.line, w = 0.6) => {
  doc.save().lineWidth(w).strokeColor(color).moveTo(x1, y).lineTo(x2, y).stroke().restore();
};

/** "LABEL ———————" section marker, like the website's folio line. */
function folio(doc: PDFDocument, label: string, x: number, y: number, width: number) {
  caps(doc, label, x, y, { size: 8, color: C.goldDeep, spacing: 2.6 });
  font(doc, F.sansBold, 8, C.goldDeep);
  const tw = doc.widthOfString(label.toUpperCase(), { characterSpacing: 2.6 });
  hairline(doc, x + tw + 14, y + 4.2, x + width, C.line);
}

/* ------------------------------------------------------------------ brand drawing */

/** The mandap-arch motif. `height` in points; stroke widths are in points and never scale with the motif. */
function drawMotif(doc: PDFDocument, cx: number, top: number, height: number, variant: 'line' | 'floral', o: { stroke?: number; tint?: boolean } = {}) {
  const s = height / MOTIF.height;
  const lw = (o.stroke ?? 0.9) / s;
  doc.save().translate(cx - (MOTIF.width * s) / 2, top).scale(s);
  doc.lineCap('round').lineJoin('round').lineWidth(lw);
  if (o.tint) doc.path(`${MOTIF.outer}Z`).fill(C.creamDeep);
  doc.strokeColor(C.gold).strokeOpacity(1);
  doc.path(MOTIF.base).stroke();
  doc.path(MOTIF.outer).stroke();
  doc.strokeOpacity(0.55).path(MOTIF.inner).stroke().strokeOpacity(1);
  if (variant === 'line') {
    doc.path(MOTIF.finial.stem).stroke();
    doc.circle(MOTIF.finial.cx, MOTIF.finial.cy, MOTIF.finial.r).stroke();
  } else {
    for (const a of [0, -MOTIF.lotus.angle, MOTIF.lotus.angle]) {
      doc.save();
      if (a) doc.rotate(a, { origin: [MOTIF.lotus.pivot[0], MOTIF.lotus.pivot[1]] });
      doc.path(MOTIF.lotus.petal).stroke();
      doc.restore();
    }
    for (const b of MOTIF.buds) doc.circle(b.cx, b.cy, b.r).stroke();
  }
  doc.restore();
}

/**
 * Flowing hairline ribbons that sweep out of a page corner. Drawn once for the top-right corner in local
 * coordinates (origin at the corner, x runs left, y runs down) and mirrored for the bottom-left.
 */
function cornerFlow(doc: PDFDocument, corner: 'tr' | 'bl', scale: number, opacity: number) {
  doc.save();
  if (corner === 'tr') doc.translate(W, 0);
  else doc.translate(0, H).scale(-1, -1);
  doc.scale(scale);
  doc.lineCap('round').lineWidth(0.7 / scale).strokeColor(C.gold);
  const n = 8;
  for (let i = 0; i < n; i++) {
    // Each ribbon enters on the top edge, sweeps into the page in a soft S and leaves through the right edge.
    // Spacing widens with i, so the family fans out like silk rather than reading as concentric rings.
    const a = 60 + i * 26 + i * i * 1.2;
    doc.strokeOpacity(opacity * (1 - (i / n) * 0.65));
    doc
      .moveTo(-a, -2)
      .bezierCurveTo(-a - 34, a * 0.34, -a * 0.52, a * 0.5 + 34, 3, a * 0.92 + 8)
      .stroke();
  }
  doc.restore();
}

function newPage(doc: PDFDocument) {
  doc.addPage();
  doc.save().rect(0, 0, W, H).fill(C.cream).restore();
}

function footer(doc: PDFDocument, n: number) {
  caps(doc, `JNB Events   \u00B7   ${String(n).padStart(2, '0')}`, 0, H - 42, { f: F.sans, size: 7.5, color: C.muted, spacing: 2.4, align: 'center', width: W });
}

/* ------------------------------------------------------------------ pages */

function cover(doc: PDFDocument, d: QuotePdfData) {
  newPage(doc);
  cornerFlow(doc, 'tr', 1, 0.8);
  cornerFlow(doc, 'bl', 1, 0.8);

  drawMotif(doc, W / 2, 170, 128, 'floral', { stroke: 1, tint: true });

  caps(doc, 'JNB Events', 0, 334, { f: F.serif, size: 50, color: C.gold, spacing: 7, align: 'center', width: W });
  caps(doc, d.wording.tagline.replace(/[\u00B7\u2022]/g, ' \u00B7 '), 0, 400, { size: 9.5, color: C.goldDeep, spacing: 4.2, align: 'center', width: W });
  hairline(doc, W / 2 - 24, 436, W / 2 + 24, C.gold, 0.7);

  // Prepared for / Date / Venue: labels right-aligned to a shared colon, values flowing right of it.
  const rows: [string, string][] = [
    ['Prepared for', clean(d.clientName) || 'Our valued client'],
    ['Date', formatDate(d.eventDate)],
    ['Venue', clean(d.venue) || 'To be confirmed'],
  ];
  const colon = W / 2 - 22;
  let y = 476;
  for (const [label, value] of rows) {
    caps(doc, label, colon - 280, y + 3, { size: 8, color: C.muted, spacing: 2.4, align: 'right', width: 270 });
    font(doc, F.serif, 8, C.gold);
    doc.text(':', colon, y + 1, { lineBreak: false });
    const h = para(doc, value, colon + 16, y - 2, { f: F.serif, size: 15, color: C.ink, width: W / 2 - 22 - 40 + 22 });
    y += Math.max(h, 18) + 14;
  }
}

function about(doc: PDFDocument, d: QuotePdfData) {
  newPage(doc);
  cornerFlow(doc, 'tr', 0.62, 0.6);
  cornerFlow(doc, 'bl', 0.62, 0.6);
  const x = 84;
  const w = W - x * 2;
  folio(doc, 'About us', x, 150, w);
  let y = rich(doc, clean(d.wording.aboutHeading).replace(/ (Modern Elegance)$/, ' *$1*'), x, 190, w, { size: 36, lineHeight: 40, color: C.ink });
  y += 18;
  hairline(doc, x, y, x + 36, C.gold, 0.8);
  y += 34;
  const [lead, ...rest] = clean(d.wording.aboutBody).split(/\n\s*\n/);
  if (lead) y += para(doc, lead, x, y, { f: F.serifItalic, size: 16, color: C.ink, width: w, lineGap: 5 }) + 22;
  for (const p of rest) y += para(doc, p, x, y, { f: F.sans, size: 11, color: C.inkSoft, width: Math.min(w, 380), lineGap: 6 }) + 14;
  footer(doc, 2);
}

function quote(doc: PDFDocument, d: QuotePdfData): number {
  const t = calculate(d.items, d.switches);
  const sw = d.switches;
  let page = 3;
  const limit = H - 118;

  const decorate = () => {
    cornerFlow(doc, 'tr', 0.55, 0.55);
    cornerFlow(doc, 'bl', 0.55, 0.55);
  };

  const header = (continued: boolean) => {
    newPage(doc);
    decorate();
    caps(doc, d.wording.quoteHeading, 0, 92, { f: F.serif, size: 27, color: C.ink, spacing: 5, align: 'center', width: W });
    caps(doc, continued ? `${d.wording.quoteSubheading} (continued)` : d.wording.quoteSubheading, 0, 134, { size: 8, color: C.goldDeep, spacing: 2.6, align: 'center', width: W });
    const who = [clean(d.clientName), formatDate(d.eventDate, ''), clean(d.venue)].filter(Boolean).join('   \u00B7   ');
    if (who) {
      font(doc, F.sans, 9, C.muted);
      let line = who;
      while (line.length > 1 && doc.widthOfString(line) > CW) line = line.slice(0, -2).trimEnd() + '\u2026';
      doc.text(line, M, 156, { width: CW + 40, align: 'center', lineBreak: false });
    }
    hairline(doc, W / 2 - 24, 184, W / 2 + 24, C.gold, 0.7);
    folio(doc, d.wording.packageLabel, M, 212, CW);
    footer(doc, page);
    return 240;
  };

  let y = header(false);
  const priceW = 110;
  for (const item of d.items) {
    const text = clean(item.description) || 'Untitled item';
    font(doc, F.sans, 10.5, C.ink);
    const h = Math.max(doc.heightOfString(text, { width: CW - priceW - 16, lineGap: 3 }), 14);
    if (y + h + 24 > limit) {
      page++;
      y = header(true);
    }
    para(doc, text, M, y + 10, { f: F.sans, size: 10.5, color: C.ink, width: CW - priceW - 16, lineGap: 3 });
    if (item.free) caps(doc, 'Free', M + CW - priceW, y + 12, { size: 8.5, color: C.goldDeep, spacing: 2, align: 'right', width: priceW });
    else {
      font(doc, F.sansBold, 10.5, C.ink);
      doc.text(formatPence(item.pence), M + CW - priceW, y + 10, { width: priceW, align: 'right', lineBreak: false });
    }
    y += h + 20;
    hairline(doc, M, y, M + CW, C.line);
  }

  // Totals block (kept together; moves to a new page if it would not fit)
  const rows: { label: string; value: string; tone?: 'gold' }[] = [{ label: 'Subtotal', value: formatPence(t.subtotal) }];
  if (sw.discountEnabled && t.discount > 0) rows.push({ label: `Special discount (${formatPercent(sw.discountPercent)}%)`, value: `\u2013${formatPence(t.discount)}`, tone: 'gold' });
  if (sw.vatEnabled) rows.push({ label: `VAT (${formatPercent(sw.vatRate)}%)`, value: formatPence(t.vat) });
  const blockH = rows.length * 26 + 76;
  if (y + 22 + blockH > limit + 40) {
    page++;
    y = header(true);
  }
  y += 22;
  const lx = M + CW * 0.45;
  for (const r of rows) {
    caps(doc, r.label, lx, y + 3, { size: 8, color: C.muted, spacing: 2, width: CW * 0.55 - 100 + 40 });
    font(doc, F.sans, 11, r.tone === 'gold' ? C.goldDeep : C.ink);
    doc.text(r.value, M + CW - 110, y, { width: 110, align: 'right', lineBreak: false });
    y += 26;
  }
  hairline(doc, lx, y + 2, M + CW, C.gold, 0.8);
  y += 18;
  caps(doc, 'Final total', lx, y + 5, { size: 8.5, color: C.ink, spacing: 2.2, width: 160 });
  if (sw.vatEnabled) caps(doc, 'Including VAT', lx, y + 21, { f: F.sans, size: 7, color: C.muted, spacing: 1.8, width: 160 });
  font(doc, F.serif, 28, C.goldDeep);
  doc.text(formatPence(t.total), M + CW - 190, y, { width: 190, align: 'right', lineBreak: false });
  return page;
}

function notice(doc: PDFDocument, d: QuotePdfData, pageNo: number) {
  const t = calculate(d.items, d.switches);
  const sw = d.switches;
  const offer = sw.discountEnabled && sw.discountPercent > 0 && t.discount > 0;
  newPage(doc);
  cornerFlow(doc, 'tr', 0.62, 0.6);
  cornerFlow(doc, 'bl', 0.62, 0.6);

  let y = rich(doc, d.wording.noticeHeading, M, 100, CW, { size: 36, lineHeight: 40, color: C.ink, align: 'center' });
  y += 14;
  hairline(doc, W / 2 - 24, y, W / 2 + 24, C.gold, 0.8);
  y += 32;

  if (offer) {
    const boxW = 380;
    const bx = (W - boxW) / 2;
    const pct = formatPercent(sw.discountPercent);
    const text = clean(d.wording.offerText).replace(/\{percent\}/g, pct);
    font(doc, F.serif, 14.5, C.ink);
    const textH = doc.heightOfString(text, { width: boxW - 64, align: 'center', lineGap: 4 });
    const boxH = 30 + 14 + 22 + textH + 22 + 11 + 12 + 34 + 28;
    doc.save().lineWidth(0.7).strokeColor(C.gold).rect(bx, y, boxW, boxH).stroke().restore();
    doc.save().lineWidth(0.4).strokeColor(C.gold).strokeOpacity(0.5).rect(bx + 4, y + 4, boxW - 8, boxH - 8).stroke().restore();
    let by = y + 30;
    caps(doc, `Special offer \u2014 ${pct}% discount`, bx, by, { size: 8.5, color: C.goldDeep, spacing: 2.6, align: 'center', width: boxW });
    by += 14 + 22;
    para(doc, text, bx + 32, by, { f: F.serif, size: 14.5, color: C.ink, width: boxW - 64, align: 'center', lineGap: 4 });
    by += textH + 22;
    caps(doc, sw.vatEnabled ? 'Final price after discount (inc. VAT)' : 'Final price after discount', bx, by, { f: F.sans, size: 7.5, color: C.muted, spacing: 2, align: 'center', width: boxW });
    by += 20;
    font(doc, F.serif, 30, C.goldDeep);
    doc.text(formatPence(t.total), bx, by, { width: boxW, align: 'center', lineBreak: false });
    y += boxH + 30;
  } else {
    y += 70;
  }

  y += para(doc, clean(d.wording.bookingNote), 120, y, { f: F.sans, size: 11, color: C.inkSoft, width: W - 240, align: 'center', lineGap: 6 }) + 22;
  y += para(doc, clean(d.wording.invitation), 120, y, { f: F.serifItalic, size: 15, color: C.ink, width: W - 240, align: 'center', lineGap: 5 }) + 16;

  const contact = [d.contact.phone, d.contact.email].filter(Boolean).join('   \u00B7   ');
  if (contact) {
    font(doc, F.sans, 10.5, C.ink);
    doc.text(clean(contact), M, y, { width: CW, align: 'center', lineBreak: false });
    y += 18;
  }
  if (d.contact.website) {
    font(doc, F.sans, 10.5, C.goldDeep);
    doc.text(d.contact.website, M, y, { width: CW, align: 'center', lineBreak: false, link: `https://${d.contact.website}` });
    y += 18;
  }

  // Sign-off sits under the contact lines, but never closer than 80pt to the page footer.
  const closeY = Math.min(y + 26, H - 80 - 22 - 12 - 46);
  drawMotif(doc, W / 2, closeY, 46, 'line', { stroke: 0.8 });
  font(doc, F.serifItalic, 18, C.ink);
  doc.text(clean(d.wording.thanks), M, closeY + 62, { width: CW, align: 'center', lineBreak: false });
  footer(doc, pageNo);
}

export function filenameFor(d: Pick<QuotePdfData, 'clientName' | 'eventDate'>): string {
  const who = clean(d.clientName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  const when = /^\d{4}-\d{2}-\d{2}$/.test(d.eventDate) ? d.eventDate : '';
  return ['JNB-Events-Quotation', who, when].filter(Boolean).join('-') + '.pdf';
}

export function drawQuote(doc: PDFDocument, d: QuotePdfData): void {
  doc.registerFont(F.serif, d.fonts.serif);
  doc.registerFont(F.serifItalic, d.fonts.serifItalic);
  doc.registerFont(F.sans, d.fonts.sans);
  doc.registerFont(F.sansBold, d.fonts.sansBold);
  cover(doc, d);
  about(doc, d);
  const last = quote(doc, d);
  notice(doc, d, last + 1);
}
