/**
 * Geometry of the JNB brand motif, in a 120 x 66 box: the ogee mandap arch from the logo (brand/jnb_logo.svg),
 * redrawn as a single hairline, with its five-petal lotus and dotted drop line.
 * `Motif.astro` is the only consumer; it is a quiet echo of the logo, not a second logo.
 */
export const MOTIF = {
  width: 120,
  height: 66,
  /** Open outline: pointed apex, convex shoulders, a notch, then the wide base curves. Symmetric about x = 60. */
  arch: 'M.5 64C3 43 11 34 24 32.3C26 32 27.5 31.5 28 29C30 21 38 16 48 11C54 8 58 5 60 0C62 5 66 8 72 11C82 16 90 21 92 29C92.5 31.5 94 32 96 32.3C109 34 117 43 119.5 64',
  /** Lotus under the apex: one upright petal plus pairs fanned out from its base. */
  lotus: {
    petal: 'M60 8.5C63.5 12.5 63.5 17 60 21C56.5 17 56.5 12.5 60 8.5Z',
    pivot: [60, 21] as const,
    angles: [0, -38, 38, -72, 72] as const,
  },
  /** Dotted line falling from the lotus, ending in a diamond and a drop. */
  dots: [
    { cx: 60, cy: 24, r: 0.95 },
    { cx: 60, cy: 27, r: 0.65 },
    { cx: 60, cy: 29.3, r: 0.4 },
    { cx: 60, cy: 31.4, r: 0.65 },
  ],
  diamond: 'M60 34l1.6 2.5L60 39l-1.6-2.5Z',
  drop: 'M60 41c1.7 2.1 1.7 3.9 0 3.9s-1.7-1.8 0-3.9Z',
  /**
   * Leaf sprig inside the arch's lower-left corner (variant "botanical"); mirrored for the right-hand side.
   * Each leaf is a small pointed ellipse drawn along +x, then moved to (x, y) and turned by r degrees.
   */
  sprig: {
    stem: 'M7.6 63.5C8.6 55.5 13.5 49.5 22.5 44.6',
    leaf: 'M0 0C1.4 -1.8 3.9 -1.8 5.4 0C3.9 1.8 1.4 1.8 0 0Z',
    leaves: [
      { x: 8.7, y: 58.9, r: -114 },
      { x: 8.7, y: 58.9, r: -26 },
      { x: 10.9, y: 54.4, r: -100 },
      { x: 10.9, y: 54.4, r: -12 },
      { x: 14.4, y: 50.4, r: -88 },
      { x: 14.4, y: 50.4, r: 0 },
      { x: 22.5, y: 44.6, r: -29 },
    ],
  },
} as const;
