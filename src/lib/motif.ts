/**
 * Geometry of the JNB brand motif (a mandap arch), in a 80 x 100 box.
 * Single source of truth: `Motif.astro` draws it as SVG and `quote-pdf.ts` draws it into the quotation PDF,
 * so the website and the paperwork always carry the identical mark.
 */
export const MOTIF = {
  width: 80,
  height: 100,
  base: 'M8 92H72',
  outer: 'M16 92V44a24 24 0 0 1 48 0v48',
  inner: 'M26 92V46a14 14 0 0 1 28 0v46',
  /** Plain finial above the arch (variant "line"). */
  finial: { stem: 'M40 20V12', cx: 40, cy: 9.5, r: 1.6 },
  /** Lotus crowning the arch (variant "floral"): one upright petal and two fanned out from the apex. */
  lotus: { petal: 'M40 3C44.5 8 44.5 14 40 20C35.5 14 35.5 8 40 3Z', pivot: [40, 20] as const, angle: 48 },
  /** Small buds on the pillars' capitals (variant "floral"). */
  buds: [
    { cx: 16, cy: 44, r: 1.3 },
    { cx: 64, cy: 44, r: 1.3 },
  ],
} as const;
