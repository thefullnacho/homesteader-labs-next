import type {
  WaterAutonomyInput,
  WaterAutonomyResult,
  CatchmentConfig,
  ForecastRainDay,
} from './types';

// ============================================================
// Constants
// ============================================================

// Physics: 1 inch of rain over 1 sq ft of collection area = 0.623 gallons
// Derivation: (1/12 ft) × 1 ft² = 0.0833 ft³ × 7.48 gal/ft³ = 0.623 gal
export const GALLONS_PER_INCH_PER_SQFT = 0.623;

// Household water need: drinking, cooking, basic sanitation
// Does NOT include irrigation — that is tracked separately.
export const DAILY_HOUSEHOLD_GALLONS_PER_PERSON = 1;

// ============================================================
// Daily water need
// ============================================================

export function getDailyHouseholdNeed(householdSize: number): number {
  return householdSize * DAILY_HOUSEHOLD_GALLONS_PER_PERSON;
}

export function getDailyTotalNeed(
  householdSize: number,
  irrigationDailyGallons = 0,
): number {
  return getDailyHouseholdNeed(householdSize) + irrigationDailyGallons;
}

// ============================================================
// Projected inflow from forecast
//
// Uses expected-value math: each day's contribution is
// precipitation × (probability / 100). This is honest —
// a 50% chance of 2 inches contributes 1 expected inch,
// not the full 2.
//
// Inflow is capped at remaining tank capacity so the clock
// never over-projects based on a full tank.
// ============================================================

export function calculateExpectedRainGallons(
  forecastDays: ForecastRainDay[],
  catchment: CatchmentConfig,
  currentStored: number,
): number {
  const remainingCapacity = Math.max(0, catchment.storageCap - currentStored);
  let totalInflow = 0;

  for (const day of forecastDays) {
    const p = day.probabilityPercent / 100;

    const rawGallons =
      day.precipitationInches * catchment.collectionAreaSqFt * GALLONS_PER_INCH_PER_SQFT * catchment.efficiency * p;

    // First-flush is also probability-weighted: if there's only a 50% chance
    // of rain, the expected first-flush loss is also 50% of the fixed volume.
    // Skip first-flush on trace rain (< 0.05 inches) — not worth diverting.
    const firstFlushLoss = day.precipitationInches > 0.05 ? catchment.firstFlushGallons * p : 0;
    const netGallons = Math.max(0, rawGallons - firstFlushLoss);

    totalInflow += netGallons;
  }

  // Cannot collect more than the tank can hold
  return Math.min(totalInflow, remainingCapacity);
}

// ============================================================
// Main autonomy calculation
//
// If catchment is not configured: clock shows stored-only,
// confidence is 'low', and irrigationTracked is false.
//
// Confidence:
//   high   — catchment configured + forecast available
//   medium — catchment configured, no forecast
//   low    — no catchment config, stored-only reading
// ============================================================

export function calculateWaterAutonomy(input: WaterAutonomyInput): WaterAutonomyResult {
  const {
    storedGallons,
    householdSize,
    catchment,
    forecastDays = [],
    irrigationDailyGallons,
  } = input;

  const dailyHouseholdNeed = getDailyHouseholdNeed(householdSize);
  const dailyTotalNeed     = getDailyTotalNeed(householdSize, irrigationDailyGallons);
  const irrigationTracked  = irrigationDailyGallons !== undefined && irrigationDailyGallons > 0;

  // Current supply only — no forecast
  const currentSupplyDays =
    dailyTotalNeed > 0 ? storedGallons / dailyTotalNeed : 0;

  // Projected inflow from catchment + forecast
  const projectedInflowGallons =
    catchment && forecastDays.length > 0
      ? calculateExpectedRainGallons(forecastDays, catchment, storedGallons)
      : 0;

  const totalAvailableGallons = storedGallons + projectedInflowGallons;
  const daysOfWater =
    dailyTotalNeed > 0 ? totalAvailableGallons / dailyTotalNeed : 0;

  let confidence: WaterAutonomyResult['confidence'];
  if (catchment && forecastDays.length > 0) {
    confidence = 'high';
  } else if (catchment) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    daysOfWater,
    currentSupplyDays,
    projectedInflowGallons,
    dailyHouseholdNeed,
    dailyTotalNeed,
    confidence,
    irrigationTracked,
  };
}
