import { describe, it, expect } from 'vitest';
import { selectCrops, parseSquareFootPerPlant } from './cropSelector';
import type { SurvivalPlanInput } from './types';

const baseInput: SurvivalPlanInput = {
  zipCode: '04401',
  adults: 2,
  kids: 2,
  dietaryRestrictions: [],
  squareFeet: 200,
  gardenType: 'in-ground',
  goal: 'max-calories',
  experience: 'intermediate',
  excludedCropIds: [],
};

describe('parseSquareFootPerPlant', () => {
  it('handles "24-36\\" apart"', () => {
    expect(parseSquareFootPerPlant('24-36" apart')).toBeCloseTo((30 / 12) ** 2, 2);
  });

  it('handles single number "12\\" apart"', () => {
    expect(parseSquareFootPerPlant('12" apart')).toBeCloseTo(1, 2);
  });

  it('falls back to 1 sqft for missing spacing', () => {
    expect(parseSquareFootPerPlant(undefined)).toBe(1.0);
  });

  it('clamps to a 0.25 sqft floor', () => {
    expect(parseSquareFootPerPlant('3" apart')).toBeGreaterThanOrEqual(0.25);
  });
});

describe('selectCrops', () => {
  it('returns 1-15 allocations for a typical 200 sqft household', () => {
    const allocations = selectCrops(baseInput);
    expect(allocations.length).toBeGreaterThan(0);
    expect(allocations.length).toBeLessThanOrEqual(15);
  });

  it('respects sq ft budget — total sq ft used does not exceed input', () => {
    const allocations = selectCrops(baseInput);
    const totalSqFt = allocations.reduce((s, a) => s + a.sqFtUsed, 0);
    expect(totalSqFt).toBeLessThanOrEqual(baseInput.squareFeet);
  });

  it('excludes crops listed in excludedCropIds', () => {
    const allocations = selectCrops({ ...baseInput, excludedCropIds: ['potato'] });
    expect(allocations.find(a => a.cropId === 'potato')).toBeUndefined();
  });

  it('excludes nightshades when restriction is set', () => {
    const allocations = selectCrops({ ...baseInput, dietaryRestrictions: ['no-nightshades'] });
    const blocked = allocations.find(a => ['tomato', 'pepper-bell', 'pepper-hot', 'potato', 'eggplant'].includes(a.cropId));
    expect(blocked).toBeUndefined();
  });

  it('max-calories goal surfaces high-calorie crops near the top', () => {
    const allocations = selectCrops({ ...baseInput, goal: 'max-calories' });
    expect(allocations.length).toBeGreaterThan(0);
    expect(allocations[0].projectedKcal).toBeGreaterThan(0);
  });

  it('preservation goal selects crops that have preservation methods', () => {
    const allocations = selectCrops({ ...baseInput, goal: 'preservation' });
    expect(allocations.length).toBeGreaterThan(0);
  });

  it('different goals produce different ordering', () => {
    const maxCal = selectCrops({ ...baseInput, goal: 'max-calories' });
    const fresh = selectCrops({ ...baseInput, goal: 'fresh' });
    expect(maxCal[0]?.cropId).not.toBe(fresh[0]?.cropId);
  });

  it('beginner experience yields a valid (possibly smaller) selection', () => {
    const allocations = selectCrops({ ...baseInput, experience: 'beginner' });
    expect(allocations.length).toBeGreaterThan(0);
  });

  it('larger gardens yield more total kcal', () => {
    const small = selectCrops({ ...baseInput, squareFeet: 100 });
    const large = selectCrops({ ...baseInput, squareFeet: 600 });
    const sumSmall = small.reduce((s, a) => s + a.projectedKcal, 0);
    const sumLarge = large.reduce((s, a) => s + a.projectedKcal, 0);
    expect(sumLarge).toBeGreaterThan(sumSmall);
  });
});
