import { describe, it, expect } from 'vitest';
import { buildSystemState } from './systemState';
import type {
  CaloricTotals, WaterAutonomyResult, EnergyAutonomyResult, InventoryItem,
} from './types';
import type { Actuals } from '@/components/tools/caloric-security/ActualsInput';
import type { ForecastDay } from '@/lib/weatherTypes';
import type { FrostDatesRow } from './db';

// ============================================================
// Fixtures
// ============================================================

const emptyActuals: Actuals = {
  storedGallons:          0,
  irrigationDailyGallons: 0,
  currentBatteryPct:      80,
};

function makeForecast(precip: number[]): ForecastDay[] {
  // systemState only reads .precipitation — fill the rest with shape-conforming filler
  return precip.map((p, i) => ({
    date: `2026-05-${String(15 + i).padStart(2, '0')}`,
    maxTemp: 70, minTemp: 50,
    avgHumidity: 50,
    precipitation: p,
    snowfall: 0,
    precipitationProbability: p > 0 ? 80 : 0,
    windSpeed: 5,
    uvIndex: 4,
    cloudCover: 20,
    sunrise: '06:00', sunset: '20:00',
    hourly: [],
  }));
}

function makeFrostDates(spring: string, fall: string): FrostDatesRow {
  return {
    id: 'singleton',
    zipCode: '00000',
    lastSpringFrost:           new Date(spring),
    lastSpringFrostConfidence: 0.9,
    firstFallFrost:            new Date(fall),
    firstFallFrostConfidence:  0.9,
    frostFreeDays:             167,
  };
}

const baseOpts = {
  caloricTotals: null as CaloricTotals | null,
  waterAutonomy: null as WaterAutonomyResult | null,
  energyAutonomy: null as EnergyAutonomyResult | null,
  inventory: [] as InventoryItem[],
  actuals: emptyActuals,
  forecastDays: [] as ForecastDay[],
  frostDates: null as FrostDatesRow | null,
};

// ============================================================
// Zero / null inputs
// ============================================================

describe('buildSystemState — null inputs', () => {
  it('returns zeroed state when all clock data is null', () => {
    const state = buildSystemState(baseOpts);
    expect(state.food.days_of_supply).toBe(0);
    expect(state.water.days_of_supply).toBe(0);
    expect(state.energy.days_of_supply).toBe(0);
    expect(state.energy.surplus_pct).toBe(0);
    expect(state.weather.precip_forecast_14d).toBe(0);
    expect(state.weather.dry_days_ahead).toBe(0);
    expect(state.calendar.days_to_last_frost).toBeNull();
    expect(state.calendar.seedling_deadline_days).toBeNull();
  });

  it('uses MVP inventory defaults', () => {
    const state = buildSystemState(baseOpts);
    expect(state.inventory.canning_jars).toBe(1);
    expect(state.inventory.seed_tomato).toBe(1);
    expect(state.inventory.dehydrator).toBe(false);
    expect(state.maintenance.filter_last_checked_days).toBe(7);
  });
});

// ============================================================
// Caloric / water / energy mapping
// ============================================================

describe('buildSystemState — clock mapping', () => {
  it('maps caloric totals to food.days_of_supply', () => {
    const caloricTotals = { daysOfFood: 23.5 } as CaloricTotals;
    const state = buildSystemState({ ...baseOpts, caloricTotals });
    expect(state.food.days_of_supply).toBe(23.5);
  });

  it('maps water autonomy to water fields and computes unexplained_draw', () => {
    const waterAutonomy = {
      daysOfWater: 14,
      dailyTotalNeed: 25,
      dailyHouseholdNeed: 15,
    } as WaterAutonomyResult;
    const state = buildSystemState({ ...baseOpts, waterAutonomy });
    expect(state.water.days_of_supply).toBe(14);
    expect(state.water.daily_total).toBe(25);
    expect(state.water.daily_household).toBe(15);
    expect(state.water.unexplained_draw).toBe(10);
  });

  it('clamps unexplained_draw at zero when household exceeds total', () => {
    const waterAutonomy = {
      daysOfWater: 14, dailyTotalNeed: 10, dailyHouseholdNeed: 20,
    } as WaterAutonomyResult;
    const state = buildSystemState({ ...baseOpts, waterAutonomy });
    expect(state.water.unexplained_draw).toBe(0);
  });

  it('computes surplus_pct as (avg solar / daily draw) × 100', () => {
    const energyAutonomy = {
      daysOfEnergy: 7, dailyDrawWh: 1000, projectedSolarWh: 8400, averageDailySolarWh: 1200,
    } as EnergyAutonomyResult;
    const state = buildSystemState({ ...baseOpts, energyAutonomy });
    expect(state.energy.surplus_pct).toBe(120);
  });

  it('surplus_pct is 0 when daily draw is 0 (avoid divide-by-zero)', () => {
    const energyAutonomy = {
      daysOfEnergy: 0, dailyDrawWh: 0, projectedSolarWh: 0, averageDailySolarWh: 0,
    } as EnergyAutonomyResult;
    const state = buildSystemState({ ...baseOpts, energyAutonomy });
    expect(state.energy.surplus_pct).toBe(0);
  });

  it('battery_pct is sourced from actuals, not from energy autonomy', () => {
    const actuals: Actuals = { currentBatteryPct: 42, storedGallons: 0, irrigationDailyGallons: 0 };
    const state = buildSystemState({ ...baseOpts, actuals });
    expect(state.energy.battery_pct).toBe(42);
  });
});

// ============================================================
// Weather aggregation
// ============================================================

describe('buildSystemState — weather', () => {
  it('sums 14 days of precipitation', () => {
    const forecastDays = makeForecast([0.1, 0.2, 0.0, 0.3, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);
    const state = buildSystemState({ ...baseOpts, forecastDays });
    expect(state.weather.precip_forecast_14d).toBeCloseTo(1.1, 5);
  });

  it('ignores forecast days beyond day 14', () => {
    const forecastDays = makeForecast([...Array(14).fill(0.1), 5.0, 5.0]);
    const state = buildSystemState({ ...baseOpts, forecastDays });
    expect(state.weather.precip_forecast_14d).toBeCloseTo(1.4, 5);
  });

  it('counts consecutive dry days from today, breaking on first wet day', () => {
    const forecastDays = makeForecast([0.0, 0.0, 0.0, 0.5, 0.0]);
    const state = buildSystemState({ ...baseOpts, forecastDays });
    expect(state.weather.dry_days_ahead).toBe(3);
  });

  it('treats precipitation < 0.05 as dry', () => {
    const forecastDays = makeForecast([0.01, 0.02, 0.05, 0.0]);
    // first two days are < 0.05 (dry), third is 0.05 (wet) → break
    const state = buildSystemState({ ...baseOpts, forecastDays });
    expect(state.weather.dry_days_ahead).toBe(2);
  });
});

// ============================================================
// Calendar / frost computation
// ============================================================

describe('buildSystemState — calendar', () => {
  it('computes days_to_last_frost from frostDates row', () => {
    // Anchor both dates in UTC — bare 'YYYY-MM-DD' strings parse as UTC midnight
    const now = new Date('2026-04-01T00:00:00Z');
    const frostDates = makeFrostDates('2026-05-01', '2026-10-15');
    const state = buildSystemState({ ...baseOpts, frostDates, now });
    expect(state.calendar.days_to_last_frost).toBe(30);
  });

  it('sets seedling_deadline = days_to_frost - 42 when frost is more than 42 days out', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const frostDates = makeFrostDates('2026-05-01', '2026-10-15');
    const state = buildSystemState({ ...baseOpts, frostDates, now });
    expect(state.calendar.days_to_last_frost).toBe(120);
    expect(state.calendar.seedling_deadline_days).toBe(78);
  });

  it('leaves seedling_deadline null when frost is within 42 days (too late to start)', () => {
    const now = new Date('2026-04-15T00:00:00Z');
    const frostDates = makeFrostDates('2026-05-01', '2026-10-15');
    const state = buildSystemState({ ...baseOpts, frostDates, now });
    expect(state.calendar.days_to_last_frost).toBe(16);
    expect(state.calendar.seedling_deadline_days).toBeNull();
  });

  it('returns null calendar fields when no frostDates row is present', () => {
    const state = buildSystemState(baseOpts);
    expect(state.calendar.days_to_last_frost).toBeNull();
    expect(state.calendar.seedling_deadline_days).toBeNull();
  });
});

// ============================================================
// Inventory-derived fields
// ============================================================

describe('buildSystemState — inventory-derived fields', () => {
  it('reports zero upcoming harvests for empty inventory', () => {
    const state = buildSystemState(baseOpts);
    expect(state.inventory.upcoming_harvests).toBe(0);
    expect(state.inventory.critical_decay_items).toBe(0);
    expect(state.inventory.food_to_dehydrate).toBe(0);
  });

  it('counts active items with expectedHarvestDate within 7 days', () => {
    const now = new Date('2026-05-14T12:00:00');
    const inventory: InventoryItem[] = [
      // within window
      { id: '1', cropId: 'tomato', type: 'crop', plantCount: 4, status: 'active',
        expectedHarvestDate: new Date('2026-05-18'), lastUpdated: now },
      // outside window
      { id: '2', cropId: 'pepper', type: 'crop', plantCount: 4, status: 'active',
        expectedHarvestDate: new Date('2026-06-20'), lastUpdated: now },
      // stored — should be excluded regardless of date
      { id: '3', cropId: 'lettuce', type: 'crop', plantCount: 4, status: 'stored',
        expectedHarvestDate: new Date('2026-05-15'), lastUpdated: now },
    ];
    const state = buildSystemState({ ...baseOpts, inventory, now });
    expect(state.inventory.upcoming_harvests).toBe(1);
  });

  it('excludes past harvest dates from upcoming_harvests', () => {
    const now = new Date('2026-05-14T12:00:00');
    const inventory: InventoryItem[] = [
      { id: '1', cropId: 'tomato', type: 'crop', plantCount: 4, status: 'active',
        expectedHarvestDate: new Date('2026-05-01'), lastUpdated: now },
    ];
    const state = buildSystemState({ ...baseOpts, inventory, now });
    expect(state.inventory.upcoming_harvests).toBe(0);
  });
});
