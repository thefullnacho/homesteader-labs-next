import { describe, it, expect } from 'vitest';
import { getAllCrops } from './cropLoader';
import { calculateCropSchedule } from './plantingCalculations';
import { getFrostDatesByZone } from '@/lib/frostNormals';
import { ZONE_PAGES } from './zonePages';
import type { SelectedCrop } from './types';

// Audit of daysToMaturity across the crop database, prompted by the garlic bug.
// Garlic was wrong because a flat day count was the wrong instrument for the
// crop, not because the number itself was mistyped. So the question here is
// both "are the numbers plausible" and "is the convention behind them applied
// consistently", and the second matters more.
//
// The convention, which seed catalogues share and which the schedule relies on:
//
//   direct-sown crops    daysToMaturity counts from SOWING
//   transplanted crops   daysToMaturity counts from TRANSPLANT
//
// calculateSinglePlanting adds daysToMaturity to whichever of those two dates
// applies, so a crop carrying a from-seed figure on a transplant-only path (or
// the reverse) would overshoot or undershoot by the length of the indoor start,
// typically five to eight weeks. Nothing currently does. These tests keep it so.

const veg = getAllCrops().filter((c) => c.category === 'vegetable');
const sel = (c: { id: string }, vId: string): SelectedCrop =>
  ({ cropId: c.id, varietyId: vId, successionEnabled: false } as SelectedCrop);

/**
 * Perennials. Planted once and harvested for years, so daysToMaturity holds
 * years-to-first-harvest rather than a season length, and the annual schedule
 * cannot represent them. Listed explicitly so the exemption is a decision
 * rather than an accident.
 */
const PERENNIALS = new Set(['asparagus']);

/**
 * Plausible bands, from seed catalogue ranges. Deliberately wide: the point is
 * to catch a decimal slip or a units mix-up, not to police a week either way.
 */
const PLAUSIBLE: Record<string, [number, number]> = {
  radish: [20, 35], spinach: [35, 55], lettuce: [40, 75], 'squash-summer': [45, 65],
  'beans-bush': [45, 65], kohlrabi: [45, 65], turnip: [35, 65], beets: [45, 70],
  kale: [50, 75], chard: [50, 70], daikon: [50, 75], cucumber: [50, 75],
  'beans-pole': [55, 80], peas: [55, 75], carrot: [55, 85], cabbage: [60, 95],
  corn: [65, 110], 'squash-winter': [75, 115], potato: [70, 110], rutabaga: [80, 110],
  parsnip: [95, 130], tomato: [55, 90], broccoli: [50, 85], cauliflower: [50, 85],
  'pepper-bell': [60, 85], eggplant: [65, 95], 'pepper-hot': [70, 100],
  onion: [90, 120], celery: [85, 125], garlic: [180, 280],
};

describe('daysToMaturity is plausible', () => {
  it('has a band for every vegetable, so new crops cannot slip in unchecked', () => {
    const missing = veg.filter((c) => !PLAUSIBLE[c.id] && !PERENNIALS.has(c.id)).map((c) => c.id);
    expect(missing, `add a plausible band for: ${missing.join(', ')}`).toEqual([]);
  });

  it.each(Object.entries(PLAUSIBLE))('%s sits in its band', (id, [lo, hi]) => {
    const crop = veg.find((c) => c.id === id);
    if (!crop) return; // covered by the previous test
    expect(crop.daysToMaturity, `${id} crop-level`).toBeGreaterThanOrEqual(lo);
    expect(crop.daysToMaturity, `${id} crop-level`).toBeLessThanOrEqual(hi);
    for (const v of crop.varieties ?? []) {
      // Varieties run wider than the crop default, so allow real headroom.
      expect(v.daysToMaturity, `${id}/${v.id}`).toBeGreaterThanOrEqual(lo - 20);
      expect(v.daysToMaturity, `${id}/${v.id}`).toBeLessThanOrEqual(hi + 35);
    }
  });
});

describe('the daysToMaturity convention is applied consistently', () => {
  // The failure this guards against: a crop that can be started indoors AND
  // direct sown, whose two routes imply different harvest dates from a single
  // daysToMaturity. Today every such crop has transplant === directSow, so both
  // routes land on the same day and one number serves both honestly.
  it('keeps dual-method crops on a single planting date', () => {
    const dual = veg.filter((c) => c.startIndoors != null && c.directSow != null);
    expect(dual.length).toBeGreaterThan(0);
    for (const c of dual) {
      expect(
        c.transplant,
        `${c.id} transplants at ${c.transplant} but direct sows at ${c.directSow}, so one ` +
          `daysToMaturity cannot be correct for both routes`
      ).toBe(c.directSow);
    }
  });

  it('gives every transplant-only crop an indoor start to transplant from', () => {
    for (const c of veg.filter((x) => x.directSow == null && !PERENNIALS.has(x.id))) {
      expect(c.startIndoors, `${c.id}`).not.toBeNull();
      expect(c.transplant, `${c.id}`).not.toBeNull();
    }
  });
});

describe('no crop is silently dropped from the schedule', () => {
  // The viability check returns [] when harvest lands after first frost, which
  // is how a crop disappears without explanation. Confirmed: nothing is dropped
  // for season length, even in 4a at 151 frost-free days. Only the perennial is
  // dropped, and that is a modelling gap rather than a seasonal one.
  it.each(ZONE_PAGES)('%s schedules every annual vegetable', (zone) => {
    const frost = getFrostDatesByZone(zone, '00000');
    const dropped = veg
      .filter((c) => c.varieties?.[0])
      .filter((c) => calculateCropSchedule(c, c.varieties![0], sel(c, c.varieties![0].id), frost, false).length === 0)
      .map((c) => c.id);
    expect(dropped).toEqual([...PERENNIALS]);
  });

  it('harvests before first frost wherever it schedules at all', () => {
    for (const zone of ZONE_PAGES) {
      const frost = getFrostDatesByZone(zone, '00000');
      for (const c of veg) {
        const v = c.varieties?.[0];
        if (!v) continue;
        const dates = calculateCropSchedule(c, v, sel(c, v.id), frost, false);
        const harvest = dates.find((d) => d.action === 'harvest');
        if (!harvest || c.directSow === -180) continue; // overwintering has its own window
        expect(
          harvest.date.getTime(),
          `${c.id} in ${zone} harvests after first frost`
        ).toBeLessThanOrEqual(frost.firstFallFrost.getTime());
      }
    }
  });
});
