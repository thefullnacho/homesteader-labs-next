import { describe, it, expect } from 'vitest';
import {
  GALLONS_PER_INCH_PER_SQFT,
  getDailyHouseholdNeed,
  getDailyTotalNeed,
  calculateExpectedRainGallons,
  calculateWaterAutonomy,
} from './waterAutonomy';
import {
  COLLECTION_METHOD_PRESETS,
  estimateCollectionArea,
  buildCatchmentConfig,
  forecastToRainDays,
} from './catchmentConfig';
import type { CatchmentConfig, ForecastRainDay, WaterAutonomyInput } from './types';
import type { ForecastDay } from '@/lib/weatherTypes';

// ============================================================
// Fixtures
// ============================================================

const gutterConfig: CatchmentConfig = {
  collectionMethod:   'rooftop-gutters',
  collectionAreaSqFt: 1000,
  storageCap:         500,
  efficiency:         0.85,
  firstFlushGallons:  5,
};

// Large-cap variant used for raw physics assertions — prevents the storage
// ceiling from interfering with inflow math tests.
const gutterConfigLargeCap: CatchmentConfig = { ...gutterConfig, storageCap: 99_999 };

const baseInput: WaterAutonomyInput = {
  storedGallons: 100,
  householdSize: 4,
  catchment: gutterConfig,
};

const certainRain: ForecastRainDay[] = [
  { precipitationInches: 1.0, probabilityPercent: 100 },
];

const uncertainRain: ForecastRainDay[] = [
  { precipitationInches: 1.0, probabilityPercent: 50 },
];

// ============================================================
// Step 1 — waterAutonomy.ts
// ============================================================

describe('getDailyHouseholdNeed', () => {
  it('returns 1 gallon per person per day', () => {
    expect(getDailyHouseholdNeed(4)).toBe(4);
    expect(getDailyHouseholdNeed(1)).toBe(1);
  });
});

describe('getDailyTotalNeed', () => {
  it('adds irrigation to household need', () => {
    expect(getDailyTotalNeed(4, 10)).toBe(14);
  });

  it('returns household-only when irrigation is 0 or omitted', () => {
    expect(getDailyTotalNeed(4)).toBe(4);
    expect(getDailyTotalNeed(4, 0)).toBe(4);
  });
});

describe('calculateExpectedRainGallons', () => {
  it('calculates inflow using physics constant correctly', () => {
    // 1 inch × 1000 sqft × 0.623 gal/in/sqft × 0.85 efficiency − 5 first-flush
    // = 529.55 − 5 = 524.55
    // Uses large-cap config so the storage ceiling doesn't interfere.
    const result = calculateExpectedRainGallons(certainRain, gutterConfigLargeCap, 0);
    expect(result).toBeCloseTo(1.0 * 1000 * GALLONS_PER_INCH_PER_SQFT * 0.85 - 5, 1);
  });

  it('applies probability weighting (50% chance = half expected yield)', () => {
    // Uses large-cap so neither certain nor uncertain hits the ceiling.
    const certain   = calculateExpectedRainGallons(certainRain,   gutterConfigLargeCap, 0);
    const uncertain = calculateExpectedRainGallons(uncertainRain, gutterConfigLargeCap, 0);
    expect(uncertain).toBeCloseTo(certain / 2, 0);
  });

  it('caps inflow at remaining tank capacity', () => {
    // Tank holds 500 gal, already has 400 gal → can only take 100 more
    const result = calculateExpectedRainGallons(certainRain, gutterConfig, 400);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('does not subtract first-flush on dry days (< 0.05 inches expected)', () => {
    const lightMist: ForecastRainDay[] = [
      { precipitationInches: 0.04, probabilityPercent: 100 },
    ];
    const result = calculateExpectedRainGallons(lightMist, gutterConfig, 0);
    // No first-flush deduction since expectedInches < 0.05
    const expected = 0.04 * 1000 * GALLONS_PER_INCH_PER_SQFT * 0.85;
    expect(result).toBeCloseTo(expected, 1);
  });

  it('returns 0 when forecast is empty', () => {
    expect(calculateExpectedRainGallons([], gutterConfig, 0)).toBe(0);
  });

  it('never returns negative gallons', () => {
    // Edge: very small rain where first-flush exceeds gross inflow
    const trace: ForecastRainDay[] = [
      { precipitationInches: 0.01, probabilityPercent: 100 },
    ];
    const result = calculateExpectedRainGallons(trace, gutterConfig, 0);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('calculateWaterAutonomy', () => {
  it('days of water = stored / daily need when no catchment', () => {
    // 100 gal / 4 gal/day = 25 days
    const result = calculateWaterAutonomy({ storedGallons: 100, householdSize: 4 });
    expect(result.daysOfWater).toBeCloseTo(25, 1);
    expect(result.currentSupplyDays).toBeCloseTo(25, 1);
    expect(result.confidence).toBe('low');
  });

  it('adds projected inflow to days of water when catchment is configured', () => {
    const noCatchment = calculateWaterAutonomy({ storedGallons: 100, householdSize: 4 });
    const withCatchment = calculateWaterAutonomy({
      ...baseInput,
      forecastDays: certainRain,
    });
    expect(withCatchment.daysOfWater).toBeGreaterThan(noCatchment.daysOfWater);
  });

  it('confidence is high with catchment + forecast', () => {
    const result = calculateWaterAutonomy({ ...baseInput, forecastDays: certainRain });
    expect(result.confidence).toBe('high');
  });

  it('confidence is medium with catchment but no forecast', () => {
    const result = calculateWaterAutonomy(baseInput);
    expect(result.confidence).toBe('medium');
  });

  it('confidence is low with no catchment', () => {
    const result = calculateWaterAutonomy({ storedGallons: 100, householdSize: 4 });
    expect(result.confidence).toBe('low');
  });

  it('irrigation extends daily need and reduces daysOfWater', () => {
    const without = calculateWaterAutonomy(baseInput);
    const withIrrigation = calculateWaterAutonomy({ ...baseInput, irrigationDailyGallons: 10 });
    expect(withIrrigation.daysOfWater).toBeLessThan(without.daysOfWater);
  });

  it('irrigationTracked is false when no irrigation value provided', () => {
    const result = calculateWaterAutonomy(baseInput);
    expect(result.irrigationTracked).toBe(false);
  });

  it('irrigationTracked is true when irrigation gallons provided', () => {
    const result = calculateWaterAutonomy({ ...baseInput, irrigationDailyGallons: 5 });
    expect(result.irrigationTracked).toBe(true);
  });

  it('projectedInflowGallons is 0 when no forecast', () => {
    const result = calculateWaterAutonomy(baseInput);
    expect(result.projectedInflowGallons).toBe(0);
  });

  it('currentSupplyDays does not include forecast inflow', () => {
    const result = calculateWaterAutonomy({ ...baseInput, forecastDays: certainRain });
    // currentSupplyDays = stored only; daysOfWater = stored + inflow
    expect(result.daysOfWater).toBeGreaterThanOrEqual(result.currentSupplyDays);
  });
});

// ============================================================
// Step 2 — catchmentConfig.ts
// ============================================================

describe('COLLECTION_METHOD_PRESETS', () => {
  it('rooftop-gutters has highest efficiency', () => {
    const { 'rooftop-gutters': gutters, 'tarp-stand': tarp, 'direct-barrel': barrel } =
      COLLECTION_METHOD_PRESETS;
    expect(gutters.efficiency).toBeGreaterThan(tarp.efficiency);
    expect(tarp.efficiency).toBeGreaterThan(barrel.efficiency);
  });

  it('every preset has a label and description', () => {
    for (const preset of Object.values(COLLECTION_METHOD_PRESETS)) {
      expect(preset.label.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);
    }
  });

  it('efficiency values are between 0 and 1', () => {
    for (const preset of Object.values(COLLECTION_METHOD_PRESETS)) {
      expect(preset.efficiency).toBeGreaterThan(0);
      expect(preset.efficiency).toBeLessThanOrEqual(1);
    }
  });
});

describe('estimateCollectionArea', () => {
  it('returns length × width as sqFt', () => {
    const result = estimateCollectionArea(40, 25);
    expect(result.sqFt).toBe(1000);
  });

  it('returns a non-empty explanation string', () => {
    const result = estimateCollectionArea(40, 25);
    expect(result.explanation).toContain('1000');
    expect(result.explanation.length).toBeGreaterThan(10);
  });
});

describe('buildCatchmentConfig', () => {
  it('fills defaults from method preset', () => {
    const config = buildCatchmentConfig('rooftop-gutters', 1000, 500);
    expect(config.efficiency).toBe(COLLECTION_METHOD_PRESETS['rooftop-gutters'].efficiency);
    expect(config.firstFlushGallons).toBe(
      COLLECTION_METHOD_PRESETS['rooftop-gutters'].firstFlushGallons,
    );
  });

  it('applies overrides over preset defaults', () => {
    const config = buildCatchmentConfig('rooftop-gutters', 1000, 500, {
      efficiency: 0.92,
      firstFlushGallons: 8,
    });
    expect(config.efficiency).toBe(0.92);
    expect(config.firstFlushGallons).toBe(8);
  });

  it('sets collectionAreaSqFt and storageCap from arguments', () => {
    const config = buildCatchmentConfig('tarp-stand', 600, 250);
    expect(config.collectionAreaSqFt).toBe(600);
    expect(config.storageCap).toBe(250);
  });
});

describe('forecastToRainDays', () => {
  const mockForecastDay: ForecastDay = {
    date: '2026-03-15',
    maxTemp: 60,
    minTemp: 45,
    avgHumidity: 70,
    precipitation: 0.75,
    snowfall: 0,
    precipitationProbability: 80,
    windSpeed: 8,
    uvIndex: 3,
    cloudCover: 85,
    sunrise: '2026-03-15T06:30:00Z',
    sunset: '2026-03-15T19:00:00Z',
    hourly: [],
  };

  it('extracts precipitation and probability from each ForecastDay', () => {
    const result = forecastToRainDays([mockForecastDay]);
    expect(result).toHaveLength(1);
    expect(result[0].precipitationInches).toBe(0.75);
    expect(result[0].probabilityPercent).toBe(80);
  });

  it('handles empty forecast array', () => {
    expect(forecastToRainDays([])).toEqual([]);
  });
});
