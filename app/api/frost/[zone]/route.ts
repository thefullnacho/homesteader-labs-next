import { NextResponse } from "next/server";
import frostZones from "@/content/frost-zones.json";
import { PUBLIC_DOMAIN_DERIVED } from "@/lib/dataLicense";

// USDA zone → frost normals. Companion to /api/zone/[zip], which resolves the
// zone in the first place: ZIP in one call, dates in the next.
//
// Dates are returned as MM-DD rather than a full date so the response does not
// go stale on January 1. The caller decides which year it is asking about.
//
// Zones 11a and warmer are absent from the table on purpose: they have no 32°F
// date at all. That is answered as frostFree, not as a 404, because "no frost
// here" is the correct answer to the question rather than a missing record.

export const dynamic = "force-static";

const ZONES = Object.keys(frostZones.zones) as (keyof typeof frostZones.zones)[];

const FROST_FREE = new Set(["11a", "11b", "12a", "12b", "13a", "13b"]);

const SHARED_HEADERS = {
  // The table changes when NOAA republishes normals, roughly once a decade.
  "Cache-Control": "public, max-age=31536000, immutable",
  // Public reference data: usable from a browser tool or an agent runtime
  // without proxying it through someone else's server first.
  "Access-Control-Allow-Origin": "*",
};

export function generateStaticParams() {
  return [...ZONES, ...FROST_FREE].map((zone) => ({ zone }));
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ zone: string }> }
) {
  const { zone } = await ctx.params;
  const key = zone?.trim().toLowerCase() ?? "";

  if (!/^\d{1,2}[ab]$/.test(key)) {
    return NextResponse.json(
      { error: "Expected a USDA zone such as 6b" },
      { status: 400, headers: SHARED_HEADERS }
    );
  }

  if (FROST_FREE.has(key)) {
    return NextResponse.json(
      {
        zone: key,
        frostFree: true,
        lastSpringFrost: null,
        firstFallFrost: null,
        frostFreeDays: 365,
        source: frostZones._source,
        caveat: frostZones._caveat,
        ...PUBLIC_DOMAIN_DERIVED,
      },
      { headers: SHARED_HEADERS }
    );
  }

  const entry = frostZones.zones[key as keyof typeof frostZones.zones];

  if (!entry) {
    return NextResponse.json(
      { zone: key, error: "No normals for that zone" },
      { status: 404, headers: SHARED_HEADERS }
    );
  }

  return NextResponse.json(
    {
      zone: key,
      frostFree: false,
      lastSpringFrost: entry.lastSpringFrost,
      firstFallFrost: entry.firstFallFrost,
      frostFreeDays: entry.frostFreeDays,
      lastFrostVarianceDays: entry.lastFrostVarianceDays,
      firstFrostVarianceDays: entry.firstFrostVarianceDays,
      source: frostZones._source,
      caveat: frostZones._caveat,
      ...PUBLIC_DOMAIN_DERIVED,
    },
    { headers: SHARED_HEADERS }
  );
}
