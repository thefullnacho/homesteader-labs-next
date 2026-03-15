'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { getDB } from './db';
import { calculateTotalCalories } from './yieldCalculations';
import { calculateWaterAutonomy } from './waterAutonomy';
import { forecastToRainDays } from './catchmentConfig';
import { calculateEnergyAutonomy, forecastToSolarDays } from './energyAutonomy';

import type { HomesteadConfig, InventoryItem, CaloricTotals, WaterAutonomyResult, EnergyAutonomyResult } from './types';
import type { ForecastDay } from '@/lib/weatherTypes';

// ============================================================
// useSurvivalData
//
// Single hook that provides all three survival clock inputs.
// Re-renders automatically whenever config or inventory changes
// (Dexie useLiveQuery handles the subscription).
//
// forecastDays and storedGallons come from outside IndexedDB
// (weather API and user actuals input respectively) so they
// are passed in as arguments rather than read from the store.
//
// Returns:
//   config          — HomesteadConfig or null (not yet set up)
//   inventory       — current InventoryItem[]
//   caloricTotals   — computed Days of Food result
//   waterAutonomy   — computed Days of Water result
//   isLoading       — true on first render before Dexie resolves
//   isFirstRun      — true when no config has been saved yet
// ============================================================

export interface SurvivalData {
  config:          HomesteadConfig | null;
  inventory:       InventoryItem[];
  caloricTotals:   CaloricTotals       | null;
  waterAutonomy:   WaterAutonomyResult | null;
  energyAutonomy:  EnergyAutonomyResult | null;
  isLoading:       boolean;
  isFirstRun:      boolean;
}

export function useSurvivalData(opts: {
  storedGallons:          number;
  currentBatteryPct?:     number;
  forecastDays?:          ForecastDay[];
  irrigationDailyGallons?: number;
  season?:                'standard' | 'winter' | 'labor';
}): SurvivalData {
  const { storedGallons, currentBatteryPct = 100, forecastDays = [], irrigationDailyGallons, season = 'standard' } = opts;

  const result = useLiveQuery(async () => {
    const db = getDB();

    const [configRow, inventory] = await Promise.all([
      db.config.get('singleton'),
      db.inventory.toArray(),
    ]);

    if (!configRow) {
      return { config: null, inventory, caloricTotals: null, waterAutonomy: null, energyAutonomy: null, isFirstRun: true };
    }

    const config: HomesteadConfig = {
      householdSize:  configRow.householdSize,
      skillLevel:     configRow.skillLevel,
      seedSavingPct:  configRow.seedSavingPct ?? 0,
      waterCatchment: configRow.waterCatchment,
      energy:         configRow.energy,
    };

    // Days of Food
    const caloricTotals = calculateTotalCalories(inventory, config, season);

    // Days of Water
    const rainDays = forecastDays.length > 0 ? forecastToRainDays(forecastDays) : [];
    const waterAutonomy = calculateWaterAutonomy({
      storedGallons,
      householdSize:         config.householdSize,
      catchment:             config.waterCatchment,
      forecastDays:          rainDays,
      irrigationDailyGallons,
    });

    // Days of Energy
    const solarDays = forecastDays.length > 0 ? forecastToSolarDays(forecastDays) : [];
    const energyAutonomy = calculateEnergyAutonomy({
      batteryCapacityAh: config.energy.batteryCapacityAh,
      solarArrayWatts:   config.energy.solarArrayWatts,
      baseloadWatts:     config.energy.baseloadWatts,
      forecastSolarDays: solarDays,
      currentBatteryPct,
    });

    return { config, inventory, caloricTotals, waterAutonomy, energyAutonomy, isFirstRun: false };
  });

  if (result === undefined) {
    return {
      config:         null,
      inventory:      [],
      caloricTotals:  null,
      waterAutonomy:  null,
      energyAutonomy: null,
      isLoading:      true,
      isFirstRun:     false,
    };
  }

  return { ...result, isLoading: false };
}
