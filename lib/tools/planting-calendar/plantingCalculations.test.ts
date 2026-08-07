import { describe, it, expect } from 'vitest';
import {
  calculateCropSchedule,
  canStillPlant
} from './plantingCalculations';
import { Crop, Variety, SelectedCrop, FrostDates } from './types';

const mockCrop: Crop = {
  id: 'tomato',
  name: 'Tomato',
  category: 'vegetable',
  varieties: [],
  startIndoors: 42,
  transplant: 14,
  directSow: null,
  daysToMaturity: 75,
  successionEnabled: true,
  successionInterval: 2,
  successionMax: 3,
  sun: 'full',
  spacing: '18-24"',
  notes: [],
  icon: '🍅'
};

const mockVariety: Variety = {
  id: 'roma',
  name: 'Roma',
  daysToMaturity: 75,
  type: 'Determinate',
  special: []
};

const mockSelectedCrop: SelectedCrop = {
  cropId: 'tomato',
  varietyId: 'roma',
  successionEnabled: true,
  successionInterval: 0 // EDGE CASE: 0 weeks
};

const mockFrostDates: FrostDates = {
  zipCode: '12345',
  lastSpringFrost: new Date('2024-05-01T12:00:00Z'),
  lastSpringFrostConfidence: 7,
  firstFallFrost: new Date('2024-10-15T12:00:00Z'),
  firstFallFrostConfidence: 10,
  frostFreeDays: 167,
  growingZone: '6a'
};

describe('plantingCalculations', () => {
  describe('calculateCropSchedule edge cases', () => {
    it('should not infinite loop if successionInterval is 0', () => {
      // This will freeze if the bug is present
      const schedule = calculateCropSchedule(
        mockCrop,
        mockVariety,
        mockSelectedCrop,
        mockFrostDates
      );
      
      expect(schedule.length).toBeGreaterThan(0);
    });

    it('should handle negative days available gracefully', () => {
      const shortSeasonFrost: FrostDates = {
        ...mockFrostDates,
        firstFallFrost: new Date('2024-05-15T12:00:00Z') // Very short season
      };
      
      const schedule = calculateCropSchedule(
        mockCrop,
        mockVariety,
        { ...mockSelectedCrop, successionInterval: 2 },
        shortSeasonFrost
      );
      
      // Should not throw or loop infinitely
      expect(Array.isArray(schedule)).toBe(true);
      
      // If the season is too short to harvest, it shouldn't recommend planting at all!
      const harvestEvents = schedule.filter(d => d.action === 'harvest');
      const startEvents = schedule.filter(d => d.action === 'start-indoors');
      
      // After the fix: it shouldn't schedule any events if it cannot harvest
      expect(startEvents.length).toBe(0);
      expect(harvestEvents.length).toBe(0);
    });

    it('should process lunarSync correctly when enabled', () => {
      // Create a mock crop that is waxing-aligned
      const lunarCrop: Crop = {
        ...mockCrop,
        lunarAffinity: 'waxing',
        directSow: 0, // plant on last frost exactly
      };

      const dateWithKnownPhase = new Date('2024-05-08T12:00:00Z'); // May 8, 2024 is exactly New Moon -> waxing
      
      const specificFrost: FrostDates = {
        ...mockFrostDates,
        lastSpringFrost: dateWithKnownPhase, // direct sow date
        firstFallFrost: new Date('2024-10-15T12:00:00Z')
      };

      const scheduleWithLunar = calculateCropSchedule(
        lunarCrop,
        mockVariety,
        { ...mockSelectedCrop, successionInterval: 0 },
        specificFrost,
        true // lunarSync active
      );

      const directSowEvent = scheduleWithLunar.find(e => e.action === 'direct-sow');
      
      expect(directSowEvent).toBeDefined();
      expect(directSowEvent?.lunarPhase).toBeDefined(); // should have an emoji
      expect(directSowEvent?.lunarAligned).toBeDefined();
      expect(typeof directSowEvent?.lunarAligned).toBe('boolean');
    });
  });

  describe('canStillPlant', () => {
    it('should return false if past the last plant date', () => {
      // Last possible plant date is first frost minus maturity days (and buffer for transplants)
      // 10/15 - 75 days = August 1. - 14 buffer = July 18.
      const lateDate = new Date('2024-08-15T12:00:00Z');
      const result = canStillPlant(mockCrop, mockVariety, mockFrostDates, lateDate);
      
      expect(result.canPlant).toBe(false);
      expect(result.message).toBe('Too late to plant this season');
    });

    it('should return true with warning if close to last chance', () => {
      const closeDate = new Date('2024-07-10T12:00:00Z');
      const result = canStillPlant(mockCrop, mockVariety, mockFrostDates, closeDate);
      
      expect(result.canPlant).toBe(true);
      expect(result.message).toContain('Last chance!');
    });
  });
});

// Garlic was anchored to last spring frost at -180 days. That anchor drifts
// into the previous summer as the last frost moves toward midwinter, and it
// shipped Aug 26 in zone 7b, Jul 14 in 9b and Jul 5 in 10b, on the zone pages,
// the interactive tool and the survival garden plan alike. It was also two to
// four weeks late in 4a and four to five weeks early in 6b, so the offset was
// wrong in both directions and merely passed through the right answer near 5b.
//
// These assert at the calculateCropSchedule layer, which is where all three
// consumers call in, rather than at any one surface.
describe('overwintering crops are not scheduled from the frost offset', () => {
  const garlic: Crop = {
    id: 'garlic',
    name: 'Garlic',
    category: 'vegetable',
    icon: '🧄',
    varieties: [],
    startIndoors: null,
    transplant: null,
    directSow: -180,
    daysToMaturity: 240,
    successionEnabled: false,
    successionInterval: 0,
    successionMax: 1,
    sun: 'full',
    spacing: '6-8" apart',
    notes: [],
  };
  const variety = { id: 'music', name: 'Music', daysToMaturity: 240 } as Variety;
  const selected = { cropId: 'garlic', varietyId: 'music', successionEnabled: false } as SelectedCrop;

  const frostFor = (zone: string, lastFrost: string, firstFrost: string, days: number): FrostDates => ({
    zipCode: '00000',
    lastSpringFrost: new Date(lastFrost),
    lastSpringFrostConfidence: 10,
    firstFallFrost: new Date(firstFrost),
    firstFallFrostConfidence: 10,
    frostFreeDays: days,
    growingZone: zone,
  });

  const cases: Array<[string, FrostDates]> = [
    ['4a', frostFor('4a', '2026-04-27', '2026-09-25', 151)],
    ['6b', frostFor('6b', '2026-03-15', '2026-11-10', 240)],
    ['7b', frostFor('7b', '2026-02-22', '2026-11-28', 279)],
    ['9b', frostFor('9b', '2026-01-10', '2026-12-28', 352)],
    ['10b', frostFor('10b', '2026-01-01', '2026-12-31', 364)],
  ];

  it.each(cases)('%s sows garlic in autumn, never in summer', (_zone, frost) => {
    const dates = calculateCropSchedule(garlic, variety, selected, frost, false);
    const sow = dates.find((d) => d.action === 'direct-sow');
    expect(sow).toBeDefined();
    const month = sow!.date.getMonth(); // 0-indexed
    expect(month).toBeGreaterThanOrEqual(8); // September at the earliest
    expect(month).toBeLessThanOrEqual(11);   // December at the latest
  });

  it('never returns an empty schedule, whatever the season length', () => {
    // The old path tested harvest against first frost and could drop the crop
    // entirely. An overwintering crop is not confined between the two frosts,
    // so that test was meaningless for it.
    for (const [, frost] of cases) {
      expect(calculateCropSchedule(garlic, variety, selected, frost, false).length).toBe(2);
    }
  });

  it('tells warm zones to pre-chill, and does not tell cold zones to', () => {
    const warm = calculateCropSchedule(garlic, variety, selected, cases[4][1], false);
    expect(warm.find((d) => d.action === 'direct-sow')!.notes!.join(' ')).toMatch(/[Rr]efrigerate/);
    const cold = calculateCropSchedule(garlic, variety, selected, cases[0][1], false);
    expect(cold.find((d) => d.action === 'direct-sow')!.notes!.join(' ')).not.toMatch(/[Rr]efrigerate/);
  });

  it('falls back to season length when no zone is supplied', () => {
    const noZone = { ...cases[4][1], growingZone: undefined };
    const sow = calculateCropSchedule(garlic, variety, selected, noZone, false)
      .find((d) => d.action === 'direct-sow')!;
    expect(sow.date.getMonth()).toBe(11); // December, same as zone 10b
  });

  // daysToMaturity is a flat count from sowing. Dec 15 + 240 gave August in
  // zone 10b, where the crop actually comes out in May.
  it.each(cases)('%s harvests in early summer, not on a day count', (_zone, frost) => {
    const harvest = calculateCropSchedule(garlic, variety, selected, frost, false)
      .find((d) => d.action === 'harvest')!;
    const month = harvest.date.getMonth(); // 0-indexed
    expect(month).toBeGreaterThanOrEqual(4); // May at the earliest
    expect(month).toBeLessThanOrEqual(6);    // July at the latest
  });

  it('harvests earlier as the zone warms, and always after the sowing', () => {
    const harvests = cases.map(([, frost]) => {
      const d = calculateCropSchedule(garlic, variety, selected, frost, false);
      const sow = d.find((x) => x.action === 'direct-sow')!.date;
      const harvest = d.find((x) => x.action === 'harvest')!.date;
      expect(harvest.getTime()).toBeGreaterThan(sow.getTime());
      return harvest.getMonth() * 31 + harvest.getDate();
    });
    // cases run coldest to warmest; harvest should move earlier, never later.
    for (let i = 1; i < harvests.length; i++) {
      expect(harvests[i]).toBeLessThanOrEqual(harvests[i - 1]);
    }
  });

  it('states the observational signal, since the date is only an estimate', () => {
    const harvest = calculateCropSchedule(garlic, variety, selected, cases[1][1], false)
      .find((d) => d.action === 'harvest')!;
    expect(harvest.notes!.join(' ')).toMatch(/third to a half of the leaves/);
  });

  it('ignores daysToMaturity entirely for these crops', () => {
    // A variety with a wildly different maturity must not move the harvest.
    const slow = { ...variety, daysToMaturity: 400 } as Variety;
    const a = calculateCropSchedule(garlic, variety, selected, cases[4][1], false);
    const b = calculateCropSchedule(garlic, slow, selected, cases[4][1], false);
    expect(b.find((d) => d.action === 'harvest')!.date.getTime()).toBe(
      a.find((d) => d.action === 'harvest')!.date.getTime()
    );
  });
});
