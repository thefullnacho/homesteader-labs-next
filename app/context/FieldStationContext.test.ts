import { describe, it, expect, vi, afterEach } from 'vitest';
import { getMockFrostData } from './FieldStationContext';

// getMockFrostData now resolves the zone over /api/zone/[zip] so the ~529KB
// PRISM table stays out of the client bundle. Stub fetch with the real values.
const REAL_ZONES: Record<string, string> = {
  '90210': '10b',
  '55001': '5a',
  '10001': '7b',
};

function stubZoneApi() {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    // URL ends in a slash (trailingSlash is on), so drop empty segments.
    const zip = String(url).split('/').filter(Boolean).pop() ?? '';
    const zone = REAL_ZONES[zip];
    return {
      ok: zone !== undefined,
      json: async () => ({ zip, zone: zone ?? null, source: 'PRISM 2023' }),
    };
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FieldStationContext Logic', () => {
  describe('getMockFrostData', () => {
    it('generates roughly correct dates and zone for 90210 (SoCal)', async () => {
      stubZoneApi();
      const data = await getMockFrostData('90210');
      expect(data.zipCode).toBe('90210');
      expect(data.growingZone).toBe('10b');
      // 10b is warmer than the 10a the old estimator wrongly returned, so the
      // last spring frost moves earlier, from February into January.
      expect(data.lastSpringFrost.getMonth()).toBe(0);  // January
      expect(data.firstFallFrost.getMonth()).toBe(11);  // December
    });

    it('generates roughly correct dates for 55001 (Northern Midwest)', async () => {
      stubZoneApi();
      const data = await getMockFrostData('55001');
      expect(data.growingZone).toBe('5a');
      expect(data.frostFreeDays).toBeGreaterThan(0);
    });

    it('handles year rollover gracefully', async () => {
      stubZoneApi();
      const data = await getMockFrostData('10001');
      const expectedYear = new Date().getMonth() >= 9
        ? new Date().getFullYear() + 1
        : new Date().getFullYear();

      expect(data.lastSpringFrost.getFullYear()).toBe(expectedYear);
    });

    it('falls back to 6a when the zone API cannot answer', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })));
      const data = await getMockFrostData('99999');
      expect(data.growingZone).toBe('6a');
    });
  });
});
