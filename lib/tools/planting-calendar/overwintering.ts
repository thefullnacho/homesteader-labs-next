// Autumn planting windows for overwintering crops.
//
// This module exists because the offset model is wrong for these crops, and was
// wrong in production across every surface that scheduled them.
//
// Every other date in the planting calendar is computed as an offset from the
// last spring frost. That is the right anchor for a crop whose season starts in
// spring. Garlic's offset is -180 days, and the further the last frost drifts
// toward midwinter, the further that subtraction reaches back into the previous
// summer. Measured against `content/frost-zones.json`, the offset produced:
//
//   4a   Oct 29   two to four weeks late
//   6b   Sep 16   four to five weeks early
//   7b   Aug 26   late summer
//   9b   Jul 14   midsummer, in a zone that plants in December
//   10b  Jul 5    midsummer, in a zone that plants in January
//
// So it is not merely wrong at the warm end. It is wrong in both directions and
// happens to pass through roughly the right answer around zone 5.
//
// There is no clean replacement formula, which is why this is a lookup. Garlic
// tracks ground freeze rather than air frost, and the gap between those two
// widens going north, so anchoring to first fall frost fits the warm end and
// runs weeks early in the cold one. The windows below come from extension and
// grower guidance and match the table published in /archive/how-to-grow-garlic/.
// Keep the two in step.
//
// Harvest is a lookup for the same class of reason. `daysToMaturity` is a flat
// count from sowing, which is defensible for a spring crop growing through one
// warm season and meaningless here: sowing December 15 in zone 10b and adding
// 240 days gives August, when that crop actually comes out in May. Garlic does
// not finish a fixed number of days after planting. It finishes when the leaves
// begin dying back, which is temperature and daylength driven.
//
// So the date below is an estimate and `harvestSignal` is the actual test. That
// ordering is deliberate. A grower checking leaves will beat a calendar every
// time, and the honest thing is to say so rather than print a false-precision
// date and let it be believed. Building a GDD maturity model was considered and
// rejected: it needs per-crop base temperatures and daily temperature normals,
// neither of which is in the repo, to improve a number readers do not act on.

import type { Crop, FrostDates } from "./types";

export interface OverwinterWindow {
  /** Mid-window date, for sorting and for any single-date display. */
  date: Date;
  /** The window as a grower would state it. */
  label: string;
  /** Weeks of refrigerator pre-chill, or null where the winter supplies it. */
  preChillWeeks: [number, number] | null;
  /** Mid-window harvest date, in the summer following the sowing. */
  harvestDate: Date;
  /** The harvest window as a grower would state it. */
  harvestLabel: string;
  /** What actually tells you it is ready. The date is the estimate; this is the test. */
  harvestSignal: string;
}

type WindowSpec = {
  month: number;
  day: number;
  label: string;
  preChillWeeks: [number, number] | null;
  harvestMonth: number;
  harvestDay: number;
  harvestLabel: string;
};

const COLD: WindowSpec = {
  month: 10, day: 5,
  label: "late September to mid October",
  preChillWeeks: null,
  harvestMonth: 7, harvestDay: 5,
  harvestLabel: "late June into July",
};
const TEMPERATE: WindowSpec = {
  month: 10, day: 21,
  label: "mid October to early November",
  preChillWeeks: null,
  harvestMonth: 6, harvestDay: 25,
  harvestLabel: "June into early July",
};
const MILD: WindowSpec = {
  month: 11, day: 8,
  label: "late October to late November",
  preChillWeeks: null,
  harvestMonth: 6, harvestDay: 5,
  harvestLabel: "late May into June",
};
const WARM: WindowSpec = {
  month: 11, day: 30,
  label: "mid November to mid December",
  preChillWeeks: [4, 6],
  harvestMonth: 5, harvestDay: 25,
  harvestLabel: "May into June",
};
const HOT: WindowSpec = {
  month: 12, day: 15,
  label: "December into early January",
  preChillWeeks: [6, 8],
  harvestMonth: 5, harvestDay: 15,
  harvestLabel: "May",
};

const BY_ZONE: Record<string, WindowSpec> = {
  "3a": COLD, "3b": COLD, "4a": COLD, "4b": COLD, "5a": COLD, "5b": COLD,
  "6a": TEMPERATE, "6b": TEMPERATE, "7a": TEMPERATE, "7b": TEMPERATE,
  "8a": MILD, "8b": MILD,
  "9a": WARM, "9b": WARM,
  "10a": HOT, "10b": HOT, "11a": HOT, "11b": HOT,
};

/**
 * Season-length fallback, for the case where frost dates arrive without a zone
 * (a user-supplied date, or an API response that omits it). Thresholds are read
 * off the same normals the zone table uses, so the two agree: 5b is 204 days,
 * 7b is 279, 8b is 307, 9b is 352.
 */
function byFrostFreeDays(days: number): WindowSpec {
  if (days < 210) return COLD;
  if (days < 290) return TEMPERATE;
  if (days < 315) return MILD;
  if (days < 355) return WARM;
  return HOT;
}

/**
 * Sown in autumn to overwinter. Ordinary crops direct-sow within a few weeks of
 * last frost (carrot -21, cabbage -21); garlic sits at -180, four months before
 * it, which is a different act. The gap is wide enough that a threshold is safe.
 */
export function isOverwintering(crop: Pick<Crop, "directSow">): boolean {
  return typeof crop.directSow === "number" && crop.directSow <= -120;
}

/**
 * The window falls in the autumn *preceding* the spring the rest of the
 * schedule is counted from, which is what "of the year before" means in copy.
 *
 * Prefers the zone, falls back to season length, because a zone is a lookup
 * into published guidance and a season length is an inference from it.
 */
export function overwinterWindow(frost: FrostDates): OverwinterWindow {
  const zone = frost.growingZone?.toLowerCase();
  const spec = (zone && BY_ZONE[zone]) || byFrostFreeDays(frost.frostFreeDays);
  const springYear = frost.lastSpringFrost.getFullYear();
  return {
    date: new Date(springYear - 1, spec.month - 1, spec.day),
    label: spec.label,
    preChillWeeks: spec.preChillWeeks,
    // Harvest lands in the summer *after* the sowing, so it takes the spring
    // year rather than the autumn one.
    harvestDate: new Date(springYear, spec.harvestMonth - 1, spec.harvestDay),
    harvestLabel: spec.harvestLabel,
    harvestSignal:
      "Harvest when a third to a half of the leaves have browned and the rest are still green. " +
      "Each green leaf is a wrapper layer, and waiting for them all to die back gives you bulbs " +
      "that split and will not store.",
  };
}
