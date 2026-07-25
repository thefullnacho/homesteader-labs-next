import { describe, it, expect } from 'vitest';
import { getGrowingZoneFromZip, getZoneTableSize, ALL_ZONES } from './zoneLookup';

describe('getGrowingZoneFromZip (PRISM 2023)', () => {
  // Spot checks against the published PRISM 2023 table. Every one of these was
  // wrong under the old 3-digit-prefix estimator, which is why it was replaced.
  const cases: Array<[string, string, string]> = [
    ['06385', '7a',  'Waterford, CT — the miss that prompted the fix, estimator said 5b'],
    ['02138', '6b',  'Cambridge, MA — estimator said 5b'],
    ['10001', '7b',  'New York, NY — estimator said 6b'],
    ['27514', '8a',  'Chapel Hill, NC — estimator said 7b'],
    ['90210', '10b', 'Beverly Hills, CA — estimator said 10a'],
    ['98101', '9a',  'Seattle, WA — estimator said 8b'],
    ['55001', '5a',  'Afton, MN'],
    ['99501', '5a',  'Anchorage, AK'],
    ['96813', '12b', 'Honolulu, HI'],
    ['00926', '13a', 'San Juan, PR'],
  ];

  it.each(cases)('%s resolves to %s (%s)', (zip, zone) => {
    expect(getGrowingZoneFromZip(zip)).toBe(zone);
  });

  it('accepts ZIP+4 and reads the first five digits', () => {
    expect(getGrowingZoneFromZip('06385-1234')).toBe('7a');
  });

  it('trims surrounding whitespace', () => {
    expect(getGrowingZoneFromZip('  06385  ')).toBe('7a');
  });

  it('returns undefined for a ZIP absent from the PRISM dataset', () => {
    // PRISM omits PO-box-only and some newly issued ZIPs; undefined is normal.
    expect(getGrowingZoneFromZip('99999')).toBeUndefined();
  });

  it.each([['abcde'], [''], ['123'], ['0638X']])(
    'returns undefined for malformed input %j',
    (input) => {
      expect(getGrowingZoneFromZip(input)).toBeUndefined();
    }
  );

  it('returns undefined for non-string input', () => {
    // Guards the API route against a non-string param at runtime.
    expect(getGrowingZoneFromZip(undefined as unknown as string)).toBeUndefined();
  });
});

describe('zone table integrity', () => {
  it('holds the full PRISM 2023 dataset', () => {
    // us 39921 + ak 272 + hi 133 + pr 176
    expect(getZoneTableSize()).toBe(40502);
  });

  it('covers all 26 half-zones from 1a to 13b', () => {
    expect(ALL_ZONES).toHaveLength(26);
    expect(ALL_ZONES[0]).toBe('1a');
    expect(ALL_ZONES[ALL_ZONES.length - 1]).toBe('13b');
  });

  it('sorts zones numerically rather than lexically', () => {
    // A naive string sort would put 10a before 2a.
    expect(ALL_ZONES.indexOf('2a')).toBeLessThan(ALL_ZONES.indexOf('10a'));
  });
});
