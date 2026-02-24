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
