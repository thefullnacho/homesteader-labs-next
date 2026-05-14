// ============================================================
// buildSystemState
//
// Maps live SurvivalData (three clocks + inventory) plus
// actuals, forecastDays, and frostDates into a flat
// SystemState object that preconditions can be evaluated
// against using dot-path field names.
// ============================================================

import { calculateItemDecay } from './decayCalculations';
import { getCropById } from '@/lib/tools/planting-calendar/cropLoader';
import type { CaloricTotals, WaterAutonomyResult, EnergyAutonomyResult, InventoryItem } from './types';
import type { FrostDatesRow } from './db';
import type { Actuals } from '@/components/tools/caloric-security/ActualsInput';
import type { ForecastDay } from '@/lib/weatherTypes';
import type { SystemState } from './actionTypes';

export function buildSystemState(opts: {
  caloricTotals:  CaloricTotals       | null;
  waterAutonomy:  WaterAutonomyResult | null;
  energyAutonomy: EnergyAutonomyResult | null;
  inventory:      InventoryItem[];
  actuals:        Actuals;
  forecastDays:   ForecastDay[];
  frostDates:     FrostDatesRow | null;
  now?:           Date;
}): SystemState {
  const {
    caloricTotals, waterAutonomy, energyAutonomy,
    inventory, actuals, forecastDays, frostDates,
  } = opts;
  const now = opts.now ?? new Date();

  // ── Food ─────────────────────────────────────────────────
  const foodDays = caloricTotals?.daysOfFood ?? 0;

  // ── Water ────────────────────────────────────────────────
  const waterDays      = waterAutonomy?.daysOfWater       ?? 0;
  const dailyTotal     = waterAutonomy?.dailyTotalNeed     ?? 0;
  const dailyHousehold = waterAutonomy?.dailyHouseholdNeed ?? 0;

  // ── Energy ───────────────────────────────────────────────
  const energyDays     = energyAutonomy?.daysOfEnergy         ?? 0;
  const dailyDraw      = energyAutonomy?.dailyDrawWh           ?? 0;
  const forecastSolar  = energyAutonomy?.projectedSolarWh      ?? 0;
  const avgDailySolar  = energyAutonomy?.averageDailySolarWh   ?? 0;
  // surplusPct: how much average daily solar covers daily draw (>100 = surplus)
  const surplusPct     = dailyDraw > 0 ? (avgDailySolar / dailyDraw) * 100 : 0;

  // ── Weather ──────────────────────────────────────────────
  const relevantDays = forecastDays.slice(0, 14);
  const precipTotal  = relevantDays.reduce((sum, d) => sum + (d.precipitation ?? 0), 0);

  let dryDaysAhead = 0;
  for (const d of relevantDays) {
    if ((d.precipitation ?? 0) >= 0.05) break;
    dryDaysAhead++;
  }

  // ── Calendar ─────────────────────────────────────────────
  let daysToLastFrost: number | null = null;
  let seedlingDeadline: number | null = null;

  if (frostDates?.lastSpringFrost) {
    const frost    = new Date(frostDates.lastSpringFrost);
    const msPerDay = 86_400_000;
    const diff     = Math.round((frost.getTime() - now.getTime()) / msPerDay);
    daysToLastFrost = diff;
    // Tomatoes need 6-8 weeks lead; use 42 days as the threshold
    if (diff > 42) seedlingDeadline = diff - 42;
  }

  // ── Inventory-derived fields ──────────────────────────────
  const upcomingHarvests = inventory.filter(i => {
    if (i.status !== 'active' && i.status !== 'planned') return false;
    if (!i.expectedHarvestDate) return false;
    const harvestDate = new Date(i.expectedHarvestDate);
    const daysUntil   = (harvestDate.getTime() - now.getTime()) / 86_400_000;
    return daysUntil >= 0 && daysUntil <= 7;
  }).length;

  const criticalDecayItems = inventory.filter(i => {
    if (i.status !== 'stored') return false;
    const crop  = getCropById(i.cropId);
    if (!crop) return false;
    const decay = calculateItemDecay(i, crop);
    return decay.daysRemaining < 7;
  }).length;

  // Items in early decline (10–90% value) — good candidates for dehydrating/canning
  const foodToDehydrate = inventory.filter(i => {
    if (i.status !== 'stored') return false;
    const crop  = getCropById(i.cropId);
    if (!crop) return false;
    const decay = calculateItemDecay(i, crop);
    return decay.modifier < 0.9 && decay.modifier > 0.1;
  }).length;

  return {
    food: {
      days_of_supply: foodDays,
    },
    water: {
      days_of_supply:   waterDays,
      daily_total:      dailyTotal,
      daily_household:  dailyHousehold,
      unexplained_draw: Math.max(0, dailyTotal - dailyHousehold),
    },
    energy: {
      days_of_supply: energyDays,
      surplus_pct:    surplusPct,
      battery_pct:    actuals.currentBatteryPct,
      forecast_solar: forecastSolar,
      daily_draw:     dailyDraw,
    },
    weather: {
      precip_forecast_14d: precipTotal,
      dry_days_ahead:      dryDaysAhead,
    },
    calendar: {
      days_to_last_frost:     daysToLastFrost,
      seedling_deadline_days: seedlingDeadline,
    },
    inventory: {
      canning_jars:          1,      // MVP default — assume jars available
      seed_tomato:           1,      // MVP default — assume seeds available
      seed_pepper:           1,      // MVP default
      seed_squash:           1,      // MVP default
      dehydrator:            false,  // MVP default — dehydrator actions suppressed
      food_to_dehydrate:     foodToDehydrate,
      upcoming_harvests:     upcomingHarvests,
      critical_decay_items:  criticalDecayItems,
    },
    maintenance: {
      filter_last_checked_days: 7,  // MVP default — surface weekly check always
    },
  };
}
