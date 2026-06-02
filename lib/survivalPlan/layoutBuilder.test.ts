import { describe, it, expect } from 'vitest';
import { buildLayout } from './layoutBuilder';
import type { CropAllocation } from './types';

const sample: CropAllocation[] = [
  { cropId: 'potato', cropName: 'Potato', varietyId: 'kennebec', varietyName: 'Kennebec', plantCount: 12, sqFtUsed: 24, projectedKcal: 8000, projectedYieldGrams: 12000, rationale: '' },
  { cropId: 'kale', cropName: 'Kale', varietyId: 'lacinato', varietyName: 'Lacinato', plantCount: 6, sqFtUsed: 6, projectedKcal: 1200, projectedYieldGrams: 3000, rationale: '' },
  { cropId: 'tomato', cropName: 'Tomatoes', varietyId: 'roma', varietyName: 'Roma', plantCount: 4, sqFtUsed: 24, projectedKcal: 600, projectedYieldGrams: 18000, rationale: '' },
];

describe('buildLayout', () => {
  it('returns one or more cells when allocations are non-empty', () => {
    const layout = buildLayout(sample, 200);
    expect(layout.cells.length).toBeGreaterThan(0);
  });

  it('grid dimensions are sane for a 200 sqft garden', () => {
    const layout = buildLayout(sample, 200);
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
    expect(layout.width * layout.height).toBeGreaterThanOrEqual(200);
  });

  it('cells do not overflow grid boundaries', () => {
    const layout = buildLayout(sample, 200);
    for (const cell of layout.cells) {
      expect(cell.x + cell.w).toBeLessThanOrEqual(layout.width);
      expect(cell.y + cell.h).toBeLessThanOrEqual(layout.height);
    }
  });

  it('cells do not overlap one another', () => {
    const layout = buildLayout(sample, 200);
    const occupied = new Set<string>();
    for (const cell of layout.cells) {
      for (let dy = 0; dy < cell.h; dy++) {
        for (let dx = 0; dx < cell.w; dx++) {
          const key = `${cell.x + dx},${cell.y + dy}`;
          expect(occupied.has(key)).toBe(false);
          occupied.add(key);
        }
      }
    }
  });
});
