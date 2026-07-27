// Assembles everything the free zone planner PDF renders.
//
// Deliberately a thin layer over `getZonePageData`. The zone pages already
// compute the fall sowing deadlines, the autumn day-length adjustment and the
// per-zone season constraint, and the planner must not drift from what the page
// says. Anything derived here is derived from that same call.

import { getZonePageData, type PageZone, type FallSowRow } from "@/lib/tools/planting-calendar/zonePages";
import pestCompanionData from "@/content/crops/pest-companions.json";

/**
 * Threaded through from the start so spring reuses this template rather than
 * needing a second one. Only `fall` is populated today; a fall-only planner
 * would strand the work in October.
 */
export type PlannerSeason = "fall";

export interface PlannerPestRow {
  cropName: string;
  pestName: string;
  companion: string;
  placement: string;
  evidenceLevel: string;
}

export interface PlannerData {
  zone: PageZone;
  season: PlannerSeason;
  /** The date the deadlines are computed against. Printed, so the sheet cannot silently age. */
  generatedOn: Date;
  firstFallFrost: Date;
  frostVarianceDays: number;
  frostFreeDays: number;
  constraintHeadline: string;
  constraintBody: string;
  /** Crops that still finish if sown now, earliest deadline first. Empty is a real answer. */
  sowing: FallSowRow[];
  /** Days until the soonest deadline. The urgent number. */
  daysToNextDeadline: number | null;
  /** Days until the furthest deadline, i.e. when the season shuts entirely. */
  daysToLastDeadline: number | null;
  pests: PlannerPestRow[];
}

interface RawPestCompanion {
  companion: string;
  reason: string;
  placement: string;
  evidenceLevel: string;
}
interface RawPest {
  name: string;
  companions?: RawPestCompanion[];
}
interface RawPestCrop {
  cropId: string;
  pests?: RawPest[];
}

const EVIDENCE_RANK: Record<string, number> = { strong: 0, moderate: 1, anecdotal: 2 };

function prettyPest(name: string): string {
  return name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Pests for the crops actually on this zone's sowing list, best-evidence
 * companion first. Crops nobody can still sow here are irrelevant to the
 * reader, so the pest page differs by zone for the same reason the schedule
 * does.
 */
function pestsFor(sowing: FallSowRow[]): PlannerPestRow[] {
  const byId = new Map(sowing.map((r) => [r.cropId, r.cropName]));
  const rows: PlannerPestRow[] = [];

  for (const entry of pestCompanionData as RawPestCrop[]) {
    const cropName = byId.get(entry.cropId);
    if (!cropName) continue;

    for (const pest of entry.pests ?? []) {
      const best = [...(pest.companions ?? [])].sort(
        (a, b) => (EVIDENCE_RANK[a.evidenceLevel] ?? 9) - (EVIDENCE_RANK[b.evidenceLevel] ?? 9),
      )[0];
      if (!best) continue;

      rows.push({
        cropName,
        pestName: prettyPest(pest.name),
        companion: best.companion,
        placement: best.placement,
        evidenceLevel: best.evidenceLevel,
      });
    }
  }

  return rows.sort(
    (a, b) =>
      (EVIDENCE_RANK[a.evidenceLevel] ?? 9) - (EVIDENCE_RANK[b.evidenceLevel] ?? 9) ||
      a.cropName.localeCompare(b.cropName),
  );
}

const MS_PER_DAY = 86_400_000;

export function buildPlannerData(
  zone: PageZone,
  season: PlannerSeason = "fall",
  from: Date = new Date(),
): PlannerData {
  const page = getZonePageData(zone);
  const sowing = page.fallSowing(from);

  // fallSowing returns earliest deadline first, so the soonest is the head and
  // the season's close is the tail. Verified against the data rather than taken
  // from the interface comment, which said the opposite.
  const days = (d: Date) => Math.ceil((d.getTime() - from.getTime()) / MS_PER_DAY);
  const daysToNextDeadline = sowing.length ? days(sowing[0].sowBy) : null;
  const daysToLastDeadline = sowing.length ? days(sowing[sowing.length - 1].sowBy) : null;

  return {
    zone,
    season,
    generatedOn: from,
    firstFallFrost: page.firstFallFrost,
    frostVarianceDays: page.frostVarianceDays,
    frostFreeDays: page.frostFreeDays,
    constraintHeadline: page.constraint.headline,
    constraintBody: page.constraint.body,
    sowing,
    daysToNextDeadline,
    daysToLastDeadline,
    pests: pestsFor(sowing),
  };
}
