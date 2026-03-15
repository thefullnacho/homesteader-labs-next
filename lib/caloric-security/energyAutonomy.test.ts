import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SYSTEM_VOLTAGE_V,
  DEFAULT_DEPTH_OF_DISCHARGE,
  DEFAULT_SYSTEM_EFFICIENCY,
  PEAK_SUN_HOUR_CONVERSION,
  estimatePeakSunHours,
  forecastToSolarDays,
  calculateEnergyAutonomy,
} from './energyAutonomy';
import type { ForecastSolarDay, EnergyAutonomyInput } from './types';
import type { ForecastDay } from '@/lib/weatherTypes';

// ============================================================
// Fixtures
// ============================================================

const clearDay: ForecastDay = {
  date:                    '2026-03-15',
  maxTemp:                 65,
  minTemp:                 45,
  avgHumidity:             40,
  precipitation:           0,
  snowfall:                0,
  precipitationProbability: 5,
  windSpeed:               8,
  uvIndex:                 6,
  cloudCover:              0,      // perfectly clear
  sunrise:                 '2026-03-15T06:30:00Z',
  sunset:                  '2026-03-15T19:00:00Z',  // 12.5 hr day
  hourly:                  [],
};

const overcastDay: ForecastDay = {
  ...clearDay,
  date:       '2026-03-16',
  cloudCover: 100,   // fully overcast
};

const halfCloudDay: ForecastDay = {
  ...clearDay,
  date:       '2026-03-17',
  cloudCover: 50,
};

// 400 Ah @ 12V × 0.5 DoD = 2400 Wh usable
// 800 W array
// 200 W baseload = 4800 Wh/day
const baseInput: EnergyAutonomyInput = {
  batteryCapacityAh: 400,
  solarArrayWatts:   800,
  baseloadWatts:     200,
};

// Sunny 3-day forecast
const sunnySolarDays: ForecastSolarDay[] = [
  { date: '2026-03-15', peakSunHours: 3,   estimatedGenWh: 0 },
  { date: '2026-03-16', peakSunHours: 3.5, estimatedGenWh: 0 },
  { date: '2026-03-17', peakSunHours: 4,   estimatedGenWh: 0 },
];

// ============================================================
// estimatePeakSunHours
// ============================================================

describe('estimatePeakSunHours', () => {
  it('returns 0 for a fully overcast day', () => {
    expect(estimatePeakSunHours(overcastDay)).toBe(0);
  });

  it('returns max hours for a perfectly clear day', () => {
    // Day length = 12.5 hrs × 1.0 clear × 0.5 conversion = 3.125 hrs
    const dayLengthHrs = 12.5;
    const expected     = dayLengthHrs * 1.0 * PEAK_SUN_HOUR_CONVERSION;
    expect(estimatePeakSunHours(clearDay)).toBeCloseTo(expected, 2);
  });

  it('returns half max hours for 50% cloud cover', () => {
    const full = estimatePeakSunHours(clearDay);
    const half = estimatePeakSunHours(halfCloudDay);
    expect(half).toBeCloseTo(full / 2, 2);
  });

  it('returns 0 for invalid sunrise/sunset data', () => {
    const bad: ForecastDay = { ...clearDay, sunrise: 'invalid', sunset: 'invalid' };
    expect(estimatePeakSunHours(bad)).toBe(0);
  });

  it('is always non-negative', () => {
    expect(estimatePeakSunHours(clearDay)).toBeGreaterThanOrEqual(0);
    expect(estimatePeakSunHours(overcastDay)).toBeGreaterThanOrEqual(0);
    expect(estimatePeakSunHours(halfCloudDay)).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// forecastToSolarDays
// ============================================================

describe('forecastToSolarDays', () => {
  it('extracts date and peakSunHours from each ForecastDay', () => {
    const result = forecastToSolarDays([clearDay, overcastDay]);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-03-15');
    expect(result[0].peakSunHours).toBeGreaterThan(0);
    expect(result[1].peakSunHours).toBe(0);
  });

  it('sets estimatedGenWh to 0 (filled in by calculateEnergyAutonomy)', () => {
    const result = forecastToSolarDays([clearDay]);
    expect(result[0].estimatedGenWh).toBe(0);
  });

  it('handles empty forecast', () => {
    expect(forecastToSolarDays([])).toEqual([]);
  });
});

// ============================================================
// calculateEnergyAutonomy — battery-only (no solar)
// ============================================================

describe('calculateEnergyAutonomy — battery only', () => {
  it('days = stored usable / daily draw when no forecast', () => {
    // 400 Ah × 12V × 0.5 DoD = 2400 Wh usable
    // 200 W × 24 hr = 4800 Wh/day
    // 2400 / 4800 = 0.5 days
    const result = calculateEnergyAutonomy({ ...baseInput, solarArrayWatts: 0 });
    expect(result.currentSupplyDays).toBeCloseTo(0.5, 2);
    expect(result.daysOfEnergy).toBeCloseTo(0.5, 2);
  });

  it('confidence is low when no solar array configured', () => {
    const result = calculateEnergyAutonomy({ ...baseInput, solarArrayWatts: 0 });
    expect(result.confidence).toBe('low');
  });

  it('confidence is medium with solar array but no forecast', () => {
    const result = calculateEnergyAutonomy(baseInput);
    expect(result.confidence).toBe('medium');
  });

  it('storedUsableWh respects currentBatteryPct', () => {
    const full = calculateEnergyAutonomy({ ...baseInput, currentBatteryPct: 100 });
    const half = calculateEnergyAutonomy({ ...baseInput, currentBatteryPct: 50  });
    expect(half.storedUsableWh).toBeCloseTo(full.storedUsableWh / 2, 1);
  });

  it('currentSupplyDays is proportionally lower at 50% charge', () => {
    const full = calculateEnergyAutonomy({ ...baseInput, currentBatteryPct: 100 });
    const half = calculateEnergyAutonomy({ ...baseInput, currentBatteryPct: 50  });
    expect(half.currentSupplyDays).toBeCloseTo(full.currentSupplyDays / 2, 2);
  });

  it('returns 0 days when baseload is 0 — guard for division by zero', () => {
    const result = calculateEnergyAutonomy({ ...baseInput, baseloadWatts: 0 });
    expect(result.daysOfEnergy).toBe(0);
  });

  it('exposes correct batteryCapWh', () => {
    const result = calculateEnergyAutonomy(baseInput);
    // 400 Ah × 12V = 4800 Wh
    expect(result.batteryCapWh).toBeCloseTo(400 * DEFAULT_SYSTEM_VOLTAGE_V, 1);
  });
});

// ============================================================
// calculateEnergyAutonomy — with solar forecast
// ============================================================

describe('calculateEnergyAutonomy — with solar', () => {
  it('daysOfEnergy exceeds currentSupplyDays when forecast has sun', () => {
    const result = calculateEnergyAutonomy({
      ...baseInput,
      forecastSolarDays: sunnySolarDays,
    });
    expect(result.daysOfEnergy).toBeGreaterThan(result.currentSupplyDays);
  });

  it('confidence is high with solar array + forecast', () => {
    const result = calculateEnergyAutonomy({
      ...baseInput,
      forecastSolarDays: sunnySolarDays,
    });
    expect(result.confidence).toBe('high');
  });

  it('annotates each solar day with estimatedGenWh using array watts', () => {
    const result = calculateEnergyAutonomy({
      ...baseInput,
      solarArrayWatts:   800,
      systemEfficiency:  1.0,   // no derating to keep math simple
      forecastSolarDays: [{ date: '2026-03-15', peakSunHours: 5, estimatedGenWh: 0 }],
    });
    // 800 W × 5 hrs × 1.0 = 4000 Wh
    expect(result.forecastSolarDays[0].estimatedGenWh).toBeCloseTo(4000, 0);
  });

  it('projectedSolarWh scales proportionally with systemEfficiency', () => {
    // projectedSolarWh is total forecast generation (uncapped) — scales 1:1 with efficiency
    const full    = calculateEnergyAutonomy({ ...baseInput, systemEfficiency: 1.0, forecastSolarDays: sunnySolarDays });
    const derated = calculateEnergyAutonomy({ ...baseInput, systemEfficiency: 0.5, forecastSolarDays: sunnySolarDays });
    expect(derated.projectedSolarWh).toBeCloseTo(full.projectedSolarWh / 2, 0);
  });

  it('full battery still benefits from solar cycling — daysOfEnergy ≥ empty battery', () => {
    // A full battery (no usable stored Wh left to draw) still gains runtime from solar
    // offsetting the daily draw, so it should match or exceed an empty-battery scenario.
    const empty = calculateEnergyAutonomy({ ...baseInput, currentBatteryPct: 0,   forecastSolarDays: sunnySolarDays });
    const full  = calculateEnergyAutonomy({ ...baseInput, currentBatteryPct: 100, forecastSolarDays: sunnySolarDays });
    expect(full.daysOfEnergy).toBeGreaterThanOrEqual(empty.daysOfEnergy);
  });

  it('projectedSolarWh is 0 when forecast is empty', () => {
    const result = calculateEnergyAutonomy({ ...baseInput, forecastSolarDays: [] });
    expect(result.projectedSolarWh).toBe(0);
  });

  it('projectedSolarWh is never negative', () => {
    const result = calculateEnergyAutonomy({
      ...baseInput,
      forecastSolarDays: [{ date: '2026-03-15', peakSunHours: 0, estimatedGenWh: 0 }],
    });
    expect(result.projectedSolarWh).toBeGreaterThanOrEqual(0);
  });

  it('solarCoversBaseload is true when average generation meets draw', () => {
    // Need daily solar >= daily draw: 200W × 24 = 4800 Wh/day
    // 800W array × 7 peak hours × 0.85 = 4760 Wh... just under
    // Use 10 peak hours to ensure it covers
    const highSolar: ForecastSolarDay[] = [
      { date: '2026-03-15', peakSunHours: 10, estimatedGenWh: 0 },
    ];
    const result = calculateEnergyAutonomy({
      ...baseInput,
      solarArrayWatts:   1000,
      systemEfficiency:  1.0,
      forecastSolarDays: highSolar,
    });
    expect(result.solarCoversBaseload).toBe(true);
  });

  it('solarCoversBaseload is false when generation is insufficient', () => {
    const dimSolar: ForecastSolarDay[] = [
      { date: '2026-03-15', peakSunHours: 0.5, estimatedGenWh: 0 },
    ];
    const result = calculateEnergyAutonomy({
      ...baseInput, forecastSolarDays: dimSolar,
    });
    expect(result.solarCoversBaseload).toBe(false);
  });

  it('overcast forecast gives less projected solar than clear forecast', () => {
    const clear = forecastToSolarDays([clearDay]);
    const overcast = forecastToSolarDays([overcastDay]);
    const resultClear   = calculateEnergyAutonomy({ ...baseInput, forecastSolarDays: clear });
    const resultOvercast = calculateEnergyAutonomy({ ...baseInput, forecastSolarDays: overcast });
    expect(resultClear.projectedSolarWh).toBeGreaterThan(resultOvercast.projectedSolarWh);
  });
});

// ============================================================
// Physics constants integrity
// ============================================================

describe('constants', () => {
  it('DEFAULT_SYSTEM_VOLTAGE_V is 12', () => {
    expect(DEFAULT_SYSTEM_VOLTAGE_V).toBe(12);
  });

  it('DEFAULT_DEPTH_OF_DISCHARGE is between 0 and 1', () => {
    expect(DEFAULT_DEPTH_OF_DISCHARGE).toBeGreaterThan(0);
    expect(DEFAULT_DEPTH_OF_DISCHARGE).toBeLessThanOrEqual(1);
  });

  it('DEFAULT_SYSTEM_EFFICIENCY is between 0 and 1', () => {
    expect(DEFAULT_SYSTEM_EFFICIENCY).toBeGreaterThan(0);
    expect(DEFAULT_SYSTEM_EFFICIENCY).toBeLessThanOrEqual(1);
  });
});
