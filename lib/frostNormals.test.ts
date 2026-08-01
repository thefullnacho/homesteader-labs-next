import { describe, it, expect } from 'vitest';
import frostZones from '@/content/frost-zones.json';
import { getFrostDatesByZone } from './frostNormals';

/**
 * Data-integrity tests for content/frost-zones.json.
 *
 * These exist because 4a, 4b and 10a shipped non-monotonic and stayed that way
 * for months. Nothing caught it, because a zone page renders one zone and no
 * reader can see its neighbours. State pages render several bands in one table,
 * where a warmer zone with a shorter season is visible and absurd.
 *
 * The invariants below are the cheap structural checks that would have caught
 * the original entry errors. They cannot tell you a date is *correct*, only
 * that the table is internally consistent, which is the class of bug that
 * actually occurred.
 */

const ORDER = [
  '1a', '1b', '2a', '2b', '3a', '3b', '4a', '4b', '5a', '5b',
  '6a', '6b', '7a', '7b', '8a', '8b', '9a', '9b', '10a', '10b',
] as const;

type ZoneKey = (typeof ORDER)[number];

const zones = frostZones.zones as Record<string, {
  lastSpringFrost: string;
  firstFallFrost: string;
  frostFreeDays: number;
  lastFrostVarianceDays: number;
  firstFrostVarianceDays: number;
}>;

/** Day of year in a non-leap year, Jan 1 = 0. */
function doy(mmdd: string): number {
  const [month, day] = mmdd.split('-').map(Number);
  return Math.round(
    (Date.UTC(2025, month - 1, day) - Date.UTC(2025, 0, 1)) / 86_400_000
  );
}

/** Consecutive pairs, coldest first: ["1a","1b"], ["1b","2a"], ... */
const PAIRS = ORDER.slice(0, -1).map((colder, i) => [colder, ORDER[i + 1]] as const);

describe('frost-zones.json shape', () => {
  it('covers every zone from 1a to 10b with no gaps', () => {
    expect(Object.keys(zones).sort()).toEqual([...ORDER].sort());
  });

  it.each(ORDER)('%s parses to real calendar dates', (zone) => {
    const e = zones[zone];
    expect(e.lastSpringFrost).toMatch(/^\d{2}-\d{2}$/);
    expect(e.firstFallFrost).toMatch(/^\d{2}-\d{2}$/);
    expect(doy(e.lastSpringFrost)).toBeGreaterThanOrEqual(0);
    expect(doy(e.firstFallFrost)).toBeLessThanOrEqual(364);
  });

  it.each(ORDER)('%s stores a frostFreeDays that matches its own dates', (zone) => {
    const e = zones[zone];
    // getFrostDatesByZone recomputes this rather than reading it, so a stale
    // stored value is invisible at runtime. 10b carried 365 against 364.
    expect(e.frostFreeDays).toBe(doy(e.firstFallFrost) - doy(e.lastSpringFrost));
  });

  it.each(ORDER)('%s frosts in the right half of the year', (zone) => {
    const e = zones[zone];
    // Spring frost in the first half, fall frost in the second. Guards against
    // the two date fields being transposed.
    expect(doy(e.lastSpringFrost)).toBeLessThan(182);
    expect(doy(e.firstFallFrost)).toBeGreaterThan(182);
  });
});

describe('frost-zones.json monotonicity', () => {
  it.each(PAIRS)('%s -> %s: last spring frost moves earlier, never later', (colder, warmer) => {
    expect(doy(zones[warmer].lastSpringFrost))
      .toBeLessThan(doy(zones[colder].lastSpringFrost));
  });

  it.each(PAIRS)('%s -> %s: first fall frost moves later, never earlier', (colder, warmer) => {
    expect(doy(zones[warmer].firstFallFrost))
      .toBeGreaterThan(doy(zones[colder].firstFallFrost));
  });

  it.each(PAIRS)('%s -> %s: the season gets longer, never shorter', (colder, warmer) => {
    expect(zones[warmer].frostFreeDays).toBeGreaterThan(zones[colder].frostFreeDays);
  });

  it.each(PAIRS)('%s -> %s: variance narrows or holds, never widens', (colder, warmer) => {
    // Warmer zones sit in more stable climates, so the 10th-90th window tightens.
    expect(zones[warmer].lastFrostVarianceDays)
      .toBeLessThanOrEqual(zones[colder].lastFrostVarianceDays);
    expect(zones[warmer].firstFrostVarianceDays)
      .toBeLessThanOrEqual(zones[colder].firstFrostVarianceDays);
  });
});

describe('frost-zones.json plausibility', () => {
  it('no two zones share a last spring frost date', () => {
    // 4a duplicated 3a's and 10a duplicated 8b's. Both were copy-paste, and
    // both are impossible under strict monotonicity anyway, but naming the
    // duplicate is what makes the failure diagnosable.
    const seen = new Map<string, string[]>();
    for (const z of ORDER) {
      const k = zones[z].lastSpringFrost;
      seen.set(k, [...(seen.get(k) ?? []), z]);
    }
    const dupes = [...seen.entries()].filter(([, zs]) => zs.length > 1);
    expect(dupes, `duplicate last frost dates: ${JSON.stringify(dupes)}`).toEqual([]);
  });

  it('no two zones share a first fall frost date', () => {
    const seen = new Map<string, string[]>();
    for (const z of ORDER) {
      const k = zones[z].firstFallFrost;
      seen.set(k, [...(seen.get(k) ?? []), z]);
    }
    const dupes = [...seen.entries()].filter(([, zs]) => zs.length > 1);
    expect(dupes, `duplicate fall frost dates: ${JSON.stringify(dupes)}`).toEqual([]);
  });

  it.each(PAIRS)('%s -> %s: the half-zone step stays inside 2-25 days', (colder, warmer) => {
    // Half-zone steps in this table run 3-19 days. A step outside 2-25 is not
    // necessarily wrong, but it is the shape a fat-fingered month takes, so it
    // should force a human to look rather than pass silently.
    const step = doy(zones[colder].lastSpringFrost) - doy(zones[warmer].lastSpringFrost);
    expect(step).toBeGreaterThanOrEqual(2);
    expect(step).toBeLessThanOrEqual(25);
  });

  it('season length spans a credible range end to end', () => {
    expect(zones['1a'].frostFreeDays).toBeLessThan(60);
    expect(zones['10b'].frostFreeDays).toBeGreaterThan(330);
    expect(zones['10b'].frostFreeDays).toBeLessThanOrEqual(364);
  });
});

describe('getFrostDatesByZone', () => {
  it.each(ORDER)('%s returns dates consistent with the table', (zone) => {
    const d = getFrostDatesByZone(zone, '00000');
    expect(d.growingZone).toBe(zone);
    expect(d.frostFreeDays).toBe(zones[zone].frostFreeDays);
  });

  it('falls back to 6a for an unknown zone rather than throwing', () => {
    const d = getFrostDatesByZone('99z', '00000');
    expect(d.frostFreeDays).toBe(zones['6a'].frostFreeDays);
  });

  it('is case-insensitive on the zone key', () => {
    expect(getFrostDatesByZone('7B', '00000').frostFreeDays)
      .toBe(getFrostDatesByZone('7b', '00000').frostFreeDays);
  });

  it('passes the ZIP through untouched, since the zone drives the dates', () => {
    expect(getFrostDatesByZone('6b', '14201').zipCode).toBe('14201');
  });

  it.each(ORDER)('%s puts the fall frost after the spring frost', (zone) => {
    const d = getFrostDatesByZone(zone as ZoneKey, '00000');
    expect(d.firstFallFrost.getTime()).toBeGreaterThan(d.lastSpringFrost.getTime());
  });
});
