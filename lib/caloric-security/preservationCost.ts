import type { InventoryItem } from './types';

// ============================================================
// Preservation cost profiles
//
// Each method has an energy cost (watt-hours) and water cost
// (gallons) per batch. Batch is defined per method below.
//
// Sources / assumptions:
//   canned    — pressure canner 800W × 90 min + heat-up = ~1400 Wh;
//               ~3 gal fill + 1 gal rinse = 4 gal per batch of 7 quarts
//   dehydrated — food dehydrator 600W × 8 hr average = 4800 Wh;
//               minimal water: ~0.5 gal rinse per tray load
//   frozen    — chest freezer adds ~150 Wh per new load (door-open penalty);
//               ongoing cost is separate (see energyAutonomy, not modeled here);
//               water: trace rinse ~0.25 gal
//   cold-storage — passive (root cellar, cool pantry); no energy, no water
//   fresh     — no processing; no energy, no water
//
// All figures are conservative homestead estimates, not commercial.
// UI should surface the assumption so users can override.
// ============================================================

export interface PreservationCostProfile {
  method:           string;
  label:            string;
  wattHoursPerBatch: number;
  gallonsPerBatch:  number;
  batchDescription: string;  // what counts as one "batch" — shown in UI
  assumption:       string;  // surfaced in UI so users understand the model
}

export const PRESERVATION_COST_PROFILES: Record<
  InventoryItem['preservationMethod'] & string,
  PreservationCostProfile
> = {
  canned: {
    method:            'canned',
    label:             'Pressure Canning',
    wattHoursPerBatch: 1400,
    gallonsPerBatch:   4,
    batchDescription:  '7-quart canner load (~14 lb produce)',
    assumption:
      '800W pressure canner, ~90 min processing + heat-up ≈ 1400 Wh. ' +
      '3 gal fill water + 1 gal prep rinse = 4 gal per batch.',
  },
  dehydrated: {
    method:            'dehydrated',
    label:             'Dehydrating',
    wattHoursPerBatch: 4800,
    gallonsPerBatch:   0.5,
    batchDescription:  'Full dehydrator load (~5 trays)',
    assumption:
      '600W dehydrator, ~8 hr average run = 4800 Wh. ' +
      '~0.5 gal rinse water per load.',
  },
  frozen: {
    method:            'frozen',
    label:             'Freezing',
    wattHoursPerBatch: 150,
    gallonsPerBatch:   0.25,
    batchDescription:  'Single freezer load (~10 lb produce)',
    assumption:
      '~150 Wh door-open penalty per new load added to chest freezer. ' +
      'Ongoing freeze energy is tracked in energy autonomy, not here. ' +
      '~0.25 gal rinse water per load.',
  },
  'cold-storage': {
    method:            'cold-storage',
    label:             'Cold Storage / Root Cellar',
    wattHoursPerBatch: 0,
    gallonsPerBatch:   0,
    batchDescription:  'Any amount placed in root cellar or cool pantry',
    assumption:
      'Passive storage — no energy cost. No water processing required.',
  },
  fresh: {
    method:            'fresh',
    label:             'Fresh (no processing)',
    wattHoursPerBatch: 0,
    gallonsPerBatch:   0,
    batchDescription:  'No preservation applied',
    assumption:        'No energy or water cost for fresh storage.',
  },
};

// ============================================================
// Batch count estimator
//
// Converts a lbs-equivalent produce weight into a batch count
// for the given method. Used by the Canning Day trigger to
// estimate the total resource cost before recommending.
//
// Batch sizes (lbs of produce per batch):
//   canned      — 14 lb (7-quart load, ~2 lb per quart)
//   dehydrated  — 10 lb (5 trays × 2 lb per tray)
//   frozen      — 10 lb (defined above)
//   cold-storage / fresh — 1 batch covers any quantity (no processing)
// ============================================================

export const PRODUCE_LBS_PER_BATCH: Record<string, number> = {
  canned:       14,
  dehydrated:   10,
  frozen:       10,
  'cold-storage': Infinity,  // one "batch" regardless of quantity
  fresh:          Infinity,
};

export function estimateBatchCount(
  produceLbs: number,
  method: string,
): number {
  const lbsPerBatch = PRODUCE_LBS_PER_BATCH[method];
  if (!lbsPerBatch || lbsPerBatch === Infinity) return 1;
  return Math.ceil(produceLbs / lbsPerBatch);
}

// ============================================================
// Cost calculator
//
// Returns the total energy (watt-hours) and water (gallons)
// required to preserve a given amount of produce.
//
// produceLbs: weight of the produce to be preserved
// method:     preservation method key
// ============================================================

export interface PreservationCostResult {
  method:           string;
  label:            string;
  produceLbs:       number;
  batchCount:       number;
  totalWattHours:   number;
  totalGallons:     number;
  profile:          PreservationCostProfile;
}

export function calculatePreservationCost(
  produceLbs: number,
  method: InventoryItem['preservationMethod'],
): PreservationCostResult {
  const key    = method ?? 'fresh';
  const profile = PRESERVATION_COST_PROFILES[key] ?? PRESERVATION_COST_PROFILES['fresh'];
  const batchCount = estimateBatchCount(produceLbs, key);

  return {
    method:         key,
    label:          profile.label,
    produceLbs,
    batchCount,
    totalWattHours: profile.wattHoursPerBatch * batchCount,
    totalGallons:   profile.gallonsPerBatch   * batchCount,
    profile,
  };
}

// ============================================================
// Autonomy impact
//
// Converts watt-hours into a days-of-energy deduction and
// gallons into a days-of-water deduction, given the current
// autonomy rates.
//
// Used by the Canning Day trigger to show the user:
// "This canning session will cost X days of energy and Y days
//  of water."
// ============================================================

export interface AutonomyImpact {
  energyDaysDeducted: number;   // fractional days of energy autonomy consumed
  waterDaysDeducted:  number;   // fractional days of water autonomy consumed
}

export function calculateAutonomyImpact(
  cost: PreservationCostResult,
  dailyWattHours: number,      // current household daily energy draw (Wh/day)
  dailyWaterGallons: number,   // current household daily water need (gal/day)
): AutonomyImpact {
  return {
    energyDaysDeducted: dailyWattHours    > 0 ? cost.totalWattHours / dailyWattHours    : 0,
    waterDaysDeducted:  dailyWaterGallons > 0 ? cost.totalGallons   / dailyWaterGallons : 0,
  };
}
