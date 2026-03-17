import frostZones from "@/content/frost-zones.json";
import type { FrostDates } from "@/lib/tools/planting-calendar/types";

type ZoneKey = keyof typeof frostZones.zones;

function parseFrostDate(mmdd: string, year: number): Date {
  const [month, day] = mmdd.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function targetYear(): number {
  const month = new Date().getMonth();
  const year  = new Date().getFullYear();
  return month >= 9 ? year + 1 : year;
}

/**
 * Returns frost date normals from NOAA 1991-2020 data for a given USDA
 * growing zone (e.g. "6b"). Falls back to zone "6a" if the key is unknown.
 * Data is US-centric — use as a fallback when api.frost.date is unavailable.
 */
export function getFrostDatesByZone(zone: string, zipCode: string): FrostDates {
  const key = zone.toLowerCase() as ZoneKey;
  const entry = frostZones.zones[key] ?? frostZones.zones["6a"];
  const year  = targetYear();

  const lastSpringFrost = parseFrostDate(entry.lastSpringFrost, year);
  const firstFallFrost  = parseFrostDate(entry.firstFallFrost,  year);
  const frostFreeDays   = Math.round(
    (firstFallFrost.getTime() - lastSpringFrost.getTime()) / 86400000
  );

  return {
    zipCode,
    lastSpringFrost,
    lastSpringFrostConfidence:  entry.lastFrostVarianceDays,
    firstFallFrost,
    firstFallFrostConfidence:   entry.firstFrostVarianceDays,
    frostFreeDays,
    growingZone: key,
  };
}
