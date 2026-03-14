import type { Crop } from '@/lib/tools/planting-calendar/types/index';
import type { InventoryItem, DecayResult, DecayPhase } from './types';

// ============================================================
// Two-phase linear decay model
//
// Phase 1  (0% → 70% of shelf life elapsed):  modifier = 1.0
// Phase 2  (70% → 100% of shelf life elapsed): linear decay 1.0 → 0.0
// Beyond   (> 100%):                           modifier = 0.0
//
// This model is intentionally simple and auditable.
// The phase boundary and assumptions must be shown in the UI.
// ============================================================

export const DECAY_PHASE_THRESHOLD = 0.7;  // 70% of shelf life = full value
export const DAYS_PER_MONTH = 30.44;        // 365 / 12

// Maps user-facing preservationMethod to the preservation method keys
// used in crop JSON entries. First match wins.
const PRESERVATION_METHOD_MAP: Record<string, string[]> = {
  fresh:        [],                                       // use storageLifeDays
  canned:       ['canning', 'pickling', 'jam', 'fermentation'],
  dehydrated:   ['drying', 'dehydrating'],
  frozen:       ['freezing'],
  'cold-storage': ['cold-storage', 'root-cellar'],
};

// ============================================================
// Shelf life resolution
//
// For 'fresh' / undefined: uses crop.yield.storageLifeDays.
// For all other methods: finds the matching preservation entry
// and converts shelfLifeMonths to days. Falls back to
// storageLifeDays if no matching entry exists.
// ============================================================

export function getShelfLifeDays(
  crop: Crop,
  preservationMethod?: InventoryItem['preservationMethod'],
): number {
  const freshFallback = crop.yield?.storageLifeDays ?? 7;

  if (!preservationMethod || preservationMethod === 'fresh') {
    return freshFallback;
  }

  const matchKeys = PRESERVATION_METHOD_MAP[preservationMethod];
  if (!matchKeys || matchKeys.length === 0) return freshFallback;

  const entry = crop.preservation?.find(p => matchKeys.includes(p.method));
  if (!entry) return freshFallback;

  return Math.round(entry.shelfLifeMonths * DAYS_PER_MONTH);
}

// ============================================================
// Core decay modifier
//
// Pure function — takes shelf life and days elapsed, returns
// a 0.0–1.0 multiplier. No side effects, easy to test.
// ============================================================

export function calculateDecayModifier(
  shelfLifeDays: number,
  daysSinceHarvest: number,
): number {
  if (shelfLifeDays <= 0 || daysSinceHarvest < 0) return 1.0;

  const elapsed = daysSinceHarvest / shelfLifeDays;

  if (elapsed >= 1.0) return 0.0;
  if (elapsed <= DECAY_PHASE_THRESHOLD) return 1.0;

  // Phase 2: linear decay from 1.0 → 0.0
  const phaseProgress = (elapsed - DECAY_PHASE_THRESHOLD) / (1.0 - DECAY_PHASE_THRESHOLD);
  return Math.max(0, 1.0 - phaseProgress);
}

// ============================================================
// Full decay result for one inventory item
//
// Non-stored items (planned / active) and stored items without
// a dateHarvested return modifier = 1.0 — decay hasn't started.
// ============================================================

export function calculateItemDecay(
  item: InventoryItem,
  crop: Crop,
  now: Date = new Date(),
): DecayResult {
  const shelfLifeDays  = getShelfLifeDays(crop, item.preservationMethod);
  const methodLabel    = item.preservationMethod ?? 'fresh';

  // Decay only applies to stored items with a known harvest date
  if (item.status !== 'stored' || !item.dateHarvested) {
    return {
      modifier:           1.0,
      phase:              'fresh',
      daysRemaining:      shelfLifeDays,
      shelfLifeDays,
      preservationMethod: methodLabel,
    };
  }

  const daysSinceHarvest =
    (now.getTime() - item.dateHarvested.getTime()) / (1000 * 60 * 60 * 24);

  const modifier = calculateDecayModifier(shelfLifeDays, daysSinceHarvest);

  let phase: DecayPhase;
  if (modifier === 0) {
    phase = 'spoiled';
  } else if (daysSinceHarvest / shelfLifeDays <= DECAY_PHASE_THRESHOLD) {
    phase = 'fresh';
  } else {
    phase = 'declining';
  }

  return {
    modifier,
    phase,
    daysRemaining:      Math.max(0, shelfLifeDays - daysSinceHarvest),
    shelfLifeDays,
    preservationMethod: methodLabel,
  };
}
