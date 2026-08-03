// Data assembly for the per-state planting calendar pages.
//
// A state page is not a calendar. Zone pages are the calendars; this layer
// establishes that the state contains several of them, resolves the reader's
// zone from a ZIP, and hands off. That division is the whole reason these two
// axes do not cannibalise each other, and it is why this module composes
// zonePages rather than reimplementing any scheduling.
//
// Why states at all: state modifiers outrank zone modifiers on the same query
// (texas 100, florida 83, california 80, against "zone 7" at 54), and measured
// before building, zero states reduce to a single material band. See
// docs/STATE_PAGES_SPEC.md for the measurement and the sequencing.
//
// SERVER ONLY, transitively: zoneLookup and stateLookup vendor ~1MB of JSON
// between them. The ZIP box on the page is a client component talking to
// /api/zone/[zip]. Do not import this module from a "use client" file.
//
// Pure throughout, so the pages prerender and cannot drift from the tool.

import { hasFrostNormals, getFrostDatesByZone } from "@/lib/frostNormals";
import { getGrowingZoneFromZip } from "@/lib/zoneLookup";
import { getZipsForState } from "@/lib/stateLookup";
import {
  getZonePageData,
  isPageZone,
  type FallSowRow,
  type PageZone,
} from "./zonePages";
import { STATE_TABLE, stateBySlug, type StateEntry } from "./stateTable";

/**
 * The ten-state pilot, decided 2026-08-01, demand-weighted and spanning all
 * three StateShape branches so the pilot exercises every prose path rather
 * than only the wide one. Kentucky carries the narrow branch alone.
 *
 * Not 48. The city plan shipped a complete set of thin pages and was
 * classified as duplicate; the lesson taken from it is that indexation and
 * duplicate classification are what a pilot buys, and they resolve in about
 * three weeks. Wave 2 gates on GSC coverage status, not on ranking.
 */
export const STATE_PAGES = [
  "texas",
  "california",
  "new-york",
  "pennsylvania",
  "florida",
  "michigan",
  "ohio",
  "north-carolina",
  "georgia",
  "kentucky",
] as const;

export type PageState = (typeof STATE_PAGES)[number];

export function isPageState(slug: string): slug is PageState {
  return (STATE_PAGES as readonly string[]).includes(slug);
}

/**
 * A band below this share of a state's ZIPs is named in prose but never
 * tabulated. Texas has nine zones present and seven that matter; giving 6b's
 * 0.4% a row in the table invites the other 99.6% to follow the wrong link.
 *
 * Share of ZIPs is area-weighted, not population-weighted, so it biases toward
 * rural bands. The threshold is doing real work holding that in check and may
 * need raising once GSC shows which bands readers actually land on.
 */
export const MATERIAL_SHARE = 0.02;

export interface StateZoneBand {
  zone: string;
  zipCount: number;
  /** 0..1 of the state's ZIPs that have a zone at all. */
  share: number;
  /** In ZONE_PAGES, so the band can be linked rather than only named. */
  hasPage: boolean;
  /**
   * Null above 10b, where NOAA has no 32°F date to average. The spec's
   * interface had these non-nullable; Florida's 11a is 10.3% of the state and
   * therefore material, so honouring that would have meant printing zone 6a's
   * March 20 over a tenth of the state, since getFrostDatesByZone falls back
   * to 6a for unknown keys. A null the page must handle beats a plausible
   * wrong date, and §5.6 already specifies the frost-free wording.
   */
  lastSpringFrost: Date | null;
  firstFallFrost: Date | null;
  frostFreeDays: number | null;
}

export interface StateShape {
  band: "narrow" | "broad" | "wide";
  headline: string;
  body: string;
}

export interface StatePageData {
  slug: string;
  name: string;
  abbr: string;
  /** ZIPs in the state that carry a PRISM zone. */
  zipCount: number;
  /** Bands at or above MATERIAL_SHARE, coldest first. The page's spine. */
  bands: StateZoneBand[];
  /** Present but below threshold, coldest first. Named in prose, never tabulated. */
  minorZones: string[];
  /** The largest band by share. Ties break to the colder zone. */
  dominant: StateZoneBand;
  /**
   * Days between the coldest and warmest material band's last spring frost.
   * Bands without normals are skipped: an 11a with no frost date cannot widen
   * a frost spread. Florida's 64 days is 9a to 10b, not 9a to 11a.
   */
  spreadDays: number;
  /** Shortest and longest frost-free season across material bands with normals. */
  seasonRange: [number, number];
  /** Share of the state's ZIPs whose band has a zone page. Gates the §5.6 note. */
  coverage: number;
  shape: StateShape;
  /** Neighbouring states with pages of their own, then the rest. */
  neighbours: string[];
  /**
   * Per band, what can still go in the ground. Delegates to zonePages, so a
   * state page and its zone pages can never disagree about a deadline. Bands
   * without a zone page are omitted rather than guessed at.
   */
  nowSowing: (from?: Date) => Array<{ band: StateZoneBand; rows: FallSowRow[] }>;
}

/** Numeric order for a zone label: 5a before 5b before 6a. */
function zoneOrder(zone: string): number {
  return parseInt(zone, 10) * 2 + (zone.endsWith("b") ? 1 : 0);
}

function bandFor(zone: string, zipCount: number, share: number): StateZoneBand {
  const normals = hasFrostNormals(zone)
    ? getFrostDatesByZone(zone, "00000")
    : null;
  return {
    zone,
    zipCount,
    share,
    hasPage: isPageZone(zone),
    lastSpringFrost: normals?.lastSpringFrost ?? null,
    firstFallFrost: normals?.firstFallFrost ?? null,
    frostFreeDays: normals?.frostFreeDays ?? null,
  };
}

function pct(share: number): number {
  return Math.round(share * 100);
}

function dayCount(a: Date, b: Date): number {
  return Math.round(Math.abs(b.getTime() - a.getTime()) / 86400000);
}

/**
 * The prose that changes between states because the structure genuinely
 * changes, not because the sentences were reshuffled. Zone pages get this from
 * seasonConstraint() and it is the single largest contributor to their 39-46%
 * per-page text share; without the equivalent here, state pages fail the §8
 * gate at 35%.
 *
 * Keyed on material band count, which is a real structural property: a state
 * with two bands and a state with seven are not the same object described at
 * different lengths. Every branch interpolates figures that differ per state,
 * so two states in the same branch still differ in every sentence carrying a
 * number.
 */
function stateShape(
  name: string,
  bands: StateZoneBand[],
  dominant: StateZoneBand,
  spreadDays: number
): StateShape {
  const lo = bands[0].zone;
  const hi = bands[bands.length - 1].zone;
  const n = bands.length;
  const domShare = pct(dominant.share);

  if (n <= 2) {
    const cold = bands[0];
    const warm = bands[bands.length - 1];
    const seasonGap = (warm.frostFreeDays ?? 0) - (cold.frostFreeDays ?? 0);
    return {
      band: "narrow",
      headline: "One calendar, and an edge worth knowing about",
      body:
        `${name} is close to a single planting calendar, which most states are not. Zone ` +
        `${dominant.zone} covers ${domShare}% of it, ${lo} and ${hi} are the only bands that carry ` +
        `real acreage, and the ${spreadDays} days between their last frosts is a smaller gap than ` +
        `the year-to-year variance in the frost date itself. Put plainly: a ${dominant.zone} date ` +
        `used anywhere in ${name} will be inside the noise. ` +
        `The two bands still differ where it counts at the end of the season. ${lo} runs ` +
        `${cold.frostFreeDays} frost-free days against ${warm.frostFreeDays} in ${hi}, so the ` +
        `${seasonGap} days you gain at the warm end are autumn days, and autumn days are the ones ` +
        `a late sowing needs. Take the spring dates from the state, take the autumn deadlines from ` +
        `your own band, and the ${pct(cold.share)} of ${name} sitting in ${lo} will stop losing the ` +
        `tail of the season to advice written for ${hi}.`,
    };
  }

  if (n <= 4) {
    return {
      band: "broad",
      headline: `State-level advice here is an average of ${n} different calendars`,
      body:
        `${name} spans ${n} material zones, ${lo} through ${hi}, and ${spreadDays} days separate the ` +
        `last spring frost at either end. That is long enough to matter and short enough to be ` +
        `invisible: local media and seed-packet guidance quote a single state date, usually close to ` +
        `${dominant.zone}, which is the right answer for the ${domShare}% of the state in that band ` +
        `and roughly a fortnight wrong for both ends of it. Being two weeks early is a reseeding. ` +
        `Being two weeks late costs the tail of the season, which is harder to get back. Find your ` +
        `zone below and use its dates instead of the state's.`,
    };
  }

  return {
    band: "wide",
    headline: "The state name is not a useful gardening input",
    body:
      `${name} contains ${n} material zones, from ${lo} to ${hi}, and ${spreadDays} days of spread in ` +
      `the last spring frost. At that width the state is not one growing region described at ` +
      `different lengths, it is genuinely different agricultures sharing a border. No single date ` +
      `serves it. Even ${dominant.zone}, the largest band at ${domShare}% of the state, leaves the ` +
      `majority of ${name} gardening on someone else's calendar. Everything below is organised by ` +
      `band for that reason, and the zone, not the state, is the input that decides your dates.`,
  };
}

/**
 * Everything a state page renders. Pure: same slug in, same page out.
 *
 * Throws on a slug outside STATE_PAGES rather than returning a partial object.
 * The route's generateStaticParams is driven by the same list, so a throw here
 * means the two have drifted and the build should stop.
 */
export function getStatePageData(slug: string): StatePageData {
  const entry: StateEntry | undefined = stateBySlug(slug);
  if (!entry || !isPageState(entry.slug)) {
    throw new Error(`No state page for "${slug}". Add it to STATE_PAGES first.`);
  }

  const counts = new Map<string, number>();
  let zipCount = 0;
  for (const zip of getZipsForState(entry.abbr)) {
    const zone = getGrowingZoneFromZip(zip);
    if (!zone) continue;
    counts.set(zone, (counts.get(zone) ?? 0) + 1);
    zipCount += 1;
  }

  const ordered = [...counts.entries()].sort((a, b) => zoneOrder(a[0]) - zoneOrder(b[0]));

  const bands: StateZoneBand[] = [];
  const minorZones: string[] = [];
  for (const [zone, count] of ordered) {
    const share = count / zipCount;
    if (share >= MATERIAL_SHARE) bands.push(bandFor(zone, count, share));
    else minorZones.push(zone);
  }

  // Coverage counts every ZIP in the state, minor bands included. A reader in
  // a 0.4% band is still a reader, and §5.6's honesty note is about them.
  let coveredZips = 0;
  for (const [zone, count] of counts) {
    if (isPageZone(zone)) coveredZips += count;
  }

  const dominant = bands.reduce((best, b) => (b.share > best.share ? b : best), bands[0]);

  const withNormals = bands.filter((b) => b.lastSpringFrost !== null);
  const spreadDays =
    withNormals.length > 1
      ? dayCount(
          withNormals[0].lastSpringFrost as Date,
          withNormals[withNormals.length - 1].lastSpringFrost as Date
        )
      : 0;

  const seasons = withNormals.map((b) => b.frostFreeDays as number);
  const seasonRange: [number, number] = [Math.min(...seasons), Math.max(...seasons)];

  const linkable = bands.filter((b) => b.hasPage);

  return {
    slug: entry.slug,
    name: entry.name,
    abbr: entry.abbr,
    zipCount,
    bands,
    minorZones,
    dominant,
    spreadDays,
    seasonRange,
    coverage: coveredZips / zipCount,
    shape: stateShape(entry.name, bands, dominant, spreadDays),
    neighbours: entry.neighbours
      .map((abbr) => STATE_TABLE.find((s) => s.abbr === abbr)?.slug)
      .filter((s): s is string => Boolean(s))
      .sort((a, b) => Number(isPageState(b)) - Number(isPageState(a))),
    nowSowing: (from = new Date()) =>
      linkable.map((band) => ({
        band,
        rows: getZonePageData(band.zone as PageZone).fallSowing(from),
      })),
  };
}

/**
 * Every state where a zone is a material band, coldest-heaviest first. Drives
 * the reciprocal section on the zone pages (spec §7), which is the link equity
 * payoff and the reason both axes are worth more together than apart.
 */
export function statesForZone(zone: string, limit = 8): Array<{ slug: string; name: string; share: number }> {
  return STATE_PAGES.map((slug) => {
    const d = getStatePageData(slug);
    const band = d.bands.find((b) => b.zone === zone);
    return band ? { slug: d.slug, name: d.name, share: band.share } : null;
  })
    .filter((x): x is { slug: string; name: string; share: number } => x !== null)
    .sort((a, b) => b.share - a.share)
    .slice(0, limit);
}
