import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getAllCrops } from '@/lib/tools/planting-calendar/cropLoader';
import { caloriesPerPlant } from '@/lib/tools/planting-calendar/zonePages';

/**
 * Several posts publish figures derived from content/crops/. Those numbers are
 * pasted into prose, so a yield or calorie edit makes the posts quietly wrong
 * with nothing to catch it. Adding turnip, rutabaga and daikon already forced
 * one correction to the August note.
 *
 * These tests re-derive the figures from the crop data and compare against what
 * the posts actually claim. If a post fails here, the data moved and the prose
 * needs updating, not the test.
 */

const ARCHIVE = path.join(process.cwd(), 'content/archive');
const read = (slug: string) => fs.readFileSync(path.join(ARCHIVE, `${slug}.mdx`), 'utf8');

/**
 * Markdown table rows as trimmed cell arrays. Header rows, separator rows and
 * `**bold**` markers are all stripped: the emphasis on standout figures like
 * `**340**` and `**down 7**` would otherwise break every numeric comparison.
 */
function tableRows(md: string): string[][] {
  const out: string[][] = [];
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l.startsWith('|')) continue;
    if (/^\|[\s:|-]+\|$/.test(l)) continue;              // separator
    if (/^\|[\s:|-]+\|$/.test((lines[i + 1] ?? '').trim())) continue; // header
    const cells = l
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim().replace(/\*\*/g, ''));
    if (cells.length > 1) out.push(cells);
  }
  return out;
}

const num = (s: string) => Number(s.replace(/[^0-9.]/g, ''));
const cropByName = (name: string) =>
  getAllCrops().find((c) => c.name.toLowerCase() === name.toLowerCase());

const GRAMS: Record<string, number> = { lbs: 453.592, oz: 28.3495 };

/**
 * Calories per plant WITHOUT rounding. The published per-sq-ft figures divide
 * the exact value; rounding first then dividing moves carrots from 1071 to 1060
 * and radishes from 163 to 180. Order of operations is load-bearing here.
 */
function exactCalories(crop: ReturnType<typeof getAllCrops>[number]): number | null {
  const y = crop.yield;
  const g = y && GRAMS[y.unit];
  if (!y || !g || !y.caloriesPer100g || !y.avgPerPlant) return null;
  return (y.avgPerPlant * g * y.caloriesPer100g) / 100;
}

/** In-row spacing × row spacing, or spacing² for equidistant bed crops. */
function sqFtPerPlant(crop: ReturnType<typeof getAllCrops>[number]): number | null {
  const parse = (s?: string) => {
    const m = String(s ?? '').match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?/);
    return m ? (m[2] ? (+m[1] + +m[2]) / 2 : +m[1]) : null;
  };
  const inRow = parse(crop.spacing);
  if (!inRow) return null;
  const row = parse((crop as { rowSpacing?: string }).rowSpacing) ?? inRow;
  return (inRow * row) / 144;
}

describe('what-to-plant-in-august: calorie table matches the crop data', () => {
  const rows = tableRows(read('what-to-plant-in-august')).filter((r) => r.length === 5);

  it('has rows to check', () => {
    expect(rows.length).toBeGreaterThanOrEqual(12);
  });

  it.each(rows.map((r) => [r[0], r] as const))(
    '%s: days, calories and storage match',
    (name, cells) => {
      const crop = cropByName(name);
      expect(crop, `no crop named "${name}" in content/crops/`).toBeDefined();
      const [, days, , cal, stores] = cells;
      expect(num(days), `${name} daysToMaturity`).toBe(crop!.daysToMaturity);
      expect(num(cal), `${name} calories per plant`).toBe(caloriesPerPlant(crop!));
      expect(num(stores), `${name} storage life`).toBe(crop!.yield?.storageLifeDays);
    }
  );
});

describe('fall-garden-plan: both rankings match the crop data', () => {
  const all = tableRows(read('fall-garden-plan'));
  const perPlant = all.filter((r) => r.length === 4 && /days$/.test(r[3]));
  const perSqFt = all.filter((r) => r.length === 3 && /^(up|down|level)/.test(r[2]));

  it('has both tables', () => {
    expect(perPlant.length).toBeGreaterThanOrEqual(15);
    expect(perSqFt.length).toBeGreaterThanOrEqual(15);
  });

  it.each(perPlant.map((r) => [r[0], r] as const))(
    'per-plant row %s matches',
    (name, cells) => {
      const crop = cropByName(name);
      expect(crop, `no crop named "${name}"`).toBeDefined();
      expect(num(cells[1]), `${name} days`).toBe(crop!.daysToMaturity);
      expect(num(cells[2]), `${name} calories`).toBe(caloriesPerPlant(crop!));
      expect(num(cells[3]), `${name} storage`).toBe(crop!.yield?.storageLifeDays);
    }
  );

  it.each(perSqFt.map((r) => [r[0], r] as const))(
    'per-sq-ft row %s matches',
    (name, cells) => {
      const crop = cropByName(name);
      expect(crop, `no crop named "${name}"`).toBeDefined();
      const cal = exactCalories(crop!);
      const sqft = sqFtPerPlant(crop!);
      expect(cal).not.toBeNull();
      expect(sqft).not.toBeNull();
      expect(num(cells[1]), `${name} kcal/sq ft`).toBe(Math.round(cal! / sqft!));
    }
  );

  it('states a rank move consistent with the two orderings', () => {
    const byCal = [...perPlant].sort((a, b) => num(b[2]) - num(a[2])).map((r) => r[0]);
    const bySqFt = perSqFt.map((r) => r[0]);
    for (const cells of perSqFt) {
      const from = byCal.indexOf(cells[0]) + 1;
      const to = bySqFt.indexOf(cells[0]) + 1;
      const move = from - to;
      const claimed = cells[2];
      const expected =
        move > 0 ? `up ${move}` : move < 0 ? `down ${-move}` : 'level';
      expect(claimed.toLowerCase(), `${cells[0]} rank move`).toContain(expected);
    }
  });
});
