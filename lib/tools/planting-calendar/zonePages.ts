// Data assembly for the per-zone planting calendar pages.
//
// Zone is the right unit for these pages, not city. Two cities in the same zone
// share a frost date and therefore render an identical schedule, which is what
// a doorway page is. Zones differ: measured across the ten zones below, every
// crop's first sow date shifts between every adjacent pair, because the frost
// normals move 10-20 days per half-zone.
//
// Coverage: the fourteen zones here hold 39,673 of the 40,502 ZIPs in the PRISM
// table, or 98% of the country.
//
// It was ten zones (5a-9b, 88%) until 2026-08-01. The state pages forced the
// extension: a state page hands its reader to a zone page, and at 5a-9b that
// dead-ended for 42% of Florida and 46% of California, which are the second and
// third largest state queries in the keyword data. Adding 4a, 4b, 10a and 10b
// cost no new data, since content/frost-zones.json already carried normals for
// all four, and cut the list of states under 90% covered from thirteen to five.
//
// The four were also exactly the zones carrying the bad frost data repaired in
// effb671, which is not a coincidence: nothing rendered them, so nothing caught
// them. Do not extend further without checking frostNormals.test.ts passes for
// the new zones first.
//
// The remaining twelve zones each hold under 250 ZIPs. 11a and above have no
// frost normals at all, and a frost-free tropical zone wants a different page
// than a frost-anchored calendar, so they stay out.

import { getFrostDatesByZone } from "@/lib/frostNormals";
import { getAllCrops } from "./cropLoader";
import { calculateCropSchedule } from "./plantingCalculations";
import type { Crop, PlantingDate, SelectedCrop } from "./types";
import {
  isOverwintering,
  overwinterWindow,
  type OverwinterWindow,
} from "./overwintering";

/** Ordered coldest to warmest. 98% of US ZIPs. */
export const ZONE_PAGES = [
  "4a", "4b", "5a", "5b", "6a", "6b", "7a", "7b", "8a", "8b", "9a", "9b", "10a", "10b",
] as const;

export type PageZone = (typeof ZONE_PAGES)[number];

export function isPageZone(zone: string): zone is PageZone {
  return (ZONE_PAGES as readonly string[]).includes(zone);
}

const GRAMS_PER_UNIT: Record<string, number> = { lbs: 453.592, oz: 28.3495 };

/**
 * Warm-season crops, excluded from fall sowing. Days-to-maturity says a tomato
 * sown in July "finishes" before frost, but fruit set collapses as nights cool,
 * so the arithmetic lies. Cool-season crops sweeten instead.
 */
const WARM_SEASON = new Set([
  "tomato", "pepper-bell", "pepper-hot", "eggplant", "cucumber",
  "squash-summer", "squash-winter", "corn", "beans-bush", "beans-pole",
  // Potato is not frost-tender in the same way, but its foliage dies at first
  // frost and tuber bulking stops with it, so a sowing that "finishes" on
  // paper yields marbles. Second-crop potatoes only work well below zone 8.
  "potato",
  // Perennial: planted once, not part of a season's sowing schedule.
  "asparagus",
  // Sown in autumn deliberately, to overwinter. Handled by `overwinters`.
  "garlic",
]);

/** Calories in a whole plant's yield, or null when the crop carries no usable yield data. */
export function caloriesPerPlant(crop: Crop): number | null {
  const y = crop.yield;
  const grams = y && GRAMS_PER_UNIT[y.unit];
  if (!y || !grams || !y.caloriesPer100g || !y.avgPerPlant) return null;
  return Math.round((y.avgPerPlant * grams * y.caloriesPer100g) / 100);
}

/**
 * Autumn days are shorter and cooler than the summer days maturity figures are
 * measured in, so growth slows as the season closes. Extension guidance is to
 * add roughly two weeks to the listed maturity for anything sown after
 * midsummer, then count back from first frost rather than forward from today.
 */
export const FALL_FACTOR_DAYS = 14;

export interface ZoneCropRow {
  cropId: string;
  cropName: string;
  /** First action of the season, whatever it is: start indoors, or direct sow. */
  startAction: PlantingDate["action"];
  startDate: Date;
  harvestDate: Date | null;
  daysToMaturity: number;
  caloriesPerPlant: number | null;
  /**
   * Autumn-sown crops that sit in the ground through winter. Garlic direct-sows
   * 180 days before last frost, landing in the previous September, and would
   * otherwise sort above January.
   *
   * Deliberately keyed on the crop's own `directSow` offset, not on whether the
   * computed date falls in a prior calendar year. In zone 9b the last frost is
   * January 10, so nearly every crop's start-indoors date lands in the previous
   * December, which is ordinary practice rather than overwintering. Testing the
   * year emptied that zone's spring table down to 5 rows from 29.
   */
  overwinters: boolean;
}

export interface FallSowRow {
  cropId: string;
  cropName: string;
  /** Latest date this can go in and still finish before first frost. */
  sowBy: Date;
  daysToMaturity: number;
  /** daysToMaturity + FALL_FACTOR_DAYS, the figure sowBy is derived from. */
  adjustedDays: number;
  caloriesPerPlant: number | null;
  storageLifeDays: number | null;
}

export interface ZonePageData {
  zone: PageZone;
  lastSpringFrost: Date;
  firstFallFrost: Date;
  /** NOAA variance, in days, either side of the normal. */
  frostVarianceDays: number;
  frostFreeDays: number;
  /** Spring schedule, sorted by first action. Overwintering crops sort last. */
  rows: ZoneCropRow[];
  /**
   * Crops that still finish if sown now, earliest-deadline first, so the head
   * of the list is the most urgent. Empty once the season has closed, which is
   * itself the answer for a late-autumn visitor.
   */
  fallSowing: (from?: Date) => FallSowRow[];
  /** What the season length actually constrains here. Differs by band, not by wording. */
  constraint: SeasonConstraint;
  /**
   * When overwintering crops go in, from the lookup rather than the offset.
   * Null when the zone carries no overwintering crop at all.
   */
  overwinterWindow: OverwinterWindow | null;
}

export interface SeasonConstraint {
  band: "short" | "moderate" | "long";
  headline: string;
  body: string;
}

/**
 * The guidance that changes between zones because the constraint genuinely
 * changes, not because the sentences were reshuffled. A 168-day season and a
 * 352-day season are limited by different things and want different tactics.
 */
function seasonConstraint(frostFreeDays: number, zone: string): SeasonConstraint {
  if (frostFreeDays < 200) {
    return {
      band: "short",
      headline: "Time is the binding constraint",
      body:
        `At ${frostFreeDays} frost-free days, zone ${zone} cannot finish a long-season crop sown ` +
        `outdoors. Transplants are not a convenience here, they are how you buy the six weeks the ` +
        `season does not give you. Anything above roughly 90 days to maturity needs starting ` +
        `indoors or choosing in a shorter variety, and a second succession rarely fits.`,
    };
  }
  if (frostFreeDays < 280) {
    return {
      band: "moderate",
      headline: "Two windows, neither of them generous",
      body:
        `${frostFreeDays} frost-free days is enough for a spring planting and a distinct autumn ` +
        `one, which is the situation most of the country gardens in. The trap is treating them as ` +
        `one long season: midsummer sowings of cool-season crops bolt, and autumn sowings made ` +
        `after the deadlines above simply do not finish. Plan them as two separate calendars.`,
    };
  }
  return {
    band: "long",
    headline: "Heat is the constraint, not frost",
    body:
      `With ${frostFreeDays} frost-free days, frost is not what limits zone ${zone}. Summer is. ` +
      `Cool-season crops bolt in high heat regardless of the calendar, so the useful windows sit ` +
      `either side of midsummer rather than in it, and the autumn sowing window is the long, ` +
      `comfortable one. Read the spring dates below as "earliest sensible", not "target".`,
  };
}

/**
 * Everything a zone page renders. Pure: same zone in, same page out, so these
 * prerender at build time and never drift between the tool and the page.
 */
export function getZonePageData(zone: PageZone): ZonePageData {
  // ZIP is only a label on the returned object; the zone drives the dates.
  const frost = getFrostDatesByZone(zone, "00000");

  const rows: ZoneCropRow[] = [];
  for (const crop of getAllCrops()) {
    if (crop.category !== "vegetable") continue;
    const variety = crop.varieties?.[0];
    if (!variety) continue;

    const selected = {
      cropId: crop.id,
      varietyId: variety.id,
      successionEnabled: false,
    } as SelectedCrop;

    const dates = calculateCropSchedule(crop, variety, selected, frost, false);
    if (dates.length === 0) continue;

    const sorted = [...dates].sort((a, b) => a.date.getTime() - b.date.getTime());
    const start = sorted.find((d) => d.action !== "harvest") ?? sorted[0];
    const harvest = sorted.find((d) => d.action === "harvest") ?? null;

    // Overwintering crops already carry the looked-up window rather than the
    // -180 offset, applied inside calculateCropSchedule so that the interactive
    // tool and the survival plan get the same correction. See ./overwintering.ts.
    const overwinters = isOverwintering(crop);
    const startDate = start.date;

    rows.push({
      cropId: crop.id,
      cropName: crop.name,
      startAction: start.action,
      startDate,
      harvestDate: harvest?.date ?? null,
      daysToMaturity: crop.daysToMaturity,
      caloriesPerPlant: caloriesPerPlant(crop),
      overwinters,
    });
  }

  // Overwintering crops last: they belong to the previous autumn, and sorting
  // them by raw date puts September above January.
  rows.sort((a, b) =>
    a.overwinters !== b.overwinters
      ? Number(a.overwinters) - Number(b.overwinters)
      : a.startDate.getTime() - b.startDate.getTime()
  );

  // Fall sowing is not modelled by calculateCropSchedule, which anchors
  // everything to last spring frost. Deadline = first frost - (dtm + fall
  // factor). Warm-season crops are excluded: they need heat to fruit, so
  // finishing before frost on paper does not mean a crop in practice.
  const fallCandidates = getAllCrops().filter(
    (c) =>
      c.category === "vegetable" &&
      c.daysToMaturity > 0 &&
      !WARM_SEASON.has(c.id)
  );

  const fallRows: FallSowRow[] = fallCandidates.map((crop) => {
    const adjustedDays = crop.daysToMaturity + FALL_FACTOR_DAYS;
    const sowBy = new Date(frost.firstFallFrost);
    sowBy.setDate(sowBy.getDate() - adjustedDays);
    return {
      cropId: crop.id,
      cropName: crop.name,
      sowBy,
      daysToMaturity: crop.daysToMaturity,
      adjustedDays,
      caloriesPerPlant: caloriesPerPlant(crop),
      storageLifeDays: crop.yield?.storageLifeDays ?? null,
    };
  });

  return {
    zone,
    lastSpringFrost: frost.lastSpringFrost,
    firstFallFrost: frost.firstFallFrost,
    frostVarianceDays: frost.lastSpringFrostConfidence,
    frostFreeDays: frost.frostFreeDays,
    rows,
    fallSowing: (from = new Date()) =>
      fallRows
        .filter((r) => r.sowBy.getTime() >= from.getTime())
        .sort((a, b) => a.sowBy.getTime() - b.sowBy.getTime()),
    constraint: seasonConstraint(frost.frostFreeDays, zone),
    overwinterWindow: rows.some((r) => r.overwinters) ? overwinterWindow(frost) : null,
  };
}
