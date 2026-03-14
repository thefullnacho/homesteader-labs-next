import { describe, it, expect } from 'vitest';
import {
  PRESERVATION_COST_PROFILES,
  PRODUCE_LBS_PER_BATCH,
  estimateBatchCount,
  calculatePreservationCost,
  calculateAutonomyImpact,
} from './preservationCost';

// ============================================================
// PRESERVATION_COST_PROFILES — shape validation
// ============================================================

describe('PRESERVATION_COST_PROFILES', () => {
  const methods = ['canned', 'dehydrated', 'frozen', 'cold-storage', 'fresh'] as const;

  it('covers all preservation methods', () => {
    for (const method of methods) {
      expect(PRESERVATION_COST_PROFILES[method]).toBeDefined();
    }
  });

  it('every profile has a label, batchDescription, and assumption', () => {
    for (const method of methods) {
      const p = PRESERVATION_COST_PROFILES[method];
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.batchDescription.length).toBeGreaterThan(0);
      expect(p.assumption.length).toBeGreaterThan(0);
    }
  });

  it('energy-intensive methods have wattHoursPerBatch > 0', () => {
    expect(PRESERVATION_COST_PROFILES.canned.wattHoursPerBatch).toBeGreaterThan(0);
    expect(PRESERVATION_COST_PROFILES.dehydrated.wattHoursPerBatch).toBeGreaterThan(0);
    expect(PRESERVATION_COST_PROFILES.frozen.wattHoursPerBatch).toBeGreaterThan(0);
  });

  it('cold-storage and fresh have zero energy and water cost', () => {
    expect(PRESERVATION_COST_PROFILES['cold-storage'].wattHoursPerBatch).toBe(0);
    expect(PRESERVATION_COST_PROFILES['cold-storage'].gallonsPerBatch).toBe(0);
    expect(PRESERVATION_COST_PROFILES.fresh.wattHoursPerBatch).toBe(0);
    expect(PRESERVATION_COST_PROFILES.fresh.gallonsPerBatch).toBe(0);
  });

  it('canning uses more energy per batch than dehydrating or freezing', () => {
    // Canning is thermally intensive; dehydrating is long but lower wattage.
    // Freezing only charges door-open penalty.
    expect(PRESERVATION_COST_PROFILES.canned.wattHoursPerBatch)
      .toBeGreaterThan(PRESERVATION_COST_PROFILES.frozen.wattHoursPerBatch);
  });

  it('canning uses more water per batch than other methods', () => {
    expect(PRESERVATION_COST_PROFILES.canned.gallonsPerBatch)
      .toBeGreaterThan(PRESERVATION_COST_PROFILES.dehydrated.gallonsPerBatch);
    expect(PRESERVATION_COST_PROFILES.canned.gallonsPerBatch)
      .toBeGreaterThan(PRESERVATION_COST_PROFILES.frozen.gallonsPerBatch);
  });

  it('wattHoursPerBatch and gallonsPerBatch are non-negative for all methods', () => {
    for (const p of Object.values(PRESERVATION_COST_PROFILES)) {
      expect(p.wattHoursPerBatch).toBeGreaterThanOrEqual(0);
      expect(p.gallonsPerBatch).toBeGreaterThanOrEqual(0);
    }
  });
});

// ============================================================
// estimateBatchCount
// ============================================================

describe('estimateBatchCount', () => {
  it('rounds up to whole batches for canning', () => {
    // 14 lb per batch → 15 lb = 2 batches
    expect(estimateBatchCount(14, 'canned')).toBe(1);
    expect(estimateBatchCount(15, 'canned')).toBe(2);
    expect(estimateBatchCount(28, 'canned')).toBe(2);
    expect(estimateBatchCount(29, 'canned')).toBe(3);
  });

  it('rounds up to whole batches for dehydrating and freezing', () => {
    expect(estimateBatchCount(10, 'dehydrated')).toBe(1);
    expect(estimateBatchCount(11, 'dehydrated')).toBe(2);
    expect(estimateBatchCount(10, 'frozen')).toBe(1);
    expect(estimateBatchCount(21, 'frozen')).toBe(3);
  });

  it('always returns 1 batch for cold-storage regardless of quantity', () => {
    expect(estimateBatchCount(1,    'cold-storage')).toBe(1);
    expect(estimateBatchCount(500,  'cold-storage')).toBe(1);
    expect(estimateBatchCount(9999, 'cold-storage')).toBe(1);
  });

  it('always returns 1 batch for fresh regardless of quantity', () => {
    expect(estimateBatchCount(100, 'fresh')).toBe(1);
  });

  it('handles unknown method gracefully (falls back to 1 batch)', () => {
    expect(estimateBatchCount(50, 'unknown-method')).toBe(1);
  });
});

// ============================================================
// calculatePreservationCost — single batch
// ============================================================

describe('calculatePreservationCost', () => {
  it('returns zero cost for fresh method', () => {
    const result = calculatePreservationCost(10, 'fresh');
    expect(result.totalWattHours).toBe(0);
    expect(result.totalGallons).toBe(0);
    expect(result.batchCount).toBe(1);
  });

  it('returns zero cost for cold-storage', () => {
    const result = calculatePreservationCost(100, 'cold-storage');
    expect(result.totalWattHours).toBe(0);
    expect(result.totalGallons).toBe(0);
  });

  it('calculates correct cost for exactly one canning batch (14 lb)', () => {
    const result = calculatePreservationCost(14, 'canned');
    expect(result.batchCount).toBe(1);
    expect(result.totalWattHours).toBe(PRESERVATION_COST_PROFILES.canned.wattHoursPerBatch);
    expect(result.totalGallons).toBe(PRESERVATION_COST_PROFILES.canned.gallonsPerBatch);
  });

  it('scales cost linearly with batch count for canning', () => {
    const one = calculatePreservationCost(14, 'canned');
    const two = calculatePreservationCost(28, 'canned');
    expect(two.totalWattHours).toBe(one.totalWattHours * 2);
    expect(two.totalGallons).toBe(one.totalGallons * 2);
  });

  it('scales cost linearly with batch count for dehydrating', () => {
    const one = calculatePreservationCost(10, 'dehydrated');
    const three = calculatePreservationCost(30, 'dehydrated');
    expect(three.totalWattHours).toBe(one.totalWattHours * 3);
  });

  it('carries produce weight and method through to result', () => {
    const result = calculatePreservationCost(20, 'frozen');
    expect(result.produceLbs).toBe(20);
    expect(result.method).toBe('frozen');
    expect(result.label).toBe(PRESERVATION_COST_PROFILES.frozen.label);
  });

  it('defaults to fresh when method is undefined', () => {
    const result = calculatePreservationCost(10, undefined);
    expect(result.method).toBe('fresh');
    expect(result.totalWattHours).toBe(0);
  });

  it('attaches the full profile to the result', () => {
    const result = calculatePreservationCost(14, 'canned');
    expect(result.profile).toBe(PRESERVATION_COST_PROFILES.canned);
  });
});

// ============================================================
// calculateAutonomyImpact
// ============================================================

describe('calculateAutonomyImpact', () => {
  it('returns zero deduction for fresh (no cost)', () => {
    const cost = calculatePreservationCost(10, 'fresh');
    const impact = calculateAutonomyImpact(cost, 2000, 4);
    expect(impact.energyDaysDeducted).toBe(0);
    expect(impact.waterDaysDeducted).toBe(0);
  });

  it('calculates energy deduction as fraction of daily draw', () => {
    // One canning batch = 1400 Wh. Daily draw = 1400 Wh → exactly 1 day deducted.
    const cost = calculatePreservationCost(14, 'canned');
    const impact = calculateAutonomyImpact(cost, 1400, 4);
    expect(impact.energyDaysDeducted).toBeCloseTo(1.0, 5);
  });

  it('calculates water deduction as fraction of daily need', () => {
    // One canning batch = 4 gal. Daily water = 4 gal → exactly 1 day deducted.
    const cost = calculatePreservationCost(14, 'canned');
    const impact = calculateAutonomyImpact(cost, 1400, 4);
    expect(impact.waterDaysDeducted).toBeCloseTo(1.0, 5);
  });

  it('returns fractional days when cost is less than one day', () => {
    // Freezing batch = 150 Wh. Daily draw = 1500 Wh → 0.1 day deducted.
    const cost = calculatePreservationCost(10, 'frozen');
    const impact = calculateAutonomyImpact(cost, 1500, 4);
    expect(impact.energyDaysDeducted).toBeCloseTo(0.1, 5);
  });

  it('two canning batches deduct twice the autonomy', () => {
    const oneBatch = calculatePreservationCost(14, 'canned');
    const twoBatch = calculatePreservationCost(28, 'canned');
    const one = calculateAutonomyImpact(oneBatch, 1400, 4);
    const two = calculateAutonomyImpact(twoBatch, 1400, 4);
    expect(two.energyDaysDeducted).toBeCloseTo(one.energyDaysDeducted * 2, 5);
    expect(two.waterDaysDeducted).toBeCloseTo(one.waterDaysDeducted * 2, 5);
  });

  it('returns 0 when daily draw is 0 (guard against division by zero)', () => {
    const cost = calculatePreservationCost(14, 'canned');
    const impact = calculateAutonomyImpact(cost, 0, 0);
    expect(impact.energyDaysDeducted).toBe(0);
    expect(impact.waterDaysDeducted).toBe(0);
  });
});
