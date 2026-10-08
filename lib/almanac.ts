/**
 * The one-line almanac under the homepage masthead: the jobs this month, each
 * linked to the guide that covers it.
 *
 * Hand-kept, and deliberately sparse. A month with no entry shows no line,
 * because a stale or padded month is worse than none. Only link guides that
 * exist; almanac.test.ts fails on a link to a missing post.
 */

export interface AlmanacJob {
  /** Lowercase imperative, read after the month name: "plant garlic". */
  label: string;
  href: string;
}

export interface AlmanacMonth {
  month: string;
  jobs: AlmanacJob[];
}

/** Keyed by JavaScript month index, 0 = January. */
export const ALMANAC: Partial<Record<number, AlmanacJob[]>> = {
  9: [
    { label: 'plant garlic', href: '/archive/how-to-grow-garlic/' },
    { label: 'mark your sugar maple', href: '/archive/identify-sugar-maple/' },
  ],
  10: [
    { label: 'blow out the drip line', href: '/archive/diy-drip-irrigation-raised-beds/' },
    { label: 'learn your chill hours', href: '/archive/chill-hours-and-the-zone-map/' },
  ],
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** The entry for a JavaScript month index, or null for a month with no jobs. */
export function almanacForMonth(index: number): AlmanacMonth | null {
  const jobs = ALMANAC[index];
  return jobs?.length ? { month: MONTHS[index], jobs } : null;
}

export function getAlmanacMonth(date: Date = new Date()): AlmanacMonth | null {
  return almanacForMonth(date.getMonth());
}
