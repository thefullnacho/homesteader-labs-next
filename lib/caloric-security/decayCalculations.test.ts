import { describe, it, expect } from 'vitest';
import {
  DECAY_PHASE_THRESHOLD,
  DAYS_PER_MONTH,
  getShelfLifeDays,
  calculateDecayModifier,
  calculateItemDecay,
} from './decayCalculations';
import type { Crop } from '@/lib/tools/planting-calendar/types/index';
import type { InventoryItem } from './types';

// ============================================================
// Fixtures
// ============================================================

const tomatoCrop: Crop = {
  id: 'tomato',
  name: 'Tomato',
  category: 'vegetable',
  icon: '🍅',
  varieties: [],
  startIndoors: 42,
  transplant: 14,
  directSow: null,
  daysToMaturity: 75,
  successionEnabled: false,
  successionInterval: 0,
  successionMax: 1,
  sun: 'full',
  spacing: '18-24"',
  notes: [],
  yield: {
    avgPerPlant: 10,
    unit: 'lbs',
    caloriesPer100g: 18,
    storageLifeDays: 7,
  },
  preservation: [
    { method: 'freezing',  shelfLifeMonths: 6,  notes: 'Blanch and freeze' },
    { method: 'canning',   shelfLifeMonths: 18, notes: 'Pressure can' },
  ],
};

const squashCrop: Crop = {
  id: 'squash-winter',
  name: 'Winter Squash',
  category: 'vegetable',
  icon: '🎃',
  varieties: [],
  startIndoors: null,
  transplant: null,
  directSow: 14,
  daysToMaturity: 100,
  successionEnabled: false,
  successionInterval: 0,
  successionMax: 1,
  sun: 'full',
  spacing: '48"',
  notes: [],
  yield: {
    avgPerPlant: 15,
    unit: 'lbs',
    caloriesPer100g: 45,
    storageLifeDays: 180,
  },
  preservation: [
    { method: 'root-cellar', shelfLifeMonths: 6,  notes: 'Cure 2 weeks then store' },
    { method: 'canning',     shelfLifeMonths: 18, notes: 'Pressure can cubed' },
  ],
};

const baseItem: InventoryItem = {
  id: 'inv-1',
  cropId: 'tomato',
  type: 'crop',
  plantCount: 5,
  status: 'stored',
  lastUpdated: new Date(),
};

// ============================================================
// getShelfLifeDays
// ============================================================

describe('getShelfLifeDays', () => {
  it('returns storageLifeDays for fresh / undefined method', () => {
    expect(getShelfLifeDays(tomatoCrop)).toBe(7);
    expect(getShelfLifeDays(tomatoCrop, 'fresh')).toBe(7);
  });

  it('converts shelfLifeMonths to days for frozen tomatoes', () => {
    // 6 months × 30.44 = 182.64 → rounded to 183
    expect(getShelfLifeDays(tomatoCrop, 'frozen')).toBe(Math.round(6 * DAYS_PER_MONTH));
  });

  it('converts shelfLifeMonths to days for canned tomatoes', () => {
    expect(getShelfLifeDays(tomatoCrop, 'canned')).toBe(Math.round(18 * DAYS_PER_MONTH));
  });

  it('maps cold-storage to root-cellar entry', () => {
    expect(getShelfLifeDays(squashCrop, 'cold-storage')).toBe(Math.round(6 * DAYS_PER_MONTH));
  });

  it('falls back to storageLifeDays when no matching preservation entry', () => {
    // tomato has no dehydrated entry
    expect(getShelfLifeDays(tomatoCrop, 'dehydrated')).toBe(7);
  });

  it('falls back to 7 days when crop has no yield data', () => {
    const bare: Crop = { ...tomatoCrop, yield: undefined };
    expect(getShelfLifeDays(bare)).toBe(7);
  });
});

// ============================================================
// calculateDecayModifier — model boundary conditions
// ============================================================

describe('calculateDecayModifier', () => {
  const shelfLife = 100; // days, easy arithmetic

  it('returns 1.0 at day 0 (just harvested)', () => {
    expect(calculateDecayModifier(shelfLife, 0)).toBe(1.0);
  });

  it('returns 1.0 through phase 1 (up to threshold)', () => {
    // 70% of 100 = day 70
    expect(calculateDecayModifier(shelfLife, 70)).toBe(1.0);
  });

  it('returns 1.0 at exactly the phase boundary', () => {
    expect(calculateDecayModifier(shelfLife, shelfLife * DECAY_PHASE_THRESHOLD)).toBe(1.0);
  });

  it('begins declining immediately after threshold', () => {
    const justPast = shelfLife * DECAY_PHASE_THRESHOLD + 1;
    expect(calculateDecayModifier(shelfLife, justPast)).toBeLessThan(1.0);
    expect(calculateDecayModifier(shelfLife, justPast)).toBeGreaterThan(0);
  });

  it('returns exactly 0.5 at 85% of shelf life (midpoint of phase 2)', () => {
    // Phase 2 spans 70%–100%. Midpoint is 85%.
    // phaseProgress = (0.85 - 0.70) / (1.0 - 0.70) = 0.15 / 0.30 = 0.5
    expect(calculateDecayModifier(shelfLife, 85)).toBeCloseTo(0.5, 5);
  });

  it('returns 0.0 at 100% of shelf life', () => {
    expect(calculateDecayModifier(shelfLife, 100)).toBe(0.0);
  });

  it('returns 0.0 beyond shelf life', () => {
    expect(calculateDecayModifier(shelfLife, 150)).toBe(0.0);
    expect(calculateDecayModifier(shelfLife, 9999)).toBe(0.0);
  });

  it('returns 1.0 for negative daysSinceHarvest (future harvest date)', () => {
    expect(calculateDecayModifier(shelfLife, -5)).toBe(1.0);
  });

  it('returns 1.0 when shelfLifeDays is 0 or negative (guard clause)', () => {
    expect(calculateDecayModifier(0, 10)).toBe(1.0);
    expect(calculateDecayModifier(-1, 10)).toBe(1.0);
  });

  it('decay is monotonically non-increasing across phase 2', () => {
    const samples = [71, 75, 80, 85, 90, 95, 99, 100];
    const modifiers = samples.map(d => calculateDecayModifier(shelfLife, d));
    for (let i = 1; i < modifiers.length; i++) {
      expect(modifiers[i]).toBeLessThanOrEqual(modifiers[i - 1]);
    }
  });
});

// ============================================================
// calculateItemDecay — item-level integration
// ============================================================

describe('calculateItemDecay', () => {
  it('returns modifier 1.0 for planned items (not yet harvested)', () => {
    const planned: InventoryItem = { ...baseItem, status: 'planned' };
    const result = calculateItemDecay(planned, tomatoCrop);
    expect(result.modifier).toBe(1.0);
    expect(result.phase).toBe('fresh');
  });

  it('returns modifier 1.0 for active items', () => {
    const active: InventoryItem = { ...baseItem, status: 'active' };
    const result = calculateItemDecay(active, tomatoCrop);
    expect(result.modifier).toBe(1.0);
  });

  it('returns modifier 1.0 for stored items with no dateHarvested', () => {
    const result = calculateItemDecay(baseItem, tomatoCrop);
    expect(result.modifier).toBe(1.0);
    expect(result.phase).toBe('fresh');
  });

  it('returns phase "fresh" for recently stored items', () => {
    const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const item: InventoryItem = { ...baseItem, dateHarvested: yesterday };
    const result = calculateItemDecay(item, tomatoCrop);
    expect(result.phase).toBe('fresh');
    expect(result.modifier).toBe(1.0);
    // daysRemaining = shelfLifeDays - 1
    expect(result.daysRemaining).toBeCloseTo(6, 0);
  });

  it('returns phase "declining" for tomatoes past 70% shelf life', () => {
    // shelf life = 7 days. 70% = 4.9 days → use 6 days
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const item: InventoryItem = { ...baseItem, dateHarvested: sixDaysAgo };
    const result = calculateItemDecay(item, tomatoCrop);
    expect(result.phase).toBe('declining');
    expect(result.modifier).toBeGreaterThan(0);
    expect(result.modifier).toBeLessThan(1.0);
  });

  it('returns phase "spoiled" for expired items', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const item: InventoryItem = { ...baseItem, dateHarvested: tenDaysAgo };
    const result = calculateItemDecay(item, tomatoCrop);
    expect(result.phase).toBe('spoiled');
    expect(result.modifier).toBe(0.0);
    expect(result.daysRemaining).toBe(0);
  });

  it('respects preservation method shelf life (frozen tomatoes last 6 months)', () => {
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const frozen: InventoryItem = {
      ...baseItem,
      dateHarvested:      oneDayAgo,
      preservationMethod: 'frozen',
    };
    const result = calculateItemDecay(frozen, tomatoCrop);
    expect(result.shelfLifeDays).toBe(Math.round(6 * DAYS_PER_MONTH));
    expect(result.phase).toBe('fresh');
    expect(result.modifier).toBe(1.0);
  });

  it('uses crop storageLifeDays when no preservation entry matches', () => {
    const oneDayAgo  = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const item: InventoryItem = {
      ...baseItem,
      dateHarvested:      oneDayAgo,
      preservationMethod: 'dehydrated',  // tomato has no dehydrated entry
    };
    const result = calculateItemDecay(item, tomatoCrop);
    expect(result.shelfLifeDays).toBe(7);  // fallback to storageLifeDays
  });

  it('daysRemaining is 0 for spoiled items, not negative', () => {
    const veryOld = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const item: InventoryItem = { ...baseItem, dateHarvested: veryOld };
    const result = calculateItemDecay(item, tomatoCrop);
    expect(result.daysRemaining).toBe(0);
  });
});
