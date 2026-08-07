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

import type { Crop, FrostDates } from "./types";

export interface OverwinterWindow {
  /** Mid-window date, for sorting and for any single-date display. */
  date: Date;
  /** The window as a grower would state it. */
  label: string;
  /** Weeks of refrigerator pre-chill, or null where the winter supplies it. */
  preChillWeeks: [number, number] | null;
}

type WindowSpec = {
  month: number;
  day: number;
  label: string;
  preChillWeeks: [number, number] | null;
};

const COLD: WindowSpec = {
  month: 10, day: 5,
  label: "late September to mid October",
  preChillWeeks: null,
};
const TEMPERATE: WindowSpec = {
  month: 10, day: 21,
  label: "mid October to early November",
  preChillWeeks: null,
};
const MILD: WindowSpec = {
  month: 11, day: 8,
  label: "late October to late November",
  preChillWeeks: null,
};
const WARM: WindowSpec = {
  month: 11, day: 30,
  label: "mid November to mid December",
  preChillWeeks: [4, 6],
};
const HOT: WindowSpec = {
  month: 12, day: 15,
  label: "December into early January",
  preChillWeeks: [6, 8],
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
  return {
    date: new Date(frost.lastSpringFrost.getFullYear() - 1, spec.month - 1, spec.day),
    label: spec.label,
    preChillWeeks: spec.preChillWeeks,
  };
}
