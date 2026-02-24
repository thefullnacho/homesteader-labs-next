import { describe, it, expect } from 'vitest';
import { getGrowingZoneFromZip, getMockFrostData } from './FieldStationContext';

describe('FieldStationContext Logic', () => {
  describe('getGrowingZoneFromZip', () => {
    it('returns 5b for New England zip codes', () => {
      expect(getGrowingZoneFromZip('02138')).toBe('5b'); // Cambridge, MA
    });

    it('returns 6b for Mid-Atlantic zip codes', () => {
      expect(getGrowingZoneFromZip('10001')).toBe('6b'); // NYC
    });

    it('returns 7b for Virginia/Carolina zip codes', () => {
      expect(getGrowingZoneFromZip('27514')).toBe('7b'); // Chapel Hill, NC
    });

    it('returns 10a for Southern California', () => {
      expect(getGrowingZoneFromZip('90210')).toBe('10a'); // Beverly Hills
    });

    it('returns 8b for PNW', () => {
      expect(getGrowingZoneFromZip('98101')).toBe('8b'); // Seattle, WA
    });
  });

  describe('getMockFrostData', () => {
    it('generates roughly correct dates and zone for 90210 (SoCal)', () => {
      const data = getMockFrostData('90210');
      expect(data.zipCode).toBe('90210');
      expect(data.growingZone).toBe('10a');
      expect(data.lastSpringFrost.getMonth()).toBe(1); // February is month 1
      expect(data.firstFallFrost.getMonth()).toBe(11); // December is month 11
    });

    it('generates roughly correct dates for 55001 (Northern Midwest)', () => {
      const data = getMockFrostData('55001');
      expect(data.growingZone).toBe('4b');
      expect(data.lastSpringFrost.getMonth()).toBe(4); // May is month 4
      expect(data.firstFallFrost.getMonth()).toBe(8); // September is month 8
      expect(data.frostFreeDays).toBeGreaterThan(0);
    });

    it('handles year rollover gracefully', () => {
      // The logic says: if month >= 9, targetYear = currentYear + 1
      const data = getMockFrostData('10001'); // Normal zone 6b
      const expectedYear = new Date().getMonth() >= 9 
        ? new Date().getFullYear() + 1 
        : new Date().getFullYear();
        
      expect(data.lastSpringFrost.getFullYear()).toBe(expectedYear);
    });
  });
});
