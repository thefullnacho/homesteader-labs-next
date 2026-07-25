import { describe, it, expect } from 'vitest';
import {
  dailyGdd,
  accumulateGdd,
  findThresholdCrossing,
  defaultBiofix,
  type DailyTemp,
} from './growingDegreeDays';

const BASE50 = { base: 50 };

describe('dailyGdd', () => {
  it('averages the daily high and low against the base', () => {
    // (80 + 60) / 2 - 50 = 20
    expect(dailyGdd(80, 60, BASE50)).toBe(20);
  });

  it('returns 0 when the mean sits below the base', () => {
    // (50 + 30) / 2 = 40, which is under 50
    expect(dailyGdd(50, 30, BASE50)).toBe(0);
  });

  it('never returns a negative, so cold days do not undo accumulation', () => {
    expect(dailyGdd(20, 0, BASE50)).toBe(0);
  });

  it('applies a horizontal upper cutoff to both temperatures', () => {
    // Uncapped: (100 + 70) / 2 - 50 = 35
    expect(dailyGdd(100, 70, { base: 50 })).toBe(35);
    // Capped at 86: (86 + 70) / 2 - 50 = 28
    expect(dailyGdd(100, 70, { base: 50, upperCutoff: 86 })).toBe(28);
  });

  it('caps the low as well as the high when both exceed the cutoff', () => {
    // Both capped to 86: (86 + 86) / 2 - 50 = 36
    expect(dailyGdd(104, 90, { base: 50, upperCutoff: 86 })).toBe(36);
  });

  it('honours a non-default base', () => {
    // (60 + 40) / 2 - 39.2 = 10.8
    expect(dailyGdd(60, 40, { base: 39.2 })).toBeCloseTo(10.8, 5);
  });

  it('tolerates transposed high and low rather than returning nonsense', () => {
    expect(dailyGdd(60, 80, BASE50)).toBe(dailyGdd(80, 60, BASE50));
  });

  it('returns 0 for non-finite input', () => {
    expect(dailyGdd(NaN, 60, BASE50)).toBe(0);
    expect(dailyGdd(80, Infinity, BASE50)).toBe(0);
  });
});

describe('accumulateGdd', () => {
  const days: DailyTemp[] = [
    { date: '2026-03-01', maxTemp: 60, minTemp: 40 }, // 0
    { date: '2026-03-02', maxTemp: 70, minTemp: 50 }, // 10
    { date: '2026-03-03', maxTemp: 80, minTemp: 60 }, // 20
  ];

  it('sums across the series', () => {
    expect(accumulateGdd(days, BASE50)).toBe(30);
  });

  it('returns 0 for an empty series', () => {
    expect(accumulateGdd([], BASE50)).toBe(0);
  });

  it('deduplicates by date so overlapping sources do not double count', () => {
    // This is the archive/forecast overlap case.
    const overlapping = [...days, { date: '2026-03-03', maxTemp: 90, minTemp: 70 }];
    expect(accumulateGdd(overlapping, BASE50)).toBe(30);
  });

  it('keeps the first occurrence, so archive values beat forecast values', () => {
    const archiveFirst = [
      { date: '2026-03-02', maxTemp: 70, minTemp: 50 }, // archive, 10
      { date: '2026-03-02', maxTemp: 90, minTemp: 70 }, // forecast, would be 30
    ];
    expect(accumulateGdd(archiveFirst, BASE50)).toBe(10);
  });
});

describe('findThresholdCrossing', () => {
  const days: DailyTemp[] = [
    { date: '2026-04-01', maxTemp: 70, minTemp: 50 }, // 10  -> 10
    { date: '2026-04-02', maxTemp: 70, minTemp: 50 }, // 10  -> 20
    { date: '2026-04-03', maxTemp: 80, minTemp: 60 }, // 20  -> 40
    { date: '2026-04-04', maxTemp: 80, minTemp: 60 }, // 20  -> 60
  ];

  it('reports the first date the running total reaches the threshold', () => {
    expect(findThresholdCrossing(days, 40, BASE50)).toEqual({
      date: '2026-04-03',
      accumulated: 40,
    });
  });

  it('treats the threshold as inclusive', () => {
    expect(findThresholdCrossing(days, 10, BASE50)?.date).toBe('2026-04-01');
  });

  it('returns null when the threshold is never reached', () => {
    expect(findThresholdCrossing(days, 5000, BASE50)).toBeNull();
  });

  it('sorts by date, so an unsorted archive/forecast merge still works', () => {
    const shuffled = [days[3], days[0], days[2], days[1]];
    expect(findThresholdCrossing(shuffled, 40, BASE50)?.date).toBe('2026-04-03');
  });

  it('is idempotent, which is what removes the need to store sent-state', () => {
    const first = findThresholdCrossing(days, 40, BASE50);
    const second = findThresholdCrossing(days, 40, BASE50);
    expect(first).toEqual(second);
  });
});

describe('defaultBiofix', () => {
  it('is January 1st of the given year', () => {
    expect(defaultBiofix(new Date('2026-07-24T00:00:00Z'))).toBe('2026-01-01');
  });

  it('does not roll into the next year late in December', () => {
    expect(defaultBiofix(new Date('2026-12-31T23:00:00Z'))).toBe('2026-01-01');
  });
});
