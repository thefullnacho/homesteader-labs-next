import { getCropById } from '@/lib/tools/planting-calendar/cropLoader';
import type { Crop } from '@/lib/tools/planting-calendar/types/index';
import { calculateItemDecay } from './decayCalculations';
import type {
  HomesteadConfig,
  InventoryItem,
  YieldResult,
  CaloricTotals,
  UnitNormalization,
} from './types';

// ============================================================
// Unit normalization lookup
// lbs and oz are standard conversions.
// bunches / heads / bulbs / ears use documented assumptions
// that must be surfaced to the user in the UI (assumption !== null).
// ============================================================

export const UNIT_NORMALIZATIONS: Record<string, UnitNormalization> = {
  lbs:     { gramsPerUnit: 453.592, assumption: null },
  oz:      { gramsPerUnit: 28.3495, assumption: null },
  bunches: { gramsPerUnit: 100,     assumption: '~100g per bunch (cilantro, dill, chives, lavender)' },
  heads:   { gramsPerUnit: 300,     assumption: '~300g per head' },
  bulbs:   { gramsPerUnit: 40,      assumption: '~40g per bulb (garlic)' },
  ears:    { gramsPerUnit: 90,      assumption: '~90g edible yield per ear (corn)' },
};

// ============================================================
// Dynamic caloric need
// 2000 kcal baseline (sedentary/standard).
// Winter cold and heavy labor push daily need to 3000–3500 kcal.
// ============================================================

export const DAILY_KCAL_PER_PERSON: Record<string, number> = {
  standard: 2000,
  winter:   3000,
  labor:    3500,
};

export function getDailyCalorieTarget(
  householdSize: number,
  season: keyof typeof DAILY_KCAL_PER_PERSON = 'standard',
): number {
  return householdSize * DAILY_KCAL_PER_PERSON[season];
}

// ============================================================
// Per-crop yield calculation
//
// skillLevel is a coefficient applied to planned/active crops
// (0.6 Novice → 1.0 Expert). Pass 1.0 for stored inventory
// because the yield has already been realised.
// ============================================================

export function calculateCropYield(
  crop: Crop,
  plantCount: number,
  skillLevel: number,
): YieldResult | null {
  const y = crop.yield;
  if (!y) return null;

  // Exclude medicinal/companion plants from food math
  if (y['non-caloric'] === true) return null;

  const norm = UNIT_NORMALIZATIONS[y.unit];
  if (!norm) return null;

  const gramsPerPlant = y.avgPerPlant * norm.gramsPerUnit * skillLevel;
  const per100gFactor  = gramsPerPlant / 100;

  const totalKcal = y.caloriesPer100g * per100gFactor * plantCount;

  return {
    cropId:          crop.id,
    cropName:        crop.name,
    plantCount,
    kcalPerPlant:    y.caloriesPer100g * per100gFactor,
    totalKcal,
    effectiveKcal:   totalKcal,   // caller applies decay modifier for stored items
    decayModifier:   1.0,
    totalGrams:      gramsPerPlant * plantCount,
    unit:            y.unit,
    gramsPerUnit:    norm.gramsPerUnit,
    unitAssumption:  norm.assumption,
    macros: {
      proteinG: (y.proteinPer100g ?? 0) * per100gFactor * plantCount,
      carbsG:   (y.carbsPer100g   ?? 0) * per100gFactor * plantCount,
      fatG:     (y.fatPer100g     ?? 0) * per100gFactor * plantCount,
    },
  };
}

// ============================================================
// Full inventory aggregation
//
// Processes all crop-type InventoryItems and returns caloric
// totals including days-of-food at the given household size.
//
// skillLevel is applied to 'planned' and 'active' items only.
// 'stored' items represent actual harvested yield — no modifier.
// ============================================================

export function calculateTotalCalories(
  items: InventoryItem[],
  config: HomesteadConfig,
  season: keyof typeof DAILY_KCAL_PER_PERSON = 'standard',
): CaloricTotals {
  const breakdown: YieldResult[] = [];
  const skippedNonCaloric: string[] = [];
  const byCategory: Record<string, number> = {};

  let totalKcal     = 0;
  let totalProteinG = 0;
  let totalCarbsG   = 0;
  let totalFatG     = 0;

  for (const item of items) {
    if (item.type !== 'crop') continue;

    const crop = getCropById(item.cropId);
    if (!crop) continue;

    // Stored items: yield already realised, skill not applied
    const effectiveSkill = item.status === 'stored' ? 1.0 : config.skillLevel;

    const result = calculateCropYield(crop, item.plantCount, effectiveSkill);

    if (!result) {
      // null means either non-caloric or unknown unit — track it
      skippedNonCaloric.push(item.cropId);
      continue;
    }

    // Apply decay to stored items; planned/active get modifier 1.0
    if (item.status === 'stored') {
      const decay = calculateItemDecay(item, crop);
      result.decayModifier  = decay.modifier;
      result.effectiveKcal  = result.totalKcal * decay.modifier;
    }

    breakdown.push(result);
    totalKcal     += result.effectiveKcal;
    totalProteinG += result.macros.proteinG * result.decayModifier;
    totalCarbsG   += result.macros.carbsG   * result.decayModifier;
    totalFatG     += result.macros.fatG     * result.decayModifier;

    byCategory[crop.category] = (byCategory[crop.category] ?? 0) + result.effectiveKcal;
  }

  const dailyTarget = getDailyCalorieTarget(config.householdSize, season);

  return {
    totalKcal,
    totalProteinG,
    totalCarbsG,
    totalFatG,
    daysOfFood:         dailyTarget > 0 ? totalKcal / dailyTarget : 0,
    byCategory,
    cropBreakdown:      breakdown,
    skippedNonCaloric,
  };
}
