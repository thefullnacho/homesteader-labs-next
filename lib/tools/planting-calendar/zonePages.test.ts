import { describe, it, expect } from 'vitest';
import {
  ZONE_PAGES,
  getZonePageData,
  isPageZone,
  caloriesPerPlant,
  FALL_FACTOR_DAYS,
} from './zonePages';
import { getAllCrops } from './cropLoader';

describe('zone page coverage', () => {
  it('covers the fourteen zones holding 98% of US ZIPs', () => {
    // Was ten (5a-9b, 88%) until 2026-08-01. Extended for the state pages,
    // which dead-ended for 42% of Florida and 46% of California at 5a-9b.
    expect(ZONE_PAGES).toHaveLength(14);
    expect(ZONE_PAGES[0]).toBe('4a');
    expect(ZONE_PAGES[ZONE_PAGES.length - 1]).toBe('10b');
  });

  it('rejects zones without a page', () => {
    expect(isPageZone('6b')).toBe(true);
    expect(isPageZone('10b')).toBe(true);
    expect(isPageZone('11a')).toBe(false); // real zone, no frost normals, no page
    expect(isPageZone('13b')).toBe(false); // real zone, no frost data, no page
    expect(isPageZone('3b')).toBe(false);  // has normals, too few ZIPs to earn a page
    expect(isPageZone('nonsense')).toBe(false);
  });
});

describe('every zone renders a usable page', () => {
  it.each(ZONE_PAGES)('%s has a full spring schedule', (zone) => {
    const d = getZonePageData(zone);
    // Regression: keying `overwinters` on the calendar year collapsed zone 9b to
    // 5 rows, because its Jan 10 last frost pushes start-indoors dates into the
    // previous December. Every zone should carry the same spring crop set.
    const spring = d.rows.filter((r) => !r.overwinters);
    expect(spring.length).toBeGreaterThanOrEqual(25);
  });

  it('gives every zone the same spring crop count', () => {
    const counts = ZONE_PAGES.map(
      (z) => getZonePageData(z).rows.filter((r) => !r.overwinters).length
    );
    expect(new Set(counts).size).toBe(1);
  });

  it('classifies garlic as overwintering and nothing else', () => {
    const d = getZonePageData('6b');
    const ow = d.rows.filter((r) => r.overwinters).map((r) => r.cropId);
    expect(ow).toEqual(['garlic']);
  });

  it('sorts overwintering crops last despite their earlier date', () => {
    const rows = getZonePageData('6b').rows;
    expect(rows[rows.length - 1].overwinters).toBe(true);
  });
});

// The -180 offset from last spring frost shipped garlic dates of Jul 14 in zone
// 9b and Jul 5 in zone 10b, on live pages describing July as "the previous
// autumn". The anchor drifts into the previous summer as the last frost moves
// toward midwinter. These are the assertions that would have caught it.
describe('overwintering crops plant in autumn, in every zone', () => {
  it.each(ZONE_PAGES)('%s puts garlic in between September and early January', (zone) => {
    const w = getZonePageData(zone).overwinterWindow;
    expect(w, `${zone} has garlic but no window`).not.toBeNull();
    const month = w!.date.getMonth(); // 0-indexed
    expect(month, `${zone} plants garlic in month ${month + 1}`).toBeGreaterThanOrEqual(8);
    expect(month).toBeLessThanOrEqual(11);
  });

  it('plants later as the zone warms, never earlier', () => {
    const days = ZONE_PAGES.map((z) => {
      const d = getZonePageData(z).overwinterWindow!.date;
      return d.getMonth() * 31 + d.getDate();
    });
    for (let i = 1; i < days.length; i++) {
      expect(days[i], `${ZONE_PAGES[i]} plants before ${ZONE_PAGES[i - 1]}`).toBeGreaterThanOrEqual(
        days[i - 1]
      );
    }
  });

  it('asks for a refrigerator pre-chill only where winter cannot do it', () => {
    const needsChill = ZONE_PAGES.filter(
      (z) => getZonePageData(z).overwinterWindow!.preChillWeeks !== null
    );
    expect(needsChill).toEqual(['9a', '9b', '10a', '10b']);
  });

  it('uses the window, not the offset, for the crop row itself', () => {
    // Regression: the row date and the stated window must agree, or the page
    // says one thing in the table and another in the prose.
    for (const zone of ZONE_PAGES) {
      const d = getZonePageData(zone);
      const garlic = d.rows.find((r) => r.overwinters);
      expect(garlic!.startDate.getTime(), zone).toBe(d.overwinterWindow!.date.getTime());
    }
  });

  it('places the window in the autumn before the spring the page counts from', () => {
    const d = getZonePageData('6b');
    expect(d.overwinterWindow!.date.getFullYear()).toBe(d.lastSpringFrost.getFullYear() - 1);
  });
});

describe('zones are genuinely distinct, not doorway pages', () => {
  it('shifts every frost-anchored crop start date between adjacent zones', () => {
    // Overwintering crops are excluded deliberately. Their dates come from a
    // banded lookup, not from the frost offset, and the horticultural guidance
    // behind it does not distinguish half-zones: 4a and 4b share a window, as
    // do 10a and 10b. Manufacturing a two-day gap between them to satisfy this
    // assertion would be inventing precision the source does not have, which is
    // the exact failure the lookup was added to fix.
    //
    // The doorway-page guarantee is unaffected. It rests on the ~28 spring
    // crops below, every one of which still shifts between every adjacent pair.
    for (let i = 1; i < ZONE_PAGES.length; i++) {
      const a = getZonePageData(ZONE_PAGES[i - 1]).rows.filter((r) => !r.overwinters);
      const b = getZonePageData(ZONE_PAGES[i]).rows;
      const byId = new Map(b.map((r) => [r.cropId, r]));
      const shared = a.filter((r) => byId.has(r.cropId));
      const identical = shared.filter(
        (r) => r.startDate.getTime() === byId.get(r.cropId)!.startDate.getTime()
      );
      expect(identical, `${ZONE_PAGES[i - 1]} vs ${ZONE_PAGES[i]}`).toHaveLength(0);
      expect(shared.length).toBeGreaterThanOrEqual(25);
    }
  });

  it('lengthens the season monotonically from 4a to 10b', () => {
    const days = ZONE_PAGES.map((z) => getZonePageData(z).frostFreeDays);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });

  it('bands the constraint guidance by season length', () => {
    expect(getZonePageData('5a').constraint.band).toBe('short');   // 168d
    expect(getZonePageData('6b').constraint.band).toBe('moderate'); // 240d
    expect(getZonePageData('9b').constraint.band).toBe('long');     // 352d
  });
});

describe('fall sowing', () => {
  it('derives the deadline as first frost minus maturity plus the fall factor', () => {
    const d = getZonePageData('6b');
    const cabbage = d.fallSowing(new Date('2026-01-01')).find((r) => r.cropId === 'cabbage');
    expect(cabbage).toBeDefined();
    expect(cabbage!.adjustedDays).toBe(cabbage!.daysToMaturity + FALL_FACTOR_DAYS);
    const expected = new Date(d.firstFallFrost);
    expected.setDate(expected.getDate() - cabbage!.adjustedDays);
    expect(cabbage!.sowBy.toDateString()).toBe(expected.toDateString());
  });

  it('excludes warm-season crops whose maturity maths lies', () => {
    // A tomato "finishes" before frost on paper, but fruit set collapses as
    // nights cool. Peppers were leaking through on an id mismatch.
    const ids = getZonePageData('9b').fallSowing(new Date('2026-01-01')).map((r) => r.cropId);
    for (const warm of ['tomato', 'pepper-bell', 'pepper-hot', 'eggplant', 'corn']) {
      expect(ids).not.toContain(warm);
    }
  });

  it('offers a longer season more crops than a shorter one', () => {
    const from = new Date('2026-07-26');
    expect(getZonePageData('9b').fallSowing(from).length)
      .toBeGreaterThan(getZonePageData('5a').fallSowing(from).length);
  });

  it('returns nothing once every deadline has passed', () => {
    expect(getZonePageData('5a').fallSowing(new Date('2026-12-15'))).toHaveLength(0);
  });

  it('orders by deadline so the most urgent sits first', () => {
    const rows = getZonePageData('6b').fallSowing(new Date('2026-01-01'));
    const times = rows.map((r) => r.sowBy.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});

describe('caloriesPerPlant', () => {
  it('converts pounds to calories via the crop yield', () => {
    const cabbage = getAllCrops().find((c) => c.id === 'cabbage')!;
    // 3 lbs * 453.592 g * 25 kcal/100g = 340
    expect(caloriesPerPlant(cabbage)).toBe(340);
  });

  it('handles ounce-denominated yields without inflating them', () => {
    // Radishes are 1 oz, not 1 lb. Treating the unit as pounds read 160 instead of 5.
    const radish = getAllCrops().find((c) => c.id === 'radish')!;
    expect(caloriesPerPlant(radish)).toBe(5);
  });

  it('returns null rather than 0 when yield data is missing', () => {
    expect(caloriesPerPlant({ id: 'x', name: 'X' } as never)).toBeNull();
  });
});
