// Growing degree day accumulation, for pest emergence prediction.
//
// This is a different quantity from `growingDegreeDays` in lib/plantingIndex.ts,
// which sums the NEXT 14 forecast days and answers "how much heat is coming".
// Pest emergence thresholds published by extension services are stated as heat
// accumulated SINCE A BIOFIX DATE, normally January 1st. The two numbers are not
// interchangeable, and comparing one to the other is meaningless.
//
// All temperatures are Fahrenheit, matching lib/weatherApi.ts which requests
// temperature_unit=fahrenheit.

export interface DailyTemp {
  /** ISO date, YYYY-MM-DD. */
  date: string;
  maxTemp: number;
  minTemp: number;
}

export interface GddOptions {
  /** Developmental threshold. 50°F is the common default; some pests use 39.2°F. */
  base: number;
  /**
   * Optional horizontal upper cutoff. Development does not accelerate above a
   * pest's optimum, so many extension models cap the daily temperatures before
   * averaging. Omit to leave uncapped, and say so wherever the number is shown.
   */
  upperCutoff?: number;
}

/**
 * Degree days for a single day, by the averaging method:
 *   max(0, (Tmax + Tmin) / 2 - base)
 * with both temperatures capped at `upperCutoff` first when one is given.
 */
export function dailyGdd(
  maxTemp: number,
  minTemp: number,
  { base, upperCutoff }: GddOptions
): number {
  if (!Number.isFinite(maxTemp) || !Number.isFinite(minTemp)) return 0;

  let hi = maxTemp;
  let lo = minTemp;

  // Guard against transposed inputs rather than silently returning nonsense.
  if (lo > hi) [hi, lo] = [lo, hi];

  if (upperCutoff !== undefined) {
    hi = Math.min(hi, upperCutoff);
    lo = Math.min(lo, upperCutoff);
  }

  return Math.max(0, (hi + lo) / 2 - base);
}

/**
 * Sums daily GDD across a series. Days are deduplicated by date, keeping the
 * first occurrence, so an archive series can be concatenated with a forecast
 * series that overlaps it without double counting.
 */
export function accumulateGdd(days: DailyTemp[], options: GddOptions): number {
  const seen = new Set<string>();
  let total = 0;

  for (const day of days) {
    if (!day || seen.has(day.date)) continue;
    seen.add(day.date);
    total += dailyGdd(day.maxTemp, day.minTemp, options);
  }

  return total;
}

/**
 * The date a running accumulation first reaches `threshold`, or null if it never
 * does across the series. Days are processed in date order regardless of input
 * order, so an unsorted merge of archive and forecast still yields the right
 * crossing date.
 *
 * This is what makes the pest feed stateless: the crossing date is derived from
 * weather rather than recorded when an alert fires, so recomputing always gives
 * the same answer and there is no sent-state to store.
 */
export function findThresholdCrossing(
  days: DailyTemp[],
  threshold: number,
  options: GddOptions
): { date: string; accumulated: number } | null {
  const byDate = new Map<string, DailyTemp>();
  for (const day of days) {
    // First occurrence wins, matching accumulateGdd, so archive beats forecast.
    if (day && !byDate.has(day.date)) byDate.set(day.date, day);
  }
  const ordered = [...byDate.values()].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0
  );

  let total = 0;
  for (const day of ordered) {
    total += dailyGdd(day.maxTemp, day.minTemp, options);
    if (total >= threshold) {
      return { date: day.date, accumulated: Math.round(total) };
    }
  }

  return null;
}

/** January 1st of the year containing `on`, as YYYY-MM-DD. The usual biofix. */
export function defaultBiofix(on: Date = new Date()): string {
  return `${on.getUTCFullYear()}-01-01`;
}

const toISO = (d: Date) => d.toISOString().split("T")[0];

/**
 * Fetches the daily temperature series from `biofix` to today for a point.
 *
 * Two sources are needed. The Open-Meteo archive lags real time by several days,
 * so it covers the bulk of the season but not the last week. The forecast
 * endpoint backfills that tail via past_days. Archive values win on overlap,
 * since they are measured rather than modelled.
 *
 * Returns null when neither source answers, so callers can distinguish "no data"
 * from "zero accumulation".
 */
export async function fetchDailyTemps(
  lat: number,
  lon: number,
  biofix: string,
  today: Date = new Date()
): Promise<DailyTemp[] | null> {
  const end = toISO(today);
  const daily = "temperature_2m_max,temperature_2m_min";

  const archiveParams = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    start_date: biofix,
    end_date: end,
    daily,
    temperature_unit: "fahrenheit",
    timezone: "auto",
  });

  // past_days covers the archive lag; forecast_days=1 keeps the payload small
  // since anything beyond today is a different question.
  const recentParams = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    daily,
    temperature_unit: "fahrenheit",
    timezone: "auto",
    past_days: "14",
    forecast_days: "1",
  });

  const parse = (data: unknown): DailyTemp[] => {
    const d = (data as { daily?: { time?: string[]; temperature_2m_max?: (number | null)[]; temperature_2m_min?: (number | null)[] } })?.daily;
    if (!d?.time) return [];
    return d.time.flatMap((date, i) => {
      const hi = d.temperature_2m_max?.[i];
      const lo = d.temperature_2m_min?.[i];
      // Open-Meteo returns null for days it has no data for; skip rather than
      // coerce to 0, which would silently depress the accumulation.
      if (hi == null || lo == null) return [];
      return [{ date, maxTemp: hi, minTemp: lo }];
    });
  };

  const [archive, recent] = await Promise.allSettled([
    fetch(`https://archive-api.open-meteo.com/v1/archive?${archiveParams}`).then((r) =>
      r.ok ? r.json() : null
    ),
    fetch(`https://api.open-meteo.com/v1/forecast?${recentParams}`).then((r) =>
      r.ok ? r.json() : null
    ),
  ]);

  const archiveDays = archive.status === "fulfilled" ? parse(archive.value) : [];
  const recentDays = recent.status === "fulfilled" ? parse(recent.value) : [];

  if (archiveDays.length === 0 && recentDays.length === 0) return null;

  // Archive first so it wins deduplication on the overlapping days.
  return [...archiveDays, ...recentDays];
}
