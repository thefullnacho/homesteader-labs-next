import { describe, it, expect } from 'vitest';
import { buildSchedule, buildPreservationTimeline } from './scheduleBuilder';
import { getFrostDatesByZone } from '@/lib/frostNormals';
import type { CropAllocation } from './types';

const sampleAllocations: CropAllocation[] = [
  { cropId: 'potato',  cropName: 'Potato',   varietyId: 'kennebec',     varietyName: 'Kennebec',     plantCount: 6, sqFtUsed: 12, projectedKcal: 4000, projectedYieldGrams: 6000, rationale: '' },
  { cropId: 'tomato',  cropName: 'Tomatoes', varietyId: 'early-girl',   varietyName: 'Early Girl',   plantCount: 4, sqFtUsed: 24, projectedKcal: 800,  projectedYieldGrams: 18000, rationale: '' },
  { cropId: 'kale',    cropName: 'Kale',     varietyId: 'lacinato',     varietyName: 'Lacinato',     plantCount: 6, sqFtUsed: 6,  projectedKcal: 1200, projectedYieldGrams: 3000, rationale: '' },
];

describe('buildSchedule', () => {
  const frost6a = getFrostDatesByZone('6a', '04401');
  const frost8b = getFrostDatesByZone('8b', '30301');

  it('returns at least one action week for zone 6a inputs', () => {
    const schedule = buildSchedule(sampleAllocations, frost6a);
    expect(schedule.length).toBeGreaterThan(0);
  });

  it('weeks are sorted chronologically', () => {
    const schedule = buildSchedule(sampleAllocations, frost6a);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i - 1].weekIso <= schedule[i].weekIso).toBe(true);
    }
  });

  it('each event has a recognizable action', () => {
    const schedule = buildSchedule(sampleAllocations, frost6a);
    const validActions = new Set(['start-indoors', 'transplant', 'direct-sow', 'harvest']);
    for (const week of schedule) {
      for (const event of week.events) {
        expect(validActions.has(event.action)).toBe(true);
      }
    }
  });

  it('zone 8b (longer season) produces more or equal action weeks than zone 6a', () => {
    const s6a = buildSchedule(sampleAllocations, frost6a);
    const s8b = buildSchedule(sampleAllocations, frost8b);
    expect(s8b.length).toBeGreaterThanOrEqual(s6a.length);
  });

  it('schedule includes a harvest event for at least one crop', () => {
    const schedule = buildSchedule(sampleAllocations, frost6a);
    const hasHarvest = schedule.some(w => w.events.some(e => e.action === 'harvest'));
    expect(hasHarvest).toBe(true);
  });

  it('empty allocations returns empty schedule', () => {
    expect(buildSchedule([], frost6a)).toEqual([]);
  });
});

describe('buildPreservationTimeline', () => {
  const frost6a = getFrostDatesByZone('6a', '04401');

  it('returns one entry per allocation', () => {
    const timeline = buildPreservationTimeline(sampleAllocations, frost6a);
    expect(timeline.length).toBeLessThanOrEqual(sampleAllocations.length);
    expect(timeline.length).toBeGreaterThan(0);
  });

  it('sorted by harvest date ascending', () => {
    const timeline = buildPreservationTimeline(sampleAllocations, frost6a);
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i - 1].harvestDateIso <= timeline[i].harvestDateIso).toBe(true);
    }
  });

  it('each entry has harvest date and methods', () => {
    const timeline = buildPreservationTimeline(sampleAllocations, frost6a);
    for (const entry of timeline) {
      expect(entry.harvestDateIso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Array.isArray(entry.methods)).toBe(true);
      expect(typeof entry.storageMonths).toBe('number');
    }
  });
});
