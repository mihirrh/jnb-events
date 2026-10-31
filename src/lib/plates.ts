/**
 * Editorial placements for a run of project tiles on large screens. The pattern repeats every five tiles:
 * one wide plate beside a near-square one (equal heights), then three equal portraits. Tops always align, so the grid
 * reads as composed rather than scattered. On phones and tablets every tile simply stacks / pairs up.
 */
export const PLATES: { cls: string; ratio: number }[] = [
  { cls: 'lg:col-span-7', ratio: 3 / 2 },
  { cls: 'lg:col-span-5', ratio: 16 / 15 },
  { cls: 'lg:col-span-4', ratio: 4 / 5 },
  { cls: 'lg:col-span-4', ratio: 4 / 5 },
  { cls: 'lg:col-span-4', ratio: 4 / 5 },
];

export const plate = (i: number) => PLATES[i % PLATES.length];
