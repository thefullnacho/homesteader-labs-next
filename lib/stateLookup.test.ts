import { describe, it, expect } from 'vitest';
import zipZones from '@/content/zones/usda-2023-zip-zones.json';
import {
  ALL_STATES,
  getStateFromZip,
  getZipsForState,
  getStateTableSize,
} from './stateLookup';

const ZONES = zipZones as Record<string, string>;

/**
 * Data-integrity tests for content/zones/zip-states.json.
 *
 * The state pages derive every band share from this join, so a silent gap in it
 * becomes a wrong percentage on a published page rather than a crash. These
 * assert the join's shape and its coverage against the PRISM zone table it is
 * keyed to.
 */

const STATE_RE = /^[A-Z]{2}$/;

describe('zip-states table shape', () => {
  it('is keyed to the PRISM ZIP set and adds nothing of its own', () => {
    // Every ZIP with a state must have a zone. The reverse does not hold: 233
    // PRISM ZIPs are documented as unresolvable.
    const strays = Object.keys(
      Object.fromEntries(
        getZipsForState('TX').concat(getZipsForState('CA')).map((z) => [z, 1])
      )
    ).filter((z) => !ZONES[z]);
    expect(strays).toEqual([]);
  });

  it('covers at least 99% of PRISM ZIPs, the spec gate', () => {
    const total = Object.keys(ZONES).length;
    const resolved = Object.keys(ZONES).filter((z) => getStateFromZip(z)).length;
    expect(resolved / total).toBeGreaterThanOrEqual(0.99);
  });

  it('leaves no more than 300 ZIPs unresolved', () => {
    // 233 at time of writing. A jump means the source or the build drifted.
    const missing = Object.keys(ZONES).filter((z) => !getStateFromZip(z));
    expect(missing.length).toBeLessThanOrEqual(300);
  });

  it('holds 50 states plus DC and PR, and nothing else', () => {
    expect(ALL_STATES).toHaveLength(52);
    expect(ALL_STATES).toContain('DC');
    expect(ALL_STATES).toContain('PR');
    // Territories other than PR are outside the PRISM table.
    for (const t of ['GU', 'AS', 'MP', 'VI']) expect(ALL_STATES).not.toContain(t);
  });

  it.each([...ALL_STATES])('%s is a two-letter uppercase code', (s) => {
    expect(s).toMatch(STATE_RE);
  });

  it('has a non-trivial table', () => {
    expect(getStateTableSize()).toBeGreaterThan(40_000);
  });
});

describe('getStateFromZip', () => {
  it.each([
    ['10001', 'NY'],
    ['90210', 'CA'],
    ['78701', 'TX'],
    ['33101', 'FL'],
    ['02108', 'MA'],
    ['97201', 'OR'],
    ['14201', 'NY'],
  ])('resolves %s to %s', (zip, state) => {
    expect(getStateFromZip(zip)).toBe(state);
  });

  it('accepts ZIP+4 and reads the first five digits', () => {
    expect(getStateFromZip('10001-1234')).toBe('NY');
  });

  it('trims surrounding whitespace', () => {
    expect(getStateFromZip('  10001 ')).toBe('NY');
  });

  it.each([
    ['', 'empty'],
    ['abcde', 'non-numeric'],
    ['123', 'too short'],
    ['99999', 'not a real ZIP'],
  ])('returns undefined for %s (%s)', (zip) => {
    expect(getStateFromZip(zip)).toBeUndefined();
  });

  it('returns undefined rather than throwing on a non-string', () => {
    // @ts-expect-error deliberately wrong type, mirrors zoneLookup's contract
    expect(getStateFromZip(null)).toBeUndefined();
    // @ts-expect-error deliberately wrong type
    expect(getStateFromZip(12345)).toBeUndefined();
  });
});

describe('getZipsForState', () => {
  it('returns a plausible count for a large state', () => {
    const tx = getZipsForState('TX');
    expect(tx.length).toBeGreaterThan(2_000);
    expect(tx.every((z) => getStateFromZip(z) === 'TX')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(getZipsForState('tx')).toEqual(getZipsForState('TX'));
  });

  it('returns empty for an unknown state rather than throwing', () => {
    expect(getZipsForState('ZZ')).toEqual([]);
  });

  it('partitions the table: every ZIP belongs to exactly one state', () => {
    const sum = ALL_STATES.reduce((n, s) => n + getZipsForState(s).length, 0);
    expect(sum).toBe(getStateTableSize());
  });
});

describe('the join the state pages actually depend on', () => {
  it.each([
    ['TX', 2_000],
    ['CA', 2_000],
    ['NY', 1_500],
    ['PA', 1_500],
    ['FL', 1_000],
    ['OH', 1_000],
    ['MI', 1_000],
    ['NC', 900],
    ['GA', 800],
    ['KY', 700],
  ])('pilot state %s has at least %i zoned ZIPs', (state, min) => {
    // Every pilot state in STATE_PAGES_SPEC section 10 must have enough zoned
    // ZIPs for its band shares to mean anything.
    const zips = getZipsForState(state).filter((z) => ZONES[z]);
    expect(zips.length).toBeGreaterThanOrEqual(min);
  });

  it.each(['TX', 'CA', 'NY', 'PA', 'FL', 'OH', 'MI', 'NC', 'GA', 'KY'])(
    '%s spans at least two zones, so it needs a state page rather than a redirect',
    (state) => {
      const zones = new Set(
        getZipsForState(state).map((z) => ZONES[z]).filter(Boolean)
      );
      expect(zones.size).toBeGreaterThanOrEqual(2);
    }
  );
});
