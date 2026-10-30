/**
 * Project categories, in the order they appear in the gallery filter.
 *
 * IMPORTANT: this list must match the `select` options for `category` in `.pages.yml`.
 * If the two drift apart, `npm run build` fails with a clear validation error pointing
 * at the offending project, so a typo in the CMS can never silently break the gallery.
 */
export const PROJECT_CATEGORIES = [
  'Mandaps & Stages',
  'Civil Ceremony',
  'Reception & Centrepieces',
  'Décor',
  'DJ & Entertainment',
  'Special Effects',
  'Dance Floor & Lighting',
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];
