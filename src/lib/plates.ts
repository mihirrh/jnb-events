/**
 * Editorial placements for a run of project tiles on large screens. The pattern repeats every six
 * tiles, mixing wide, tall and square plates and staggering their vertical offsets so rows never
 * line up. On phones and tablets every tile simply stacks / pairs up.
 */
export const PLATES: { cls: string; ratio: number }[] = [
  { cls: 'lg:col-span-7 lg:col-start-1', ratio: 4 / 3 },
  { cls: 'lg:col-span-4 lg:col-start-9 lg:mt-32', ratio: 4 / 5 },
  { cls: 'lg:col-span-4 lg:col-start-2 lg:-mt-8', ratio: 4 / 5 },
  { cls: 'lg:col-span-6 lg:col-start-7 lg:mt-24', ratio: 3 / 2 },
  { cls: 'lg:col-span-5 lg:col-start-1 lg:mt-10', ratio: 1 },
  { cls: 'lg:col-span-4 lg:col-start-8 lg:mt-40', ratio: 4 / 5 },
];

export const plate = (i: number) => PLATES[i % PLATES.length];
