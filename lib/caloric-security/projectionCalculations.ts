import { getCropById } from '@/lib/tools/planting-calendar/cropLoader';
import { calculateItemDecay } from './decayCalculations';
import { calculateCropYield, getDailyCalorieTarget } from './yieldCalculations';
import type { HomesteadConfig, InventoryItem } from './types';

// ============================================================
// Harvest Contribution Projection
//
// Estimates how many food days will be added when active/planned
// crops in inventory reach their expectedHarvestDate.
//
// Only items with expectedHarvestDate set are included — items
// without it are excluded from projections rather than guessed.
// ============================================================

export interface HarvestContribution {
  foodDays:           number;        // projected additional food days from upcoming harvests
  nearestHarvestDays: number | null; // days until the nearest upcoming harvest
  harvestCount:       number;        // number of crops contributing to projection
}

export function estimateHarvestContribution(
  inventory: InventoryItem[],
  config:    HomesteadConfig,
  now:       Date = new Date(),
): HarvestContribution {
  const dailyTarget = getDailyCalorieTarget(config.householdSize);
  if (dailyTarget <= 0) return { foodDays: 0, nearestHarvestDays: null, harvestCount: 0 };

  let totalProjectedKcal = 0;
  let nearestMs: number | null = null;
  let harvestCount = 0;

  const seedRetentionMod = 1 - Math.min(0.3, (config.seedSavingPct ?? 0) / 100);
  const effectiveSkill   = config.skillLevel * seedRetentionMod;

  for (const item of inventory) {
    if (item.type !== 'crop') continue;
    if (item.status === 'stored') continue;               // already in stores
    if (!item.expectedHarvestDate) continue;              // no estimate available

    const harvestDate = new Date(item.expectedHarvestDate);
    if (harvestDate <= now) continue;                     // past harvest not projected

    const crop = getCropById(item.cropId);
    if (!crop) continue;

    const result = calculateCropYield(crop, item.plantCount, effectiveSkill);
    if (!result) continue;

    // Weight-based override for items that already have a weightLbs set
    // (unusual on planned items, but handle gracefully)
    let projectedKcal = result.totalKcal;
    if (item.weightLbs != null && item.weightLbs > 0 && crop.yield?.caloriesPer100g) {
      projectedKcal = crop.yield.caloriesPer100g * (item.weightLbs * 453.592 / 100);
    }

    totalProjectedKcal += projectedKcal;
    harvestCount++;

    const msUntilHarvest = harvestDate.getTime() - now.getTime();
    if (nearestMs === null || msUntilHarvest < nearestMs) {
      nearestMs = msUntilHarvest;
    }
  }

  const nearestHarvestDays = nearestMs !== null
    ? Math.ceil(nearestMs / (1000 * 60 * 60 * 24))
    : null;

  return {
    foodDays:    dailyTarget > 0 ? totalProjectedKcal / dailyTarget : 0,
    nearestHarvestDays,
    harvestCount,
  };
}

// ============================================================
// Forward Food Day Projection
//
// Estimates the food clock value `daysAhead` days from now by
// advancing the decay model forward for all stored items.
// Used purely for trend direction — cheap, no new data needed.
// ============================================================

export function projectFoodDays(
  inventory: InventoryItem[],
  config:    HomesteadConfig,
  daysAhead: number,
  now:       Date = new Date(),
): number {
  const dailyTarget = getDailyCalorieTarget(config.householdSize);
  if (dailyTarget <= 0) return 0;

  const futureNow = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const seedRetentionMod = 1 - Math.min(0.3, (config.seedSavingPct ?? 0) / 100);

  let totalKcal = 0;

  for (const item of inventory) {
    if (item.type !== 'crop') continue;

    const crop = getCropById(item.cropId);
    if (!crop) continue;

    const effectiveSkill = item.status === 'stored'
      ? 1.0
      : config.skillLevel * seedRetentionMod;

    const result = calculateCropYield(crop, item.plantCount, effectiveSkill);
    if (!result) continue;

    let kcal = result.totalKcal;

    // Override with weight if available
    if (item.status === 'stored' && item.weightLbs != null && item.weightLbs > 0 && crop.yield?.caloriesPer100g) {
      kcal = crop.yield.caloriesPer100g * (item.weightLbs * 453.592 / 100);
    }

    // Apply decay at future time for stored items
    if (item.status === 'stored') {
      const decay = calculateItemDecay(item, crop, futureNow);
      kcal *= decay.modifier;
    }

    totalKcal += kcal;
  }

  return dailyTarget > 0 ? totalKcal / dailyTarget : 0;
}
