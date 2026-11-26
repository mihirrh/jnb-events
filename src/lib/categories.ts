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

/** Category-specific copy keeps gallery archives useful and distinct from the all-project index. */
export const PROJECT_CATEGORY_COPY: Record<ProjectCategory, { description: string; introduction: string }> = {
  'Mandaps & Stages': {
    description: 'Explore carved and contemporary mandap settings, with ceremony views, aisle styling and floral details from JNB Events in Leicester and the Midlands.',
    introduction: 'Compare traditional carved structures with contemporary gold frames. These projects show how the mandap, aisle, seating and floral palette work together as one ceremony setting.',
  },
  'Civil Ceremony': {
    description: 'Civil ceremony styling ideas from JNB Events, including ceremony backdrops, aisle details and floral arrangements in Leicester and the Midlands.',
    introduction: 'Civil ceremony styling can bring together a focal backdrop, aisle details and a considered signing area. This collection will grow as verified projects are added.',
  },
  'Reception & Centrepieces': {
    description: 'Reception styling ideas from JNB Events, from stage backdrops and table centrepieces to lighting and room details in Leicester and the Midlands.',
    introduction: 'Reception décor brings the room together through the stage, table styling and lighting. This collection will grow as verified reception projects are added.',
  },
  'Décor': {
    description: 'Browse wedding entrance and welcome décor by JNB Events, including floral framing, Ganesh displays and candlelit details in Leicestershire.',
    introduction: 'Explore welcome and entrance displays, from indoor floral framing and candlelight to outdoor arrangements. Open a project to see the photographs and styling details.',
  },
  'DJ & Entertainment': {
    description: 'Explore DJ and entertainment work from JNB Events, with event sound, lighting and performance details for celebrations across the Midlands.',
    introduction: 'Sound and entertainment shape the energy of an event. Verified projects will be added here as photography and event details become available.',
  },
  'Special Effects': {
    description: 'Special effects styling by JNB Events, including low fog and sparkler moments for wedding celebrations in Leicester and the Midlands.',
    introduction: 'Low fog and sparkler effects can create a distinct moment in an evening celebration. Verified project photographs will be added to this collection when available.',
  },
  'Dance Floor & Lighting': {
    description: 'Browse dance floor and lighting ideas from JNB Events, including evening atmosphere and room lighting for weddings in Leicester and the Midlands.',
    introduction: 'Dance floor and lighting choices change the feel of an evening room. This collection will show verified setups as project photographs become available.',
  },
};
